import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
import { CategoryService } from '../category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guard/permission.guard';
import { Permissions } from '../../auth/decorator/permissions.decorator';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Admin Categories')
@ApiBearerAuth('access-token')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class CategoryAdminController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Permissions('category.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories with product counts (Admin)' })
  @ApiResponse({ status: 200, description: 'List of categories returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires category.read permission.',
  })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Permissions('category.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category details by id (Admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category details returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires category.read permission.',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Get(':id/products')
  @Permissions('product.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all products in a category (Admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Products in the category returned',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.read permission.',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryProducts(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryProducts(id);
  }

  @Post()
  @Permissions('category.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires category.create permission.',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this slug already exists',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Patch(':id')
  @Permissions('category.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires category.update permission.',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 409,
    description: 'Category with this slug already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Permissions('category.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires category.delete permission.',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 409,
    description:
      'Cannot delete category with existing products or subcategories',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
