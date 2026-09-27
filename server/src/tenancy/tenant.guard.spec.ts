import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '@/db/database.service';

import { TenantGuard } from '@/tenancy/tenant.guard';

function createExecutionContext(user?: unknown) {
  const request = { user };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getRequest: () => request,
  } as unknown as Parameters<TenantGuard['canActivate']>[0];
}

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let dbMock: { select: jest.Mock };

  const setupDb = (rows: unknown[]) => {
    dbMock = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({ limit: jest.fn(async () => rows) })),
        })),
      })),
    };
    (guard as unknown as { db: { db: unknown } }).db = { db: dbMock };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: DatabaseService,
          useValue: { db: {} },
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('attaches the tenant context for a valid membership', async () => {
    setupDb([{ id: 'membership-1', role: 'ADMIN' }]);

    const context = createExecutionContext({
      sub: 'user-1',
      tenantId: 'tenant-1',
      type: 'access',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest();

    expect(request.tenantContext).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'ADMIN',
      membershipId: 'membership-1',
    });
  });

  it('throws UnauthorizedException when there is no authenticated user', async () => {
    setupDb([]);

    const context = createExecutionContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when the token has no tenant', async () => {
    setupDb([]);

    const context = createExecutionContext({
      sub: 'user-1',
      type: 'access',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when the user is not a tenant member', async () => {
    setupDb([]);

    const context = createExecutionContext({
      sub: 'user-1',
      tenantId: 'tenant-2',
      type: 'access',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
