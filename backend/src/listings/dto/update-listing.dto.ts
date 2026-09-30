import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { LISTING_CONDITIONS, ListingCondition } from './create-listing.dto';

export class UpdateListingDto {
  @ApiPropertyOptional({ example: 'iPhone 13 128GB' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Transform(({ value }) => (value as string)?.trim())
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  @Transform(({ value }) => (value as string)?.trim())
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string;

  @ApiPropertyOptional({ enum: LISTING_CONDITIONS })
  @IsOptional()
  @IsIn(LISTING_CONDITIONS)
  condition?: ListingCondition;

  @ApiPropertyOptional({ example: 'Kota Kinabalu, Sabah' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  lookingFor?: string;
}
