import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecipeDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Recipe must have at least one ingredient');
    }

    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          name: dto.name,
          description: dto.description,
          servings: dto.servings,
        },
      });

      await tx.recipeItem.createMany({
        data: dto.items.map((item) => ({
          recipeId: recipe.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      });

      return tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });
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
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          servings: dto.servings,
        },
      });

      if (dto.items) {
        if (dto.items.length === 0) {
          throw new BadRequestException('Recipe must have at least one ingredient');
        }

        await tx.recipeItem.deleteMany({
          where: { recipeId: id },
        });

        await tx.recipeItem.createMany({
          data: dto.items.map((item) => ({
            recipeId: id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          })),
        });
      }

      return tx.recipe.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.recipe.delete({
      where: { id },
    });
  }
}
