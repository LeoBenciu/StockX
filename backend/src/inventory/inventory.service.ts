import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.inventory.findMany({
      include: {
        ingredient: true,
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        ingredient: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        deductions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  async findByIngredientName(name: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { name },
      include: {
        inventory: true,
      },
    });

    return ingredient?.inventory || null;
  }

  async addToInventory(
    ingredientName: string,
    quantity: number,
    unit: string,
    invoiceItemId?: string,
  ) {
    // Find or create ingredient
    let ingredient = await this.prisma.ingredient.findUnique({
      where: { name: ingredientName },
    });

    if (!ingredient) {
      ingredient = await this.prisma.ingredient.create({
        data: {
          name: ingredientName,
          unit,
        },
      });
    }

    // Find or create inventory
    let inventory = await this.prisma.inventory.findUnique({
      where: { ingredientId: ingredient.id },
    });

    if (!inventory) {
      inventory = await this.prisma.inventory.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 0,
          unit,
        },
      });
    }

    // Add to inventory
    const newQuantity = inventory.quantity + quantity;
    inventory = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity },
    });

    // Create inventory update record
    await this.prisma.inventoryUpdate.create({
      data: {
        inventoryId: inventory.id,
        invoiceItemId,
        quantity,
        type: 'ADD',
        notes: `Added from invoice`,
      },
    });

    return inventory;
  }

  async deductFromInventory(
    ingredientId: string,
    quantity: number,
    receiptItemId?: string,
    reason?: string,
  ) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { ingredientId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    if (inventory.quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${inventory.quantity}, Required: ${quantity}`);
    }

    const newQuantity = inventory.quantity - quantity;
    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity },
    });

    // Create deduction record
    await this.prisma.inventoryDeduction.create({
      data: {
        inventoryId: inventory.id,
        receiptItemId,
        quantity,
        reason,
      },
    });

    return updated;
  }

  async deductFromRecipe(recipeId: string, servings: number, receiptItemId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Deduct each ingredient based on recipe
    for (const recipeItem of recipe.items) {
      const quantityToDeduct = recipeItem.quantity * servings;
      await this.deductFromInventory(
        recipeItem.ingredientId,
        quantityToDeduct,
        receiptItemId,
        `Used in ${recipe.name}`,
      );
    }
  }

  async updateThreshold(id: string, minThreshold: number) {
    return this.prisma.inventory.update({
      where: { id },
      data: { minThreshold },
    });
  }

  async getLowStockItems() {
    return this.prisma.inventory.findMany({
      where: {
        minThreshold: {
          not: null,
        },
        quantity: {
          lte: this.prisma.inventory.fields.minThreshold,
        },
      },
      include: {
        ingredient: true,
      },
    });
  }
}

