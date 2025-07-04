import { useState, useRef } from "react";
import { FaMusic, FaXmark } from "react-icons/fa6";
import { getLastSegment } from "@utils/utils";

export default function UploadSongModal({ isOpen, onClose, onSongUploaded }){
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an audio file");

    setIsUploading(true);

    try {
      // Get audio duration using HTMLAudioElement
      return
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

      // Step 1: Upload the file to S3 via FastAPI
      const formData = new FormData();
      formData.append("file", file);

      const fileRes = await fetch(`${apiUrl}/songs/upload-audio`, {
        method: "POST",
        body: formData,
      });

      if (!fileRes.ok) {
        const errorText = await fileRes.text();
        console.error("Audio upload failed:", errorText);
        throw new Error("Audio upload failed");
      }

      const { url } = await fileRes.json();

      // Step 2: Submit song metadata to FastAPI
      const songRes = await fetch(`${apiUrl}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist,
          name,
          duration: duration,
          filename: getLastSegment(url),
          status,
        }),
      });
      console.log(getLastSegment(url));

      if (!songRes.ok) {
        const errorText = await songRes.text();
        console.error("Metadata upload failed:", errorText);
        throw new Error("Failed to upload song metadata");
      }

      const newSong = await songRes.json();
      onSongUploaded(newSong);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    } finally {
      setIsUploading(false);
      setArtist("");
      setName("");
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
        <h2 className="text-xl font-bold">Upload New Song</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex flex-col gap-2">
            <label>Artists</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
                <FaMusic size={14} className="shrink-0 text-neutral-600" />
                <p className="text-sm truncate grow break-all line-clamp-1">{file.name}</p>
              </div>
            )}
          </div>
          <button type="submit" disabled={isUploading} className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer">
            {isUploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};
