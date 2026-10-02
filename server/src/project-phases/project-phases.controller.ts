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
import { ProjectPhasesService } from './project-phases.service';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Controller('project-phases')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ProjectPhasesController {
  constructor(private readonly projectPhasesService: ProjectPhasesService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PHASES_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createDto: CreateProjectPhaseDto,
  ) {
    return this.projectPhasesService.create(context.tenantId, createDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PHASES_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.projectPhasesService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PHASES_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.projectPhasesService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PHASES_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectPhaseDto,
  ) {
    return this.projectPhasesService.update(context.tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PHASES_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.projectPhasesService.remove(context.tenantId, id);
  }
}
