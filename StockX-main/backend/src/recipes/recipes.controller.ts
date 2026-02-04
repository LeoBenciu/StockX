import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes' })
  async findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID' })
  async findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recipe' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recipe' })
  async delete(@Param('id') id: string) {
    return this.recipesService.delete(id);
  }
}
