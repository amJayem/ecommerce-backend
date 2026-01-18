import { OrderStatus, PaymentStatus } from './create-order.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Update Order DTO - all fields optional for partial updates
export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: number;

  @ApiPropertyOptional({
    description: 'Updated items (not commonly used here)',
  })
  items?: Array<{ productId: number; quantity: number; price: number }>;

  @ApiPropertyOptional({ description: 'Order status', enum: OrderStatus })
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Total amount' })
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Subtotal' })
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Tax' })
  tax?: number;

  @ApiPropertyOptional({ description: 'Shipping cost' })
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Discount' })
  discount?: number;

  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payment method' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Shipping address ID' })
  shippingAddressId?: number;

  @ApiPropertyOptional({ description: 'Plain-text shipping address' })
  shippingAddressText?: string;

  @ApiPropertyOptional({ description: 'Billing address ID' })
  billingAddressId?: number;

  @ApiPropertyOptional({ description: 'Delivery note' })
  deliveryNote?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery (ISO date string)' })
  estimatedDelivery?: string;

  @ApiPropertyOptional({ description: 'Actual delivery timestamp' })
  actualDelivery?: Date;
}
