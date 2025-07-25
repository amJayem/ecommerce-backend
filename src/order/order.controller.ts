import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Public: Create a new order
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<{ message: string; order: Record<string, unknown> }> {
    // Return a typed response for linter safety
    const order = (await this.orderService.createOrder(
      createOrderDto,
    )) as Record<string, unknown>;
    return { message: 'Order created successfully', order };
  }

  // Public: Get all orders (removed JwtAuthGuard and RolesGuard for now)
  @Get()
  async getOrders(): Promise<Record<string, unknown>[]> {
    // Ensure type safety for returned orders
    return (await this.orderService.getOrders()) as Record<string, unknown>[];
  }

  // Public: Get order by ID (removed JwtAuthGuard and RolesGuard for now)
  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
  ): Promise<Record<string, unknown> | null> {
    // Ensure type safety for returned order
    return (await this.orderService.getOrderById(Number(id))) as Record<
      string,
      unknown
    > | null;
  }
}
