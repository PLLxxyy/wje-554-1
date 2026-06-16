import { create } from 'zustand';
import { complaintApi } from '../api/complaint';
import { ComplaintStatus } from '../constants/enums';
import { Complaint } from '../types/complaint';

interface ComplaintState {
  complaints: Complaint[];
  current?: Complaint;
  loadComplaints: (params?: { status?: ComplaintStatus }) => Promise<void>;
  loadComplaint: (id: string) => Promise<void>;
  createComplaint: (payload: { orderId: string; title: string; content: string }) => Promise<Complaint>;
  handleComplaint: (id: string, payload: { status: ComplaintStatus; handleResult: string }) => Promise<void>;
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: [],
  loadComplaints: async (params) => set({ complaints: await complaintApi.list(params) }),
  loadComplaint: async (id) => set({ current: await complaintApi.detail(id) }),
  createComplaint: async (payload) => {
    const created = await complaintApi.create(payload);
    set({ complaints: [created, ...get().complaints] });
    return created;
  },
  handleComplaint: async (id, payload) => {
    const updated = await complaintApi.handle(id, payload);
    set({
      current: updated,
      complaints: get().complaints.map((item) => (item.id === id ? updated : item))
    });
  }
}));
