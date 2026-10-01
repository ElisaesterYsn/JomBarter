import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  LISTING_CONDITIONS,
  LISTING_TYPES,
  ListingCondition,
  ListingType,
} from './create-listing.dto';

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

  @ApiPropertyOptional({ enum: LISTING_TYPES })
  @IsOptional()
  @IsIn(LISTING_TYPES)
  listingType?: ListingType;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  tradePreference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  exchangeMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  interestedInCategories?: string;
}
