import { useState, useCallback } from "react";

interface UploadProgressState {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
  message?: string;
  retryCount?: number;
  estimatedTime?: string;
}

interface UploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number, message: string) => void;
  maxRetries?: number;
  timeout?: number;
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
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 600000; // 10 minutes default for large files
    
    setUploadState({ 
      progress: 0, 
      status: "uploading", 
      message: "Starting upload...",
      retryCount: 0 
    });

    return new Promise((resolve, reject) => {
      let retryCount = 0;
      let startTime = Date.now();
      let lastProgressTime = Date.now();
      
      const attemptUpload = () => {
        const xhr = new XMLHttpRequest();
        
        // Set a very long timeout for large files
        xhr.timeout = timeout;
        
        // Track upload progress with time estimation
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const currentTime = Date.now();
            const timeElapsed = (currentTime - startTime) / 1000; // seconds
            
            // Calculate estimated time remaining
            let estimatedTime = "";
            if (progress > 0 && timeElapsed > 0) {
              const bytesPerSecond = event.loaded / timeElapsed;
              const remainingBytes = event.total - event.loaded;
              const remainingSeconds = remainingBytes / bytesPerSecond;
              
              if (remainingSeconds > 60) {
                const minutes = Math.ceil(remainingSeconds / 60);
                estimatedTime = `${minutes} min remaining`;
              } else {
                estimatedTime = `${Math.ceil(remainingSeconds)} sec remaining`;
              }
            }
            
            const message = `Uploading... ${progress}%`;
            setUploadState(prev => ({ 
              ...prev, 
              progress, 
              message,
              retryCount,
              estimatedTime
            }));
            options.onProgress?.(progress, message);
            
            lastProgressTime = currentTime;
          }
        });

        // Handle successful upload
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText) as T;
              setUploadState({ 
                progress: 100, 
                status: "complete", 
                message: "Upload completed successfully!",
                retryCount 
              });
              options.onSuccess?.(response);
              resolve(response);
            } catch (error) {
              const errorMsg = "Failed to parse response";
              setUploadState({ 
                progress: 0, 
                status: "error", 
                errorMessage: errorMsg,
                retryCount 
              });
              options.onError?.(errorMsg);
              reject(new Error(errorMsg));
            }
          } else {
            handleUploadError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
          }
        });

        // Handle network errors
        xhr.addEventListener("error", () => {
          handleUploadError("Network error occurred. Please check your connection.");
        });

        // Handle timeout with specific message for large files
        xhr.addEventListener("timeout", () => {
          const fileSize = formData.get('file') instanceof File ? 
            (formData.get('file') as File).size : 0;
          
          if (fileSize > 100 * 1024 * 1024) { // > 100MB
            handleUploadError("Upload timed out. Large files may take longer. Please try again.");
          } else {
            handleUploadError("Upload timed out. Please try again.");
          }
        });

        // Handle abort
        xhr.addEventListener("abort", () => {
          handleUploadError("Upload was cancelled");
        });

        const handleUploadError = (errorMsg: string) => {
          if (retryCount < maxRetries) {
            retryCount++;
            const retryDelay = Math.min(2000 * retryCount, 10000); // Progressive delay
            
            setUploadState(prev => ({ 
              ...prev, 
              status: "uploading", 
              message: `Retrying upload... (${retryCount}/${maxRetries})`,
              retryCount,
              progress: 0 // Reset progress for retry
            }));
            
            // Progressive retry delay
            setTimeout(() => {
              startTime = Date.now(); // Reset timer for retry
              attemptUpload();
            }, retryDelay);
          } else {
            setUploadState({ 
              progress: 0, 
              status: "error", 
              errorMessage: `${errorMsg} (${maxRetries} retries attempted)`,
              retryCount 
            });
            options.onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        };

        // Add headers for better error handling
        xhr.open("POST", url);
        xhr.setRequestHeader("X-Upload-Retry", retryCount.toString());
        xhr.setRequestHeader("X-Upload-Timeout", timeout.toString());
        
        // Send the request
        xhr.send(formData);
      };

      // Start the first attempt
      attemptUpload();
    });
  }, []);

  const setProcessing = useCallback(() => {
    setUploadState(prev => ({ ...prev, status: "processing" }));
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({ progress: 0, status: "idle" });
  }, []);

  const setUploadStateDirect = useCallback((state: UploadProgressState) => {
    setUploadState(state);
  }, []);

  return {
    uploadState,
    uploadWithProgress,
    setProcessing,
    resetUpload,
    setUploadState: setUploadStateDirect
  };
}; 