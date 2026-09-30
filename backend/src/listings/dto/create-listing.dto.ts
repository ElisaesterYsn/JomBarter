import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export const LISTING_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export class CreateListingDto {
  @ApiProperty({ example: 'iPhone 13 128GB' })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(120, { message: 'Title must be at most 120 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  title: string;

  @ApiProperty({
    example:
      'Used iPhone 13 128GB. Fully functional with minor scratches on the frame. Battery health 87%. Comes with original box and charging cable.',
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(3000, { message: 'Description must be at most 3000 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  description: string;

  @ApiProperty({ example: 'phones-tablets', description: 'Category id (cuid)' })
  @IsString()
  @MinLength(1, { message: 'Category is required' })
  categoryId: string;

  @ApiProperty({ enum: LISTING_CONDITIONS, example: 'GOOD' })
  @IsIn(LISTING_CONDITIONS, {
    message: `Condition must be one of: ${LISTING_CONDITIONS.join(', ')}`,
  })
  condition: ListingCondition;

  @ApiPropertyOptional({ example: 'Kota Kinabalu, Sabah' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  location?: string;

  @ApiPropertyOptional({
    example: 'Looking for a Samsung S23 or similar Android phone. Open to reasonable offers.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'lookingFor must be at most 1000 characters' })
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  lookingFor?: string;
}
