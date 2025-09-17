import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product Name', example: 'Fresh fruits' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product Description',
    example: 'Fresh fruits from the farm',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Product Short Description',
    example: 'Fresh fruits from the farm',
  })
  @IsNotEmpty()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    description: 'Product Detailed Description',
    example: 'Fresh fruits from the farm',
  })
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @ApiProperty({ description: 'Product Price', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Product Original Price', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ description: 'Product Discount', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiProperty({ description: 'Product In Stock', example: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiProperty({ description: 'Product Stock', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number; // Total quantity available in warehouse

  @ApiProperty({ description: 'Product Low Stock Threshold', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiProperty({ description: 'Product Category Id', example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ description: 'Product Unit', example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Product Weight', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'Product Images',
    example: [
      'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/placeholder_image.webp?v=1757652031',
      'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/placeholder_image.webp?v=1757652031',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({ description: 'Product Is Active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Product Tags', example: ['Tag1', 'Tag2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Product Featured', example: true })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ description: 'Product Bestseller', example: true })
  @IsOptional()
  @IsBoolean()
  bestseller?: boolean;

  @ApiProperty({ description: 'Product Slug', example: 'product-slug' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Product Status', example: 'draft' })
  @IsOptional()
  @IsString()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({ description: 'Product SKU', example: '1234567890' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'Product Brand', example: 'Brand Name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    description: 'Product Cover Image',
    example:
      'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/placeholder_image.webp?v=1757652031',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  coverImage?: string;
}
