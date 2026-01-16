import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { DocumentProcessingService } from '../upload/document-processing.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreateManualReceiptDto } from './dto/create-manual-receipt.dto';
import { Express } from 'express';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private documentProcessing: DocumentProcessingService,
    private inventoryService: InventoryService,
  ) { }

  // =========================
  // BON MANUAL
  // =========================
  async createManualReceipt(
    userId: string,
    dto: CreateManualReceiptDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Receipt must contain at least one item',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          user: { connect: { id: userId } },
          fileName: 'MANUAL',
          fileUrl: 'MANUAL',
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });


      for (const item of dto.items) {
        const recipe = await tx.recipe.findUnique({
          where: { id: item.recipeId },
        });

        if (!recipe) {
          throw new BadRequestException(
            `Recipe not found: ${item.recipeId}`,
          );
        }

        const receiptItem = await tx.receiptItem.create({
          data: {
            receipt: { connect: { id: receipt.id } },
            recipe: { connect: { id: recipe.id } },
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? 0,
            totalPrice:
              (item.unitPrice ?? 0) * item.quantity,
          },
        });

        await this.inventoryService.consumeRecipe(
          tx,
          recipe.id,
          item.quantity,
          receiptItem.id,
        );
      }

      return tx.receipt.update({
        where: { id: receipt.id },
        data: { status: 'COMPLETED' },
      });
    });
  }

  // =========================
  // BON PDF
  // =========================
  async createReceipt(
    userId: string,
    file: Express.Multer.File,
    dto: CreateReceiptDto,
  ) {
    const { url, key } =
      await this.uploadService.uploadFile(file, 'receipts');

    const receipt = await this.prisma.receipt.create({
      data: {
        user: { connect: { id: userId } },
        fileName: file.originalname,
        fileUrl: url,
        fileKey: key,
        status: 'PROCESSING',
      },
    });

    this.processReceipt(
      receipt.id,
      file.buffer,
      file.originalname,
    ).catch(async () => {
      await this.prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'FAILED' },
      });
    });

    return receipt;
  }

  // =========================
  // READ
  // =========================
  async findAll(userId: string) {
    return this.prisma.receipt.findMany({
      where: {
        user: { id: userId },
      },
      include: {
        items: {
          include: {
            recipe: true,
            inventoryUpdates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id,
        user: { id: userId },
      },
      include: {
        items: {
          include: {
            recipe: true,
            inventoryUpdates: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  // =========================
  // DELETE
  // =========================
  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.receipt.delete({
      where: { id },
    });
  }

  // =========================
  // OCR PROCESS
  // =========================
  private async processReceipt(
    receiptId: string,
    fileBuffer: Buffer,
    fileName: string,
  ) {
    const extractedData =
      await this.documentProcessing.processReceipt(
        fileBuffer,
        fileName,
      );
    console.log('========== OCR RESULT ==========');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('================================');


    await this.prisma.$transaction(async (tx) => {
      await tx.receipt.update({
        where: { id: receiptId },
        data: {
          receiptDate: extractedData.receiptDate,
          totalAmount: extractedData.totalAmount,
          processedAt: new Date(),
          status: 'PROCESSING',
        },
      });

      for (const item of extractedData.items) {
        let recipe = await tx.recipe.findFirst({
          where: {
            name: {
              equals: item.recipeKey,
              mode: 'insensitive',
            },
          },
        });

        if (!recipe) {
          console.log(
            `Recipe not found for ${item.recipeKey}. Creating automatically.`,
          );
          recipe = await tx.recipe.create({
            data: {
              name: item.recipeKey,
              description: `Auto-created from receipt upload for item: ${item.itemName}`,
            },
          });
        }

        const receiptItem = await tx.receiptItem.create({
          data: {
            receipt: { connect: { id: receiptId } },
            recipe: { connect: { id: recipe.id } },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        await this.inventoryService.consumeRecipe(
          tx,
          recipe.id,
          item.quantity,
          receiptItem.id,
        );
      }

      await tx.receipt.update({
        where: { id: receiptId },
        data: { status: 'COMPLETED' },
      });
    });
  }

  async getMonthlyStats(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get total revenue (receipts) for the month
    // Use receiptDate if available, otherwise use createdAt
    const receipts = await this.prisma.receipt.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        OR: [
          {
            receiptDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            receiptDate: null,
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

    const venituri = receipts.reduce((sum, rec) => sum + (rec.totalAmount || 0), 0);

    return {
      year,
      month,
      venituri,
    };
  }
}
