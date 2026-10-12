import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'SUSPENDED', 'BANNED'], {
    message: 'Status must be ACTIVE, SUSPENDED, or BANNED',
  })
  status: string;
}
