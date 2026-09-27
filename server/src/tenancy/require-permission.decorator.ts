import { SetMetadata } from '@nestjs/common';

import type { Permission } from '@/tenancy/roles';

export const PERMISSIONS_KEY = 'tenancy:permissions';

export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
