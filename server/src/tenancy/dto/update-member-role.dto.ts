import { IsIn } from 'class-validator';

import { ASSIGNABLE_ROLES } from '@/tenancy/roles';
import type { AssignableRole } from '@/tenancy/roles';

export class UpdateMemberRoleDto {
  @IsIn(ASSIGNABLE_ROLES)
  role!: AssignableRole;
}
