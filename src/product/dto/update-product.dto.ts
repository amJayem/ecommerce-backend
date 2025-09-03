// Update Product DTO - extends CreateProductDto with all fields optional
// This allows partial updates of product data
export class UpdateProductDto {
  name?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  inStock?: boolean;
  stock?: number; // Total quantity available in warehouse
  lowStockThreshold?: number;
  categoryId?: number;
  unit?: string;
  weight?: number;
  images?: string[];
  isActive?: boolean;
  tags?: string[];
  featured?: boolean;
  bestseller?: boolean;
  slug?: string;
  status?: string;
  sku?: string;
  brand?: string;
  coverImage?: string;
}
