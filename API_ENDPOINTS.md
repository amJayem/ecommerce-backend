# eCommerce Backend API Endpoints

This document outlines all the available API endpoints for the eCommerce backend application.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Products

### Public Endpoints

- `GET /api/products` - List all products with pagination and filtering
- `GET /api/products/featured` - Get featured products
- `GET /api/products/bestsellers` - Get bestseller products
- `GET /api/products/:id` - Get single product by ID
- `GET /api/products/slug/:slug` - Get product by slug

### Admin Only Endpoints

- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update product stock

### Query Parameters for Products

- `categoryId` - Filter by category
- `status` - Filter by status (draft, published, archived)
- `featured` - Filter featured products (true/false)
- `inStock` - Filter by stock availability (true/false)
- `search` - Search in name, description, and tags
- `page` - Page number for pagination
- `limit` - Items per page

## Categories

### Public Endpoints

- `GET /api/categories` - List all active categories
- `GET /api/categories/hierarchy` - Get category hierarchy
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/slug/:slug` - Get category by slug

### Admin Only Endpoints

- `POST /api/categories` - Create new category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Orders

### User Endpoints (Authenticated)

- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID (own orders only)
- `DELETE /api/orders/:id` - Cancel order (own pending orders only)

### Admin Only Endpoints

- `GET /api/orders` - List all orders with pagination
- `PATCH /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/payment-status` - Update payment status
- `DELETE /api/orders/:id` - Delete order (admin only)

### Query Parameters for Orders

- `userId` - Filter by user ID
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `page` - Page number for pagination
- `limit` - Items per page

## Data Models

### Product

```typescript
{
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  detailedDescription?: string;
  price: number;
  originalPrice?: number;
  discount: number;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId?: number;
  unit: string;
  weight?: number;
  images: string[];
  isActive: boolean;
  tags: string[];
  organic: boolean;
  featured: boolean;
  bestseller: boolean;
  slug: string;
  status: string;
  sku?: string;
  brand?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category

```typescript
{
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
}
```

### Order

```typescript
{
  id: number;
  userId: number;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress: string;
  billingAddress: string;
  deliveryInstructions?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}
```

### OrderItem

```typescript
{
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
}
```

## Enums

### OrderStatus

- `PENDING` - Order is pending confirmation
- `CONFIRMED` - Order has been confirmed
- `SHIPPED` - Order has been shipped
- `DELIVERED` - Order has been delivered
- `CANCELLED` - Order has been cancelled

### PaymentStatus

- `PENDING` - Payment is pending
- `PAID` - Payment has been received
- `FAILED` - Payment has failed
- `REFUNDED` - Payment has been refunded

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business rule violation
- `500 Internal Server Error` - Server error

## Rate Limiting

The API implements rate limiting:

- 10 requests per minute per IP address
- Applies to all endpoints

## Database Schema

The application uses PostgreSQL with Prisma ORM. The schema includes:

- **Users** - Authentication and user management
- **Categories** - Product categorization with hierarchical support
- **Products** - Product catalog with comprehensive attributes
- **Orders** - Order management with status tracking
- **OrderItems** - Individual items within orders

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables (DATABASE_URL, JWT_SECRET, etc.)
3. Run database migrations: `npx prisma migrate dev`
4. Generate Prisma client: `npx prisma generate`
5. Start the application: `npm run dev`

## Testing

Run the test suite:

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
