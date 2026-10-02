import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { and, asc, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { emailVerificationTokens } from '@/db/schema/email-verification-tokens.schema';
import { memberships } from '@/db/schema/memberships.schema';
import { passwordResetTokens } from '@/db/schema/password-reset-tokens.schema';
import { sessions } from '@/db/schema/sessions.schema';
import { tenants } from '@/db/schema/tenants.schema';
import { users } from '@/db/schema/users.schema';
import { MailService } from '@/mail/mail.service';

import { ForgotPasswordDto } from '@/auth/dto/forgot-password.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ResendVerificationDto } from '@/auth/dto/resend-verification.dto';
import { ResetPasswordDto } from '@/auth/dto/reset-password.dto';
import { VerifyEmailDto } from '@/auth/dto/verify-email.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token.';
const GENERIC_VERIFICATION_MESSAGE =
  'If an account exists for this email and is not yet verified, a new verification link has been sent.';

type SessionMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName?.trim() || null;

    const [existingUser] = await this.db.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const tenantId = randomUUID();

    const user = await this.db.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          fullName,
          passwordHash,
          status: 'PENDING',
        })
        .returning({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          status: users.status,
          createdAt: users.createdAt,
        });

      const [tenant] = await tx
        .insert(tenants)
        .values({
          id: tenantId,
          name: 'My Practice',
        })
        .returning({ id: tenants.id });

      await tx.insert(memberships).values({
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER',
        isDefault: true,
      });

      return user;
    });

    /*
     * The account now exists, so a failure to send the verification email would
     * otherwise leave a PENDING user who can never verify and can never log in,
     * while the client sees an error and retries into a 409. Compensate by
     * removing what was just created, so "could not email" and "no account" are
     * the same state and the user can simply try again.
     *
     * The token is created before the send so the rollback covers it too.
     */
    try {
      await this.createAndSendVerificationToken(user.id, email);
    } catch (error) {
      await this.rollbackRegistration(user.id, tenantId);

      this.logger.error(
        `Registration rolled back for user ${user.id}: verification email could not be sent.`,
      );

      throw error;
    }

    this.logger.log(`Registered new user ${user.id}`);

    return user;
  }

  /**
   * Undoes a registration that could not be completed.
   *
   * Memberships and tokens cascade from `users`, and the tenant is only reachable
   * through the membership, so deleting the user and then the tenant is enough.
   * Failures here are logged rather than raised: the caller is already throwing
   * the original, more useful error, and masking it with a cleanup failure would
   * hide the actual cause.
   */
  private async rollbackRegistration(userId: string, tenantId: string) {
    try {
      await this.db.db.delete(users).where(eq(users.id, userId));
      await this.db.db.delete(tenants).where(eq(tenants.id, tenantId));
    } catch (cleanupError) {
      this.logger.error(
        `Failed to roll back registration for user ${userId} and tenant ${tenantId}.`,
        cleanupError instanceof Error
          ? cleanupError.stack
          : String(cleanupError),
      );
    }
  }

  async login(dto: LoginDto, metadata: SessionMetadata = {}) {
    const email = dto.email.trim().toLowerCase();

    const [user] = await this.db.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      this.logger.warn(`Login failed for unknown email ${email}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      this.logger.warn(`Login failed for user ${user.id} (invalid password)`);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.status === 'SUSPENDED') {
      this.logger.warn(`Login denied for suspended user ${user.id}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.status === 'PENDING') {
      this.logger.warn(`Login denied for unverified user ${user.id}`);
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const membershipRows = await this.db.db
      .select({
        tenantId: memberships.tenantId,
        name: tenants.name,
        role: memberships.role,
        isDefault: memberships.isDefault,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.isDefault), asc(memberships.createdAt));

    if (membershipRows.length === 0) {
      this.logger.error(`User ${user.id} has no tenant membership`);
      throw new ForbiddenException('No tenant membership found.');
    }

    const activeTenant = membershipRows[0];

    const accessToken = await this.createAccessToken(
      user.id,
      activeTenant.tenantId,
    );
    const { session, refreshToken } = await this.createSession(
      user.id,
      activeTenant.tenantId,
      metadata,
    );

    this.logger.log(`User ${user.id} logged in (session ${session.id})`);

    return {
      accessToken,
      refreshToken,

      user: {
        id: user.id,
        email: user.email,
        /*
         * Same projection as `getCurrentUser`. The client types this as the full
         * user and reads `fullName` immediately (workspace user menu, initials),
         * so returning a partial object left the name blank until a page reload.
         */
        fullName: user.fullName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },

      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },

      tenants: membershipRows.map((row) => ({
        id: row.tenantId,
        name: row.name,
        role: row.role,
        isDefault: row.isDefault,
      })),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const parsedToken = this.parseOpaqueToken(dto.token);

    if (!parsedToken) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    const [tokenRow] = await this.db.db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, parsedToken.id))
      .limit(1);

    if (!tokenRow) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    if (tokenRow.usedAt) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    if (tokenRow.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    const matches = await argon2.verify(tokenRow.tokenHash, parsedToken.secret);

    if (!matches) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    await this.db.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, tokenRow.userId));

      await tx
        .update(emailVerificationTokens)
        .set({
          usedAt: new Date(),
        })
        .where(eq(emailVerificationTokens.id, tokenRow.id));
    });

    this.logger.log(`Email verified for user ${tokenRow.userId}`);

    return {
      message: 'Email verified successfully.',
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase();

    const [user] = await this.db.db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.status === 'SUSPENDED') {
      return {
        message: GENERIC_VERIFICATION_MESSAGE,
      };
    }

    if (user.status === 'ACTIVE') {
      return {
        message: 'Your email address is already verified.',
      };
    }

    await this.db.db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id));

    await this.createAndSendVerificationToken(user.id, email);

    this.logger.log(`Re-sent verification email for user ${user.id}`);

    return {
      message: 'A new verification link has been sent.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const [user] = await this.db.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return {
        message:
          'If an account exists for this email, a password reset link has been sent.',
      };
    }

    await this.db.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    const token = this.createOpaqueToken();

    await this.db.db.insert(passwordResetTokens).values({
      id: token.id,
      userId: user.id,
      tokenHash: await argon2.hash(token.secret),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await this.mailService.sendPasswordResetEmail(user.email, token.value);

    this.logger.log(`Issued a password reset token for user ${user.id}`);

    return {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const parsedToken = this.parseOpaqueToken(dto.token);

    if (!parsedToken) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const [token] = await this.db.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.id, parsedToken.id))
      .limit(1);

    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const matches = await argon2.verify(token.tokenHash, parsedToken.secret);

    if (!matches) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.db.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, token.userId));

      await tx
        .update(passwordResetTokens)
        .set({
          usedAt: new Date(),
        })
        .where(eq(passwordResetTokens.id, token.id));

      await tx
        .update(sessions)
        .set({
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sessions.userId, token.userId));
    });

    this.logger.log(`Password reset for user ${token.userId}`);

    return {
      message: 'Password reset successfully.',
    };
  }

  async refresh(refreshToken: string) {
    const parsedToken = this.parseOpaqueToken(refreshToken);

    if (!parsedToken) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const [session] = await this.db.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, parsedToken.id))
      .limit(1);

    if (!session) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const tokenMatches = await argon2.verify(
      session.refreshTokenHash,
      parsedToken.secret,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    if (session.revokedAt) {
      await this.revokeSessionFamily(session.familyId, session.userId);
      this.logger.warn(
        `Refresh-token reuse detected for user ${session.userId}; revoked session family ${session.familyId}`,
      );
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const [user] = await this.db.db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || user.status !== 'ACTIVE') {
      await this.revokeSession(session.id);
      this.logger.warn(`Refresh denied for user ${session.userId} (status)`);
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const [membership] = await this.db.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, session.userId),
          eq(memberships.tenantId, session.tenantId),
        ),
      )
      .limit(1);

    if (!membership) {
      await this.revokeSession(session.id);
      this.logger.warn(
        `Refresh denied for user ${session.userId} (not a tenant member)`,
      );
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    await this.revokeSession(session.id);

    const accessToken = await this.createAccessToken(
      session.userId,
      session.tenantId,
    );
    const { session: newSession, refreshToken: newRefreshToken } =
      await this.createSession(
        session.userId,
        session.tenantId,
        {
          userAgent: session.userAgent ?? undefined,
          ipAddress: session.ipAddress ?? undefined,
        },
        session.familyId,
      );

    this.logger.log(
      `Rotated session for user ${session.userId} (${session.id} -> ${newSession.id})`,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      session: {
        id: newSession.id,
        expiresAt: newSession.expiresAt,
      },
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const parsedToken = this.parseOpaqueToken(refreshToken);

    if (!parsedToken) {
      return;
    }

    const [session] = await this.db.db
      .select({
        id: sessions.id,
        refreshTokenHash: sessions.refreshTokenHash,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(eq(sessions.id, parsedToken.id))
      .limit(1);

    if (!session || session.revokedAt) {
      return;
    }

    const matches = await argon2.verify(
      session.refreshTokenHash,
      parsedToken.secret,
    );

    if (!matches) {
      return;
    }

    await this.revokeSession(session.id);

    this.logger.log(`User logged out (session ${session.id})`);
  }

  async logoutAll(userId: string) {
    await this.revokeAllSessions(userId);
    this.logger.log(`All sessions revoked for user ${userId}`);
  }

  async getCurrentUser(userId: string) {
    const [user] = await this.db.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        status: users.status,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('User account is suspended.');
    }

    return user;
  }

  private async createAccessToken(userId: string, tenantId: string) {
    return this.jwtService.signAsync({
      sub: userId,
      tenantId,
      type: 'access',
    });
  }

  async handleOAuthLogin(
    oauthUser: {
      email?: string;
      firstName?: string;
      lastName?: string;
      provider?: string;
      providerId?: string;
      picture?: string;
    } | null,
  ) {
    const email = oauthUser?.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException(
        'OAuth provider did not return an email.',
      );
    }

    let user = await this.db.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      const tenantId = randomUUID();
      user = await this.db.db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            email,
            fullName:
              [oauthUser?.firstName, oauthUser?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() || null,
            passwordHash: await argon2.hash(randomBytes(32).toString('hex')),
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
            authProvider: oauthUser!.provider,
            providerId: oauthUser!.providerId,
            avatarUrl: oauthUser?.picture,
          })
          .returning();

        const [tenant] = await tx
          .insert(tenants)
          .values({
            id: tenantId,
            name: 'My Practice',
          })
          .returning({ id: tenants.id });

        await tx.insert(memberships).values({
          userId: newUser.id,
          tenantId: tenant.id,
          role: 'OWNER',
          isDefault: true,
        });

        return newUser;
      });
    } else {
      if (user.status === 'SUSPENDED') {
        this.logger.warn(`OAuth login denied for suspended user ${user.id}`);
        throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
      }
      await this.db.db
        .update(users)
        .set({
          authProvider: oauthUser!.provider,
          providerId: oauthUser!.providerId,
          avatarUrl: oauthUser?.picture || user.avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    const membershipRows = await this.db.db
      .select({
        tenantId: memberships.tenantId,
        name: tenants.name,
        role: memberships.role,
        isDefault: memberships.isDefault,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(memberships.isDefault), asc(memberships.createdAt));

    if (membershipRows.length === 0) {
      this.logger.error(`User ${user.id} has no tenant membership`);
      throw new ForbiddenException('No tenant membership found.');
    }

    const activeTenant = membershipRows[0];
    const accessToken = await this.createAccessToken(
      user.id,
      activeTenant.tenantId,
    );
    const { session, refreshToken } = await this.createSession(
      user.id,
      activeTenant.tenantId,
      {},
    );

    this.logger.log(
      `User ${user.id} logged in via OAuth (${oauthUser!.provider})`,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      tenants: membershipRows.map((row) => ({
        id: row.tenantId,
        name: row.name,
        role: row.role,
        isDefault: row.isDefault,
      })),
    };
  }

  private async createAndSendVerificationToken(userId: string, email: string) {
    const token = this.createOpaqueToken();
    const tokenHash = await argon2.hash(token.secret);

    const [verificationToken] = await this.db.db
      .insert(emailVerificationTokens)
      .values({
        id: token.id,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning({ id: emailVerificationTokens.id });

    if (!verificationToken) {
      throw new InternalServerErrorException(
        'Failed to create verification token.',
      );
    }

    await this.mailService.sendVerificationEmail(email, token.value);
  }

  private createOpaqueToken() {
    const id = randomUUID();
    const secret = randomBytes(32).toString('hex');

    return {
      id,
      secret,
      value: `${id}.${secret}`,
    };
  }

  private parseOpaqueToken(tokenValue: string) {
    const separatorIndex = tokenValue.indexOf('.');

    if (separatorIndex === -1) {
      return null;
    }

    const id = tokenValue.slice(0, separatorIndex);
    const secret = tokenValue.slice(separatorIndex + 1);

    if (!id || !secret) {
      return null;
    }

    return { id, secret };
  }

  private async createSession(
    userId: string,
    tenantId: string,
    metadata: SessionMetadata,
    familyId: string = randomUUID(),
  ) {
    const sessionId = randomUUID();
    const refreshTokenSecret = randomBytes(64).toString('hex');
    const refreshTokenHash = await argon2.hash(refreshTokenSecret);

    const [session] = await this.db.db
      .insert(sessions)
      .values({
        id: sessionId,
        familyId,
        userId,
        tenantId,
        refreshTokenHash,
        userAgent: metadata.userAgent?.slice(0, 1000),
        ipAddress: metadata.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      })
      .returning({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
      });

    return {
      session,
      refreshToken: `${sessionId}.${refreshTokenSecret}`,
    };
  }

  private async revokeSession(sessionId: string) {
    await this.db.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  }

  private async revokeSessionFamily(familyId: string, _userId: string) {
    await this.revokeSessionsByFamily(familyId);
  }

  private async revokeSessionsByFamily(familyId: string) {
    await this.db.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.familyId, familyId));
  }

  private async revokeAllSessions(userId: string) {
    await this.db.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.userId, userId));
  }
}
