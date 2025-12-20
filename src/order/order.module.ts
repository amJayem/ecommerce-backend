import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderPublicController } from './public/order-public.controller';
import { OrderAdminController } from './admin/order-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [OrderPublicController, OrderAdminController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
