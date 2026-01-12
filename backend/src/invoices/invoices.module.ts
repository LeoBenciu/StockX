import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { UploadModule } from '../upload/upload.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [UploadModule, InventoryModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

