import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get all permissions grouped by category
   */
  async getPermissionsByCategory() {
    const permissions = await this.getAllPermissions();

    const grouped = permissions.reduce(
      (acc, permission) => {
        const category = permission.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return grouped;
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId: number) {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
      orderBy: {
        permission: {
          name: 'asc',
        },
      },
    });

    return userPermissions.map((up) => ({
      id: up.id,
      permissionId: up.permissionId,
      name: up.permission.name,
      description: up.permission.description,
      category: up.permission.category,
      grantedBy: up.grantedBy,
      grantedAt: up.grantedAt,
    }));
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean> {
    const count = await this.prisma.userPermission.count({
      where: {
        userId,
        permission: {
          name: permissionName,
        },
      },
    });

    return count > 0;
  }

  /**
   * Assign a single permission to a user
   */
  async assignPermission(
    userId: number,
    permissionName: string,
    grantedBy?: number,
  ) {
    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new NotFoundException(`Permission "${permissionName}" not found`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      return {
        message: 'Permission already assigned',
        permission: permissionName,
      };
    }

    // Assign permission
    await this.prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedBy,
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
    grantedBy?: number,
  ) {
    const results = {
      assigned: [] as string[],
      alreadyAssigned: [] as string[],
      notFound: [] as string[],
    };

    for (const permissionName of permissionNames) {
      try {
        const result = await this.assignPermission(
          userId,
          permissionName,
          grantedBy,
        );

        if (result.message === 'Permission already assigned') {
          results.alreadyAssigned.push(permissionName);
        } else {
          results.assigned.push(permissionName);
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          results.notFound.push(permissionName);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Revoke a permission from a user
   */
  async revokePermission(userId: number, permissionName: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new NotFoundException(`Permission "${permissionName}" not found`);
    }

    const deleted = await this.prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: permission.id,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(
        `User does not have permission "${permissionName}"`,
      );
    }

    return {
      message: 'Permission revoked successfully',
      permission: permissionName,
    };
  }

  /**
   * Revoke all permissions from a user
   */
  async revokeAllPermissions(userId: number) {
    const deleted = await this.prisma.userPermission.deleteMany({
      where: { userId },
    });

    return {
      message: 'All permissions revoked',
      count: deleted.count,
    };
  }

  /**
   * Get users who have a specific permission
   */
  async getUsersWithPermission(permissionName: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission "${permissionName}" not found`);
    }

    return permission.users.map((up) => ({
      ...up.user,
      grantedBy: up.grantedBy,
      grantedAt: up.grantedAt,
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
    // 1. Verify User exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    // 2. Validate all permission names exist
    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map((p) => p.name);
      const missing = permissionNames.filter(
        (name) => !foundNames.includes(name),
      );
      throw new NotFoundException(
        `Permissions not found: ${missing.join(', ')}`,
      );
    }

    // 3. Execute sync in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Remove all existing permissions
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // Add new permissions
      if (permissionNames.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map((p) => ({
            userId,
            permissionId: p.id,
            grantedBy,
          })),
        });
      }

      return {
        message: 'Permissions synced successfully',
        syncedCount: permissions.length,
        permissions: permissionNames,
      };
    });
  }
}
