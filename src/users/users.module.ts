import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersAdminController } from './admin/users-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [UsersAdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
