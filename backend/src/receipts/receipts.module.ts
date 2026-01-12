import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { UploadModule } from '../upload/upload.module';
import { RecipesModule } from '../recipes/recipes.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [UploadModule, RecipesModule, InventoryModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}

