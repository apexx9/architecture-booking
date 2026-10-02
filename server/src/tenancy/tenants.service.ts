import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { and, asc, count, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/db/database.service';
import { memberships } from '@/db/schema/memberships.schema';
import { sessions } from '@/db/schema/sessions.schema';
import { tenants } from '@/db/schema/tenants.schema';
import { users } from '@/db/schema/users.schema';

import { AddMemberDto } from '@/tenancy/dto/add-member.dto';
import { CreateTenantDto } from '@/tenancy/dto/create-tenant.dto';
import { SwitchTenantDto } from '@/tenancy/dto/switch-tenant.dto';
import { UpdateMemberRoleDto } from '@/tenancy/dto/update-member-role.dto';
import { UpdateTenantDto } from '@/tenancy/dto/update-tenant.dto';
import type { TenantContext } from '@/tenancy/tenancy.types';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async listMyTenants(userId: string) {
    const rows = await this.db.db
      .select({
        tenantId: memberships.tenantId,
        name: tenants.name,
        role: memberships.role,
        isDefault: memberships.isDefault,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.userId, userId))
      .orderBy(desc(memberships.isDefault), asc(memberships.createdAt));

    return rows.map((row) => ({
      id: row.tenantId,
      name: row.name,
      role: row.role,
      isDefault: row.isDefault,
    }));
  }

  async createTenant(userId: string, dto: CreateTenantDto) {
    const name = dto.name.trim();
    const tenantId = randomUUID();

    const tenant = await this.db.db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          id: tenantId,
          name,
        })
        .returning({
          id: tenants.id,
          name: tenants.name,
          createdAt: tenants.createdAt,
        });

      await tx.insert(memberships).values({
        userId,
        tenantId,
        role: 'OWNER',
        isDefault: false,
      });

      return tenant;
    });

    this.logger.log(`User ${userId} created tenant ${tenant.id}`);

    return {
      id: tenant.id,
      name: tenant.name,
      role: 'OWNER' as const,
      isDefault: false,
    };
  }

  async switchTenant(
    userId: string,
    sessionId: string | undefined,
    dto: SwitchTenantDto,
  ) {
    const [membership] = await this.db.db
      .select({
        id: memberships.id,
        role: memberships.role,
      })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.tenantId, dto.tenantId),
        ),
      )
      .limit(1);

    if (!membership) {
      this.logger.warn(
        `User ${userId} attempted to switch to non-member tenant ${dto.tenantId}`,
      );
      throw new ForbiddenException('You are not a member of this tenant.');
    }

    await this.db.db.transaction(async (tx) => {
      await tx
        .update(memberships)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(memberships.userId, userId));

      await tx
        .update(memberships)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(eq(memberships.id, membership.id));

      if (sessionId) {
        await tx
          .update(sessions)
          .set({
            tenantId: dto.tenantId,
            updatedAt: new Date(),
          })
          .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
      }
    });

    const [tenant] = await this.db.db
      .select({
        id: tenants.id,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, dto.tenantId))
      .limit(1);

    const accessToken = await this.createAccessToken(userId, dto.tenantId);

    this.logger.log(`User ${userId} switched active tenant to ${dto.tenantId}`);

    return {
      accessToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      role: membership.role,
    };
  }

  async getCurrentTenant(userId: string, tenantId: string) {
    const [row] = await this.db.db
      .select({
        id: tenants.id,
        name: tenants.name,
        role: memberships.role,
        isDefault: memberships.isDefault,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(
        and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)),
      )
      .limit(1);

    if (!row) {
      throw new ForbiddenException('You are not a member of this tenant.');
    }

    return row;
  }

  async renameTenant(userId: string, tenantId: string, dto: UpdateTenantDto) {
    const name = dto.name.trim();

    const [tenant] = await this.db.db
      .update(tenants)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning({
        id: tenants.id,
        name: tenants.name,
      });

    this.logger.log(`User ${userId} renamed tenant ${tenantId}`);

    return tenant;
  }

  async listMembers(userId: string, tenantId: string) {
    const rows = await this.db.db
      .select({
        userId: memberships.userId,
        email: users.email,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.tenantId, tenantId))
      .orderBy(asc(memberships.createdAt));

    this.logger.log(`User ${userId} listed members of tenant ${tenantId}`);

    return rows;
  }

  async addMember(context: TenantContext, dto: AddMemberDto) {
    const email = dto.email.trim().toLowerCase();
    const { tenantId } = context;

    const [user] = await this.db.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new NotFoundException('No user found with this email.');
    }

    const [existing] = await this.db.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, user.id),
          eq(memberships.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('User is already a member of this tenant.');
    }

    const [member] = await this.db.db
      .insert(memberships)
      .values({
        userId: user.id,
        tenantId,
        role: dto.role,
        isDefault: false,
      })
      .returning({
        userId: memberships.userId,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      });

    this.logger.log(
      `User ${context.userId} added member ${user.id} to tenant ${tenantId} as ${dto.role}`,
    );

    return {
      userId: member.userId,
      email,
      role: member.role,
      // Same shape as a `listMembers` row, so a caller can treat the created
      // member exactly like a fetched one instead of refetching the list.
      joinedAt: member.joinedAt,
    };
  }

  async updateMemberRole(
    context: TenantContext,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const { tenantId } = context;

    const [target] = await this.db.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, targetUserId),
          eq(memberships.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new NotFoundException('Member not found in this tenant.');
    }

    if (target.role === 'OWNER') {
      throw new ForbiddenException(
        "The tenant owner's role cannot be changed.",
      );
    }

    if (context.role === 'ADMIN' && target.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admins cannot change the role of other admins.',
      );
    }

    const [updated] = await this.db.db
      .update(memberships)
      .set({
        role: dto.role,
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, target.id))
      .returning({
        userId: memberships.userId,
        role: memberships.role,
      });

    this.logger.log(
      `User ${context.userId} changed role of ${targetUserId} to ${dto.role} in tenant ${tenantId}`,
    );

    return updated;
  }

  async removeMember(context: TenantContext, targetUserId: string) {
    const { tenantId } = context;

    const [target] = await this.db.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, targetUserId),
          eq(memberships.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new NotFoundException('Member not found in this tenant.');
    }

    if (context.role === 'ADMIN' && target.role === 'ADMIN') {
      throw new ForbiddenException('Admins cannot remove other admins.');
    }

    if (target.role === 'OWNER') {
      const [ownerCount] = await this.db.db
        .select({ count: count() })
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, tenantId),
            eq(memberships.role, 'OWNER'),
          ),
        );

      if (Number(ownerCount.count) <= 1) {
        throw new ForbiddenException('A tenant must have at least one owner.');
      }
    }

    await this.db.db.delete(memberships).where(eq(memberships.id, target.id));

    this.logger.log(
      `User ${context.userId} removed member ${targetUserId} from tenant ${tenantId}`,
    );

    return {
      message: 'Member removed successfully.',
    };
  }

  private async createAccessToken(userId: string, tenantId: string) {
    return this.jwtService.signAsync({
      sub: userId,
      tenantId,
      type: 'access',
    });
  }
}
