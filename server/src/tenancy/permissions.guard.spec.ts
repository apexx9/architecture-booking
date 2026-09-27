import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PermissionsGuard } from '@/tenancy/permissions.guard';
import { PERMISSIONS } from '@/tenancy/roles';
import type { TenantContext } from '@/tenancy/tenancy.types';

function createExecutionContext(tenantContext?: TenantContext) {
  const request = { tenantContext };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as Parameters<PermissionsGuard['canActivate']>[0];
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  const mockReflector = (permissions: unknown) => ({
    getAllAndOverride: jest.fn(() => permissions),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsGuard],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  const ownerContext: TenantContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'OWNER',
    membershipId: 'membership-1',
  };

  const viewerContext: TenantContext = {
    userId: 'user-2',
    tenantId: 'tenant-1',
    role: 'VIEWER',
    membershipId: 'membership-2',
  };

  it('allows access when the role holds the permission', () => {
    (guard as unknown as { reflector: unknown }).reflector = mockReflector([
      PERMISSIONS.TENANT_MEMBERS_MANAGE,
    ]);

    const context = createExecutionContext(ownerContext);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when the role lacks the permission', () => {
    (guard as unknown as { reflector: unknown }).reflector = mockReflector([
      PERMISSIONS.TENANT_MEMBERS_MANAGE,
    ]);

    const context = createExecutionContext(viewerContext);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies access when there is no tenant context', () => {
    (guard as unknown as { reflector: unknown }).reflector = mockReflector([
      PERMISSIONS.TENANT_READ,
    ]);

    const context = createExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access when no permission is required', () => {
    (guard as unknown as { reflector: unknown }).reflector =
      mockReflector(undefined);

    const context = createExecutionContext(viewerContext);

    expect(guard.canActivate(context)).toBe(true);
  });
});
