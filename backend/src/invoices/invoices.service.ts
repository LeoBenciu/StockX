import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async createInvoice(userId: string, file: Express.Multer.File, dto: CreateInvoiceDto) {
    console.log('[Invoice Upload] Starting invoice upload...');
    console.log('[Invoice Upload] File:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
    
    // Save file buffer before upload (might be lost after upload)
    const fileBuffer = Buffer.from(file.buffer);
    
    // Upload file to S3 or local storage
    const { url, key } = await this.uploadService.uploadFile(file, 'invoices');
    console.log('[Invoice Upload] File uploaded to:', url);

    // Create invoice record
    const invoice = await this.prisma.invoice.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: url,
        fileKey: key,
        status: 'PROCESSING',
      },
    });

    console.log('[Invoice Upload] Invoice created with ID:', invoice.id);

    // Process invoice - wait for it to complete
    try {
      await this.processInvoice(invoice.id, fileBuffer, file.originalname);
      console.log('[Invoice Upload] Processing completed successfully');
    } catch (error) {
      console.error('[Invoice Upload] Error processing invoice:', error);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }

    // Return updated invoice with items
    return this.findOne(invoice.id, userId);
  }

  private async processInvoice(invoiceId: string, fileBuffer: Buffer, fileName: string) {
    try {
      console.log(`[Invoice Processing] Starting processing for invoice ${invoiceId}`);
      
      // Extract data from invoice
      const extractedData = await this.documentProcessing.processInvoice(fileBuffer, fileName);
      
      console.log(`[Invoice Processing] Extracted ${extractedData.items?.length || 0} items`);
      console.log(`[Invoice Processing] Items:`, JSON.stringify(extractedData.items, null, 2));

      // Update invoice with extracted data
      const invoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          supplierName: extractedData.supplierName,
          invoiceDate: extractedData.invoiceDate,
          totalAmount: extractedData.totalAmount,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Create invoice items
      let itemsAdded = 0;
      for (const item of extractedData.items) {
        try {
          console.log(`[Invoice Processing] Adding item: ${item.itemName} (${item.quantity} ${item.unit})`);
          
          const invoiceItem = await this.prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });

          // Update inventory
          await this.inventoryService.addToInventory(
            item.itemName,
            item.quantity,
            item.unit,
            invoiceItem.id,
          );
          
          itemsAdded++;
          console.log(`[Invoice Processing] Successfully added ${item.itemName} to inventory`);
        } catch (itemError) {
          console.error(`[Invoice Processing] Error adding item ${item.itemName}:`, itemError);
        }
      }
      
      console.log(`[Invoice Processing] Completed. ${itemsAdded} items added to inventory.`);
    } catch (error) {
      console.error('[Invoice Processing] Error processing invoice:', error);
      console.error('[Invoice Processing] Error stack:', error.stack);
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async delete(id: string, userId: string) {
    const invoice = await this.findOne(id, userId);

    // Delete file from S3
    if (invoice.fileKey) {
      await this.uploadService.deleteFile(invoice.fileKey);
    }

    // Delete invoice (cascade will delete items)
    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async addItemsToInventory(invoiceId: string, userId: string) {
    const invoice = await this.findOne(invoiceId, userId);

    // Add all invoice items to inventory
    for (const item of invoice.items) {
      // Check if already added to inventory
      const existingUpdate = await this.prisma.inventoryUpdate.findFirst({
        where: { invoiceItemId: item.id },
      });

      if (!existingUpdate) {
        await this.inventoryService.addToInventory(
          item.itemName,
          item.quantity,
          item.unit,
          item.id,
        );
      }
    }

    return { message: 'Items added to inventory successfully' };
  }
}

