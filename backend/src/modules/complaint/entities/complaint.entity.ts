import { ComplaintStatus } from '../../../constants/enums';
import { UserEntity } from '../../auth/auth.service';
import { OrderEntity } from '../../order/entities/order.entity';

export interface ComplaintEntity {
  id: string;
  orderId: string;
  customerId: string;
  title: string;
  content: string;
  status: ComplaintStatus;
  handlerId?: string;
  handleResult?: string;
  createdAt: string;
  updatedAt: string;
  order?: OrderEntity;
  customer?: UserEntity;
  handler?: UserEntity;
}
