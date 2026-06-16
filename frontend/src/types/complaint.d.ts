import { ComplaintStatus } from '../constants/enums';
import { ServiceOrder } from './order';
import { User } from './auth';

export interface Complaint {
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
  order?: ServiceOrder;
  customer?: User;
  handler?: User;
}
