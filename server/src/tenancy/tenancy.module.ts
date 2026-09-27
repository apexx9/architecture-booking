import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';

import { PermissionsGuard } from './permissions.guard';
import { TenantGuard } from './tenant.guard';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule],

  controllers: [TenantsController],

  providers: [TenantsService, TenantGuard, PermissionsGuard],
})
export class TenancyModule {}
