import { api } from "../api";

type AudioType = "ads" | "songs" | "broadcasts" | "rjmasters";

export const audioService = {
  getBlob: (type: AudioType, filename: string) =>
    api.get<Blob>(`/audio/${type}/${filename}`, { responseType: "blob" }).then((r) => r.data),
};
