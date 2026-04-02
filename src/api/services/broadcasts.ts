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

export interface ReportDownload {
  blob: Blob;
  /** From `x-suggested-filename` when backend sends it */
  filename: string | null;
}

function getSuggestedFilenameFromHeaders(headers: unknown): string | null {
  if (!headers || typeof headers !== "object") return null;
  const h = headers as { get?: (name: string) => string | undefined };
  if (typeof h.get === "function") {
    const v = h.get("x-suggested-filename") ?? h.get("X-Suggested-Filename");
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  for (const key of Object.keys(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === "x-suggested-filename") {
      const v = (headers as Record<string, string>)[key];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
  }
  return null;
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

  getReport: (broadcastId: number, forceRegenerate = false): Promise<ReportDownload> =>
    api
      .get(`/broadcasts/${broadcastId}/report`, {
        responseType: "blob",
        params: forceRegenerate ? { force_regenerate: true } : undefined,
      })
      .then((r) => ({
        blob: r.data as Blob,
        filename: getSuggestedFilenameFromHeaders(r.headers),
      })),

  designateClip: (broadcastId: number, payload: DesignateClipPayload) =>
    api.post(`/broadcasts/${broadcastId}/designate_clip`, payload).then((r) => r.data),

  remove: (id: number) => api.delete(`/broadcasts/${id}`).then((r) => r.data),
};
