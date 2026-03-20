import { api } from "../api";
import type { SongMaster } from "@/types";

export interface SongCreatePayload {
  artist: string;
  name: string;
  duration: number;
  filename: string;
  status: string;
}

export const songsService = {
  list: () => api.get<SongMaster[]>("/songs").then((r) => r.data),

  create: (payload: SongCreatePayload) => api.post<SongMaster>("/songs", payload).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.put<SongMaster>("/songs/status", { id, status }).then((r) => r.data),

  remove: (id: number) => api.delete(`/songs/${id}`).then((r) => r.data),
};
