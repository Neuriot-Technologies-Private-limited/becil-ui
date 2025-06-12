import React, { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import "@styles/UploadAdModal.css"; // CSS for modal styling
import { getLastSegment } from "@utils/utils";

export default function UploadBroadcastModal({ isOpen, onClose, onBroadcastUploaded }) {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [radioStation, setRadioStation] = useState("");
  const [recordingName, setRecordingName] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return alert("Please select an audio file");
    if (!radioStation || !recordingName) {
      return alert("Please fill in all required fields");
    }

    setIsUploading(true);

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

      // Step 1: Upload the file to S3 via FastAPI
      const formData = new FormData();
      formData.append("file", file);

      const fileRes = await fetch(`${apiUrl}/broadcasts/upload-audio`, {
        method: "POST",
        body: formData,
      });

      if (!fileRes.ok) {
        const errorText = await fileRes.text();
        console.error("Audio upload failed:", errorText);
        throw new Error("Audio upload failed");
      }

      const { url } = await fileRes.json();

      // Step 2: Submit metadata to FastAPI
      const adRes = await fetch(`${apiUrl}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radio_station: radioStation,
          broadcast_recording: recordingName,
          filename: getLastSegment(url),
          duration: duration,
          status: "Pending",
        }),
      });

      if (!adRes.ok) {
        const errorText = await adRes.text();
        console.error("Metadata upload failed:", errorText);
        throw new Error("Failed to upload broadcast metadata");
      }

      const newAd = await adRes.json();
      onBroadcastUploaded(newAd);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    } finally {
      setIsUploading(false);
    }
  };
  if (!isOpen) return null;


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FaXmark />
        </button>
        <h2>Upload New Broadcast</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Radio Station:
            <input type="text" value={radioStation} onChange={(e) => setRadioStation(e.target.value)} required />
          </label>

          <label>
            Recording name:
            <input type="text" value={recordingName} onChange={(e) => setRecordingName(e.target.value)} required />
          </label>

          <label>
            Audio File:
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} required />
          </label>

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
