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

import { AccessTokenGuard } from '@/auth/auth.guard';
import { CsrfGuard } from '@/auth/csrf.guard';
import { CurrentTenantContext } from '@/tenancy/current-tenant-context.decorator';
import { PermissionsGuard } from '@/tenancy/permissions.guard';
import { RequirePermission } from '@/tenancy/require-permission.decorator';
import { PERMISSIONS } from '@/tenancy/roles';
import { TenantGuard } from '@/tenancy/tenant.guard';
import type { TenantContext } from '@/tenancy/tenancy.types';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadToClientDto } from './dto/convert-lead.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.LEADS_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    return this.leadsService.create(context.tenantId, createLeadDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.LEADS_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.leadsService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.LEADS_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.LEADS_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(context.tenantId, id, updateLeadDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.LEADS_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.leadsService.remove(context.tenantId, id);
  }

  @Post(':id/convert')
  @RequirePermission(PERMISSIONS.LEADS_CREATE)
  @UseGuards(CsrfGuard)
  convertToClient(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() dto: ConvertLeadToClientDto,
  ) {
    return this.leadsService.convertToClient(context.tenantId, id, dto);
  }
}
