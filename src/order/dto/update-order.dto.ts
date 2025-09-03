// Update Order DTO - extends CreateOrderDto with all fields optional
// This allows partial updates of order data
export class UpdateOrderDto {
  userId?: number;
  items?: any[];
  status?: any;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  paymentStatus?: any;
  paymentMethod?: string;
  shippingAddress?: string;
  billingAddress?: string;
  deliveryInstructions?: string;
  estimatedDelivery?: string;
  actualDelivery?: Date;
}
