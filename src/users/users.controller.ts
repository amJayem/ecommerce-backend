import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApprovalGuard } from '../auth/guard/approval.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user.read')
  findAll(@Query('status') status?: UserStatus) {
    return this.usersService.findAll(status);
  }

  @Patch(':id/approve')
  @Permissions('user.approve')
  approve(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.approveUser(+id, admin.id);
  }

  @Patch(':id/reject')
  @Permissions('user.approve') // Rejection usually same level as approval
  reject(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.rejectUser(+id, admin.id);
  }

  @Patch(':id/suspend')
  @Permissions('user.manage') // Suspension might be higher level
  suspend(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.suspendUser(+id, admin.id);
  }

  @Patch(':id/role')
  @Permissions('user.manage')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(+id, role);
  }
}
