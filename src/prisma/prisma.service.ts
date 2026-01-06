import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './prisma-soft-delete.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  readonly extendedClient: ReturnType<typeof this.extendWithSoftDelete>;

  constructor() {
    super();
    this.extendedClient = this.extendWithSoftDelete();

    // Explicitly define properties on the instance to shadow base PrismaClient properties
    // This ensures that this.product and this.category always use the soft-delete extension
    Object.defineProperties(this, {
      product: {
        get: () => (this.extendedClient as any).product,
        enumerable: true,
        configurable: true,
      },
      category: {
        get: () => (this.extendedClient as any).category,
        enumerable: true,
        configurable: true,
      },
    });
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
