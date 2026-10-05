import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(50, { message: 'Display name must be at most 50 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  displayName?: string;

  @ApiPropertyOptional({ example: 'taro_trades' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Username must be at least 2 characters' })
  @MaxLength(30, { message: 'Username must be at most 30 characters' })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username may only contain lowercase letters, numbers, and underscores',
  })
  @Transform(({ value }) => (value as string)?.toLowerCase().trim())
  username?: string;

  @ApiPropertyOptional({ example: 'Love trading tech and useful stuff.' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Bio must be at most 300 characters' })
  @Transform(({ value }) => (value as string)?.trim() || null)
  bio?: string | null;

  @ApiPropertyOptional({ example: 'Kota Kinabalu, Sabah' })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Location must be at most 120 characters' })
  @Transform(({ value }) => (value as string)?.trim() || null)
  location?: string | null;
}
