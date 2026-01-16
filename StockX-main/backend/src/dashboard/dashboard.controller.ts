import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from '../invoices/invoices.service';
import { ReceiptsService } from '../receipts/receipts.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  @Get('monthly-stats')
  @ApiOperation({ summary: 'Get monthly revenue and expenses' })
  async getMonthlyStats(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const yearNum = parseInt(year) || new Date().getFullYear();
    const monthNum = parseInt(month) || new Date().getMonth() + 1;

    const [expensesData, revenueData] = await Promise.all([
      this.invoicesService.getMonthlyStats(req.user.userId, yearNum, monthNum),
      this.receiptsService.getMonthlyStats(req.user.userId, yearNum, monthNum),
    ]);

    return {
      year: yearNum,
      month: monthNum,
      venituri: revenueData.venituri,
      cheltuieli: expensesData.cheltuieli,
      profit: revenueData.venituri - expensesData.cheltuieli,
    };
  }
}

