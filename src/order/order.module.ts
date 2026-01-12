import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderPublicController } from './public/order-public.controller';
import { OrderAdminController } from './admin/order-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // Default, can be overridden per sign call
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrderPublicController, OrderAdminController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
