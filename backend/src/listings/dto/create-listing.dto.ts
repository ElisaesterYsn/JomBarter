import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ── Enum constants ────────────────────────────────────────────────────────────

export const LISTING_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const LISTING_TYPES = ['PHYSICAL_ITEM', 'SERVICE', 'ITEM_AND_SERVICE'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const TRADE_PREFERENCES = [
  'SPECIFIC_ITEM',
  'SIMILAR_VALUE',
  'OPEN_OFFERS',
  'MULTIPLE_ITEMS',
  'ITEM_SERVICE',
] as const;
export type TradePreference = (typeof TRADE_PREFERENCES)[number];

export const EXCHANGE_METHODS = [
  'MEETUP',
  'SELF_PICKUP',
  'DELIVERY',
  'SHIPPING',
  'ONLINE',
] as const;
export type ExchangeMethod = (typeof EXCHANGE_METHODS)[number];

// ── DTO ───────────────────────────────────────────────────────────────────────

export class CreateListingDto {
  @ApiProperty({ example: 'iPhone 13 128GB' })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(120, { message: 'Title must be at most 120 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  title: string;

  @ApiProperty({ example: 'Used iPhone 13. Minor scratches. Battery 87%. Original box included.' })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(3000, { message: 'Description must be at most 3000 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  description: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @MinLength(1, { message: 'Category is required' })
  categoryId: string;

  @ApiProperty({ enum: LISTING_CONDITIONS, example: 'GOOD' })
  @IsIn(LISTING_CONDITIONS, {
    message: `Condition must be one of: ${LISTING_CONDITIONS.join(', ')}`,
  })
  condition: ListingCondition;

  @ApiPropertyOptional({ enum: LISTING_TYPES, example: 'PHYSICAL_ITEM' })
  @IsOptional()
  @IsIn(LISTING_TYPES, { message: `listingType must be one of: ${LISTING_TYPES.join(', ')}` })
  listingType?: ListingType;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'estimatedValue must be a number' })
  @Min(0, { message: 'estimatedValue must be >= 0' })
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 'Kota Kinabalu, Sabah' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  location?: string;

  @ApiPropertyOptional({
    example: 'Looking for a Samsung S23 or similar Android phone.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  lookingFor?: string;

  /**
   * Comma-separated trade preferences.
   * e.g. "SPECIFIC_ITEM,SIMILAR_VALUE"
   */
  @ApiPropertyOptional({ example: 'SPECIFIC_ITEM,SIMILAR_VALUE' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  tradePreference?: string;

  /**
   * Comma-separated exchange methods.
   * e.g. "MEETUP,DELIVERY"
   */
  @ApiPropertyOptional({ example: 'MEETUP,DELIVERY' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  exchangeMethod?: string;

  /**
   * Comma-separated category ids the owner is interested in receiving.
   */
  @ApiPropertyOptional({ example: 'clxyz123,clabc456' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  interestedInCategories?: string;
}
