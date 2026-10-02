import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// Aliased so it does not clash with the local `UploadedFile` type describing
// the parsed multipart payload.
import { UploadedFile as UploadedFileDecorator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { RequirePermission } from '@/tenancy/require-permission.decorator';
import { PERMISSIONS } from '@/tenancy/roles';
import { TenantGuard } from '@/tenancy/tenant.guard';
import type { TenantContext } from '@/tenancy/tenancy.types';
import { CurrentTenantContext } from '@/tenancy/current-tenant-context.decorator';
import { AccessTokenGuard } from '@/auth/auth.guard';
import { CsrfGuard } from '@/auth/csrf.guard';
import { PermissionsGuard } from '@/tenancy/permissions.guard';

import { FilesService } from './files.service';
import type { UploadedFile, UploadMetadata } from './uploaded-file.type';

@Controller('files')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @RequirePermission(PERMISSIONS.FILES_UPLOAD)
  @UseGuards(CsrfGuard)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentTenantContext() context: TenantContext,
    @UploadedFileDecorator() file: UploadedFile,
    @Body() body: UploadMetadata,
  ) {
    return this.filesService.upload(context.tenantId, file, {
      projectId: body.projectId,
      taskId: body.taskId,
      deliverableId: body.deliverableId,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.FILES_READ)
  findAll(@CurrentTenantContext() context: TenantContext) {
    return this.filesService.findAll(context.tenantId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FILES_READ)
  findOne(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.filesService.findOne(context.tenantId, id);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.FILES_DELETE)
  @UseGuards(CsrfGuard)
  remove(
    @CurrentTenantContext() context: TenantContext,
    @Param('id') id: string,
  ) {
    return this.filesService.remove(context.tenantId, id);
  }
}
