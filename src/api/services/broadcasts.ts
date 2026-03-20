import { api } from "../api";
import type { AdDetectionResult, Broadcast } from "@/types";

export interface BroadcastCreatePayload {
  radio_station: string;
  broadcast_recording: string;
  filename: string;
  duration: number;
  city?: string;
  language?: string;
  status?: string;
}

export interface DesignateClipPayload {
  clip_type: string;
  brand_artist: string;
  advertisement_name: string;
  start_time: number;
  end_time: number;
}

export const broadcastsService = {
  list: (params?: { radio_station?: string; broadcast_recording?: string }) =>
    api.get<Broadcast[]>("/broadcasts", { params }).then((r) => r.data),

  create: (payload: BroadcastCreatePayload) =>
    api.post<Broadcast>("/broadcasts", payload).then((r) => r.data),

  getDetections: (broadcastId: number) =>
    api.get<AdDetectionResult[]>(`/broadcasts/${broadcastId}/detections`).then((r) => r.data),

  startProcessing: (broadcastId: number) =>
    api.post("/broadcasts/start-processing", { broadcast_id: broadcastId }).then((r) => r.data),

  getReport: (broadcastId: number, forceRegenerate = false) =>
    api
      .get(`/broadcasts/${broadcastId}/report`, {
        responseType: "blob",
        params: forceRegenerate ? { force_regenerate: true } : undefined,
      })
      .then((r) => r.data),

  designateClip: (broadcastId: number, payload: DesignateClipPayload) =>
    api.post(`/broadcasts/${broadcastId}/designate_clip`, payload).then((r) => r.data),

  remove: (id: number) => api.delete(`/broadcasts/${id}`).then((r) => r.data),
};
