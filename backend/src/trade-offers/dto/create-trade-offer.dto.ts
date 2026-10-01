import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTradeOfferDto {
  /** The listing the sender wants to receive */
  @ApiProperty({ example: 'clxyz_target_listing_id' })
  @IsString()
  @MinLength(1, { message: 'targetListingId is required' })
  targetListingId: string;

  /** The listing the sender is offering in exchange */
  @ApiProperty({ example: 'clxyz_offered_listing_id' })
  @IsString()
  @MinLength(1, { message: 'offeredListingId is required' })
  offeredListingId: string;

  @ApiPropertyOptional({
    example: 'Hi! Would you be interested in exchanging this camera for your iPhone?',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (value as string)?.trim() || undefined)
  message?: string;
}
