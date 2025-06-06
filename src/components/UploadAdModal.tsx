import React, { useState } from 'react';
import '@styles/UploadAdModal.css'; // CSS for modal styling

const UploadAdModal = ({ isOpen, onClose, onAdUploaded }) => {
  const [brand, setBrand] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('active');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an audio file");

    setIsUploading(true);

    try {
      // Step 1: Upload the file to S3 via FastAPI
      const formData = new FormData();
      formData.append('file', file);

      const fileRes = await fetch('/ads/upload-audio', {
        method: 'POST',
        body: formData,
      });

      const { url } = await fileRes.json();

      // Step 2: Submit ad metadata to FastAPI
      const adRes = await fetch('/ads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          advertisement: url,
          duration: parseInt(duration),
          status,
        }),
      });

      if (!adRes.ok) throw new Error("Failed to upload ad metadata");

      const newAd = await adRes.json();
      onAdUploaded(newAd);
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
        <button className="close-btn" onClick={onClose}>ž</button>
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
            Duration (seconds):
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </label>

          <label>
            Status:
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
