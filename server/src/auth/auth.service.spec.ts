import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';

import { DatabaseService } from '@/db/database.service';
import { MailService } from '@/mail/mail.service';

import { AuthService } from '@/auth/auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(async () => 'hashed-token'),
  verify: jest.fn(async () => true),
}));

const argon2Mock = argon2 as jest.Mocked<typeof argon2>;

type ResultProvider = unknown[] | (() => unknown[]);

type DbCall = {
  isTx: boolean;
  steps: string[];
  args: unknown[];
};

function createDbMock(results: Record<string, ResultProvider> = {}) {
  const calls: DbCall[] = [];

  const record = (steps: string[], args: unknown[], isTx: boolean) => {
    calls.push({ isTx, steps: [...steps], args });
  };

  const query = (steps: string[], isTx: boolean): any =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'then') {
            return (resolve: (value: unknown) => void) => {
              const key = steps.join('.');
              const provider = results[key];
              const value =
                typeof provider === 'function'
                  ? provider()
                  : (provider ?? results.default ?? []);
              resolve(value);
            };
          }

          return (...args: unknown[]) => {
            const newSteps = [...steps, String(prop)];
            record(newSteps, args, isTx);
            return query(newSteps, isTx);
          };
        },
      },
    );

  const tx = {
    update: jest.fn((...args: unknown[]) => {
      record(['tx.update'], args, true);
      return query(['tx.update'], true);
    }),
    insert: jest.fn((...args: unknown[]) => {
      record(['tx.insert'], args, true);
      return query(['tx.insert'], true);
    }),
    delete: jest.fn((...args: unknown[]) => {
      record(['tx.delete'], args, true);
      return query(['tx.delete'], true);
    }),
  };

  type Tx = typeof tx;

  return {
    select: jest.fn(() => query(['select'], false)),
    insert: jest.fn(() => query(['insert'], false)),
    update: jest.fn(() => query(['update'], false)),
    delete: jest.fn(() => query(['delete'], false)),
    transaction: jest.fn(async (callback: (tx: Tx) => Promise<unknown>) =>
      callback(tx),
    ),
    calls,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let dbMock: ReturnType<typeof createDbMock>;
  let mailService: MailService;

  const swapDb = (results: Record<string, ResultProvider>) => {
    dbMock = createDbMock(results);
    (service as unknown as { db: { db: unknown } }).db.db = dbMock;
  };

  beforeEach(async () => {
    dbMock = createDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: { db: dbMock },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(async () => 'signed-access-token'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(async () => undefined),
            sendPasswordResetEmail: jest.fn(async () => undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    argon2Mock.hash.mockResolvedValue('hashed-token');
    argon2Mock.verify.mockResolvedValue(true);
  });

  describe('register', () => {
    it('creates a user and a default tenant in a transaction', async () => {
      const createdAt = new Date();

      let inserts = 0;

      swapDb({
        'select.from.where.limit': [],
        'tx.insert.values.returning': () => {
          inserts += 1;
          return inserts === 1
            ? [
                {
                  id: 'user-1',
                  email: 'user@example.com',
                  status: 'PENDING',
                  createdAt,
                },
              ]
            : [{ id: 'tenant-1' }];
        },
        'insert.values.returning': [{ id: 'verify-token-1' }],
      });

      const result = await service.register({
        email: 'User@Example.com',
        password: 'Password123',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        status: 'PENDING',
        createdAt,
      });

      const txInserts = dbMock.calls.filter(
        (call) => call.isTx && call.steps.join('.') === 'tx.insert.values',
      );

      const tenantInsert = txInserts.find(
        (call) => (call.args[0] as { name?: string }).name !== undefined,
      );

      const membershipInsert = txInserts.find(
        (call) => (call.args[0] as { role?: string }).role === 'OWNER',
      );

      expect(tenantInsert?.args[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'My Practice',
        }),
      );

      expect(membershipInsert?.args[0]).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          tenantId: 'tenant-1',
          role: 'OWNER',
          isDefault: true,
        }),
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringContaining('.'),
      );
    });

    it('throws ConflictException when the email is already registered', async () => {
      swapDb({
        'select.from.where.limit': [{ id: 'existing' }],
      });

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens and tenants for valid credentials', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
      };

      swapDb({
        'select.from.where.limit': [user],
        'select.from.innerJoin.where.orderBy': [
          {
            tenantId: 'tenant-1',
            name: 'My Practice',
            role: 'OWNER',
            isDefault: true,
          },
        ],
        'insert.values.returning': [{ id: 'session-1', expiresAt: new Date() }],
      });

      const result = await service.login({
        email: 'user@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toContain('.');
      expect(result.user.email).toBe('user@example.com');
      expect(result.tenants).toEqual([
        {
          id: 'tenant-1',
          name: 'My Practice',
          role: 'OWNER',
          isDefault: true,
        },
      ]);

      const insertedValues = dbMock.calls.find(
        (call) => call.steps.join('.') === 'insert.values',
      );

      expect(insertedValues?.args[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId: 'user-1',
          tenantId: 'tenant-1',
        }),
      );
    });

    it('throws ForbiddenException when the user has no tenant membership', async () => {
      swapDb({
        'select.from.where.limit': [
          {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            status: 'ACTIVE',
          },
        ],
        'select.from.innerJoin.where.orderBy': [],
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow('No tenant membership found.');
    });

    it('throws UnauthorizedException for an invalid password', async () => {
      argon2Mock.verify.mockResolvedValue(false);

      swapDb({
        'select.from.where.limit': [
          {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            status: 'ACTIVE',
          },
        ],
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException while the email is unverified', async () => {
      swapDb({
        'select.from.where.limit': [
          {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            status: 'PENDING',
          },
        ],
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'Password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException with a generic message for suspended users', async () => {
      swapDb({
        'select.from.where.limit': [
          {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            status: 'SUSPENDED',
          },
        ],
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow('Invalid email or password.');
    });
  });

  describe('verifyEmail', () => {
    it('verifies the email and activates the user', async () => {
      const tokenRow = {
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };

      swapDb({
        'select.from.where.limit': [tokenRow],
      });

      const result = await service.verifyEmail({
        token: 'token-1.some-secret',
      });

      expect(result).toEqual({ message: 'Email verified successfully.' });

      expect(
        dbMock.calls.some(
          (call) => call.isTx && call.steps.join('.') === 'tx.update.set.where',
        ),
      ).toBe(true);
    });

    it('throws UnauthorizedException when no token matches', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.verifyEmail({ token: 'token-1.some-secret' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for a malformed token', async () => {
      await expect(
        service.verifyEmail({ token: 'not-a-valid-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('resendVerification', () => {
    it('returns a generic message for an unknown email', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      const result = await service.resendVerification({
        email: 'nobody@example.com',
      });

      expect(result.message).toContain('If an account exists');
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('sends a new verification token for a pending user', async () => {
      swapDb({
        'select.from.where.limit': [{ id: 'user-1', status: 'PENDING' }],
        'insert.values.returning': [{ id: 'verify-token-1' }],
      });

      await service.resendVerification({
        email: 'user@example.com',
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
      );
      expect(
        dbMock.calls.some((call) => call.steps.join('.') === 'delete.where'),
      ).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('returns a generic message for an unknown email without sending mail', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      const result = await service.forgotPassword({
        email: 'nobody@example.com',
      });

      expect(result.message).toContain('If an account exists');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('deletes old tokens, inserts a hashed token and sends the email', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'user-1', email: 'user@example.com' },
        ],
      });

      const result = await service.forgotPassword({
        email: 'user@example.com',
      });

      expect(result.message).toContain('If an account exists');

      const insertedValues = dbMock.calls.find(
        (call) => call.steps.join('.') === 'insert.values',
      );

      expect(insertedValues?.args[0]).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: 'hashed-token',
        }),
      );

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringContaining('.'),
      );
    });
  });

  describe('resetPassword', () => {
    it('resets the password and revokes all sessions', async () => {
      const tokenRow = {
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };

      swapDb({
        'select.from.where.limit': [tokenRow],
      });

      const result = await service.resetPassword({
        token: 'reset-1.some-secret',
        password: 'NewPassword123',
      });

      expect(result).toEqual({ message: 'Password reset successfully.' });

      expect(
        dbMock.calls.filter(
          (call) => call.isTx && call.steps.join('.') === 'tx.update.set.where',
        ).length,
      ).toBe(3);
    });

    it('throws UnauthorizedException for a malformed token', async () => {
      await expect(
        service.resetPassword({
          token: 'invalid',
          password: 'NewPassword123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for an unknown token', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.resetPassword({
          token: 'reset-1.some-secret',
          password: 'NewPassword123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const activeSession = {
      id: 'session-1',
      familyId: 'family-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      refreshTokenHash: 'hashed-token',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };

    it('throws UnauthorizedException for a malformed refresh token', async () => {
      await expect(service.refresh('not-a-valid-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates the session and keeps the same family', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          if (selects === 1) return [activeSession];
          if (selects === 2) return [{ id: 'user-1', status: 'ACTIVE' }];
          return [{ id: 'membership-1' }];
        },
        'insert.values.returning': [{ id: 'session-2', expiresAt: new Date() }],
      });

      const result = await service.refresh('session-1.some-secret');

      expect(result.session.id).toBe('session-2');
      expect(result.refreshToken).toContain('.');

      const insertedValues = dbMock.calls.find(
        (call) => call.steps.join('.') === 'insert.values',
      );

      expect(insertedValues?.args[0]).toEqual(
        expect.objectContaining({
          familyId: 'family-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
        }),
      );
    });

    it('revokes the session family when a rotated token is reused', async () => {
      swapDb({
        'select.from.where.limit': [
          { ...activeSession, revokedAt: new Date() },
        ],
      });

      await expect(
        service.refresh('session-1.some-secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(
        dbMock.calls.some(
          (call) => call.steps.join('.') === 'update.set.where',
        ),
      ).toBe(true);
    });

    it('denies refresh for a suspended user', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          return selects === 1
            ? [activeSession]
            : [{ id: 'user-1', status: 'SUSPENDED' }];
        },
      });

      await expect(
        service.refresh('session-1.some-secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('denies refresh when the membership was revoked', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          if (selects === 1) return [activeSession];
          if (selects === 2) return [{ id: 'user-1', status: 'ACTIVE' }];
          return [];
        },
      });

      await expect(
        service.refresh('session-1.some-secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(
        dbMock.calls.some(
          (call) => call.steps.join('.') === 'update.set.where',
        ),
      ).toBe(true);
    });
  });

  describe('logout', () => {
    it('revokes the session when the token is valid', async () => {
      swapDb({
        'select.from.where.limit': [
          {
            id: 'session-1',
            refreshTokenHash: 'hashed-token',
            revokedAt: null,
          },
        ],
      });

      await service.logout('session-1.some-secret');

      expect(
        dbMock.calls.some(
          (call) => call.steps.join('.') === 'update.set.where',
        ),
      ).toBe(true);
    });

    it('does nothing for an invalid token', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await service.logout('session-1.some-secret');

      expect(
        dbMock.calls.some(
          (call) => call.steps.join('.') === 'update.set.where',
        ),
      ).toBe(false);
    });
  });

  describe('logoutAll', () => {
    it('revokes every session for the user', async () => {
      await service.logoutAll('user-1');

      expect(
        dbMock.calls.some(
          (call) => call.steps.join('.') === 'update.set.where',
        ),
      ).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the active user', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'user-1', email: 'user@example.com', status: 'ACTIVE' },
        ],
      });

      const result = await service.getCurrentUser('user-1');
      expect(result.email).toBe('user@example.com');
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(service.getCurrentUser('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
