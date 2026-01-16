import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { DocumentProcessingService } from '../upload/document-processing.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private documentProcessing: DocumentProcessingService,
    private inventoryService: InventoryService,
  ) { }

  async createInvoice(
    userId: string,
    file: Express.Multer.File,
    dto: CreateInvoiceDto,
  ) {
    console.log('========== INVOICE UPLOAD STARTED ==========');
    console.log('File name:', file.originalname);
    console.log('File size:', file.size, 'bytes');
    console.log('File mimetype:', file.mimetype);
    
    const fileBuffer = Buffer.from(file.buffer);
    console.log('Buffer size:', fileBuffer.length, 'bytes');
    
    const { url, key } = await this.uploadService.uploadFile(file, 'invoices');
    console.log('File uploaded to:', url);

    const invoice = await this.prisma.invoice.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: url,
        fileKey: key,
        status: 'PROCESSING',
      },
    });

    console.log('Invoice created with ID:', invoice.id);
    console.log('Starting invoice processing...');

    try {
      await this.processInvoice(invoice.id, fileBuffer, file.originalname);
      console.log('✅ Invoice processing completed successfully');
    } catch (error) {
      console.error('❌ Invoice processing error:', error);
      console.error('Error stack:', error?.stack);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Invoice processing failed');
    }

    return this.findOne(invoice.id, userId);
  }

  private async processInvoice(
    invoiceId: string,
    fileBuffer: Buffer,
    fileName: string,
  ) {
    console.log('========== PROCESSING INVOICE ==========');
    console.log('Invoice ID:', invoiceId);
    console.log('File name:', fileName);
    console.log('Calling documentProcessing.processInvoice...');

    const extractedData =
      await this.documentProcessing.processInvoice(fileBuffer, fileName);

    console.log('========== EXTRACTED DATA RECEIVED ==========');
    console.log('Supplier name:', extractedData.supplierName);
    console.log('Invoice date:', extractedData.invoiceDate);
    console.log('Total amount:', extractedData.totalAmount);
    console.log('Items count:', extractedData.items?.length || 0);
    console.log('Items:', JSON.stringify(extractedData.items, null, 2));
    console.log('=============================================');

    if (!extractedData.items || extractedData.items.length === 0) {
      console.error('⚠️⚠️⚠️ WARNING: NO ITEMS EXTRACTED FROM INVOICE! ⚠️⚠️⚠️');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          supplierName: extractedData.supplierName,
          invoiceDate: extractedData.invoiceDate,
          totalAmount: extractedData.totalAmount,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      console.log('Invoice updated in database');
      console.log('Creating', extractedData.items?.length || 0, 'invoice items...');

      for (const item of extractedData.items) {
        console.log('Creating item:', item.itemName, '- Qty:', item.quantity, item.unit);
        await tx.invoiceItem.create({
          data: {
            invoiceId,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });
      }

      console.log('✅ All invoice items created in database');
    });
  }

  async addItemsToInventory(invoiceId: string, userId: string) {
    const invoice = await this.findOne(invoiceId, userId);

    if (invoice.status !== 'COMPLETED') {
      throw new BadRequestException('Invoice not processed yet');
    }

    for (const item of invoice.items) {
      const alreadyAdded = await this.prisma.inventoryUpdate.findFirst({
        where: { invoiceItemId: item.id },
      });

      if (alreadyAdded) {
        continue;
      }

      const normalizedName = item.itemName.trim().toLowerCase();

      let ingredient = await this.prisma.ingredient.findUnique({
        where: { name: normalizedName },
      });

      if (!ingredient) {
        ingredient = await this.prisma.ingredient.create({
          data: {
            name: normalizedName,
            baseUnit: item.unit,
          },
        });
      }

      await this.inventoryService.addToInventory(
        ingredient.name,
        item.quantity,
        item.id,
      );
    }

    return { message: 'Invoice items added to inventory' };
  }

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async delete(id: string, userId: string) {
    const invoice = await this.findOne(id, userId);

    if (invoice.fileKey) {
      await this.uploadService.deleteFile(invoice.fileKey);
    }

    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get total expenses (invoices) for the month
    // Use invoiceDate if available, otherwise use createdAt
    const invoices = await this.prisma.invoice.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        OR: [
          {
            invoiceDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            invoiceDate: null,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      select: {
        totalAmount: true,
      },
    });

    const cheltuieli = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      year,
      month,
      cheltuieli,
    };
  }
}
