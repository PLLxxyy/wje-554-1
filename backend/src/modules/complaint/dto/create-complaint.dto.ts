import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateComplaintDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;
}
