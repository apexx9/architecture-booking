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
import { PermissionsGuard } from '@/tenancy/permissions.guard';
import { RequirePermission } from '@/tenancy/require-permission.decorator';
import { PERMISSIONS } from '@/tenancy/roles';
import { TenantGuard } from '@/tenancy/tenant.guard';
import type { TenantContext } from '@/tenancy/tenancy.types';
import { CurrentTenantContext } from '@/tenancy/current-tenant-context.decorator';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROJECTS_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(context.tenantId, createProjectDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PROJECTS_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.projectsService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROJECTS_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.projectsService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PROJECTS_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(context.tenantId, id, updateProjectDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PROJECTS_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(context.tenantId, id);
  }
}
