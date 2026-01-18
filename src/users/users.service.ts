import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(status?: UserStatus) {
    const users = await this.prisma.user.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });

    // Map to sanitize
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, ...userData } = user;
      return {
        ...userData,
        permissionNames: user.permissions,
      };
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userData } = user;
    return {
      ...userData,
      permissionNames: user.permissions,
    };
  }

  async approveUser(id: number, approvedBy: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async rejectUser(id: number, approvedBy: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy, // Track who rejected
        approvedAt: new Date(),
      },
    });
  }

  async suspendUser(id: number, approvedBy: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        // maybe separate field for suspendedBy? reusing approvedBy for now as 'statusChangedBy' effectively
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async updateRole(id: number, roleName: string) {
    // Verify role exists?
    // FK constraint handles it, but good to check or let it fail
    return this.prisma.user.update({
      where: { id },
      data: { role: roleName }, // Logic: changing role stays approved? Usually yes.
    });
  }

  // ==================== PROFILE MANAGEMENT ====================

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Get active orders count
    const activeOrders = await this.prisma.order.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userData } = user;

    return {
      ...userData,
      stats: {
        totalOrders: user._count.orders,
        activeOrders,
      },
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    const result = (await this.cloudinaryService.uploadImage(
      file,
      'profiles',
    )) as UploadApiResponse;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url },
    });

    return { avatarUrl: result.secure_url };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async softDeleteAccount(userId: number) {
    // You can add soft delete logic here
    // For now, we'll just mark the user as SUSPENDED
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        refreshToken: null, // Clear refresh token
      },
    });
  }

  // ==================== ADDRESS MANAGEMENT ====================

  async getAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: {
        userId,
        addressType: 'saved',
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
  }

  async createAddress(userId: number, dto: CreateAddressDto) {
    // 1. Fetch user for fallback info if needed
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // 2. Handle defaults and mapping
    const firstName =
      dto.firstName || user.firstName || user.name.split(' ')[0] || 'N/A';
    const lastName =
      dto.lastName ||
      user.lastName ||
      user.name.split(' ').slice(1).join(' ') ||
      'N/A';
    const phone = dto.phone || user.phone || user.phoneNumber || 'N/A';
    const country = dto.country || 'Bangladesh';

    // Map addressType from DTO to addressName if addressName is missing
    const addressName =
      dto.addressName ||
      dto.addressType ||
      `${dto.street}${dto.state ? `, ${dto.state}` : ''}`;

    // 3. If isDefault is true, unset all other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, addressType: 'saved' },
        data: { isDefault: false },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addressType: _, ...restDto } = dto;

    return this.prisma.address.create({
      data: {
        ...restDto,
        firstName,
        lastName,
        phone,
        country,
        addressName,
        userId,
        addressType: 'saved',
      },
    });
  }

  async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    // Check ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, addressType: 'saved' },
    });

    if (!address) {
      throw new ForbiddenException('Address not found or access denied');
    }

    // If setting as default, unset others
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, addressType: 'saved', id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: number, addressId: number) {
    // Check ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, addressType: 'saved' },
    });

    if (!address) {
      throw new ForbiddenException('Address not found or access denied');
    }

    await this.prisma.address.delete({ where: { id: addressId } });
  }

  async setDefaultAddress(userId: number, addressId: number) {
    // Check ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, addressType: 'saved' },
    });

    if (!address) {
      throw new ForbiddenException('Address not found or access denied');
    }

    // Unset all defaults
    await this.prisma.address.updateMany({
      where: { userId, addressType: 'saved' },
      data: { isDefault: false },
    });

    // Set this as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  // ==================== ADDRESS SNAPSHOT (for orders) ====================

  async createAddressSnapshot(sourceAddressId: number, userId: number) {
    const sourceAddress = await this.prisma.address.findFirst({
      where: { id: sourceAddressId, userId, addressType: 'saved' },
    });

    if (!sourceAddress) {
      throw new BadRequestException('Invalid shipping address');
    }

    return this.prisma.address.create({
      data: {
        firstName: sourceAddress.firstName,
        lastName: sourceAddress.lastName,
        street: sourceAddress.street,
        city: sourceAddress.city,
        state: sourceAddress.state,
        zipCode: sourceAddress.zipCode,
        country: sourceAddress.country,
        phone: sourceAddress.phone,
        addressType: 'order_snapshot',
        userId: null, // Snapshots are not linked to users
        isDefault: false,
      },
    });
  }

  // ==================== NOTIFICATION PREFERENCES ====================

  async getNotifications(userId: number) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create with defaults if doesn't exist
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updateNotifications(
    userId: number,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }
}
