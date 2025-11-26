# Category API Implementation Guide

This guide summarizes everything you need to integrate Category CRUD and query endpoints into the frontend dashboard.

## Table of Contents

1. [API Overview](#api-overview)
2. [Public Endpoints](#public-endpoints)
   - [List Categories](#1-list-categories)
   - [Category Hierarchy](#2-category-hierarchy)
   - [Get Category by ID](#3-get-category-by-id)
   - [Get Category by Slug](#4-get-category-by-slug)
   - [Get Products of a Category](#5-get-products-of-a-category)
3. [Admin Endpoints](#admin-endpoints)
   - [Create Category](#1-create-category)
   - [Update Category](#2-update-category)
   - [Delete Category](#3-delete-category)
4. [Data Models & DTOs](#data-models--dtos)
5. [Frontend Integration Examples](#frontend-integration-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## API Overview

- **Base URL:** `http://localhost:3456/api/v1`
- **Authentication:**
  - Public endpoints: no authentication required
  - Admin endpoints (create, update, delete): require JWT + `admin` role
- **Rate Limiting:** 10 requests/minute per IP (global)
- **Swagger Docs:** `http://localhost:3456/docs`

---

## Public Endpoints

### 1. List Categories

**Endpoint:** `GET /api/v1/categories`

**Description:** Returns all active categories with parent/children info and product counts.

**Example Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Fruits",
    "slug": "fruits",
    "description": "Fresh fruits and berries",
    "icon": "🍎",
    "image": "https://example.com/fruits.jpg",
    "parentId": null,
    "isActive": true,
    "sortOrder": 1,
    "metaTitle": "Fresh Fruits",
    "metaDescription": "Best organic fruits",
    "parent": null,
    "children": [
      {
        "id": 2,
        "name": "Citrus",
        "slug": "citrus",
        "parentId": 1,
        "...": "..."
      }
    ],
    "_count": {
      "products": 42
    }
  }
]
```

---

### 2. Category Hierarchy

**Endpoint:** `GET /api/v1/categories/hierarchy`

**Description:** Returns only root categories with nested children and product counts. Use for building navigation trees.

---

### 3. Get Category by ID

**Endpoint:** `GET /api/v1/categories/:id`

**Path Parameter:** `id` (number)

**Example Response:**

```json
{
  "id": 1,
  "name": "Fruits",
  "slug": "fruits",
  "description": "Fresh fruits",
  "parent": null,
  "children": [...],
  "products": [
    {
      "id": 202510291,
      "name": "Fresh Organic Apples",
      "slug": "fresh-organic-apples",
      "price": 25.99,
      "coverImage": "https://example.com/apple-cover.jpg",
      "status": "published"
    }
  ],
  "_count": { "products": 42 }
}
```

---

### 4. Get Category by Slug

**Endpoint:** `GET /api/v1/categories/slug/:slug`

**Path Parameter:** `slug` (string)

Returns the same structure as `GET /:id`.

---

### 5. Get Products of a Category

**Endpoint:** `GET /api/v1/categories/:id/products`

**Description:** Returns active products belonging to the category (no authentication needed).

**Response Fields:**

- `id`, `name`, `slug`, `description`, `price`, `originalPrice`, `discount`,
  `coverImage`, `stock`, `featured`, `bestseller`, `createdAt`, `updatedAt`

---

## Admin Endpoints

All admin endpoints require:

- JWT authentication (`Authorization: Bearer <token>` or HttpOnly cookie)
- `admin` role (enforced via `@Roles('admin')`)

### 1. Create Category

**Endpoint:** `POST /api/v1/categories`

**Request Body:**

```json
{
  "name": "Fruits",
  "slug": "fruits",
  "description": "Fresh fruits and berries",
  "icon": "🍎",
  "image": "https://example.com/fruits.jpg",
  "parentId": null,
  "isActive": true,
  "sortOrder": 1,
  "metaTitle": "Fresh Fruits",
  "metaDescription": "Best organic fruits"
}
```

**Validation Rules:**

| Field             | Type    | Required | Validation        | Description                |
| ----------------- | ------- | -------- | ----------------- | -------------------------- |
| `name`            | string  | ✅ Yes   | Non-empty         | Category name              |
| `slug`            | string  | ✅ Yes   | Unique, non-empty | URL-friendly identifier    |
| `description`     | string  | ✅ Yes   | Non-empty         | Description text           |
| `icon`            | string  | No       | String            | Emoji / icon text          |
| `image`           | string  | No       | Valid URL         | Category image             |
| `parentId`        | number  | No       | Existing category | Parent category ID         |
| `isActive`        | boolean | No       | Boolean           | Active flag (default true) |
| `sortOrder`       | number  | No       | Number            | Order in lists             |
| `metaTitle`       | string  | No       | String            | SEO meta title             |
| `metaDescription` | string  | No       | String            | SEO meta description       |

**Success Response (201 Created):** Returns created category with parent/children and product count.

**Error Cases:**

- `400`: validation errors
- `401`: unauthorized
- `404`: parent category not found
- `409`: slug already exists

---

### 2. Update Category

**Endpoint:** `PATCH /api/v1/categories/:id`

**Notes:**

- All fields optional
- Prevents duplicate slugs and parent-child loops (a category cannot parent itself)

**Sample Request:**

```json
{
  "name": "Fresh Fruits",
  "slug": "fresh-fruits",
  "sortOrder": 2,
  "parentId": null
}
```

**Response:** Updated category with parent/children info and product count.

---

### 3. Delete Category

**Endpoint:** `DELETE /api/v1/categories/:id`

**Constraints:**

- Cannot delete if category has products
- Cannot delete if category has child categories

**Success Response (200 OK):**

```json
{
  "message": "Category deleted successfully"
}
```

**Error Cases:**

- `404`: category not found
- `409`: category has products or subcategories

---

## Data Models & DTOs

### Category Model (Prisma)

```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}
```

### CreateCategoryDto

```typescript
type CreateCategoryDto = {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string;
  parentId?: number;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
};
```

### UpdateCategoryDto

Same fields as create, all optional.

---

## Frontend Integration Examples

### Fetch Categories (Public)

```typescript
async function fetchCategories() {
  const res = await fetch('http://localhost:3456/api/v1/categories');
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}
```

### Create Category (Admin)

```typescript
async function createCategory(data) {
  const res = await fetch('http://localhost:3456/api/v1/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends cookies
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create category');
  }

  return res.json();
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3456/api/v1/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { categories, loading, error };
}
```

---

## Error Handling

| Status | Cause                                                 | Message Example                            |
| ------ | ----------------------------------------------------- | ------------------------------------------ |
| 400    | Validation error                                      | `["name should not be empty"]`             |
| 401    | Missing/invalid auth                                  | `"Unauthorized"`                           |
| 403    | Insufficient role                                     | `"Forbidden resource"`                     |
| 404    | Category/Parent not found                             | `"Category not found"`                     |
| 409    | Duplicate slug, has products, or subcategory conflict | `"Category with this slug already exists"` |

### Error Handling Pattern

```typescript
try {
  const res = await fetch('/api/v1/categories/1', { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message);
  }
  const category = await res.json();
} catch (error) {
  console.error('Category error:', error.message);
}
```

---

## Best Practices

1. **Slug Uniqueness** – generate slug client-side, check collisions server-side.
2. **Hierarchy Safety** – prevent circular parent references (backend already enforces).
3. **Delete Protection** – disable delete button when category has products/children.
4. **Optimistic UI** – update UI immediately, revert if API fails.
5. **Caching** – categories change less often; consider caching in frontend state/store.
6. **Sorting** – use `sortOrder` for drag-and-drop category ordering.
7. **SEO Fields** – surface `metaTitle` and `metaDescription` in admin UI for SEO control.

---

## Summary

- ✅ Public endpoints cover listing, hierarchy, view by ID/slug, and category products.
- ✅ Admin endpoints support full CRUD with validations and safety checks.
- ✅ Responses include parent/child relations and product counts to power dashboards.
- ✅ Error responses clearly indicate validation, auth, and conflict reasons.

Use this guide to build the category management UI (list, details, create/edit forms, delete confirmations) with confidence. For additional reference, inspect the NestJS Swagger docs at `/docs`.
