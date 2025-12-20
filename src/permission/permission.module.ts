import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService], // Export for use in guards
})
export class PermissionModule {}
