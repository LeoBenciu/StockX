import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [InvoicesModule, ReceiptsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}

