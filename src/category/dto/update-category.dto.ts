// Update Category DTO - extends CreateCategoryDto with all fields optional
// This allows partial updates of category data
export class UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: number;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}
