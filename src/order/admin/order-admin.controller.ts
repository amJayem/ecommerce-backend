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
} from '@nestjs/common';
import { OrderService } from '../order.service';
import { OrderStatus, PaymentStatus } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guard/permission.guard';
import { Permissions } from '../../auth/decorator/permissions.decorator';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin Orders')
@ApiBearerAuth('access-token')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class OrderAdminController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions('order.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all orders with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of orders returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.read permission.',
  })
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  @Permissions('order.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order details by id' })
  @ApiResponse({ status: 200, description: 'Order details returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.read permission.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @Permissions('order.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order by ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.update permission.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Permissions('order.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.update permission.',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, data.status);
  }

  @Patch(':id/payment-status')
  @Permissions('order.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order payment status' })
  @ApiResponse({ status: 200, description: 'Order payment status updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.update permission.',
  })
  updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { paymentStatus: PaymentStatus },
  ) {
    return this.orderService.updatePaymentStatus(id, data.paymentStatus);
  }

  @Delete(':id')
  @Permissions('order.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete an order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires order.delete permission.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}
