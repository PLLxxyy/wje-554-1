import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintStatus, OrderStatus, UserRole } from '../../constants/enums';
import { complaints, orders, users } from '../demo-data';
import { NotificationService } from '../notification/notification.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { HandleComplaintDto } from './dto/handle-complaint.dto';
import { ComplaintEntity } from './entities/complaint.entity';

@Injectable()
export class ComplaintService {
  constructor(private readonly notification: NotificationService) {}

  list(user: { sub: string; role: UserRole }, status?: ComplaintStatus) {
    return complaints.filter((item) => {
      if (status && item.status !== status) return false;
      if (user.role === UserRole.ADMIN) return true;
      if (user.role === UserRole.CUSTOMER) return item.customerId === user.sub;
      return false;
    }).map((item) => this.hydrate(item));
  }

  detail(user: { sub: string; role: UserRole }, id: string) {
    const complaint = this.mustFind(id);
    if (!this.canAccess(user, complaint)) throw new ForbiddenException('无权查看该投诉');
    return this.hydrate(complaint);
  }

  create(user: { sub: string; role: UserRole }, dto: CreateComplaintDto) {
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException('仅客户可发起投诉');
    const order = orders.find((item) => item.id === dto.orderId);
    if (!order) throw new NotFoundException('订单不存在');
    if (order.customerId !== user.sub) throw new ForbiddenException('仅订单客户可对该订单发起投诉');
    if (![OrderStatus.COMPLETED, OrderStatus.RATED].includes(order.status)) {
      throw new BadRequestException('仅已完工订单可发起投诉');
    }
    if (complaints.some((item) => item.orderId === dto.orderId)) {
      throw new BadRequestException('该订单已存在投诉，请勿重复提交');
    }
    const complaint: ComplaintEntity = {
      id: crypto.randomUUID(),
      orderId: dto.orderId,
      customerId: user.sub,
      title: dto.title,
      content: dto.content,
      status: ComplaintStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    complaints.unshift(complaint);
    this.notification.notify({
      type: 'complaint:new',
      title: '新投诉待处理',
      message: `${order.orderNo} - ${dto.title}`,
      orderId: order.id,
      complaintId: complaint.id
    });
    return this.hydrate(complaint);
  }

  handle(user: { sub: string; role: UserRole }, id: string, dto: HandleComplaintDto) {
    if (user.role !== UserRole.ADMIN) throw new ForbiddenException('仅管理员可处理投诉');
    const complaint = this.mustFind(id);
    if (complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.REJECTED) {
      throw new BadRequestException('该投诉已结案，不可再处理');
    }
    complaint.status = dto.status;
    complaint.handlerId = user.sub;
    complaint.handleResult = dto.handleResult;
    complaint.updatedAt = new Date().toISOString();
    if (dto.status === ComplaintStatus.RESOLVED || dto.status === ComplaintStatus.REJECTED) {
      this.notification.notify({
        type: 'complaint:resolved',
        title: '投诉处理结果',
        message: `您的投诉「${complaint.title}」已${dto.status === ComplaintStatus.RESOLVED ? '处理完成' : '被驳回'}`,
        orderId: complaint.orderId,
        complaintId: complaint.id,
        userIds: [complaint.customerId]
      });
    }
    return this.hydrate(complaint);
  }

  private mustFind(id: string) {
    const complaint = complaints.find((item) => item.id === id);
    if (!complaint) throw new NotFoundException('投诉不存在');
    return complaint;
  }

  private canAccess(user: { sub: string; role: UserRole }, complaint: ComplaintEntity) {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.CUSTOMER) return complaint.customerId === user.sub;
    return false;
  }

  private hydrate(complaint: ComplaintEntity) {
    return {
      ...complaint,
      order: orders.find((order) => order.id === complaint.orderId),
      customer: users.find((u) => u.id === complaint.customerId),
      handler: complaint.handlerId ? users.find((u) => u.id === complaint.handlerId) : undefined
    };
  }
}
