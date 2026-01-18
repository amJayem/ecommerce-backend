import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { softDeleteExtension } from './prisma-soft-delete.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  readonly extendedClient: any;

  // Shadowed properties from base PrismaClient
  get product(): Prisma.ProductDelegate {
    return (this.extendedClient as any).product;
  }

  get category(): Prisma.CategoryDelegate {
    return (this.extendedClient as any).category;
  }

  constructor() {
    super();
    this.extendedClient = this.extendWithSoftDelete();
  }

  private extendWithSoftDelete() {
    return this.$extends(softDeleteExtension);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
