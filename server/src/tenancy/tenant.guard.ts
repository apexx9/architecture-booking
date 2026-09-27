import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { and, eq } from 'drizzle-orm';
import type { Request } from 'express';

import type { AccessTokenPayload } from '@/auth/auth.guard';
import { DatabaseService } from '@/db/database.service';
import { memberships } from '@/db/schema/memberships.schema';
import type { TenantContext } from '@/tenancy/tenancy.types';

type TenantRequest = Request & {
  user?: AccessTokenPayload;
  tenantContext?: TenantContext;
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required.');
    }

    const tenantId = user.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No active tenant.');
    }

    const [membership] = await this.db.db
      .select({
        id: memberships.id,
        role: memberships.role,
      })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, user.sub),
          eq(memberships.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this tenant.');
    }

    request.tenantContext = {
      userId: user.sub,
      tenantId,
      role: membership.role,
      membershipId: membership.id,
    };

    return true;
  }
}
