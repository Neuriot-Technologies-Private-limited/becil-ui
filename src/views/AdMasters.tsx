import UploadAdModal from "@components/UploadAdModal";
import "@styles/audioMedia.css";
import { formatDuration } from "@utils/utils";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaTimes } from "react-icons/fa";
import { type AdMaster } from "/src/types";
import { useOutletContext } from "react-router";

export default function AdMasters() {
  const user = { name: "Rohit", avatar: "https://randomuser.me/api/portraits/men/32.jpg" };
  const [modal, setModal] = useState(false);
  const [ads, setAds] = useState<AdMaster[]>([]);
  const { setActiveLink } = useOutletContext();

  useEffect(() => {
    setActiveLink("/admasters");
    const fetchAds = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/ads");
        setAds(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchAds();
  }, []);

  return (
    <>
      <main className="audioai-main">
        <header className="audioai-header">
          <div className="audioai-header-title">Ad Masters</div>
          <div className="audioai-header-user">
            <img src={user.avatar} alt="User" className="audioai-user-avatar" />
            <span>{user.name}</span>
          </div>
        </header>
        <div className="audioai-main-content">
          <div className="audioai-main-toolbar">
            <div className="audioai-search-box">
              <input type="text" placeholder="Search..." />
              <span className="audioai-search-icon">🔍</span>
            </div>
            <button className="audioai-btn audioai-btn-primary" onClick={() => setModal(true)}>
              + New Ad Master
            </button>
          </div>
          <div className="audioai-table-block">
            <div className="audioai-table-title">All Ad Masters</div>
            <table className="audioai-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Advertisement</th>
                  <th>Duration</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.brand}</td>
                    <td>{row.advertisement}</td>
                    <td>{formatDuration(row.duration)}</td>
                    <td>{row.upload_date.toString().slice(0, 10)}</td>
                    <td className={row.status === "Active" ? "audioai-status-active" : "audioai-status-inactive"}>{row.status}</td>
                    <td>
                      <FaMusic className="audioai-action-icon" title="Music" />
                      <FaCloudDownloadAlt className="audioai-action-icon" title="Download" />
                      <FaTimes className="audioai-action-icon" title="Delete" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="audioai-table-pagination">
              <span className="audioai-pagination-arrow">
                <FaAngleDoubleLeft />
              </span>
              <span className="audioai-pagination-arrow">
                <FaAngleLeft />
              </span>
              <span className="audioai-pagination-arrow">
                <FaAngleRight />
              </span>
              <span className="audioai-pagination-arrow">
                <FaAngleDoubleRight />
              </span>
            </div>
          </div>
        </div>
      </main>
      <UploadAdModal isOpen={modal} onClose={() => setModal(false)} onAdUploaded={(newAd) => setAds([...ads, newAd])} />
    </>
  );
}
