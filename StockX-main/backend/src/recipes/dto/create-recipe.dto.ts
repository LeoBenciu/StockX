import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RecipeItemDto {
  @ApiProperty({ description: 'Ingredient ID (UUID)' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ description: 'Quantity per serving, in ingredient base unit' })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CreateRecipeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  servings?: number;

  @ApiProperty({ type: [RecipeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
