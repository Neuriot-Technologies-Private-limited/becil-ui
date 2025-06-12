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
            </div>
            <button className="audioai-btn audioai-btn-primary" onClick={() => setModal(true)}>
              + New Ad Master
            </button>
          </div>
          <div className="text-xl font-bold text-white !mb-4">All Ad Masters</div>
          <div className="w-full flex flex-col">
            <div className="bg-neutral-700 h-16 text-neutral-200 flex items-center px-4 font-bold">
              <div className="w-[15%]">Brand</div>
              <div className="w-[35%]">Advertisement</div>
              <div className="w-[15%] text-center">Duration</div>
              <div className="w-[10%] text-center">Upload Date</div>
              <div className="w-[15%] text-center">Status</div>
              <div className="w-[10%]"></div>
            </div>
            <div className="flex flex-col bg-white">
              {ads.map((row, idx) => (
                <div key={idx} className="p-4 flex items-center odd:bg-gray-100">
                  <div className="w-[15%]">{row.brand}</div>
                  <div className="w-[35%]">{row.advertisement}</div>
                  <div className="w-[15%] text-center">{formatDuration(row.duration)}</div>
                  <div className="w-[10%] text-center">{row.upload_date.toString().slice(0, 10)}</div>
                  <div className={"w-[15%] text-center" + (row.status === "Active" ? " text-green-600" : " text-red-600")}>{row.status}</div>
                  <div className="w-[10%] flex gap-2 justify-end">
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-gray-400"
                      title="Play"
                    >
                      <FaMusic />
                    </button>
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-gray-400"
                      title="Download"
                    >
                      <FaCloudDownloadAlt/>
                    </button>
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-gray-400"
                      title="Status"
                    >
                      <FaTimes/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      </main>
      <UploadAdModal isOpen={modal} onClose={() => setModal(false)} onAdUploaded={(newAd) => setAds([...ads, newAd])} />
    </>
  );
}
