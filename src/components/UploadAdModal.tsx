import { useState, useRef, type RefObject } from "react";
import { FaMusic, FaXmark } from "react-icons/fa6";
import { getLastSegment } from "@utils/utils";
import { DatePicker } from "./DatePicker";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import UploadProgressModal from "./UploadProgressModal";

interface UploadAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdUploaded: (ad: any) => void;
}

const UploadAdModal = ({ isOpen, onClose, onAdUploaded }: UploadAdModalProps) => {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [brand, setBrand] = useState("");
  const [advertisement, setAdvertisement] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [radioStation, setRadioStation] = useState("");
  const [creationDate, setCreationDate] = useState(new Date());
  const [status, setStatus] = useState("Active");
  const [file, setFile] = useState<File>();
  const [showProgress, setShowProgress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { uploadState, uploadWithProgress, setProcessing, resetUpload, setUploadState } = useUploadProgress();

  const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({
    advertisement: null,
    brand: null,
    category: null,
    city: null,
    language: null,
    radioStation: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            resolve(Math.floor(audio.duration)); // round down to seconds
          };
          audio.onerror = reject;
          audio.src = URL.createObjectURL(file);
        });
      };

      const duration = await getDuration(file);

      // Step 1: Upload the file to S3 via FastAPI with progress
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadWithProgress(`${apiUrl}/ads/upload-audio`, formData, {
        onSuccess: (data) => {
          setProcessing();
        },
        onError: (error) => {
          console.error("Audio upload failed:", error);
          setShowProgress(false);
          setIsUploading(false);
        }
      });
      
      const { url } = uploadResult;

      // Step 2: Submit ad metadata to FastAPI
      const adRes = await fetch(`${apiUrl}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          advertisement,
          duration,
          filename: getLastSegment(url),
          status,
          city,
          language,
          category,
          radio_station: radioStation,
          creation_date: creationDate.toISOString().split("T")[0]
        }),
      });

      if (!adRes.ok) {
        const errorText = await adRes.text();
        console.error("Metadata upload failed:", errorText);
        throw new Error("Failed to upload ad metadata");
      }

      const newAd = await adRes.json();
      onAdUploaded(newAd);
      setUploadState({ progress: 100, status: "complete" });
      setIsUploading(false);
      // Modal will auto-close after 2 seconds via UploadProgressModal
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
      setShowProgress(false);
      setIsUploading(false);
    } finally {
      setBrand("");
      setAdvertisement("");
      setStatus("Active");
    }
  };

  onTextareaResize()

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-black text-white px-8 py-5 rounded-lg w-[550px] relative modal-shadow" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Upload New Ad</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex gap-8">
            <div className="flex flex-col gap-4 basis-1/2">
              <div className="flex flex-col gap-2">
                <label>Brand</label>
                <textarea
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.brand = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>Advertisement</label>
                <textarea
                  value={advertisement}
                  onChange={(e) => {
                    setAdvertisement(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.advertisement = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>Category</label>
                <textarea
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.category = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
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
                    <FaMusic size={14} className="shrink-0 text-neutral-600" />
                    <p className="text-sm truncate grow break-all line-clamp-1">{file.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 basis-1/2">
              <div className="flex flex-col gap-2">
                <label>City</label>
                <textarea
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.city = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>Language</label>
                <textarea
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.language = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>Radio Station</label>
                <textarea
                  value={radioStation}
                  onChange={(e) => {
                    setRadioStation(e.target.value);
                  }}
                  required
                  ref={(el) => {
                    if (textareaRefs) {
                      textareaRefs.current.radioStation = el;
                    }
                  }}
                  className="pt-2 resize-none rounded-md bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>Date created</label>
                <DatePicker date={creationDate} setDate={setCreationDate} />
              </div>
            </div>
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
      />
    </div>
  );
};

export default UploadAdModal;
