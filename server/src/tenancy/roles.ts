export const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
export type Role = (typeof ROLES)[number];

export const ASSIGNABLE_ROLES: readonly Role[] = ['ADMIN', 'MEMBER', 'VIEWER'];
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const PERMISSIONS = {
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_MEMBERS_READ: 'tenant.members.read',
  TENANT_MEMBERS_MANAGE: 'tenant.members.manage',
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TENANT_MEMBERS_READ,
    PERMISSIONS.TENANT_MEMBERS_MANAGE,
  ],
  ADMIN: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_MEMBERS_READ,
    PERMISSIONS.TENANT_MEMBERS_MANAGE,
  ],
  MEMBER: [PERMISSIONS.TENANT_READ, PERMISSIONS.TENANT_MEMBERS_READ],
  VIEWER: [PERMISSIONS.TENANT_READ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
