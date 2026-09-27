import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { Request } from 'express';

import type { TenantContext } from '@/tenancy/tenancy.types';

export const CurrentTenantContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { tenantContext: TenantContext }>();

    return request.tenantContext;
  },
);
