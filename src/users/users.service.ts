import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: UserStatus) {
    const users = await this.prisma.user.findMany({
      where: status ? { status } : {},
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to sanitize and flatten permissions
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, permissions, ...userData } = user;
      return {
        ...userData,
        permissions: permissions.map((up) => ({
          id: up.permission.id,
          name: up.permission.name,
          category: up.permission.category,
        })),
        permissionNames: permissions.map((up) => up.permission.name),
      };
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, permissions, ...userData } = user;
    return {
      ...userData,
      permissions: permissions.map((up) => ({
        id: up.permission.id,
        name: up.permission.name,
        category: up.permission.category,
      })),
      permissionNames: permissions.map((up) => up.permission.name),
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
}
