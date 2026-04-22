import { api } from "../api";
import type { RjClip, RjBrandMention } from "@/types";

export interface RjClipCreatePayload {
  rj_name?: string;
  radio_station?: string;
  broadcast_id?: number;
  duration?: number;
  filename: string;
  status?: string;
}

export interface RjTranscribePayload {
  brand_names?: string[];
  threshold?: number;
}

export const rjService = {
  /** List all RJ clips, optionally filtered */
  list: (params?: { radio_station?: string; status?: string }) =>
    api.get<RjClip[]>("/rj-clips", { params }).then((r) => r.data),

  /** Get a single clip */
  get: (id: number) =>
    api.get<RjClip>(`/rj-clips/${id}`).then((r) => r.data),

  /** Upload audio file + register clip in one step (multipart) */
  uploadAndRegister: (
    file: File,
    meta: { rj_name?: string; radio_station?: string; broadcast_id?: number; status?: string }
  ) => {
    const form = new FormData();
    form.append("file", file);
    if (meta.rj_name) form.append("rj_name", meta.rj_name);
    if (meta.radio_station) form.append("radio_station", meta.radio_station);
    if (meta.broadcast_id != null) form.append("broadcast_id", String(meta.broadcast_id));
    if (meta.status) form.append("status", meta.status);
    return api
      .post<RjClip>("/rj-clips/upload-and-register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  /** Update clip status */
  updateStatus: (id: number, status: string) =>
    api.put<RjClip>("/rj-clips/status", { id, status }).then((r) => r.data),

  /** Kick off async transcription + brand mention detection */
  transcribe: (id: number, payload?: RjTranscribePayload) =>
    api.post(`/rj-clips/${id}/transcribe`, payload ?? {}).then((r) => r.data),

  /** Poll transcript status */
  getTranscript: (id: number) =>
    api
      .get<{ clip_id: number; status: string; transcript_romanized: string | null; transcript_hindi: string | null }>(
        `/rj-clips/${id}/transcript`
      )
      .then((r) => r.data),

  /** Get brand mentions for a clip */
  getBrandMentions: (id: number) =>
    api.get<RjBrandMention[]>(`/rj-clips/${id}/brand-mentions`).then((r) => r.data),

  /** Delete clip + S3 file */
  remove: (id: number) => api.delete(`/rj-clips/${id}`).then((r) => r.data),
};
