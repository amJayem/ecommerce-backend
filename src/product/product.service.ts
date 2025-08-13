import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    try {
      console.log('Creating product with data:', data);
      
      // Ensure arrays are properly formatted
      const images = Array.isArray(data.images) ? data.images : [];
      const tags = Array.isArray(data.tags) ? data.tags : [];
      
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          slug: data.slug || '',
          description: data.description,
          price: data.price,
          salePrice: data.salePrice || null,
          imageUrl: data.imageUrl || null,
          coverImage: data.coverImage || null,
          images: images,
          category: data.category || null,
          categoryId: data.categoryId || null,
          stock: data.stock,
          status: data.status || 'draft',
          tags: tags,
          sku: data.sku || null,
          isFeatured: data.isFeatured || false,
          brand: data.brand || null,
          discount: data.discount || null,
          weight: data.weight || null,
        },
      });
      
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      // Use Prisma's select to explicitly select fields and provide defaults for nullable fields
      const products = await this.prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        // Don't use select as it might exclude fields we need
      });
      
      // Transform products to ensure all fields from the updated schema exist
      return products.map(product => ({
        ...product,
        slug: product.slug || '', // Provide empty string for null slugs
        salePrice: product.salePrice || null,
        coverImage: product.coverImage || null,
        images: Array.isArray(product.images) ? product.images : [],
        categoryId: product.categoryId || null,
        status: product.status || 'draft',
        tags: Array.isArray(product.tags) ? product.tags : [],
        sku: product.sku || null,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      // Log more details about the error
      if (error.code === 'P2032') {
        console.error('Prisma error details:', error.meta);
      }
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      
      if (!product) return null;
      
      // Transform product to ensure all fields from the updated schema exist
      return {
        ...product,
        slug: product.slug || '',
        salePrice: product.salePrice || null,
        coverImage: product.coverImage || null,
        images: Array.isArray(product.images) ? product.images : [],
        categoryId: product.categoryId || null,
        status: product.status || 'draft',
        tags: Array.isArray(product.tags) ? product.tags : [],
        sku: product.sku || null,
      };
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  }

  async update(id: number, data: Partial<CreateProductDto>) {
    try {
      // Filter out undefined values to avoid overwriting with null
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined),
      );

      // Ensure arrays are properly formatted
      if (updateData.images && !Array.isArray(updateData.images)) {
        updateData.images = [];
      }
      
      if (updateData.tags && !Array.isArray(updateData.tags)) {
        updateData.tags = [];
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
      });
      
      // Transform product to ensure all fields from the updated schema exist
      return {
        ...product,
        slug: product.slug || '',
        salePrice: product.salePrice || null,
        coverImage: product.coverImage || null,
        images: Array.isArray(product.images) ? product.images : [],
        categoryId: product.categoryId || null,
        status: product.status || 'draft',
        tags: Array.isArray(product.tags) ? product.tags : [],
        sku: product.sku || null,
      };
    } catch (error) {
      console.error(`Error updating product with id ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return this.prisma.product.delete({ where: { id } });
    } catch (error) {
      console.error(`Error deleting product with id ${id}:`, error);
      throw error;
    }
  }
}
