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

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.LEADS_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(context.tenantId, createClientDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.LEADS_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.clientsService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.LEADS_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.LEADS_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(context.tenantId, id, updateClientDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.LEADS_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(context.tenantId, id);
  }
}
