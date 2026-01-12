import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
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
  @ApiOperation({ summary: 'Get all inventory items' })
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id/threshold')
  @ApiOperation({ summary: 'Update minimum threshold for inventory item' })
  async updateThreshold(@Param('id') id: string, @Body() dto: UpdateThresholdDto) {
    return this.inventoryService.updateThreshold(id, dto.minThreshold);
  }
}

