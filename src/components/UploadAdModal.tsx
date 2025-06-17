import React, { useState } from 'react';
import '@styles/UploadAdModal.css'; // CSS for modal styling
import { FaXmark } from 'react-icons/fa6';
import { getLastSegment } from '@utils/utils';

const UploadAdModal = ({ isOpen, onClose, onAdUploaded }) => {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [brand, setBrand] = useState('');
  const [advertisement, setAdvertisement] = useState('');
  const [status, setStatus] = useState('Active');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an audio file");

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
      formData.append('file', file);

      const fileRes = await fetch(`${apiUrl}/ads/upload-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!fileRes.ok) {
        const errorText = await fileRes.text();
        console.error("Audio upload failed:", errorText);
        throw new Error("Audio upload failed");
      }

      const { url } = await fileRes.json();

      // Step 2: Submit ad metadata to FastAPI
      const adRes = await fetch(`${apiUrl}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          advertisement,
          duration: duration,
          filename: getLastSegment(url),
          status,
        }),
      });
      console.log(getLastSegment(url))

      if (!adRes.ok) {
        const errorText = await adRes.text();
        console.error("Metadata upload failed:", errorText);
        throw new Error("Failed to upload ad metadata");
      }

      const newAd = await adRes.json();
      onAdUploaded(newAd);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    } finally {
      setIsUploading(false);
      setBrand("")
      setAdvertisement("")
      setStatus("Active")
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FaXmark />
        </button>
        <h2>Upload New Ad</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Brand:
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </label>

    <label>
            Advertisement:
            <input
              type="text"
              value={advertisement}
              onChange={(e) => setAdvertisement(e.target.value)}
              required
            />
          </label>


          <label>
            Status:
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label>
            Audio File:
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </label>

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadAdModal;
