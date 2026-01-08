import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available permissions (Now returns a list of common strings, as they are no longer in DB)
   * This is technically optional now since permissions are defined by the frontend/guard.
   */
  async getAllPermissions() {
    return [
      { name: 'order.read', category: 'order' },
      { name: 'order.create', category: 'order' },
      { name: 'order.update', category: 'order' },
      { name: 'order.delete', category: 'order' },
      { name: 'product.read', category: 'product' },
      { name: 'product.create', category: 'product' },
      { name: 'product.update', category: 'product' },
      { name: 'product.delete', category: 'product' },
      { name: 'category.read', category: 'category' },
      { name: 'category.create', category: 'category' },
      { name: 'category.update', category: 'category' },
      { name: 'category.delete', category: 'category' },
      { name: 'user.read', category: 'user' },
      { name: 'user.approve', category: 'user' },
      { name: 'user.manage', category: 'user' },
      { name: 'admin.action', category: 'admin' },
      { name: 'analytics.orders.read', category: 'analytics' },
      { name: 'analytics.sales.read', category: 'analytics' },
      { name: 'analytics.inventory.read', category: 'analytics' },
    ];
  }

  /**
   * Get all permissions grouped by category
   */
  async getPermissionsByCategory() {
    const permissions = await this.getAllPermissions();
    return permissions.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p.name);
        return acc;
      },
      {} as Record<string, string[]>,
    );
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.permissions;
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) return false;

    return user.permissions.includes(permissionName);
  }

  /**
   * Assign a single permission to a user
   */
  async assignPermission(userId: number, permissionName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.permissions.includes(permissionName)) {
      return {
        message: 'Permission already assigned',
        permission: permissionName,
      };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          push: permissionName,
        },
      },
    });

    return {
      message: 'Permission assigned successfully',
      permission: permissionName,
    };
  }

  /**
   * Assign multiple permissions to a user
   */
  async assignPermissions(
    userId: number,
    permissionNames: string[],
    grantedBy?: number, // Kept for compatibility, though not used in simple array storage
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newPermissions = [
      ...new Set([...user.permissions, ...permissionNames]),
    ];

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: newPermissions,
      },
    });

    return {
      message: 'Permissions updated successfully',
      assigned: permissionNames,
    };
  }

  /**
   * Revoke a permission from a user
   */
  async revokePermission(userId: number, permissionName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedPermissions = user.permissions.filter(
      (p) => p !== permissionName,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: updatedPermissions,
      },
    });

    return {
      message: 'Permission revoked successfully',
      permission: permissionName,
    };
  }

  /**
   * Revoke all permissions from a user
   */
  async revokeAllPermissions(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: [],
      },
    });

    return {
      message: 'All permissions revoked',
    };
  }

  /**
   * Get users who have a specific permission
   */
  async getUsersWithPermission(permissionName: string) {
    const users = await this.prisma.user.findMany({
      where: {
        permissions: {
          has: permissionName,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return users.map((user) => ({
      ...user,
      grantedAt: new Date(), // Mocked as it's no longer tracked per-permission
    }));
  }

  /**
   * Sync permissions for a user (Set exactly these permissions)
   */
  async syncPermissions(
    userId: number,
    permissionNames: string[],
    grantedBy?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        permissions: permissionNames,
      };

      // Automatically approve user if they are PENDING and getting permissions
      if (user.status === 'PENDING' && permissionNames.length > 0) {
        updateData.status = 'APPROVED';
        updateData.approvedBy = grantedBy;
        updateData.approvedAt = new Date();
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      return {
        message: 'Permissions synced successfully',
        syncedCount: permissionNames.length,
        permissions: permissionNames,
        automaticallyApproved:
          user.status === 'PENDING' && permissionNames.length > 0,
      };
    });
  }
}
