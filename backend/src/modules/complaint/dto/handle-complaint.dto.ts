import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ComplaintStatus } from '../../../constants/enums';

const allowedStatuses = [ComplaintStatus.PROCESSING, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED] as const;

export class HandleComplaintDto {
  @IsIn(allowedStatuses as unknown as string[])
  status!: typeof allowedStatuses[number];

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  handleResult!: string;
}
