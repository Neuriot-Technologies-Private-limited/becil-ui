import { useState, useEffect } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaRegFileAlt, FaTimes } from "react-icons/fa";
import { LuBrainCircuit } from "react-icons/lu";
import { PiWaveform } from "react-icons/pi";
import Waveform from "@components/Waveform";
import { type Broadcast } from "/src/types";
import { formatDuration } from "@utils/utils";
import "@styles/audioMedia.css";
import { useOutletContext } from "react-router";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const user = { name: "Rohit", avatar: "https://randomuser.me/api/pordivaits/men/32.jpg" };
  const { setActiveLink } = useOutletContext();
  const [openWaveform, setOpenWaveform] = useState<string>("");

  useEffect(() => {
    setActiveLink("/broadcasts");
    async function fetchBroadcasts() {
      try {
        const response = await fetch("http://localhost:8000/api/broadcasts");
        if (!response.ok) {
          throw new Error("Failed to fetch broadcasts");
        }
        const data = await response.json();
        setBroadcasts(data);
      } catch (error) {
        console.error("Error fetching broadcasts:", error);
      }
    }

    fetchBroadcasts();
  }, [setActiveLink]);

  return (
    <main className="audioai-main">
      <header className="audioai-header">
        <div className="audioai-header-title">Broadcasts</div>
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
          <button className="audioai-btn audioai-btn-primary">+ New Broadcast</button>
        </div>
        <div className="audioai-table-block">
          <div className="audioai-table-title">All Broadcasts</div>
          <div className="audioai-table">
            <div className="flex justify-between bg-neutral-700 text-white p-4">
              <div className="w-[20%] text-center">Radio Station</div>
              <div className="w-[20%] text-center">Broadcast Recording</div>
              <div className="w-[10%] text-center">Duration</div>
              <div className="w-[20%] text-center">Broadcast Date</div>
              <div className="w-[10%] text-center">Status</div>
              <div className="w-[20%] text-center">Actions</div>
            </div>
            {broadcasts.map((row, idx) => (
              <>
                <div key={idx} className="flex p-4">
                  <div className="w-[20%]">{row.radio_station}</div>
                  <div className="w-[20%] whitespace-nowrap">
                    <p className="overflow-ellipsis">{row.broadcast_recording}</p>
                  </div>
                  <div className="w-[10%] text-center">{formatDuration(row.duration)}</div>
                  <div className="w-[20%] text-center">{row.broadcast_date.toString().slice(0, 10)}</div>
                  <div className={(row.status === "Processed" ? "audioai-status-active" : "audioai-status-inactive") + " w-[10%]"}>{row.status}</div>
                  <div className="w-[20%] flex justify-around">
                    <FaMusic className="audioai-action-icon" title="Music" />
                    <PiWaveform className="audioai-action-icon" title="Waveform" />
                    <LuBrainCircuit className="audioai-action-icon" title="Waveform" onClick={() => handleWaveformClick(row.status)}/>
                    <FaCloudDownloadAlt className="audioai-action-icon" title="Download" />
                    <FaRegFileAlt className="audioai-action-icon" title="Report" />
                    <FaTimes className="audioai-action-icon" title="Delete" />
                  </div>
                </div>
                <div>
                  <Waveform hidden={openWaveform == row.id ? true : false} />
                </div>
              </>
            ))}
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
      </div>
      <Waveform />
    </main>
  );
}
