import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AccessTokenGuard } from '@/auth/auth.guard';
import type { AccessTokenPayload } from '@/auth/auth.guard';
import { CsrfGuard } from '@/auth/csrf.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { AppConfigService } from '@/config/app-config.service';

import { AddMemberDto } from '@/tenancy/dto/add-member.dto';
import { CreateTenantDto } from '@/tenancy/dto/create-tenant.dto';
import { SwitchTenantDto } from '@/tenancy/dto/switch-tenant.dto';
import { UpdateMemberRoleDto } from '@/tenancy/dto/update-member-role.dto';
import { UpdateTenantDto } from '@/tenancy/dto/update-tenant.dto';
import { CurrentTenantContext } from '@/tenancy/current-tenant-context.decorator';
import { PermissionsGuard } from '@/tenancy/permissions.guard';
import { RequirePermission } from '@/tenancy/require-permission.decorator';
import { PERMISSIONS } from '@/tenancy/roles';
import { TenantGuard } from '@/tenancy/tenant.guard';
import { TenantsService } from '@/tenancy/tenants.service';
import type { TenantContext } from '@/tenancy/tenancy.types';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly appConfig: AppConfigService,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Get()
  listMyTenants(@CurrentUser() user: AccessTokenPayload) {
    return this.tenantsService.listMyTenants(user.sub);
  }

  @UseGuards(AccessTokenGuard, CsrfGuard)
  @Post()
  @HttpCode(201)
  createTenant(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.createTenant(user.sub, dto);
  }

  @UseGuards(AccessTokenGuard, CsrfGuard)
  @Post('switch')
  async switchTenant(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SwitchTenantDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = (request.cookies as Record<string, string>)[
      'refresh_token'
    ];

    const sessionId = refreshToken?.split('.')[0] ?? undefined;

    const result = await this.tenantsService.switchTenant(
      user.sub,
      sessionId,
      dto,
    );

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: this.appConfig.cookieSecure,
      sameSite: this.appConfig.cookieSameSite,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    return {
      tenant: result.tenant,
      role: result.role,
    };
  }

  @UseGuards(AccessTokenGuard, TenantGuard)
  @Get('current')
  getCurrentTenant(@CurrentTenantContext() context: TenantContext) {
    return this.tenantsService.getCurrentTenant(
      context.userId,
      context.tenantId,
    );
  }

  @UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard, CsrfGuard)
  @RequirePermission(PERMISSIONS.TENANT_UPDATE)
  @Patch('current')
  renameTenant(
    @CurrentTenantContext() context: TenantContext,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.renameTenant(
      context.userId,
      context.tenantId,
      dto,
    );
  }

  @UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.TENANT_MEMBERS_READ)
  @Get('current/members')
  listMembers(@CurrentTenantContext() context: TenantContext) {
    return this.tenantsService.listMembers(context.userId, context.tenantId);
  }

  @UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard, CsrfGuard)
  @RequirePermission(PERMISSIONS.TENANT_MEMBERS_MANAGE)
  @Post('current/members')
  @HttpCode(201)
  addMember(
    @CurrentTenantContext() context: TenantContext,
    @Body() dto: AddMemberDto,
  ) {
    return this.tenantsService.addMember(context, dto);
  }

  @UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard, CsrfGuard)
  @RequirePermission(PERMISSIONS.TENANT_MEMBERS_MANAGE)
  @Patch('current/members/:userId')
  updateMemberRole(
    @CurrentTenantContext() context: TenantContext,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tenantsService.updateMemberRole(context, userId, dto);
  }

  @UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard, CsrfGuard)
  @RequirePermission(PERMISSIONS.TENANT_MEMBERS_MANAGE)
  @Delete('current/members/:userId')
  removeMember(
    @CurrentTenantContext() context: TenantContext,
    @Param('userId') userId: string,
  ) {
    return this.tenantsService.removeMember(context, userId);
  }
}
