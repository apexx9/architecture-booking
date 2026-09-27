import type { Role } from '@/tenancy/roles';

export type TenantContext = {
  userId: string;
  tenantId: string;
  role: Role;
  membershipId: string;
};
