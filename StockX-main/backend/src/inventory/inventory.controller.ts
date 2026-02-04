import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { UpdateThresholdDto } from './dto/update-threshold.dto';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Get('low-stock')
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id/threshold')
  async updateThreshold(
    @Param('id') id: string,
    @Body() dto: UpdateThresholdDto,
  ) {
    return this.inventoryService.updateThreshold(id, dto.minThreshold);
  }

  @Delete(':id')
  async deleteInventory(@Param('id') id: string) {
    return this.inventoryService.deleteInventory(id);
  }
}
