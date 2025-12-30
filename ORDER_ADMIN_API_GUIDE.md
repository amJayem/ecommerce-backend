# Order Admin API Documentation

This document provides a guide for frontend integration of the administrative order management features.

## 1. Base Configuration

- **Base URL:** `/admin/orders`
- **Authentication:** Requires a Bearer Token in the `Authorization` header.
- **Permission Required:** `order.read`, `order.update`, or `order.delete` depending on the action.

---

## 2. API Endpoints

| Method     | Endpoint              | Description                                            | Permission     |
| :--------- | :-------------------- | :----------------------------------------------------- | :------------- |
| **GET**    | `/`                   | List all orders with advanced filtering and pagination | `order.read`   |
| **GET**    | `/:id`                | Get full details of a specific order                   | `order.read`   |
| **PATCH**  | `/:id`                | Update general order info (address, amounts, notes)    | `order.update` |
| **PATCH**  | `/:id/status`         | Quick update for Order Status                          | `order.update` |
| **PATCH**  | `/:id/payment-status` | Quick update for Payment Status                        | `order.update` |
| **DELETE** | `/:id`                | Hard delete/Cancel an order                            | `order.delete` |

---

## 3. Advanced Filtering (GET `/admin/orders`)

The listing endpoint supports multiple optional query parameters for powerful administrative search.

### Query Parameters:

- **`search`**: (String) Search across Order ID, Customer Name, Email, or Phone Number.
- **`startDate` / `endDate`**: (ISO Date Strings) Filter by order creation date range.
- **`minAmount` / `maxAmount`**: (Number) Filter by order total amount range.
- **`status`**: (Enum) `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- **`paymentStatus`**: (Enum) `PENDING`, `PAID`, `FAILED`, `REFUNDED`.
- **`paymentMethod`**: (String) Case-insensitive search (e.g., "BKASH", "COD").
- **`page`**: (Number) Default: `1`.
- **`limit`**: (Number) Items per page. Default: `20`.

**Example Usage:**
`GET /admin/orders?search=Jayem&status=PENDING&minAmount=1000&page=1&limit=10`

---

## 4. Request Payloads

### Update Order Info (PATCH `/:id`)

Use this for manual adjustments to orders.

```json
{
  "shippingAddress": {
    "name": "Md. Jayem",
    "city": "Dhaka",
    "postalCode": "1212"
  },
  "shippingAddressText": "Custom label or short address...",
  "totalAmount": 1500.0,
  "deliveryNote": "Deliver after 6 PM"
}
```

### Update Order Status (PATCH `/:id/status`)

```json
{ "status": "SHIPPED" }
```

### Update Payment Status (PATCH `/:id/payment-status`)

```json
{ "paymentStatus": "PAID" }
```

---

## 5. Frontend Types & Enums (TypeScript)

```typescript
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}
```

## 6. Implementation Notes

1. **Search Debounce**: Recommend a 500ms delay on the search input to minimize server load.
2. **Date Picker**: Use a range picker and pass values as `.toISOString()`.
3. **Admin Actions**: Only enable the `DELETE` action if the user has `order.delete` permission.
