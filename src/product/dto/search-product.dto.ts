import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  // Transform,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class SearchProductDto {
  @ApiProperty({
    description: 'Search term for product name, description, or keywords',
    example: 'fresh fruits',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Category ID to filter products',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : undefined))
  @IsNumber()
  category?: number;

  @ApiProperty({
    description: 'Minimum price filter',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    description: 'Sort option for products',
    enum: SortOption,
    example: SortOption.PRICE_ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : 1))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of products per page',
    example: 12,
    required: false,
    default: 12,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : 12))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}

export class SearchProductItemDto {
  @ApiProperty({ description: 'Product ID' })
  id: number;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiProperty({ description: 'Original price' })
  originalPrice: number;

  @ApiProperty({ description: 'Discount percentage' })
  discount: number;

  @ApiProperty({ description: 'Stock quantity' })
  stock: number;

  @ApiProperty({ description: 'In stock status' })
  inStock: boolean;

  @ApiProperty({ description: 'Active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Product status' })
  status: string;

  @ApiProperty({ description: 'Cover image URL' })
  coverImage: string;

  @ApiProperty({ description: 'Product images array', type: [String] })
  images: string[];

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'SKU code' })
  sku: string;

  @ApiProperty({ description: 'Featured product flag' })
  featured: boolean;

  @ApiProperty({ description: 'Bestseller product flag' })
  bestseller: boolean;

  @ApiProperty({ description: 'Product tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Product category' })
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
}

export class SearchProductResponseDto {
  @ApiProperty({
    description:
      'Array of products matching the search criteria (minimal data)',
    type: [SearchProductItemDto],
  })
  data: SearchProductItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number', description: 'Total number of products' },
      page: { type: 'number', description: 'Current page number' },
      limit: { type: 'number', description: 'Number of products per page' },
      totalPages: { type: 'number', description: 'Total number of pages' },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
