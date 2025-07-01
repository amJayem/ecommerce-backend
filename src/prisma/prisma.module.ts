import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // optional: makes it globally available
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <<< This is important
})
export class PrismaModule {}
