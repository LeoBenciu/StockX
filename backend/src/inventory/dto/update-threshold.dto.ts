import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateThresholdDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  minThreshold: number;
}

