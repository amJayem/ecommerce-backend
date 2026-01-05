import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryPublicController } from './public/category-public.controller';
import { CategoryAdminController } from './admin/category-admin.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule, MulterModule.register({})],
  controllers: [CategoryPublicController, CategoryAdminController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
