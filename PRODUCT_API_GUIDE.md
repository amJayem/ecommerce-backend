# Product API Implementation Guide

This comprehensive guide covers everything you need to know about implementing and using the Product APIs in this eCommerce backend application.

## Table of Contents

1. [API Overview](#api-overview)
2. [Public Endpoints](#public-endpoints)
   - [List Products](#1-list-products)
   - [Get Product by ID](#2-get-product-by-id)
   - [Get Product by Slug](#3-get-product-by-slug)
   - [Get Featured Products](#4-get-featured-products)
   - [Get Bestseller Products](#5-get-bestseller-products)
   - [Search Products](#6-search-products)
   - [Get Products by Category Slug](#7-get-products-by-category-slug)
3. [Admin Endpoints](#admin-endpoints)
   - [Create Product](#1-create-product)
   - [Update Product](#2-update-product)
   - [Delete Product](#3-delete-product)
   - [Update Product Stock](#4-update-product-stock)
4. [Data Models](#data-models)
5. [Frontend Integration Examples](#frontend-integration-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## API Overview

**Base URL:** `http://localhost:3456/api/v1` (development) or your production URL

**Authentication:**

- Public endpoints: No authentication required
- Admin endpoints: Require JWT token (in cookies or Authorization header)
- Admin role required for create, update, delete operations

**Rate Limiting:** 10 requests per minute per IP address

---

## Public Endpoints

### 1. List Products

**Endpoint:** `GET /api/v1/products`

**Description:** Get a paginated list of products with optional filtering

**Query Parameters:**

| Parameter      | Type    | Required | Description                                         | Example        |
| -------------- | ------- | -------- | --------------------------------------------------- | -------------- |
| `categoryId`   | number  | No       | Filter by category ID                               | `1`            |
| `categorySlug` | string  | No       | Filter by category slug                             | `fruits`       |
| `status`       | string  | No       | Filter by status (`draft`, `published`, `archived`) | `published`    |
| `featured`     | boolean | No       | Filter featured products                            | `true`         |
| `inStock`      | boolean | No       | Filter by stock availability                        | `true`         |
| `search`       | string  | No       | Search in name, description, and tags               | `fresh fruits` |
| `page`         | number  | No       | Page number (default: 1)                            | `1`            |
| `limit`        | number  | No       | Items per page (default: 20)                        | `20`           |

**Example Request:**

```http
GET /api/v1/products?categoryId=1&status=published&page=1&limit=20
```

**Example Response (200 OK):**

```json
{
  "products": [
    {
      "id": 202510291,
      "name": "Fresh Organic Apples",
      "slug": "fresh-organic-apples",
      "description": "Fresh organic apples from local farms",
      "shortDescription": "Fresh organic apples",
      "detailedDescription": "Premium quality organic apples...",
      "price": 25.99,
      "originalPrice": 29.99,
      "discount": 13.34,
      "stock": 100,
      "inStock": true,
      "lowStockThreshold": 10,
      "categoryId": 1,
      "unit": "kg",
      "weight": 1.0,
      "images": [
        "https://example.com/apple1.jpg",
        "https://example.com/apple2.jpg"
      ],
      "isActive": true,
      "tags": ["organic", "fresh", "fruits"],
      "featured": true,
      "bestseller": false,
      "status": "published",
      "sku": "APPLE-001",
      "brand": "Farm Fresh",
      "coverImage": "https://example.com/apple-cover.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 2. Get Product by ID

**Endpoint:** `GET /api/v1/products/:id`

**Description:** Get a single product by its ID

**Path Parameters:**

| Parameter | Type   | Required | Description | Example     |
| --------- | ------ | -------- | ----------- | ----------- |
| `id`      | number | Yes      | Product ID  | `202510291` |

**Example Request:**

```http
GET /api/v1/products/202510291
```

**Example Response (200 OK):**

```json
{
  "id": 202510291,
  "name": "Fresh Organic Apples",
  "slug": "fresh-organic-apples",
  "description": "Fresh organic apples from local farms",
  "shortDescription": "Fresh organic apples",
  "detailedDescription": "Premium quality organic apples...",
  "price": 25.99,
  "originalPrice": 29.99,
  "discount": 13.34,
  "stock": 100,
  "inStock": true,
  "lowStockThreshold": 10,
  "categoryId": 1,
  "unit": "kg",
  "weight": 1.0,
  "images": [
    "https://example.com/apple1.jpg",
    "https://example.com/apple2.jpg"
  ],
  "isActive": true,
  "tags": ["organic", "fresh", "fruits"],
  "featured": true,
  "bestseller": false,
  "status": "published",
  "sku": "APPLE-001",
  "brand": "Farm Fresh",
  "coverImage": "https://example.com/apple-cover.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "category": {
    "id": 1,
    "name": "Fruits",
    "slug": "fruits",
    "icon": "🍎"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

### 3. Get Product by Slug

**Endpoint:** `GET /api/v1/products/slug/:slug`

**Description:** Get a single product by its slug (SEO-friendly URL)

**Path Parameters:**

| Parameter | Type   | Required | Description  | Example                |
| --------- | ------ | -------- | ------------ | ---------------------- |
| `slug`    | string | Yes      | Product slug | `fresh-organic-apples` |

**Example Request:**

```http
GET /api/v1/products/slug/fresh-organic-apples
```

**Example Response (200 OK):**

Same format as "Get Product by ID" response.

---

### 4. Get Featured Products

**Endpoint:** `GET /api/v1/products/featured`

**Description:** Get all featured products

**Example Request:**

```http
GET /api/v1/products/featured
```

**Example Response (200 OK):**

```json
[
  {
    "id": 202510291,
    "name": "Fresh Organic Apples",
    "slug": "fresh-organic-apples",
    "price": 25.99,
    "originalPrice": 29.99,
    "discount": 13.34,
    "coverImage": "https://example.com/apple-cover.jpg",
    "images": ["https://example.com/apple1.jpg"],
    "inStock": true,
    "featured": true,
    "status": "published"
  }
]
```

---

### 5. Get Bestseller Products

**Endpoint:** `GET /api/v1/products/bestsellers`

**Description:** Get all bestseller products

**Example Request:**

```http
GET /api/v1/products/bestsellers
```

**Example Response (200 OK):**

Same format as "Get Featured Products" response.

---

### 6. Search Products

**Endpoint:** `GET /api/v1/products/search`

**Description:** Advanced search and filter products with sorting and pagination

**Query Parameters:**

| Parameter  | Type   | Required | Description                                                 | Example        |
| ---------- | ------ | -------- | ----------------------------------------------------------- | -------------- |
| `q`        | string | No       | Search term (name, description, keywords)                   | `fresh fruits` |
| `category` | number | No       | Filter by category ID                                       | `1`            |
| `minPrice` | number | No       | Minimum price filter                                        | `10`           |
| `maxPrice` | number | No       | Maximum price filter                                        | `100`          |
| `sort`     | string | No       | Sort option (`price_asc`, `price_desc`, `newest`, `oldest`) | `price_asc`    |
| `page`     | number | No       | Page number (default: 1)                                    | `1`            |
| `limit`    | number | No       | Items per page (default: 12, max: 100)                      | `12`           |

**Sort Options:**

- `price_asc`: Price low to high
- `price_desc`: Price high to low
- `newest`: Newest first
- `oldest`: Oldest first

**Example Request:**

```http
GET /api/v1/products/search?q=fresh%20fruits&category=1&minPrice=10&maxPrice=100&sort=price_asc&page=1&limit=12
```

**Example Response (200 OK):**

```json
{
  "data": [
    {
      "id": 202510291,
      "name": "Fresh Organic Apples",
      "slug": "fresh-organic-apples",
      "price": 25.99,
      "originalPrice": 29.99,
      "discount": 13.34,
      "stock": 100,
      "inStock": true,
      "isActive": true,
      "status": "published",
      "coverImage": "https://example.com/apple-cover.jpg",
      "images": ["https://example.com/apple1.jpg"],
      "unit": "kg",
      "brand": "Farm Fresh",
      "sku": "APPLE-001",
      "featured": true,
      "bestseller": false,
      "tags": ["organic", "fresh", "fruits"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "category": {
        "id": 1,
        "name": "Fruits",
        "slug": "fruits",
        "icon": "🍎"
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "totalPages": 5
  }
}
```

---

### 7. Get Products by Category Slug

**Endpoint:** `GET /api/v1/products/category/:slug`

**Description:** Get all products in a specific category by category slug

**Path Parameters:**

| Parameter | Type   | Required | Description   | Example  |
| --------- | ------ | -------- | ------------- | -------- |
| `slug`    | string | Yes      | Category slug | `fruits` |

**Example Request:**

```http
GET /api/v1/products/category/fruits
```

**Example Response (200 OK):**

```json
{
  "category": {
    "id": 1,
    "name": "Fruits",
    "slug": "fruits"
  },
  "products": [
    {
      "id": 202510291,
      "name": "Fresh Organic Apples",
      "slug": "fresh-organic-apples",
      "price": 25.99,
      "coverImage": "https://example.com/apple-cover.jpg",
      "inStock": true,
      "status": "published"
    }
  ]
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Category not found",
  "error": "Not Found"
}
```

---

## Admin Endpoints

All admin endpoints require:

- JWT authentication (token in cookies or Authorization header)
- Admin role

### 1. Create Product

**Endpoint:** `POST /api/v1/products`

**Description:** Create a new product (Admin only)

**Authentication:** Required (Admin role)

**Request Body:**

```json
{
  "name": "Fresh Organic Apples",
  "slug": "fresh-organic-apples",
  "description": "Fresh organic apples from local farms",
  "shortDescription": "Fresh organic apples",
  "detailedDescription": "Premium quality organic apples from certified farms",
  "price": 25.99,
  "originalPrice": 29.99,
  "discount": 13.34,
  "stock": 100,
  "lowStockThreshold": 10,
  "categoryId": 1,
  "unit": "kg",
  "weight": 1.0,
  "images": [
    "https://example.com/apple1.jpg",
    "https://example.com/apple2.jpg"
  ],
  "isActive": true,
  "tags": ["organic", "fresh", "fruits"],
  "featured": true,
  "bestseller": false,
  "status": "published",
  "sku": "APPLE-001",
  "brand": "Farm Fresh",
  "coverImage": "https://example.com/apple-cover.jpg"
}
```

**Field Specifications:**

| Field                 | Type     | Required | Validation                             | Description                       |
| --------------------- | -------- | -------- | -------------------------------------- | --------------------------------- |
| `name`                | string   | ✅ Yes   | Non-empty string                       | Product name                      |
| `slug`                | string   | ✅ Yes   | Non-empty string, unique               | URL-friendly identifier           |
| `description`         | string   | No       | String                                 | Full description                  |
| `shortDescription`    | string   | ✅ Yes   | Non-empty string                       | Short description                 |
| `detailedDescription` | string   | No       | String                                 | Detailed description              |
| `price`               | number   | ✅ Yes   | Number, >= 0                           | Current price                     |
| `originalPrice`       | number   | No       | Number, >= 0                           | Original price (before discount)  |
| `discount`            | number   | No       | Number, 0-100                          | Discount percentage               |
| `stock`               | number   | ✅ Yes   | Number, >= 0                           | Stock quantity                    |
| `lowStockThreshold`   | number   | No       | Number, >= 0                           | Low stock warning threshold       |
| `categoryId`          | number   | No       | Number                                 | Category ID                       |
| `unit`                | string   | No       | String                                 | Unit of measurement (e.g., "kg")  |
| `weight`              | number   | No       | Number, >= 0                           | Product weight                    |
| `images`              | string[] | No       | Array of valid URLs                    | Product images                    |
| `isActive`            | boolean  | No       | Boolean                                | Active status (default: true)     |
| `tags`                | string[] | No       | Array of strings                       | Product tags                      |
| `featured`            | boolean  | No       | Boolean                                | Featured flag (default: false)    |
| `bestseller`          | boolean  | No       | Boolean                                | Bestseller flag (default: false)  |
| `status`              | string   | No       | Enum: `draft`, `published`, `archived` | Product status (default: `draft`) |
| `sku`                 | string   | No       | String                                 | SKU code                          |
| `brand`               | string   | No       | String                                 | Brand name                        |
| `coverImage`          | string   | No       | Valid URL                              | Cover image URL                   |

**Example Request:**

```http
POST /api/v1/products
Content-Type: application/json
Authorization: Bearer <token>
Cookie: access_token=<token>

{
  "name": "Fresh Organic Apples",
  "slug": "fresh-organic-apples",
  "shortDescription": "Fresh organic apples",
  "price": 25.99,
  "stock": 100
}
```

**Example Response (201 Created):**

```json
{
  "id": 202510291,
  "name": "Fresh Organic Apples",
  "slug": "fresh-organic-apples",
  "description": null,
  "shortDescription": "Fresh organic apples",
  "detailedDescription": null,
  "price": 25.99,
  "originalPrice": null,
  "discount": 0,
  "stock": 100,
  "inStock": true,
  "lowStockThreshold": 5,
  "categoryId": null,
  "unit": "piece",
  "weight": null,
  "images": [],
  "isActive": true,
  "tags": [],
  "featured": false,
  "bestseller": false,
  "status": "draft",
  "sku": null,
  "brand": null,
  "coverImage": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

**400 Bad Request (Validation Error):**

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "price must be a positive number"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**409 Conflict (Duplicate Slug):**

```json
{
  "statusCode": 409,
  "message": "Product with this slug already exists",
  "error": "Conflict"
}
```

---

### 2. Update Product

**Endpoint:** `PATCH /api/v1/products/:id`

**Description:** Update an existing product (Admin only)

**Authentication:** Required (Admin role)

**Path Parameters:**

| Parameter | Type   | Required | Description | Example     |
| --------- | ------ | -------- | ----------- | ----------- |
| `id`      | number | Yes      | Product ID  | `202510291` |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "price": 29.99,
  "stock": 150,
  "featured": true
}
```

**Example Request:**

```http
PATCH /api/v1/products/202510291
Content-Type: application/json
Authorization: Bearer <token>

{
  "price": 29.99,
  "stock": 150
}
```

**Example Response (200 OK):**

Returns the updated product object (same format as create response).

---

### 3. Delete Product

**Endpoint:** `DELETE /api/v1/products/:id`

**Description:** Delete a product (Admin only)

**Authentication:** Required (Admin role)

**Path Parameters:**

| Parameter | Type   | Required | Description | Example     |
| --------- | ------ | -------- | ----------- | ----------- |
| `id`      | number | Yes      | Product ID  | `202510291` |

**Example Request:**

```http
DELETE /api/v1/products/202510291
Authorization: Bearer <token>
```

**Example Response (200 OK):**

```json
{
  "id": 202510291,
  "name": "Fresh Organic Apples",
  "message": "Product deleted successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

---

### 4. Update Product Stock

**Endpoint:** `PATCH /api/v1/products/:id/stock`

**Description:** Update stock quantity for a product (Admin only)

**Authentication:** Required (Admin role)

**Path Parameters:**

| Parameter | Type   | Required | Description | Example     |
| --------- | ------ | -------- | ----------- | ----------- |
| `id`      | number | Yes      | Product ID  | `202510291` |

**Request Body:**

```json
{
  "quantity": 150
}
```

**Example Request:**

```http
PATCH /api/v1/products/202510291/stock
Content-Type: application/json
Authorization: Bearer <token>

{
  "quantity": 150
}
```

**Example Response (200 OK):**

```json
{
  "id": 202510291,
  "stock": 150,
  "inStock": true,
  "message": "Stock updated successfully"
}
```

---

## Data Models

### Product Model

```typescript
interface Product {
  id: number; // Auto-generated ID (date-based)
  name: string; // Product name
  slug: string; // URL-friendly identifier (unique)
  description?: string; // Full description
  shortDescription?: string; // Short description
  detailedDescription?: string; // Detailed description
  price: number; // Current price
  originalPrice?: number; // Original price (before discount)
  discount?: number; // Discount percentage (0-100)
  stock: number; // Stock quantity
  inStock: boolean; // Calculated: stock > 0
  lowStockThreshold: number; // Low stock warning threshold
  categoryId?: number; // Category ID (foreign key)
  unit: string; // Unit of measurement (default: "piece")
  weight?: number; // Product weight
  images: string[]; // Array of image URLs
  isActive: boolean; // Active status
  tags: string[]; // Product tags
  featured: boolean; // Featured product flag
  bestseller: boolean; // Bestseller flag
  status: 'draft' | 'published' | 'archived'; // Product status
  sku?: string; // SKU code
  brand?: string; // Brand name
  coverImage?: string; // Cover image URL
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
  category?: {
    // Category object (when included)
    id: number;
    name: string;
    slug: string;
    icon?: string;
  };
}
```

---

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)

#### Get All Products

```typescript
async function getProducts(filters?: {
  categoryId?: number;
  status?: string;
  featured?: boolean;
  inStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();

  if (filters?.categoryId)
    queryParams.append('categoryId', filters.categoryId.toString());
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.featured !== undefined)
    queryParams.append('featured', filters.featured.toString());
  if (filters?.inStock !== undefined)
    queryParams.append('inStock', filters.inStock.toString());
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const response = await fetch(
    `http://localhost:3456/api/v1/products?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

// Usage
const result = await getProducts({
  categoryId: 1,
  status: 'published',
  page: 1,
  limit: 20,
});
console.log(result.products);
console.log(result.pagination);
```

#### Get Single Product

```typescript
async function getProduct(id: number) {
  const response = await fetch(`http://localhost:3456/api/v1/products/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

// Usage
const product = await getProduct(202510291);
```

#### Search Products

```typescript
async function searchProducts(params: {
  q?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.append('q', params.q);
  if (params.category)
    queryParams.append('category', params.category.toString());
  if (params.minPrice)
    queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice)
    queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `http://localhost:3456/api/v1/products/search?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

// Usage
const searchResult = await searchProducts({
  q: 'fresh fruits',
  category: 1,
  minPrice: 10,
  maxPrice: 100,
  sort: 'price_asc',
  page: 1,
  limit: 12,
});
console.log(searchResult.data);
console.log(searchResult.meta);
```

#### Create Product (Admin)

```typescript
async function createProduct(productData: {
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  stock: number;
  // ... other optional fields
}) {
  const response = await fetch('http://localhost:3456/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Sends cookies automatically
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  return response.json();
}

// Usage
const newProduct = await createProduct({
  name: 'Fresh Organic Apples',
  slug: 'fresh-organic-apples',
  shortDescription: 'Fresh organic apples',
  price: 25.99,
  stock: 100,
});
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useProducts(filters?: {
  categoryId?: number;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters?.categoryId) queryParams.append('categoryId', filters.categoryId.toString());
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());

        const response = await fetch(
          `http://localhost:3456/api/v1/products?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters?.categoryId, filters?.status, filters?.page, filters?.limit]);

  return { products, pagination, loading, error };
}

// Usage in component
function ProductList() {
  const { products, pagination, loading, error } = useProducts({
    categoryId: 1,
    status: 'published',
    page: 1,
    limit: 20
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </div>
      ))}
      <div>
        Page {pagination.page} of {pagination.pages}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "price must be a positive number"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

**409 Conflict:**

```json
{
  "statusCode": 409,
  "message": "Product with this slug already exists",
  "error": "Conflict"
}
```

**429 Too Many Requests:**

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

### Error Handling Example

```typescript
async function handleProductRequest(requestFn: () => Promise<Response>) {
  try {
    const response = await requestFn();

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          console.error('Validation error:', error.message);
          break;
        case 401:
          console.error('Unauthorized - please login');
          // Redirect to login
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Product not found');
          break;
        case 409:
          console.error('Conflict:', error.message);
          break;
        default:
          console.error('Error:', error.message);
      }

      throw new Error(error.message);
    }

    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

---

## Best Practices

### 1. **Pagination**

- Always use pagination for product lists
- Default limit: 20 items per page
- Maximum limit: 100 items per page (for search endpoint)

### 2. **Caching**

- Cache product data on the frontend
- Use appropriate cache headers
- Invalidate cache when products are updated

### 3. **Image Handling**

- Always validate image URLs
- Use lazy loading for product images
- Provide fallback images for missing products

### 4. **Search Optimization**

- Use the `/search` endpoint for advanced filtering
- Implement debouncing for search inputs
- Show loading states during searches

### 5. **Error Handling**

- Always handle 404 errors gracefully
- Show user-friendly error messages
- Implement retry logic for network errors

### 6. **Performance**

- Load products incrementally (pagination)
- Use slugs for SEO-friendly URLs
- Minimize API calls by caching results

### 7. **Admin Operations**

- Validate all inputs before sending
- Show confirmation dialogs for delete operations
- Provide feedback for successful operations

---

## Summary

✅ **Product API is fully implemented**

**Public Endpoints:**

- ✅ List products with filtering and pagination
- ✅ Get product by ID or slug
- ✅ Get featured/bestseller products
- ✅ Search products with advanced filters
- ✅ Get products by category

**Admin Endpoints:**

- ✅ Create product
- ✅ Update product
- ✅ Delete product
- ✅ Update stock

**Key Features:**

- Pagination support
- Advanced search and filtering
- Category filtering
- Stock management
- Featured and bestseller flags
- SEO-friendly slugs

For questions or issues, refer to the Swagger documentation at `/docs` or check the API endpoints documentation.
