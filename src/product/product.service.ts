import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    console.log('Creating product with data:', data);
    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        imageUrl: data.imageUrl,
        coverImage: data.coverImage,
        images: data.images || [],
        category: data.category,
        categoryId: data.categoryId,
        stock: data.stock,
        status: data.status || 'draft',
        tags: data.tags || [],
        sku: data.sku,
        isFeatured: data.isFeatured || false,
        brand: data.brand,
        discount: data.discount,
        weight: data.weight,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Partial<CreateProductDto>) {
    // Filter out undefined values to avoid overwriting with null
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
