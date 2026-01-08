import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsSummaryDto,
  AnalyticsChartsDto,
  AnalyticsInventoryDto,
} from './dto/analytics-response.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { Permissions } from '../auth/decorator/permissions.decorator';
import { ApprovalGuard } from '../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin Analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, ApprovalGuard, PermissionGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Permissions('analytics.orders.read') // Support and above
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get analytics summary (KPIs and status counts)' })
  @ApiQuery({ name: 'period', enum: ['today', '7d', '30d'], required: false })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Format: YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'Format: YYYY-MM-DD',
  })
  @ApiResponse({ status: 200, type: AnalyticsSummaryDto })
  async getSummary(
    @Query('period') period: string = 'today',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnalyticsSummaryDto> {
    return this.analyticsService.getSummary(period, startDate, endDate);
  }

  @Get('charts')
  @Permissions('analytics.sales.read') // Manager and above
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get analytics chart data (Trends and distributions)',
  })
  @ApiQuery({ name: 'period', enum: ['today', '7d', '30d'], required: false })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    required: false,
    description: 'Format: YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    required: false,
    description: 'Format: YYYY-MM-DD',
  })
  @ApiResponse({ status: 200, type: AnalyticsChartsDto })
  async getCharts(
    @Query('period') period: string = 'today',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnalyticsChartsDto> {
    return this.analyticsService.getCharts(period, startDate, endDate);
  }

  @Get('inventory')
  @Permissions('analytics.inventory.read') // Manager and above
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory analytics (Stock and categories)' })
  @ApiResponse({ status: 200, type: AnalyticsInventoryDto })
  async getInventory(): Promise<AnalyticsInventoryDto> {
    return this.analyticsService.getInventory();
  }
}
