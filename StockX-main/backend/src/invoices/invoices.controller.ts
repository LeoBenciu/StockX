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
  UsePipes,
  ValidationPipe,
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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload and process an invoice' })
  async create(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createInvoice(req.user.userId, file, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  async findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.userId);
  }

  @Post(':id/add-to-inventory')
  @ApiOperation({ summary: 'Add invoice items to inventory (admin)' })
  async addToInventory(@Param('id') id: string, @Request() req) {
    return this.invoicesService.addItemsToInventory(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.invoicesService.delete(id, req.user.userId);
  }
}
