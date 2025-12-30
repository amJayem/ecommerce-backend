import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from '../order.service';
import { CreateOrderDto, OrderStatus } from '../dto/create-order.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class UserOrderQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { ApprovalGuard } from '../../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrderPublicController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order (public or authenticated)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    if (req.user && req.user.id) {
      createOrderDto.userId = req.user.id;
    }
    return this.orderService.createOrder(createOrderDto);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard, ApprovalGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders returned' })
  getMyOrders(@Request() req: any, @Query() query: UserOrderQueryDto) {
    return this.orderService.getUserOrders(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ApprovalGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order details by id (owner only)' })
  @ApiResponse({ status: 200, description: 'Order details returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Can only view own orders.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const order = await this.orderService.findOne(id);

    // Check if user is the owner
    if (
      order.userId !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ApprovalGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (owner only, pending only)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Can only cancel own orders.',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const order = await this.orderService.findOne(id);

    // Check if user is the owner
    if (
      order.userId !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Only pending orders can be cancelled');
    }

    return this.orderService.updateOrderStatus(id, OrderStatus.CANCELLED);
  }
}
