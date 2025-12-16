import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: UserStatus) {
    return this.prisma.user.findMany({
      where: status ? { status } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        isVerified: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
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
