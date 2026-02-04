import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreateManualReceiptDto } from './dto/create-manual-receipt.dto';

@ApiTags('receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private receiptsService: ReceiptsService) { }

  // =========================
  // BON PDF (EXISTENT)
  // =========================
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload and process a receipt' })
  async create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateReceiptDto,
  ) {
    return this.receiptsService.createReceipt(
      req.user.userId,
      file,
      dto,
    );
  }

  // =========================
  // BON MANUAL (NOU)
  // =========================
  @Post('manual')
  @ApiOperation({ summary: 'Create manual receipt' })
  async createManual(
    @Request() req,
    @Body() dto: CreateManualReceiptDto,
  ) {
    return this.receiptsService.createManualReceipt(
      req.user.userId,
      dto,
    );
  }

  // =========================
  // READ
  // =========================
  @Get()
  @ApiOperation({ summary: 'Get all receipts' })
  async findAll(@Request() req) {
    return this.receiptsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.receiptsService.findOne(id, req.user.userId);
  }

  // =========================
  // DELETE
  // =========================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt' })
  async delete(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.receiptsService.delete(id, req.user.userId);
  }
}
