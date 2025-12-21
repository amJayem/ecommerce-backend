import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { Permissions } from '../../auth/decorator/permissions.decorator';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import { PermissionGuard } from '../../auth/guard/permission.guard';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { PermissionService } from '../../permission/permission.service';
import { UsersService } from '../users.service';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class UsersAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users (filter by status)' })
  @ApiQuery({
    name: 'status',
    enum: UserStatus,
    required: false,
    description: 'Filter users by status (e.g. PENDING)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires user.read permission.',
  })
  @Permissions('user.read')
  findAll(@Query('status') status?: UserStatus) {
    return this.usersService.findAll(status);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User approved successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires user.approve permission.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Permissions('user.approve')
  approve(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.approveUser(+id, admin.id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User rejected successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires user.approve permission.',
  })
  @Permissions('user.approve') // Rejection usually same level as approval
  reject(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.rejectUser(+id, admin.id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User suspended successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires user.manage permission.',
  })
  @Permissions('user.manage') // Suspension might be higher level
  suspend(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.usersService.suspendUser(+id, admin.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { role: { type: 'string', example: 'moderator' } },
    },
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires user.manage permission.',
  })
  @Permissions('user.manage')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(+id, role);
  }

  @Patch(':id/access')
  @ApiOperation({
    summary: 'Update user role and permissions in one operation',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', example: 'moderator' },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['product.read'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User access updated successfully.',
  })
  @Permissions('user.manage')
  async updateAccess(
    @Param('id') id: string,
    @Body() dto: { role?: string; permissions?: string[] },
    @CurrentUser() admin: any,
  ) {
    const userId = +id;
    const results: any = { message: 'Access updated successfully' };

    // 1. Update role if provided
    if (dto.role) {
      results.roleUpdate = await this.usersService.updateRole(userId, dto.role);
    }

    // 2. Sync permissions if provided
    if (dto.permissions) {
      results.permissionSync = await this.permissionService.syncPermissions(
        userId,
        dto.permissions,
        admin?.id,
      );
    }

    return results;
  }
}
