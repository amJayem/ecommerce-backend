import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse/sync';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      // Check if slug already exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: createCategoryDto.slug },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }

      // If parentId is provided, verify it exists
      if (createCategoryDto.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: createCategoryDto.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }
      }

      const category = await this.prisma.category.create({
        data: createCategoryDto,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });

      return category;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error('Failed to create category');
    }
  }

  async findAll() {
    try {
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch categories');
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          parent: true,
          children: true,
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              coverImage: true,
              status: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch category');
    }
  }

  async findBySlug(slug: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
        include: {
          parent: true,
          children: true,
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              coverImage: true,
              status: true,
              discount: true,
              inStock: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch category');
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      // If slug is being updated, check for conflicts
      if (
        updateCategoryDto.slug &&
        updateCategoryDto.slug !== existingCategory.slug
      ) {
        const slugConflict = await this.prisma.category.findUnique({
          where: { slug: updateCategoryDto.slug },
        });

        if (slugConflict) {
          throw new ConflictException('Category with this slug already exists');
        }
      }

      // If parentId is being updated, verify it exists and doesn't create circular reference
      if (updateCategoryDto.parentId !== undefined) {
        if (updateCategoryDto.parentId === id) {
          throw new ConflictException('Category cannot be its own parent');
        }

        if (updateCategoryDto.parentId !== null) {
          const parentCategory = await this.prisma.category.findUnique({
            where: { id: updateCategoryDto.parentId },
          });

          if (!parentCategory) {
            throw new NotFoundException('Parent category not found');
          }
        }
      }

      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });

      return updatedCategory;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error('Failed to update category');
    }
  }

  async remove(id: number) {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true, children: true },
          },
        },
      });

      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      // Check if category has products
      if (existingCategory._count.products > 0) {
        throw new ConflictException(
          'Cannot delete category with existing products',
        );
      }

      // Check if category has children
      if (existingCategory._count.children > 0) {
        throw new ConflictException(
          'Cannot delete category with existing subcategories',
        );
      }

      await this.prisma.category.delete({
        where: { id },
      });

      return { message: 'Category deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error('Failed to delete category');
    }
  }

  async getHierarchy() {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          parentId: null, // Only root categories
          isActive: true,
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              _count: {
                select: { products: true },
              },
            },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch category hierarchy');
    }
  }

  async getCategoryProducts(id: number) {
    try {
      // First verify the category exists
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Get products for this category
      const products = await this.prisma.product.findMany({
        where: {
          categoryId: id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          originalPrice: true,
          discount: true,
          coverImage: true,
          stock: true,
          featured: true,
          bestseller: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { featured: 'desc' },
          { bestseller: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return products;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch category products');
    }
  }

  async exportCategoriesToCsv(): Promise<string> {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: {
          select: { name: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      icon: c.icon || '',
      image: c.image || '',
      parentId: c.parentId || '',
      parentName: c.parent?.name || '',
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      metaTitle: c.metaTitle || '',
      metaDescription: c.metaDescription || '',
    }));

    return new Promise((resolve, reject) => {
      stringify(
        data,
        {
          header: true,
          columns: [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'image',
            'parentId',
            'parentName',
            'isActive',
            'sortOrder',
            'metaTitle',
            'metaDescription',
          ],
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output);
        },
      );
    });
  }

  async importCategoriesFromCsv(buffer: Buffer) {
    try {
      const records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        bom: true,
      }) as any[];

      const results = {
        created: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const record of records) {
        try {
          const categoryId = parseInt(record.id, 10);
          const data = {
            name: record.name,
            slug: record.slug || this.generateSlugFromName(record.name),
            description: record.description || '',
            icon: record.icon || null,
            image: record.image || null,
            parentId: record.parentId ? parseInt(record.parentId, 10) : null,
            isActive: String(record.isActive).toLowerCase() === 'true',
            sortOrder: parseInt(record.sortOrder, 10) || 0,
            metaTitle: record.metaTitle || null,
            metaDescription: record.metaDescription || null,
          };

          if (!data.name) {
            throw new Error('Category name is required');
          }

          if (!isNaN(categoryId)) {
            await this.prisma.category.upsert({
              where: { id: categoryId },
              update: data,
              create: { ...data, id: categoryId },
            });
            results.updated++;
          } else {
            // Find by slug if no ID
            if (!data.slug) {
              throw new Error('Slug is required for categories without an ID');
            }
            const existing = await this.prisma.category.findUnique({
              where: { slug: data.slug },
            });

            if (existing) {
              await this.prisma.category.update({
                where: { id: existing.id },
                data,
              });
              results.updated++;
            } else {
              await this.prisma.category.create({
                data,
              });
              results.created++;
            }
          }
        } catch (error) {
          results.errors.push(
            `Error at category ${record.name || 'unknown'}: ${error.message}`,
          );
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  async getSampleCategoriesCsv(): Promise<string> {
    const data = [
      {
        id: 1,
        name: 'Staples',
        slug: 'staples',
        description:
          'Essential food items including rice, lentils, grains, and basic cooking ingredients',
        icon: '🌾',
        image:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        parentId: '',
        parentName: '',
        isActive: true,
        sortOrder: 1,
        metaTitle: 'Staples - Essential Food Items',
        metaDescription:
          'Shop for rice, lentils, grains and essential cooking ingredients',
      },
    ];

    return new Promise((resolve, reject) => {
      stringify(
        data,
        {
          header: true,
          columns: [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'image',
            'parentId',
            'parentName',
            'isActive',
            'sortOrder',
            'metaTitle',
            'metaDescription',
          ],
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output);
        },
      );
    });
  }

  private generateSlugFromName(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
