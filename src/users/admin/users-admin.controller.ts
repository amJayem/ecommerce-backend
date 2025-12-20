import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { UserStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import { PermissionGuard } from '../../auth/guard/permission.guard';
import { Permissions } from '../../auth/decorator/permissions.decorator';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

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
}
