import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  OrderStatus,
  PaymentStatus,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/decorator/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  // REMOVED JWT GUARD - Allows both authenticated and anonymous users to create orders
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    // If user is authenticated, set userId from JWT token
    // If user is anonymous, userId will remain undefined/null
    if (req.user && req.user.id) {
      createOrderDto.userId = req.user.id;
    }

    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: any) {
    return this.orderService.findAll(query);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getMyOrders(@Request() req: any, @Query() query: any) {
    return this.orderService.getUserOrders(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Users can only view their own orders, admins can view all
    if (req.user.role !== 'admin') {
      return this.orderService.getUserOrders(req.user.id);
    }
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, data.status);
  }

  @Patch(':id/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { paymentStatus: PaymentStatus },
  ) {
    return this.orderService.updatePaymentStatus(id, data.paymentStatus);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Users can only cancel their own pending orders, admins can cancel any pending order
    if (req.user.role !== 'admin') {
      // For users, this will be a cancellation (soft delete)
      return this.orderService.updateOrderStatus(id, OrderStatus.CANCELLED);
    }
    return this.orderService.remove(id);
  }
}
