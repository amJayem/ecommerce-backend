import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@ApiTags('Users (Profile & Addresses)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== PROFILE ====================

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getProfile(@GetUser('sub') userId: number) {
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile information' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @GetUser('sub') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update profile avatar' })
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @GetUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(userId, file);
  }

  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @GetUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Delete('profile/delete-account')
  @ApiOperation({ summary: 'Soft-delete account' })
  async deleteAccount(@GetUser('sub') userId: number) {
    await this.usersService.softDeleteAccount(userId);
    return { message: 'Account deactivated' };
  }

  // ==================== ADDRESSES ====================

  @Get('addresses')
  @ApiOperation({ summary: 'Get all saved addresses' })
  async getAddresses(@GetUser('sub') userId: number) {
    return this.usersService.getAddresses(userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create a new address' })
  async createAddress(
    @GetUser('sub') userId: number,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(userId, dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Post('addresses/:id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set address as default' })
  async setDefaultAddress(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.usersService.setDefaultAddress(userId, addressId);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    await this.usersService.deleteAddress(userId, addressId);
    return { message: 'Address deleted' };
  }

  // ==================== NOTIFICATIONS ====================

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotifications(@GetUser('sub') userId: number) {
    return this.usersService.getNotifications(userId);
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(
    @GetUser('sub') userId: number,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotifications(userId, dto);
  }
}
