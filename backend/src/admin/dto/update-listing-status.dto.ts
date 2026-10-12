import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateListingStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'TRADED', 'ARCHIVED', 'REMOVED'])
  status: string;
}
