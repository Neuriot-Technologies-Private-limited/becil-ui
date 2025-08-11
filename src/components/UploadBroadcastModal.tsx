import { useRef, useState } from "react";
import { FaMusic, FaXmark } from "react-icons/fa6";
import { getLastSegment } from "@utils/utils";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import UploadProgressModal from "./UploadProgressModal";

interface UploadBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastUploaded: (broadcast: any) => void;
}

export default function UploadBroadcastModal({ isOpen, onClose, onBroadcastUploaded }: UploadBroadcastModalProps) {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [radioStation, setRadioStation] = useState("");
  const [recordingName, setRecordingName] = useState("");
  const [city, setCity] = useState("")
  const [language, setLanguage] = useState("")
  const [file, setFile] = useState<File | null>();
  const [showProgress, setShowProgress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { uploadState, uploadWithProgress, setProcessing, resetUpload, setUploadState } = useUploadProgress();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({
    advertisement: null,
    brand: null,
    category: null,
    city: null,
    language: null,
    radioStation: null,
  });


  const onTextareaResize = () => {
    for (const el of Object.values(textareaRefs.current)) {
      if (!el) return;
      const lineHeight = parseInt(getComputedStyle(el).lineHeight || "15", 10);
      const maxLines = 5;
      const maxHeight = lineHeight * maxLines;

      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return alert("Please select an audio file");
    if (!radioStation || !recordingName) {
      return alert("Please fill in all required fields");
    }

    setShowProgress(true);
    setIsUploading(true);
    resetUpload();

    try {
      // Get audio duration using HTMLAudioElement
      const getDuration = (file) => {
        return new Promise((resolve, reject) => {
          const audio = document.createElement("audio");
          audio.preload = "metadata";
          audio.onloadedmetadata = () => {
            resolve(Math.floor(audio.duration));
          };
          audio.onerror = reject;
          audio.src = URL.createObjectURL(file);
        });
      };

      const duration = await getDuration(file);

      // Step 1: Upload the file to S3 via FastAPI with progress
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadWithProgress(`${apiUrl}/broadcasts/upload-audio`, formData, {
        onSuccess: (data) => {
          setProcessing();
        },
        onError: (error) => {
          console.error("Audio upload failed:", error);
          setShowProgress(false);
          setIsUploading(false);
        },
        onProgress: (progress, message) => {
          console.log(`Progress: ${progress}% - ${message}`);
        },
        timeout: 180000 // 3 minutes timeout
      });
      
      const { url } = uploadResult;

      // Step 2: Submit broadcast metadata to FastAPI
      const broadcastRes = await fetch(`${apiUrl}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radio_station: radioStation,
          broadcast_recording: recordingName,
          filename: getLastSegment(url),
          duration: duration,
          city,
          language,
          status: "Pending",
        }),
      });

      if (!broadcastRes.ok) {
        const errorText = await broadcastRes.text();
        console.error("Metadata upload failed:", errorText);
        throw new Error("Failed to upload broadcast metadata");
      }

      const newBroadcast = await broadcastRes.json();
      onBroadcastUploaded(newBroadcast);
      setUploadState({ progress: 100, status: "complete" });
      setIsUploading(false);
      // Modal will auto-close after 2 seconds via UploadProgressModal
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
      setShowProgress(false);
      setIsUploading(false);
    } finally {
      setRadioStation("");
      setRecordingName("");
      setCity("");
      setLanguage("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  onTextareaResize()

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-black text-white px-8 py-5 rounded-lg max-w-md w-full relative modal-shadow" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Upload New Broadcast</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex flex-col gap-2">
            <label>Radio Station</label>
            <textarea
              value={radioStation}
              onChange={(e) => {
                setRadioStation(e.target.value)
              }}
              required
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Recording name</label>
            <textarea
              value={recordingName}
              onChange={(e) => {
                setRecordingName(e.target.value)
              }}
              required
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>City</label>
            <textarea
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
              }}
              required
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Language</label>
            <textarea
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
              }}
              required
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Audio File:</label>
            <input type="file" accept="audio/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files![0])} required className="hidden" />
            <button
              type="button"
              className="rounded-md h-10 !mb-1 bg-neutral-800 focus:outline-none self-start px-4"
              onClick={() => fileInputRef.current!.click()}
            >
              Choose File
            </button>
            {file && (
              <div className="flex gap-4 overflow-hidden items-center">
                <FaMusic size={14} className="shrink-0 text-neutral-600" />
                <p className="text-sm truncate grow break-all line-clamp-1">{file.name}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer"
          >
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
