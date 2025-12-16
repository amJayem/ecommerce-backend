import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is provided globally or needs import? 
// If PrismaModule is Global, we don't strictly need to import it if it exports PrismaService. 
// But if it's not Global, we need imports: [PrismaModule]. 
// Usually PrismaModule is standard. I'll provide PrismaService in providers if needed or assume global.
// Best practice: Import PrismaModule if it exists.
// I saw prisma directory but no prisma.module.ts in list? 
// src/prisma dir had 3 children. Let's check if there is a module.
// If I assume correct imports later, I can fix.
// For now, adding basic structure.

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
