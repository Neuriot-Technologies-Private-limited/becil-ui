import axios from "axios";
import { api } from "../api";

export type UploadType = "ads" | "broadcasts" | "songs" | "rjmasters";

export interface PresignUploadRequest {
  filename: string;
  upload_type: UploadType;
  content_type: string;
}

export interface PresignUploadResponse {
  upload_url: string;
  file_key: string;
  public_url: string;
  expires_in: number;
}

export const uploadsService = {
  presign: (payload: PresignUploadRequest) =>
    api.post<PresignUploadResponse>("/uploads/presign", payload).then((r) => r.data),

  complete: (fileKey: string) => api.post("/uploads/complete", { file_key: fileKey }).then((r) => r.data),

  uploadToS3: (uploadUrl: string, file: File, onProgress?: (progress: number) => void) =>
    axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "audio/mpeg",
      },
      onUploadProgress: (event) => {
        const progress = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
        onProgress?.(progress);
      },
    }),
};
