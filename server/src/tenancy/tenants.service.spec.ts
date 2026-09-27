import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@/db/database.service';

import { TenantsService } from '@/tenancy/tenants.service';
import type { TenantContext } from '@/tenancy/tenancy.types';

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

describe('TenantsService', () => {
  let service: TenantsService;
  let dbMock: ReturnType<typeof createDbMock>;
  let jwtService: JwtService;

  const ownerContext: TenantContext = {
    userId: 'user-a',
    tenantId: 'tenant-a',
    role: 'OWNER',
    membershipId: 'membership-a',
  };

  const adminContext: TenantContext = {
    userId: 'user-b',
    tenantId: 'tenant-a',
    role: 'ADMIN',
    membershipId: 'membership-b',
  };

  const swapDb = (results: Record<string, ResultProvider>) => {
    dbMock = createDbMock(results);
    (service as unknown as { db: { db: unknown } }).db.db = dbMock;
  };

  beforeEach(async () => {
    dbMock = createDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
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
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listMyTenants', () => {
    it('returns the tenants the user belongs to', async () => {
      swapDb({
        'select.from.innerJoin.where.orderBy': [
          {
            tenantId: 'tenant-a',
            name: 'Studio A',
            role: 'OWNER',
            isDefault: true,
          },
          {
            tenantId: 'tenant-b',
            name: 'Studio B',
            role: 'MEMBER',
            isDefault: false,
          },
        ],
      });

      const result = await service.listMyTenants('user-a');

      expect(result).toEqual([
        { id: 'tenant-a', name: 'Studio A', role: 'OWNER', isDefault: true },
        { id: 'tenant-b', name: 'Studio B', role: 'MEMBER', isDefault: false },
      ]);
    });
  });

  describe('createTenant', () => {
    it('creates the tenant with the creator as owner', async () => {
      swapDb({
        'tx.insert.values.returning': [
          { id: 'tenant-new', name: 'New Studio', createdAt: new Date() },
        ],
      });

      const result = await service.createTenant('user-a', {
        name: '  New Studio  ',
      });

      expect(result).toEqual({
        id: 'tenant-new',
        name: 'New Studio',
        role: 'OWNER',
        isDefault: false,
      });

      const txInserts = dbMock.calls.filter(
        (call) => call.isTx && call.steps.join('.') === 'tx.insert.values',
      );

      expect(txInserts[0].args[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'New Studio',
        }),
      );

      const membershipInsert = txInserts.find(
        (call) => (call.args[0] as { role?: string }).role === 'OWNER',
      );

      expect(membershipInsert?.args[0]).toEqual(
        expect.objectContaining({
          userId: 'user-a',
          tenantId: expect.any(String),
          role: 'OWNER',
        }),
      );
    });
  });

  describe('switchTenant', () => {
    it('switches to a tenant the user belongs to', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          return selects === 1
            ? [{ id: 'membership-b', role: 'MEMBER' }]
            : [{ id: 'tenant-b', name: 'Studio B' }];
        },
      });

      const result = await service.switchTenant('user-a', 'session-1', {
        tenantId: 'tenant-b',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-a',
        tenantId: 'tenant-b',
        type: 'access',
      });
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.role).toBe('MEMBER');

      const sessionUpdate = dbMock.calls.find(
        (call) =>
          call.isTx &&
          call.steps.join('.') === 'tx.update.set' &&
          (call.args[0] as { tenantId?: string }).tenantId === 'tenant-b',
      );

      expect(sessionUpdate).toBeDefined();
    });

    it('rejects switching to a tenant the user does not belong to', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.switchTenant('user-a', 'session-1', {
          tenantId: 'tenant-b',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getCurrentTenant', () => {
    it('returns the active tenant', async () => {
      swapDb({
        'select.from.innerJoin.where.limit': [
          { id: 'tenant-a', name: 'Studio A', role: 'OWNER', isDefault: true },
        ],
      });

      const result = await service.getCurrentTenant('user-a', 'tenant-a');

      expect(result.name).toBe('Studio A');
      expect(result.role).toBe('OWNER');
    });

    it('rejects users without a membership in the tenant', async () => {
      swapDb({
        'select.from.innerJoin.where.limit': [],
      });

      await expect(
        service.getCurrentTenant('user-a', 'tenant-b'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('renameTenant', () => {
    it('renames the tenant', async () => {
      swapDb({
        'update.set.where.returning': [
          { id: 'tenant-a', name: 'Renamed Studio' },
        ],
      });

      const result = await service.renameTenant('user-a', 'tenant-a', {
        name: '  Renamed Studio  ',
      });

      expect(result.name).toBe('Renamed Studio');
    });
  });

  describe('listMembers', () => {
    it('lists members scoped to the active tenant only', async () => {
      swapDb({
        'select.from.innerJoin.where.orderBy': [
          {
            userId: 'user-a',
            email: 'a@example.com',
            role: 'OWNER',
            joinedAt: new Date(),
          },
          {
            userId: 'user-b',
            email: 'b@example.com',
            role: 'MEMBER',
            joinedAt: new Date(),
          },
        ],
      });

      const result = await service.listMembers('user-a', 'tenant-a');

      expect(result).toHaveLength(2);

      const whereCall = dbMock.calls.find(
        (call) => call.steps.join('.') === 'select.from.innerJoin.where',
      );

      const seen = new Set<object>();
      const safeJson = (value: unknown) =>
        JSON.stringify(value, (_key, v) => {
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          return v;
        });

      const whereSql = safeJson(whereCall?.args[0]);

      expect(whereSql).toContain('tenant-a');
      expect(whereSql).not.toContain('tenant-b');
    });
  });

  describe('addMember', () => {
    it('adds a member to the tenant', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          return selects === 1 ? [{ id: 'user-c' }] : [];
        },
        'insert.values.returning': [{ userId: 'user-c', role: 'MEMBER' }],
      });

      const result = await service.addMember(ownerContext, {
        email: 'c@example.com',
        role: 'MEMBER',
      });

      expect(result).toEqual({
        userId: 'user-c',
        email: 'c@example.com',
        role: 'MEMBER',
      });

      const insert = dbMock.calls.find(
        (call) => call.steps.join('.') === 'insert.values',
      );

      expect(insert?.args[0]).toEqual(
        expect.objectContaining({
          userId: 'user-c',
          tenantId: 'tenant-a',
          role: 'MEMBER',
        }),
      );
    });

    it('rejects unknown users', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.addMember(ownerContext, {
          email: 'nobody@example.com',
          role: 'MEMBER',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects existing members with a conflict', async () => {
      let selects = 0;

      swapDb({
        'select.from.where.limit': () => {
          selects += 1;
          return selects === 1 ? [{ id: 'user-c' }] : [{ id: 'membership-c' }];
        },
      });

      await expect(
        service.addMember(ownerContext, {
          email: 'c@example.com',
          role: 'MEMBER',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('updates the role of a member', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-c', userId: 'user-c', role: 'MEMBER' },
        ],
        'update.set.where.returning': [{ userId: 'user-c', role: 'ADMIN' }],
      });

      const result = await service.updateMemberRole(ownerContext, 'user-c', {
        role: 'ADMIN',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('forbids changing the owner role', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-owner', userId: 'user-o', role: 'OWNER' },
        ],
      });

      await expect(
        service.updateMemberRole(ownerContext, 'user-o', { role: 'ADMIN' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids admins from changing the role of other admins', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-d', userId: 'user-d', role: 'ADMIN' },
        ],
      });

      await expect(
        service.updateMemberRole(adminContext, 'user-d', { role: 'MEMBER' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound for a user outside the tenant', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.updateMemberRole(ownerContext, 'user-x', { role: 'MEMBER' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('removes a member from the tenant', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-c', userId: 'user-c', role: 'MEMBER' },
        ],
      });

      const result = await service.removeMember(ownerContext, 'user-c');

      expect(result).toEqual({ message: 'Member removed successfully.' });

      expect(
        dbMock.calls.some((call) => call.steps.join('.') === 'delete.where'),
      ).toBe(true);
    });

    it('forbids removing the sole owner', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-o', userId: 'user-o', role: 'OWNER' },
        ],
        'select.from.where': [{ count: 1 }],
      });

      await expect(
        service.removeMember(ownerContext, 'user-o'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids admins from removing other admins', async () => {
      swapDb({
        'select.from.where.limit': [
          { id: 'membership-d', userId: 'user-d', role: 'ADMIN' },
        ],
      });

      await expect(
        service.removeMember(adminContext, 'user-d'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound for a user outside the tenant', async () => {
      swapDb({
        'select.from.where.limit': [],
      });

      await expect(
        service.removeMember(ownerContext, 'user-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
