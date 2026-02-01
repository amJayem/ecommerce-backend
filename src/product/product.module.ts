import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductPublicController } from './public/product-public.controller';
import { ProductAdminController } from './admin/product-admin.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { ProductUtilityService } from './services/product-utility.service';
import { ProductInventoryService } from './services/product-inventory.service';
import { ProductSearchService } from './services/product-search.service';
import { ProductCsvService } from './services/product-csv.service';

@Module({
  imports: [PrismaModule, PermissionModule, MulterModule.register({})],
  controllers: [ProductPublicController, ProductAdminController],
  providers: [
    ProductService,
    ProductUtilityService,
    ProductInventoryService,
    ProductSearchService,
    ProductCsvService,
  ],
  exports: [
    ProductService,
    ProductUtilityService,
    ProductInventoryService,
    ProductSearchService,
    ProductCsvService,
  ],
})
export class ProductModule {}
