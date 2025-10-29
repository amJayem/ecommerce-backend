# Category API Requirements

## Overview

This document outlines the API requirements for the Category endpoints that will integrate with the Next.js e-commerce frontend.

## Endpoints

### 1. GET /api/categories

**Purpose**: Fetch all categories with product counts for homepage display

**Response Format**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Staples",
      "slug": "staples",
      "description": "Essential food items including rice, lentils, grains, and basic cooking ingredients",
      "icon": "🌾",
      "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
      "parentId": null,
      "isActive": true,
      "sortOrder": 1,
      "metaTitle": "Staples - Essential Food Items",
      "metaDescription": "Shop for rice, lentils, grains and essential cooking ingredients",
      "createdAt": "2025-09-12T05:31:15.307Z",
      "updatedAt": "2025-09-12T05:31:15.307Z",
      "parent": null,
      "children": [],
      "_count": {
        "products": 25
      }
    }
  ]
}
```

**Required Fields**:

- `id` (number) - Unique category ID
- `name` (string) - Category display name
- `slug` (string) - URL-friendly identifier
- `icon` (string) - Emoji or icon identifier (e.g., "🌾", "🍎", "🥕")
- `metaTitle` (string) - SEO title
- `metaDescription` (string) - SEO description
- `_count.products` (number) - Number of products in this category

**Optional Fields**:

- `description` (string) - Category description
- `image` (string) - Category banner image URL
- `parentId` (number|null) - For subcategories
- `isActive` (boolean) - Category status
- `sortOrder` (number) - Display order
- `createdAt` (string) - ISO timestamp
- `updatedAt` (string) - ISO timestamp

### 2. GET /api/categories/{id}

**Purpose**: Fetch single category details

**Response Format**:

```json
{
  "data": {
    "id": 1,
    "name": "Staples",
    "slug": "staples",
    "description": "Essential food items...",
    "icon": "🌾",
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    "parentId": null,
    "isActive": true,
    "sortOrder": 1,
    "metaTitle": "Staples - Essential Food Items",
    "metaDescription": "Shop for rice, lentils, grains and essential cooking ingredients",
    "createdAt": "2025-09-12T05:31:15.307Z",
    "updatedAt": "2025-09-12T05:31:15.307Z",
    "parent": null,
    "children": [],
    "_count": {
      "products": 25
    }
  }
}
```

### 3. GET /api/categories/{id}/products

**Purpose**: Fetch products for a specific category

**Response Format**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Organic Basmati Rice",
      "slug": "organic-basmati-rice",
      "description": "Premium quality organic basmati rice",
      "price": 299,
      "oldPrice": 349,
      "discount": 14,
      "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
      "category": "staples",
      "stock": 50,
      "isFeatured": true,
      "isNewArrival": false,
      "ratings": 4.5,
      "reviewsCount": 120,
      "createdAt": "2025-09-12T05:31:15.307Z",
      "updatedAt": "2025-09-12T05:31:15.307Z"
    }
  ]
}
```

## Technical Requirements

### Error Handling

- Return `404` for non-existent categories
- Return `500` for server errors
- Include error messages in response body

### Pagination (Optional)

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Filtering (Optional)

- `?isActive=true` - Only active categories
- `?parentId=null` - Only root categories
- `?sortBy=sortOrder` - Sort by field

## Frontend Integration

### Homepage Category Section

- Displays first 10 categories
- Shows emoji icons (🌾, 🍎, 🥕)
- Displays product count from `_count.products`
- Links to `/products/categories/{slug}`

### Category Pages

- Dynamic routing: `/products/categories/[category]`
- Fetches category details and products
- Uses `metaTitle` and `metaDescription` for SEO

### SEO Requirements

- `metaTitle` used for page titles
- `metaDescription` used for page descriptions
- `slug` used for URL routing

## Sample Category Data

```json
[
  {
    "id": 1,
    "name": "Fruits",
    "slug": "fruits",
    "icon": "🍎",
    "metaTitle": "Fresh Fruits - Organic & Seasonal",
    "metaDescription": "Shop fresh, organic fruits delivered to your doorstep",
    "_count": { "products": 45 }
  },
  {
    "id": 2,
    "name": "Vegetables",
    "slug": "vegetables",
    "icon": "🥕",
    "metaTitle": "Fresh Vegetables - Farm to Table",
    "metaDescription": "Premium quality vegetables from local farms",
    "_count": { "products": 38 }
  }
]
```

## Implementation Notes

1. **Icon Support**: Frontend supports both emoji icons (🌾) and Lucide icon names
2. **Product Count**: Must be included in `_count.products` for homepage display
3. **SEO Fields**: `metaTitle` and `metaDescription` are required for page optimization
4. **Slug Format**: Use kebab-case for URL-friendly slugs
5. **Active Status**: Only active categories should be returned by default

## Testing Checklist

- [ ] GET /api/categories returns array of categories
- [ ] Each category includes required fields
- [ ] Product count is accurate in `_count.products`
- [ ] Emoji icons display correctly
- [ ] SEO metadata is properly formatted
- [ ] Error handling works for 404/500 cases
- [ ] Pagination works (if implemented)
- [ ] Filtering works (if implemented)
