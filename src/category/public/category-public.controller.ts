import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CategoryService } from '../category.service';
import { OptionalJwtAuthGuard } from '../../auth/guard/optional-jwt.guard';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoryPublicController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active categories with product counts' })
  @ApiResponse({ status: 200, description: 'List of categories returned' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('hierarchy')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get category hierarchy (root categories with children)',
  })
  @ApiResponse({ status: 200, description: 'Category hierarchy returned' })
  getHierarchy() {
    return this.categoryService.getHierarchy();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', type: 'string', description: 'Category slug' })
  @ApiResponse({ status: 200, description: 'Category returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Get(':id/products')
  @UseGuards(OptionalJwtAuthGuard, ApprovalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get products for a specific category' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Products for the category returned',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryProducts(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryProducts(id);
  }
}
