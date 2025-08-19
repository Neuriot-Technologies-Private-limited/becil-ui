import { useState, useCallback } from "react";

interface UploadProgressState {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
  message?: string;
  estimatedTime?: string;
  currentFile?: string;
  totalFiles?: number;
  currentFileIndex?: number;
}

interface UploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number, message: string) => void;
  timeout?: number;
}

export const useUploadProgress = () => {
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    status: "idle"
  });

  // Calculate timeout based on file size (longer for larger files)
  const calculateTimeout = (fileSize: number): number => {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > 100) {
      return 900000; // 15 minutes for files > 100MB
    } else if (sizeInMB > 50) {
      return 600000; // 10 minutes for files > 50MB
    } else {
      return 300000; // 5 minutes for smaller files
    }
  };

  const uploadWithProgress = useCallback(async <T = any>(
    url: string,
    formData: FormData,
    options: UploadOptions = {}
  ): Promise<T> => {
    const file = formData.get("file") as File;
    const timeout = options.timeout || calculateTimeout(file?.size || 0);
    
    setUploadState({ 
      progress: 0, 
      status: "uploading", 
      message: "Starting upload..."
    });

    return new Promise((resolve, reject) => {
      let startTime = Date.now();
      
      const xhr = new XMLHttpRequest();
      
      // Set timeout based on file size
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
            estimatedTime
          }));
          options.onProgress?.(progress, message);
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
              message: "Upload completed successfully!"
            });
            options.onSuccess?.(response);
            resolve(response);
          } catch (error) {
            const errorMsg = "Failed to parse response";
            setUploadState({ 
              progress: 0, 
              status: "error", 
              errorMessage: errorMsg
            });
            options.onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        } else {
          console.error("Upload failed:", xhr.status, xhr.statusText, xhr.responseText);
          const errorMsg = `Upload failed: ${xhr.status} ${xhr.statusText}. Response: ${xhr.responseText}`;
          setUploadState({ 
            progress: 0, 
            status: "error", 
            errorMessage: errorMsg
          });
          options.onError?.(errorMsg);
          reject(new Error(errorMsg));
        }
      });

      // Handle network errors
      xhr.addEventListener("error", () => {
        console.error("XHR Error:", xhr.status, xhr.statusText, xhr.responseText);
        const errorMsg = `Network error occurred. Status: ${xhr.status} ${xhr.statusText}`;
        setUploadState({ 
          progress: 0, 
          status: "error", 
          errorMessage: errorMsg
        });
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      });

      // Handle timeout
      xhr.addEventListener("timeout", () => {
        const errorMsg = `Upload timed out after ${Math.round(timeout / 1000)} seconds. Please try again.`;
        setUploadState({ 
          progress: 0, 
          status: "error", 
          errorMessage: errorMsg
        });
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      });

      // Handle abort
      xhr.addEventListener("abort", () => {
        const errorMsg = "Upload was cancelled";
        setUploadState({ 
          progress: 0, 
          status: "error", 
          errorMessage: errorMsg
        });
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      });

      // Send the request
      xhr.open("POST", url);
      
      // Add headers to help with CORS
      // DO NOT set Content-Type header - let browser set it automatically for FormData
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      

      
      xhr.send(formData);
    });
  }, []);

  // New function for uploading multiple files
  const uploadMultipleFiles = useCallback(async <T = any>(
    url: string,
    files: File[],
    options: UploadOptions = {}
  ): Promise<T[]> => {
    const timeout = options.timeout || 180000; // 3 minutes per file
    const results: T[] = [];
    
    setUploadState({ 
      progress: 0, 
      status: "uploading", 
      message: `Starting upload of ${files.length} files...`,
      totalFiles: files.length,
      currentFileIndex: 0
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      setUploadState(prev => ({ 
        ...prev, 
        currentFile: file.name,
        currentFileIndex: i + 1,
        message: `Uploading ${file.name} (${i + 1}/${files.length})...`
      }));

      try {
        const result = await uploadWithProgress(url, formData, {
          ...options,
          timeout,
          onProgress: (progress, message) => {
            const overallProgress = Math.round(((i * 100) + progress) / files.length);
            setUploadState(prev => ({ 
              ...prev, 
              progress: overallProgress,
              message: `${file.name}: ${progress}% (${i + 1}/${files.length})`
            }));
            options.onProgress?.(overallProgress, message);
          }
        });
        results.push(result);
      } catch (error) {
        setUploadState({ 
          progress: 0, 
          status: "error", 
          errorMessage: `Failed to upload ${file.name}: ${error}`
        });
        throw error;
      }
    }

    setUploadState({ 
      progress: 100, 
      status: "complete", 
      message: `Successfully uploaded ${files.length} files!`
    });

    return results;
  }, [uploadWithProgress]);



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
    uploadMultipleFiles,
    setProcessing,
    resetUpload,
    setUploadState: setUploadStateDirect
  };
}; 