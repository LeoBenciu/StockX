import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryUpdateType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  /* ===========================
     READ
  ============================ */

  async findAll() {
    return this.prisma.inventory.findMany({
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        ingredient: true,
        updates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  /* ===========================
     ADD FROM INVOICE
  ============================ */

  async addToInventory(
    ingredientName: string,
    quantity: number,
    invoiceItemId?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const normalizedName = ingredientName.trim().toLowerCase();

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { name: normalizedName },
      });

      if (!ingredient) {
        throw new BadRequestException(`Unknown ingredient: ${ingredientName}`);
      }

      let inventory = await tx.inventory.findUnique({
        where: { ingredientId: ingredient.id },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            ingredientId: ingredient.id,
            quantity: 0,
          },
        });
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { increment: quantity },
        },
      });

      await tx.inventoryUpdate.create({
        data: {
          inventoryId: inventory.id,
          invoiceItemId,
          quantity,
          type: InventoryUpdateType.INVOICE_IN,
          reason: 'Invoice import',
        },
      });

      return true;
    });
  }

  /* ===========================
     CONSUME FROM RECEIPT
     IMPORTANT: GRAME / ML / BUC
  ============================ */

  async consumeRecipe(
    tx: Prisma.TransactionClient,
    recipeId: string,
    receiptQuantity: number,
    receiptItemId: string,
  ) {
    if (receiptQuantity <= 0) {
      throw new BadRequestException('Invalid receipt quantity');
    }

    const alreadyConsumed = await tx.inventoryUpdate.findFirst({
      where: { receiptItemId },
    });

    if (alreadyConsumed) {
      throw new BadRequestException(
        'Recipe already consumed for this receipt item',
      );
    }

    const recipe = await tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    for (const item of recipe.items) {
      const requiredQuantity = item.quantity * receiptQuantity;

      const inventory = await tx.inventory.findUnique({
        where: { ingredientId: item.ingredientId },
      });

      if (!inventory) {
        throw new BadRequestException(
          `No inventory for ingredient ${item.ingredient.name}`,
        );
      }

      if (inventory.quantity < requiredQuantity) {
        throw new BadRequestException(
          `Insufficient stock for ingredient ${item.ingredient.name}`,
        );
      }

      // 🔥 UPDATE EXPLICIT + lastUpdated
      await tx.inventory.update({
        where: { ingredientId: item.ingredientId },
        data: {
          quantity: inventory.quantity - requiredQuantity,
          lastUpdated: new Date(),
        },
      });

      await tx.inventoryUpdate.create({
        data: {
          inventoryId: inventory.id,
          receiptItemId,
          quantity: requiredQuantity,
          type: InventoryUpdateType.RECIPE_OUT,
          reason: `Recipe: ${recipe.name}`,
        },
      });
    }

    return true;
  }


  /* ===========================
     THRESHOLD
  ============================ */

  async updateThreshold(id: string, minThreshold: number) {
    return this.prisma.inventory.update({
      where: { id },
      data: { minThreshold },
    });
  }

  async getLowStockItems() {
    const items = await this.prisma.inventory.findMany({
      where: {
        minThreshold: { not: null },
      },
      include: { ingredient: true },
    });

    return items.filter(
      (item) =>
        item.minThreshold !== null &&
        item.quantity <= item.minThreshold,
    );
  }

  /* ===========================
     DELETE INVENTORY + INGREDIENT
     SAFE
  ============================ */

  async deleteInventory(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        ingredient: {
          include: {
            recipeItems: true,
          },
        },
        updates: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.ingredient.recipeItems.length > 0) {
      throw new BadRequestException(
        'Ingredient is used in recipes and cannot be deleted',
      );
    }

    if (inventory.updates.length > 0) {
      throw new BadRequestException(
        'Inventory has history and cannot be deleted',
      );
    }

    await this.prisma.inventory.delete({
      where: { id },
    });

    await this.prisma.ingredient.delete({
      where: { id: inventory.ingredientId },
    });

    return { success: true };
  }
}
