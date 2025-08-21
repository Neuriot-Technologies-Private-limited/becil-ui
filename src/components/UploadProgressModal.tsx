import { useState, useEffect } from "react";
import { FaXmark, FaCloudArrowUp } from "react-icons/fa6";
import { useTranslation } from 'react-i18next';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
  message?: string;
  estimatedTime?: string;
  currentFile?: string;
  totalFiles?: number;
  currentFileIndex?: number;
}

export default function UploadProgressModal({
  isOpen,
  onClose,
  fileName,
  progress,
  status,
  errorMessage,
  message,
  estimatedTime,
  currentFile,
  totalFiles,
  currentFileIndex
}: UploadProgressModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-close when complete
  useEffect(() => {
    if (status === "complete") {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Auto-close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isVisible) return null;

  const getStatusText = () => {
    if (message) {
      return message;
    }
    
    switch (status) {
      case "idle":
        return t('upload.processingFile');
      case "uploading":
        return t('upload.uploadingFile');
      case "processing":
        return t('upload.processing');
      case "complete":
        return t('upload.uploadComplete');
      case "error":
        return t('upload.uploadFailed');
      default:
        return t('upload.processingFile');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "text-neutral-400";
      case "uploading":
      case "processing":
        return "text-blue-400";
      case "complete":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case "idle":
        return "bg-orange-400";
      case "uploading":
      case "processing":
        return "bg-blue-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-orange-400";
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[200] transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`} 
      onClick={status === "complete" || status === "error" ? onClose : undefined}
    >
      <div 
        className="bg-black text-white px-8 py-6 rounded-lg max-w-md w-full relative modal-shadow border border-neutral-700" 
        onClick={(e) => e.stopPropagation()}
      >
        {status === "complete" || status === "error" ? (
          <button 
            className="absolute top-4 right-4 cursor-pointer hover:text-neutral-400 transition-colors" 
            onClick={onClose}
          >
            <FaXmark />
          </button>
        ) : null}
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <FaCloudArrowUp size={48} className={`${getStatusColor()} mb-2`} />
          </div>
          
          <h2 className="text-xl font-bold mb-2">{getStatusText()}</h2>
          
          {fileName && (
            <p className="text-sm text-neutral-400 mb-4 truncate max-w-full">
              {fileName}
            </p>
          )}
          
          {/* Show multi-file upload information */}
          {totalFiles && totalFiles > 1 && (
            <div className="w-full p-3 bg-blue-900/20 border border-blue-500/30 rounded-md mb-4">
              <p className="text-blue-400 text-sm">
                {t('upload.fileOf', { current: currentFileIndex, total: totalFiles })}: {currentFile}
              </p>
            </div>
          )}
          
          {/* Show estimated time for large files */}
          {estimatedTime && status === "uploading" && progress > 0 && (
            <div className="w-full p-3 bg-neutral-800/50 border border-neutral-600/30 rounded-md mb-4">
              <p className="text-neutral-300 text-sm">
                {estimatedTime}
              </p>
            </div>
          )}
          
          <div className="w-full mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">{t('upload.progress')}</span>
              <span className={getStatusColor()}>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {status === "error" && errorMessage && (
            <div className="w-full p-3 bg-red-900/20 border border-red-500/30 rounded-md mb-4">
              <p className="text-red-400 text-sm">{errorMessage}</p>
              <p className="text-red-300 text-xs mt-1">
                {t('upload.uploadFailed')}
              </p>
            </div>
          )}
          
          {status === "complete" && (
            <div className="w-full p-3 bg-green-900/20 border border-green-500/30 rounded-md mb-4">
              <p className="text-green-400 text-sm">{t('upload.uploadComplete')}</p>
            </div>
          )}
          
          {status === "uploading" && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-600 border-t-blue-400"></div>
              <span>{t('upload.uploading')}</span>
            </div>
          )}
          
          {status === "processing" && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-600 border-t-blue-400"></div>
              <span>{t('upload.processing')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 