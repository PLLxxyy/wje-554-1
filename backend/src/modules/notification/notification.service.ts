import { Injectable } from '@nestjs/common';

export interface NotificationPayload {
  type: 'order:status_changed' | 'order:new_assignment' | 'order:worker_arriving' | 'complaint:new' | 'complaint:resolved';
  title: string;
  message: string;
  orderId?: string;
  complaintId?: string;
  userIds?: string[];
}

@Injectable()
export class NotificationService {
  private gateway?: { push: (payload: NotificationPayload) => void };

  bindGateway(gateway: { push: (payload: NotificationPayload) => void }) {
    this.gateway = gateway;
  }

  notify(payload: NotificationPayload) {
    this.gateway?.push(payload);
  }
}
