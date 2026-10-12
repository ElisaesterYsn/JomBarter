import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AdminUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string)?.trim())
  search?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status?: string;
}
