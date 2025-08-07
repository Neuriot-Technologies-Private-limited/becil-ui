import { useState, useCallback } from "react";

interface UploadProgressState {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
}

interface UploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export const useUploadProgress = () => {
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    status: "idle"
  });

  const uploadWithProgress = useCallback(async <T = any>(
    url: string,
    formData: FormData,
    options: UploadOptions = {}
  ): Promise<T> => {
    setUploadState({ progress: 0, status: "uploading" });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState(prev => ({ ...prev, progress }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as T;
            setUploadState({ progress: 100, status: "complete" });
            options.onSuccess?.(response);
            resolve(response);
          } catch (error) {
            const errorMsg = "Failed to parse response";
            setUploadState({ progress: 0, status: "error", errorMessage: errorMsg });
            options.onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        } else {
          const errorMsg = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          setUploadState({ progress: 0, status: "error", errorMessage: errorMsg });
          options.onError?.(errorMsg);
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener("error", () => {
        const errorMsg = "Network error occurred";
        setUploadState({ progress: 0, status: "error", errorMessage: errorMsg });
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      });

      xhr.addEventListener("abort", () => {
        const errorMsg = "Upload was cancelled";
        setUploadState({ progress: 0, status: "error", errorMessage: errorMsg });
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      });

      xhr.open("POST", url);
      xhr.send(formData);
    });
  }, []);

  const setProcessing = useCallback(() => {
    setUploadState(prev => ({ ...prev, status: "processing" }));
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({ progress: 0, status: "idle" });
  }, []);

  return {
    uploadState,
    uploadWithProgress,
    setProcessing,
    resetUpload
  };
}; 