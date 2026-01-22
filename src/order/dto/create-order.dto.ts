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
// export enum OrderStatus {
//   PENDING = 'PENDING',
//   CONFIRMED = 'CONFIRMED',
//   SHIPPED = 'SHIPPED',
//   DELIVERED = 'DELIVERED',
//   CANCELLED = 'CANCELLED',
// }

// // Payment status tracking
// export enum PaymentStatus {
//   PENDING = 'PENDING',
//   PAID = 'PAID',
//   FAILED = 'FAILED',
//   REFUNDED = 'REFUNDED',
// }

import { OrderStatus, PaymentStatus } from '@prisma/client';

export { OrderStatus, PaymentStatus };

// Address object for guest orders
class CreateAddressDto {
  @ApiProperty({ description: 'Full name', example: 'Asif Jayem' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '01759375796' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Address line 1', example: 'Dhaka' })
  @IsString()
  address1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ description: 'City', example: 'Dhaka' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Postal code', example: '1205' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;
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

  @ApiPropertyOptional({
    description: 'Email for guest checkout (required if userId is omitted)',
    example: 'guest@example.com',
  })
  @IsOptional()
  @IsString()
  guestEmail?: string;

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

  // Address IDs - for authenticated users with saved addresses
  @ApiPropertyOptional({
    description: 'ID of the shipping address (for authenticated users)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  shippingAddressId?: number;

  @ApiPropertyOptional({
    description: 'ID of the billing address (for authenticated users)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  // Address objects - for guest users
  @ApiPropertyOptional({
    description: 'Shipping address object (for guest users)',
    type: CreateAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  shippingAddress?: CreateAddressDto;

  @ApiPropertyOptional({
    description:
      'Billing address object (for guest users, defaults to shipping if omitted)',
    type: CreateAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  billingAddress?: CreateAddressDto;

  // Plain-text version of the shipping address (for labels/quick display)
  @ApiPropertyOptional({
    description: 'Plain-text shipping address summary',
    example: 'Md Anik, 01712345678, House 123, Road 45, Apt 6B, Dhaka 1207',
  })
  @IsOptional()
  @IsString()
  shippingAddressText?: string;

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
