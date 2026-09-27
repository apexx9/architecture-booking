import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

import { PERMISSIONS_KEY } from '@/tenancy/require-permission.decorator';
import { hasPermission } from '@/tenancy/roles';
import type { Permission } from '@/tenancy/roles';
import type { TenantContext } from '@/tenancy/tenancy.types';

type PermissionRequest = Request & {
  tenantContext?: TenantContext;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context.switchToHttp().getRequest<PermissionRequest>();

    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('No tenant context.');
    }

    for (const permission of requiredPermissions) {
      if (!hasPermission(tenantContext.role, permission)) {
        throw new ForbiddenException('Insufficient permissions.');
      }
    }

    return true;
  }
}
