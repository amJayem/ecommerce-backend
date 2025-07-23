import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { Roles } from '../auth/decorator/roles.decorator';
import { RolesGuard } from '../auth/decorator/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Public: Create a new order
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  // Admin only: Get all orders
  // Use both JwtAuthGuard (to authenticate and set request.user) and RolesGuard (to check for admin role)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getOrders() {
    return this.orderService.getOrders();
  }

  // Admin only: Get order by ID
  // Use both JwtAuthGuard and RolesGuard for role-based access
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(Number(id));
  }
}
