import { useState, useEffect } from "react";
import { GiDiamonds } from "react-icons/gi";
import UploadBroadcastModal from "@components/UploadBroadcastModal";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaRegFileAlt } from "react-icons/fa";
import { PiWaveformBold } from "react-icons/pi";
import Waveform from "@components/Waveform";
import { type Broadcast } from "/src/types";
import { formatDuration, formatSecondsToHHMMSS, generateAmplitudes } from "@utils/utils";
import "@styles/audioMedia.css";
import { useOutletContext } from "react-router";
// import { sampleBroadcasts } from "/src/data";
import type { AdDetectionResult } from "src/types";

export default function Broadcasts() {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [modal, setModal] = useState(false);
  const user = { name: "Rohit", avatar: "https://randomuser.me/api/pordivaits/men/32.jpg" };
  const { setActiveLink } = useOutletContext();
  const [openWaveform, setOpenWaveform] = useState(-1);
  const [waveformData, setWaveformData] = useState<AdDetectionResult[]>([]);
  const [disabledButtons, setDisabledButtons] = useState<number[]>([]);

  useEffect(() => {
    setActiveLink("/broadcasts");
    async function fetchBroadcasts() {
      try {
        const response = await fetch(`${apiUrl}/broadcasts`);
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

  async function handleWaveformClick(b_id: number) {
    if (openWaveform !== b_id) {
      setOpenWaveform(b_id);
      console.log(b_id);
      try {
        const res = await fetch(`${apiUrl}/broadcasts/${b_id}/detections`);
        const data = await res.json();

        setWaveformData(data);
        console.log(data);
      } catch (er) {
        console.log(er);
      }
    } else {
      setOpenWaveform(-1);
      setWaveformData([]);
    }
  }

  const handleProcessingStart = async (id: number, file_name: string) => {
    try {
      setDisabledButtons(prev => [...prev, id])
      const res = await fetch(`${apiUrl}/broadcasts/start-processing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file_name,
          broadcast_id: id,
        }),
      });
      const message: string = (await res.json()).message;
      if (res.status == 200) {
        setDisabledButtons(prev => prev.filter(i => i != id))
        const response = await fetch(`${apiUrl}/broadcasts`);
        if (!response.ok) {
          throw new Error("Failed to fetch broadcasts");
        }
        const data = await response.json();
        setBroadcasts(data);
      }
      console.log(message);
    } catch (e) {
      console.log(e);
    }
  };

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
          </div>
          <button className="audioai-btn audioai-btn-primary" onClick={() => setModal(true)}>
            + New Broadcast
          </button>
        </div>
        <div>
          <div className="text-xl font-bold text-white !mb-4">All Broadcasts</div>
          <div>
            <div className="bg-neutral-700 h-16 text-neutral-200 flex items-center px-4 font-bold">
              <div className="w-[15%]">Radio Station</div>
              <div className="w-[25%]">Broadcast Recording</div>
              <div className="w-[10%] text-center">Duration</div>
              <div className="w-[20%] text-center">Broadcast Date</div>
              <div className="w-[10%] text-center">Status</div>
              <div className="w-[20%] text-center"></div>
            </div>
            {broadcasts.map((row, idx) => (
              <div className="odd:bg-gray-100 bg-white" key={row.id}>
                <div key={idx} className="flex items-center p-4">
                  <div className="w-[15%]">{row.radio_station}</div>
                  <div className="w-[25%] whitespace-nowrap">
                    <p className="overflow-ellipsis">{row.broadcast_recording}</p>
                  </div>
                  <div className="w-[10%] text-center">{formatDuration(row.duration)}</div>
                  <div className="w-[20%] text-center">{row.broadcast_date.toString().slice(0, 10)}</div>
                  <div
                    className={
                      (row.status === "Processed" ? "text-green-600" : row.status === "Processing" ? "text-yellow-600" : "text-red-600") +
                      " w-[10%] flex justify-center"
                    }
                  >
                    {row.status}
                  </div>
                  <div className="w-[20%] flex justify-end gap-1">
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
                      title="Waveform"
                      onClick={() => handleWaveformClick(row.id)}
                      disabled={row.status !== "Processed"}
                    >
                      <PiWaveformBold />
                    </button>
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl disabled:text-gray-400 cursor-pointer"
                      onClick={() => handleProcessingStart(row.id, row.filename)}
                      disabled={row.status === "Processed" || row.status === "Processing" || disabledButtons.findIndex(i => i === row.id) != -1}
                      title="Process Audio"
                    >
                      <GiDiamonds />
                    </button>
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl disabled:text-gray-400 cursor-pointer"
                      title="Download"
                    >
                      <FaCloudDownloadAlt />
                    </button>
                    <button
                      type="button"
                      className="p-2 disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl disabled:text-gray-400 cursor-pointer"
                      title="View Report"
                    >
                      <FaRegFileAlt />
                    </button>
                  </div>
                </div>
                {openWaveform === row.id && (
                  <div className="bg-white flex space-between items-center px-4">
                    <div className="flex flex-col border-r-2 border-gray-300 mx-2 w-1/5">
                      <div className="font-bold uppercase">Ad instances</div>
                      <div className="border-b-2 border-gray-300 pb-2 !mb-2">{waveformData.length}</div>
                      <div className="font-bold uppercase">Total Ad duration</div>
                      <div>{formatSecondsToHHMMSS(Math.floor(waveformData.reduce((sum, ad) => sum + ad.duration_seconds, 0)))}</div>
                    </div>

                    <Waveform duration={row.duration} amplitudes={generateAmplitudes(row.broadcast_recording)} regions={waveformData} />
                  </div>
                )}
              </div>
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
      <UploadBroadcastModal isOpen={modal} onClose={() => setModal(false)} onBroadcastUploaded={(newB) => setBroadcasts((prev) => [...prev, newB])} />
    </main>
  );
}
