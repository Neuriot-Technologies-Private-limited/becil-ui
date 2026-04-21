import { useState, useRef } from "react";
import { FaMicrophone, FaXmark } from "react-icons/fa6";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { rjService, uploadsService } from "@/api/services";
import UploadProgressModal from "./UploadProgressModal";

interface UploadRjModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRjUploaded: (rj: any) => void;
}

export default function UploadRjModal({ isOpen, onClose, onRjUploaded }: UploadRjModalProps) {
  const [rjName, setRjName] = useState("");
  const [showName, setShowName] = useState("");
  const [status, setStatus] = useState("Active");
  const [file, setFile] = useState<File>();
  const [showProgress, setShowProgress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadState, resetUpload, setUploadState } = useUploadProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select an audio file");

    setShowProgress(true);
    setIsUploading(true);
    resetUpload();

    try {
      const getDuration = (f: File) =>
        new Promise<number>((resolve, reject) => {
          const audio = document.createElement("audio");
          audio.preload = "metadata";
          audio.onloadedmetadata = () => resolve(Math.floor(audio.duration));
          audio.onerror = reject;
          audio.src = URL.createObjectURL(f);
        });

      const duration = await getDuration(file);

      const presign = await uploadsService.presign({
        filename: file.name,
        upload_type: "rjmasters",
        content_type: file.type || "audio/mpeg",
      });

      setUploadState({ progress: 0, status: "uploading", message: "Uploading to S3..." });
      await uploadsService.uploadToS3(presign.upload_url, file, (progress) => {
        setUploadState({ progress, status: "uploading", message: `Uploading... ${progress}%` });
      });

      setUploadState({ progress: 100, status: "processing", message: "Verifying upload..." });
      await uploadsService.complete(presign.file_key);

      const newRj = await rjService.create({
        rj_name: rjName,
        show_name: showName,
        duration,
        filename: presign.file_key.split("/").pop() ?? file.name,
        status,
      });

      onRjUploaded(newRj);
      setUploadState({ progress: 100, status: "complete" });
      setIsUploading(false);
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
      setShowProgress(false);
      setIsUploading(false);
    } finally {
      setRjName("");
      setShowName("");
      setStatus("Active");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-black text-white px-8 py-5 rounded-lg max-w-md w-full relative modal-shadow" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Upload New RJ Audio</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex flex-col gap-2">
            <label>RJ Name</label>
            <input
              type="text"
              value={rjName}
              onChange={(e) => setRjName(e.target.value)}
              required
              placeholder="Enter RJ name..."
              className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Show Name</label>
            <input
              type="text"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              required
              placeholder="Enter show name..."
              className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md h-10 bg-neutral-800 focus:outline-none px-3">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label>Audio File</label>
            <input ref={fileInputRef} className="hidden" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files![0])} required />
            <button
              type="button"
              className="rounded-md h-10 !mb-1 bg-neutral-800 focus:outline-none self-start px-4"
              onClick={() => fileInputRef.current!.click()}
            >
              Choose File
            </button>
            {file && (
              <div className="flex gap-4 overflow-hidden items-center">
                <FaMicrophone size={14} className="shrink-0 text-neutral-600" />
                <p className="text-sm truncate grow break-all line-clamp-1">{file.name}</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={isUploading} className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer">
            {isUploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>

      <UploadProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        fileName={file?.name || ""}
        progress={uploadState.progress}
        status={uploadState.status}
        errorMessage={uploadState.errorMessage}
        message={uploadState.message}
        estimatedTime={uploadState.estimatedTime}
        currentFile={uploadState.currentFile}
        totalFiles={uploadState.totalFiles}
        currentFileIndex={uploadState.currentFileIndex}
      />
    </div>
  );
}
