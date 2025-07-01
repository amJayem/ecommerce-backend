import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 Make sure the path is correct

@Module({
  imports: [PrismaModule], // 👈 Add this
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
