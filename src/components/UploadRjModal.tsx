import { useState, useRef } from "react";
import { FaMicrophone, FaXmark } from "react-icons/fa6";
import { getApiUrl } from "@/env";
import type { RjClip } from "@/types";

interface UploadRjModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRjUploaded: (rj: RjClip) => void;
}

export default function UploadRjModal({ isOpen, onClose, onRjUploaded }: UploadRjModalProps) {
  const [rjName, setRjName] = useState("");
  const [radioStation, setRadioStation] = useState("");
  const [status, setStatus] = useState("Active");
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Please select an audio file");

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Use XMLHttpRequest to track upload progress
      const newClip = await new Promise<RjClip>((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        if (rjName) form.append("rj_name", rjName);
        if (radioStation) form.append("radio_station", radioStation);
        form.append("status", status);

        const baseURL = getApiUrl();
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${baseURL}/rj-clips/upload-and-register`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText) as RjClip);
          } else {
            const detail = (() => {
              try { return JSON.parse(xhr.responseText)?.detail; } catch { return null; }
            })();
            reject(new Error(detail ?? `Server returned ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      });

      onRjUploaded(newClip);
      // Reset form
      setRjName("");
      setRadioStation("");
      setStatus("Active");
      setFile(undefined);
      setUploadProgress(0);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]"
      onClick={() => !isUploading && onClose()}
    >
      <div
        className="bg-black text-white px-8 py-5 rounded-lg max-w-md w-full relative modal-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 cursor-pointer disabled:opacity-50"
          onClick={onClose}
          disabled={isUploading}
          type="button"
        >
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Upload New RJ Clip</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          {/* RJ Name */}
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

          {/* Radio Station */}
          <div className="flex flex-col gap-2">
            <label>Radio Station</label>
            <input
              type="text"
              value={radioStation}
              onChange={(e) => setRadioStation(e.target.value)}
              placeholder="e.g. 93.5 Red FM"
              className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md h-10 bg-neutral-800 focus:outline-none px-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Audio File */}
          <div className="flex flex-col gap-2">
            <label>Audio File</label>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files![0])}
              required
            />
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

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Progress bar */}
          {isUploading && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer"
          >
            {isUploading ? `Uploading ${uploadProgress}%` : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
