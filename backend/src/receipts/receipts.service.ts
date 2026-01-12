import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { DocumentProcessingService } from '../upload/document-processing.service';
import { RecipesService } from '../recipes/recipes.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private documentProcessing: DocumentProcessingService,
    private recipesService: RecipesService,
    private inventoryService: InventoryService,
  ) {}

  async createReceipt(userId: string, file: Express.Multer.File, dto: CreateReceiptDto) {
    // Upload file to S3
    const { url, key } = await this.uploadService.uploadFile(file, 'receipts');

    // Create receipt record
    const receipt = await this.prisma.receipt.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: url,
        fileKey: key,
        status: 'PROCESSING',
      },
    });

    // Process receipt asynchronously
    this.processReceipt(receipt.id, file.buffer, file.originalname).catch((error) => {
      console.error('Error processing receipt:', error);
      this.prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'FAILED' },
      });
    });

    return receipt;
  }

  private async processReceipt(receiptId: string, fileBuffer: Buffer, fileName: string) {
    try {
      // Extract data from receipt
      const extractedData = await this.documentProcessing.processReceipt(fileBuffer, fileName);

      // Update receipt with extracted data
      const receipt = await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          receiptDate: extractedData.receiptDate,
          totalAmount: extractedData.totalAmount,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Create receipt items and deduct inventory
      for (const item of extractedData.items) {
        const receiptItem = await this.prisma.receiptItem.create({
          data: {
            receiptId: receipt.id,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        // Find recipe for this food item
        const recipe = await this.recipesService.findByName(item.itemName);

        if (recipe) {
          // Deduct inventory based on recipe
          await this.inventoryService.deductFromRecipe(
            recipe.id,
            item.quantity,
            receiptItem.id,
          );
        }
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.receipt.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            inventoryDeductions: {
              include: {
                inventory: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  async delete(id: string, userId: string) {
    const receipt = await this.findOne(id, userId);

    // Delete file from S3
    if (receipt.fileKey) {
      await this.uploadService.deleteFile(receipt.fileKey);
    }

    // Delete receipt (cascade will delete items)
    await this.prisma.receipt.delete({
      where: { id },
    });
  }
}

