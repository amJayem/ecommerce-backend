import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
}
