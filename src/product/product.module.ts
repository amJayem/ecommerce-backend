import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductPublicController } from './public/product-public.controller';
import { ProductAdminController } from './admin/product-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [ProductPublicController, ProductAdminController],
  providers: [ProductService],
})
export class ProductModule {}
