import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        description: dto.description,
        servings: dto.servings,
        items: {
          create: dto.items.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.recipe.findMany({
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
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

    return recipe;
  }

  async findByName(name: string) {
    return this.prisma.recipe.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRecipeDto) {
    const recipe = await this.findOne(id);

    // Update recipe
    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        servings: dto.servings,
      },
    });

    // Update items if provided
    if (dto.items) {
      // Delete existing items
      await this.prisma.recipeItem.deleteMany({
        where: { recipeId: id },
      });

      // Create new items
      await this.prisma.recipeItem.createMany({
        data: dto.items.map((item) => ({
          recipeId: id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        })),
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.recipe.delete({
      where: { id },
    });
  }
}

