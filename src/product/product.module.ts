import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductPublicController } from './public/product-public.controller';
import { ProductAdminController } from './admin/product-admin.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    MulterModule.register({
      dest: './uploads', // temporary storage if needed, but we use memoryBuffer
    }),
  ],
  controllers: [ProductPublicController, ProductAdminController],
  providers: [ProductService],
})
export class ProductModule {}
