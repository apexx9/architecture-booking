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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermission(PERMISSIONS.TASKS_CREATE)
  @UseGuards(CsrfGuard)
  create(
    @CurrentTenantContext() context: TenantContext,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(context.tenantId, createTaskDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TASKS_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.tasksService.findAll(context.tenantId);
  }

  @Get('project/:projectId')
  @RequirePermission(PERMISSIONS.TASKS_READ)
  findByProject(
    @CurrentTenantContext() context: TenantContext,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findByProject(context.tenantId, projectId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TASKS_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(context.tenantId, id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TASKS_UPDATE)
  @UseGuards(CsrfGuard)
  update(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(context.tenantId, id, updateTaskDto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.TASKS_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(context.tenantId, id);
  }
}
