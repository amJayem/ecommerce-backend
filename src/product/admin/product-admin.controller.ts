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
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductService } from '../product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guard/permission.guard';
import { Permissions } from '../../auth/decorator/permissions.decorator';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin Products')
@ApiBearerAuth('access-token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions('product.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all products with filters and pagination (Admin)',
  })
  @ApiResponse({ status: 200, description: 'List of products returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.read permission.',
  })
  findAll(@Query() query: any) {
    // Admins see deleted items by default in this view
    const params = {
      ...query,
      includeDeleted: query.includeDeleted !== 'false',
    };
    return this.productService.findAll(params);
  }

  @Get(':id')
  @Permissions('product.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product details by id (Admin)' })
  @ApiResponse({ status: 200, description: 'Product details returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.read permission.',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.productService.findOne(id, includeDeleted !== 'false');
  }

  @Post()
  @Permissions('product.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.create permission.',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  @Permissions('product.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product by id' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.update permission.',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Permissions('product.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product by id' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.delete permission.',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @Get('export/sample')
  @Permissions('product.read')
  @ApiOperation({ summary: 'Export sample product CSV template' })
  async exportSample(@Res() res: Response) {
    const csv = await this.productService.getSampleProductsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=products_sample.csv',
    );
    return res.status(200).send(csv);
  }

  @Get('export/csv')
  @Permissions('product.read')
  @ApiOperation({ summary: 'Export all products to CSV' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.productService.exportProductsToCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=products_export.csv',
    );
    return res.status(200).send(csv);
  }

  @Post('import/csv')
  @Permissions('product.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import products from CSV' })
  async importCsv(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    return this.productService.importProductsFromCsv(file.buffer);
  }

  @Patch(':id/stock')
  @Permissions('product.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update stock quantity for a product' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires product.update permission.',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { quantity: number },
  ) {
    return this.productService.updateStock(id, data.quantity);
  }
}
