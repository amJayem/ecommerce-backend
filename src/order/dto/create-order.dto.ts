// DTOs and enums for order submission (creation)
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsEnum,
  ValidateNested,
  IsDateString,
  IsObject,
} from 'class-validator';

// Allowed order statuses
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Payment status tracking
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// A single product in the order
class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 202510291 })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({ description: 'Quantity of the product', example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Unit price at the time of order',
    example: 3.99,
  })
  @IsNumber()
  @IsPositive()
  price: number;
}

// Main payload
export class CreateOrderDto {
  // Provide if user is authenticated; omit for guest checkout
  @ApiPropertyOptional({
    description: 'Authenticated user ID (omit for guest)',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  userId?: number;

  // At least 1 item is required
  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // Optional: initial state (otherwise defaults to PENDING on backend)
  @ApiPropertyOptional({
    description: 'Initial order status (defaults to PENDING)',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  // Optional price summary fields (these can be recomputed/stored by backend)
  @ApiPropertyOptional({
    description: 'Total amount (can be computed server-side)',
    example: 13.48,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Subtotal before tax/shipping',
    example: 13.48,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 0 })
  @IsOptional()
  @IsNumber()
  tax?: number;

  // Order shipping cost (not address)
  @ApiPropertyOptional({ description: 'Shipping cost', example: 0 })
  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  // Order-level discount
  @ApiPropertyOptional({ description: 'Order-level discount', example: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  // Payment fields
  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  // Free-form (e.g., COD, CARD, BKASH, NAGAD)
  @ApiPropertyOptional({ description: 'Payment method label', example: 'COD' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  /**
   * Structured delivery address, stored as JSON.
   * Example:
   * {
   *   name: string, phone: string, address1: string, address2?: string,
   *   city: string, postalCode: string, note?: string
   * }
   */
  @ApiPropertyOptional({
    description: 'Structured shipping address (stored as JSON)',
    example: {
      name: 'Md Anik',
      phone: '01712345678',
      address1: 'House 123, Road 45',
      address2: 'Apt 6B',
      city: 'Dhaka',
      postalCode: '1207',
      note: 'Call before delivery',
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  shippingAddress?: any;

  // Plain-text version of the shipping address (for labels/quick display)
  @ApiPropertyOptional({
    description: 'Plain-text shipping address summary',
    example: 'Md Anik, 01712345678, House 123, Road 45, Apt 6B, Dhaka 1207',
  })
  @IsOptional()
  @IsString()
  shippingAddressText?: string;

  /**
   * Structured billing address, stored as JSON (same as shipping by default).
   * Keys: name, phone, address1, address2, city, postalCode, etc.
   */
  @ApiPropertyOptional({
    description: 'Structured billing address (stored as JSON)',
    example: {
      name: 'Md Anik',
      phone: '01712345678',
      address1: 'House 123, Road 45',
      city: 'Dhaka',
      postalCode: '1207',
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  billingAddress?: any;

  // Special note for delivery (e.g., "Call before delivery"); plain text
  @ApiPropertyOptional({
    description: 'Delivery note/instructions',
    example: 'Leave at the front desk',
  })
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  // ISO date string for requested or estimated delivery date (optional)
  @ApiPropertyOptional({
    description: 'Estimated delivery time (ISO datetime)',
    example: '2025-10-31T15:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;
}
