import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

// Update Product DTO - extends CreateProductDto with all fields optional
// This allows partial updates of product data
export class UpdateProductDto extends PartialType(CreateProductDto) {}
