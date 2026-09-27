import { hasPermission, PERMISSIONS } from '@/tenancy/roles';

describe('roles', () => {
  it('grants the owner every permission', () => {
    expect(hasPermission('OWNER', PERMISSIONS.TENANT_READ)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.TENANT_UPDATE)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.TENANT_MEMBERS_READ)).toBe(true);
    expect(hasPermission('OWNER', PERMISSIONS.TENANT_MEMBERS_MANAGE)).toBe(
      true,
    );
  });

  it('grants admins member management but not tenant updates', () => {
    expect(hasPermission('ADMIN', PERMISSIONS.TENANT_MEMBERS_MANAGE)).toBe(
      true,
    );
    expect(hasPermission('ADMIN', PERMISSIONS.TENANT_UPDATE)).toBe(false);
  });

  it('grants members read-only access to tenant data', () => {
    expect(hasPermission('MEMBER', PERMISSIONS.TENANT_READ)).toBe(true);
    expect(hasPermission('MEMBER', PERMISSIONS.TENANT_MEMBERS_READ)).toBe(true);
    expect(hasPermission('MEMBER', PERMISSIONS.TENANT_MEMBERS_MANAGE)).toBe(
      false,
    );
  });

  it('grants viewers only tenant read access', () => {
    expect(hasPermission('VIEWER', PERMISSIONS.TENANT_READ)).toBe(true);
    expect(hasPermission('VIEWER', PERMISSIONS.TENANT_MEMBERS_READ)).toBe(
      false,
    );
    expect(hasPermission('VIEWER', PERMISSIONS.TENANT_UPDATE)).toBe(false);
  });
});
