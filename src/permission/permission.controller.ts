import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApprovalGuard } from '../auth/guard/approval.guard';
import { RolesGuard } from '../auth/decorator/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@ApiTags('Admin Permissions')
@ApiBearerAuth('access-token')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, ApprovalGuard, RolesGuard)
@Roles('super_admin')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of all permissions returned successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only super_admin can access this endpoint',
  })
  async getAllPermissions() {
    return this.permissionService.getAllPermissions();
  }

  @Get('grouped')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get permissions grouped by category' })
  @ApiResponse({
    status: 200,
    description: 'Permissions grouped by category',
  })
  async getPermissionsByCategory() {
    return this.permissionService.getPermissionsByCategory();
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's assigned permissions" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: "User's permissions returned successfully",
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionService.getUserPermissions(userId);
  }

  @Post('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({ status: 404, description: 'User or permission not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only super_admin can assign permissions',
  })
  async assignPermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() admin: any,
  ) {
    return this.permissionService.assignPermissions(
      userId,
      dto.permissions,
      admin.id,
    );
  }

  @Delete('user/:userId/:permissionName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific permission from a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({
    name: 'permissionName',
    description: 'Permission name to revoke',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission revoked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User, permission not found, or user does not have permission',
  })
  async revokePermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permissionName') permissionName: string,
  ) {
    return this.permissionService.revokePermission(userId, permissionName);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all permissions from a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'All permissions revoked successfully',
  })
  async revokeAllPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionService.revokeAllPermissions(userId);
  }

  @Get('permission/:permissionName/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users who have a specific permission' })
  @ApiParam({
    name: 'permissionName',
    description: 'Permission name',
    example: 'order.read',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users with the permission',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getUsersWithPermission(
    @Param('permissionName') permissionName: string,
  ) {
    return this.permissionService.getUsersWithPermission(permissionName);
  }
}
