import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersAdminController } from './admin/users-admin.controller';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, PermissionModule, CloudinaryModule],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
