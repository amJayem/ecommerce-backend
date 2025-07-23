import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { RolesGuard } from '../auth/decorator/roles.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Public: Create a new order
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  // Admin only: Get all orders
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async getOrders() {
    return this.orderService.getOrders();
  }

  // Admin only: Get order by ID
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(Number(id));
  }
}
