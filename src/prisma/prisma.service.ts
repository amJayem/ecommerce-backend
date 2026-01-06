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

  // Delegate common model access to the extended client
  get product() {
    return (this.extendedClient as any).product;
  }

  get category() {
    return (this.extendedClient as any).category;
  }
}
