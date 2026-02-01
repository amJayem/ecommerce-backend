import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../product.service';
import { ProductSearchService } from '../services/product-search.service';
import { ProductInventoryService } from '../services/product-inventory.service';
import {
  SearchProductDto,
  SearchProductResponseDto,
} from '../dto/search-product.dto';
import { OptionalJwtAuthGuard } from '../../auth/guard/optional-jwt.guard';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductPublicController {
  constructor(
    private readonly productService: ProductService,
    private readonly searchService: ProductSearchService,
    private readonly inventoryService: ProductInventoryService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    description: 'Filter by category slug',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by product status',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    description: 'Filter by featured products',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter by in-stock products',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in product name, description, or tags',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products per page',
  })
  @ApiResponse({ status: 200, description: 'List of products returned' })
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get('featured')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({ status: 200, description: 'Featured products returned' })
  getFeatured() {
    return this.inventoryService.getFeatured();
  }

  @Get('bestsellers')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bestseller products' })
  @ApiResponse({ status: 200, description: 'Bestseller products returned' })
  getBestsellers() {
    return this.inventoryService.getBestsellers();
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search and filter products' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search term for product name, description, or keywords',
    example: 'fresh fruits',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Category ID to filter products',
    example: 1,
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    example: 10,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    example: 100,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort option for products',
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
    example: 'price_asc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products per page',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: SearchProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  search(@Query() searchDto: SearchProductDto) {
    return this.searchService.search(searchDto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Product returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get('category/:slug')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get products by category slug' })
  @ApiResponse({
    status: 200,
    description: 'Products for the category returned',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getProductsByCategorySlug(@Param('slug') slug: string) {
    return this.productService.getProductsByCategorySlug(slug);
  }

  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }
}
