import { api, getBaseUrl } from "../api";
import type { AdMaster } from "@/types";

export interface AdCreatePayload {
  brand: string;
  advertisement: string;
  duration: number;
  filename: string;
  status: string;
  city?: string;
  language?: string;
  category?: string;
  radio_station?: string;
  creation_date?: string;
}

export const adsService = {
  list: (params?: { brand?: string; advertisement?: string }) =>
    api.get<AdMaster[]>("/ads", { params }).then((r) => r.data),

  create: (payload: AdCreatePayload) => api.post<AdMaster>("/ads", payload).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.put<AdMaster>("/ads/status", { id, status }).then((r) => r.data),

  getUploadAudioUrl: () => `${getBaseUrl()}/ads/upload-audio`,
};
