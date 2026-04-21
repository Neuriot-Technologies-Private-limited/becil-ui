import { api } from "../api";
import type { RjMaster } from "@/types";

export interface RjCreatePayload {
  rj_name: string;
  show_name: string;
  duration: number;
  filename: string;
  status: string;
}

export const rjService = {
  list: (params?: { rj_name?: string; show_name?: string }) =>
    api.get<RjMaster[]>("/rjmasters", { params }).then((r) => r.data),

  create: (payload: RjCreatePayload) =>
    api.post<RjMaster>("/rjmasters", payload).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.put<RjMaster>("/rjmasters/status", { id, status }).then((r) => r.data),

  remove: (id: number) => api.delete(`/rjmasters/${id}`).then((r) => r.data),
};
