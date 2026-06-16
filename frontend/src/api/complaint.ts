import { ComplaintStatus } from '../constants/enums';
import { Complaint } from '../types/complaint';
import { request } from './request';

export const complaintApi = {
  list: (params?: { status?: ComplaintStatus }) => request.get<unknown, Complaint[]>('/complaints', { params }),
  detail: (id: string) => request.get<unknown, Complaint>(`/complaints/${id}`),
  create: (payload: { orderId: string; title: string; content: string }) =>
    request.post<unknown, Complaint>('/complaints', payload),
  handle: (id: string, payload: { status: ComplaintStatus; handleResult: string }) =>
    request.patch<unknown, Complaint>(`/complaints/${id}/handle`, payload)
};
