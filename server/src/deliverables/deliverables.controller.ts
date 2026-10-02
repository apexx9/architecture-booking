import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RequirePermission } from '@/tenancy/require-permission.decorator';
import { PERMISSIONS } from '@/tenancy/roles';
import { TenantGuard } from '@/tenancy/tenant.guard';
import type { TenantContext } from '@/tenancy/tenancy.types';
import { CurrentTenantContext } from '@/tenancy/current-tenant-context.decorator';
import { AccessTokenGuard } from '@/auth/auth.guard';
import { CsrfGuard } from '@/auth/csrf.guard';
import { PermissionsGuard } from '@/tenancy/permissions.guard';

import { DeliverablesService } from './deliverables.service';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto';

@Controller('deliverables')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DELIVERABLES_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createDto: CreateDeliverableDto,
  ) {
    return this.deliverablesService.create(context.tenantId, createDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DELIVERABLES_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.deliverablesService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.DELIVERABLES_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.DELIVERABLES_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateDeliverableDto,
  ) {
    return this.deliverablesService.update(context.tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.DELIVERABLES_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.remove(context.tenantId, id);
  }
}
