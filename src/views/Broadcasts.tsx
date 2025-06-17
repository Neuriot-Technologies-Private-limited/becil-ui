import { useState, useEffect } from "react";
import MusicControls from "@components/MusicControls";
import { GiDiamonds } from "react-icons/gi";
import UploadBroadcastModal from "@components/UploadBroadcastModal";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaRegFileAlt, FaSearch } from "react-icons/fa";
import { PiWaveformBold } from "react-icons/pi";
import Waveform from "@components/Waveform";
import { type Broadcast } from "/src/types";
import { formatDuration, formatSecondsToHHMMSS, generateAmplitudes } from "@utils/utils";
import "@styles/audioMedia.css";
import { useOutletContext } from "react-router";
// import { sampleBroadcasts } from "/src/data";
import type { AdDetectionResult } from "src/types";
import { PuffLoader } from "react-spinners";

export default function Broadcasts() {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<Broadcast>();
  const [modal, setModal] = useState(false);
  const { setActiveLink } = useOutletContext();
  const [openWaveform, setOpenWaveform] = useState(-1);
  const [waveformData, setWaveformData] = useState<AdDetectionResult[]>([]);
  const [buttonLoading, setButtonLoading] = useState({
    id: -1,
    type: "Music",
  });
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

  async function handleMusic(brd: Broadcast) {
    if (buttonLoading.id !== -1) {
      return;
    }

    try {
      setButtonLoading({ id: brd.id, type: "Music" });
      const res = await fetch(`${apiUrl}/audio/broadcasts/${brd.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      setSrc(audioUrl);
      setMetadata(brd);
    } catch (err) {
      console.error("Error fetching audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleDownload(brd: Broadcast) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: brd.id, type: "Download" });
      const res = await fetch(`${apiUrl}/audio/broadcasts/${brd.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = brd.filename; // You can customize the download name here
      a.click();

      URL.revokeObjectURL(url); // Clean up the object URL
    } catch (err) {
      console.error("Error downloading audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleProcessingStart(id: number, file_name: string) {
    try {
      setDisabledButtons((prev) => [...prev, id]);
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
        setDisabledButtons((prev) => prev.filter((i) => i != id));
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
  }

  async function handleReport(broadcast: Broadcast) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: broadcast.id, type: "Report" });
      const res = await fetch(`${apiUrl}/broadcasts/${broadcast.id}/report`);
      if (!res.ok) throw new Error("Failed to fetch report");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${broadcast.broadcast_recording}.xlsx`
      a.click();

      URL.revokeObjectURL(url); // Clean up the object URL
    } catch (err) {
      console.error("Error downloading report:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Report" });
    }
  }

  return (
    <main className="audioai-main">
      <header className="flex px-12 items-end justify-between h-20">
        <div className="uppercase font-light text-3xl text-white tracking-widest">Broadcasts</div>
        <div className="audioai-header-user">
          <img src="/man.png" alt="User" className="audioai-user-avatar" />
          <span>Rohit</span>
        </div>
      </header>
      <div className="audioai-main-content">
        <div className="flex justify-between !mb-8">
          <div className="flex items-center gap-4 w-1/4">
            <FaSearch className="text-neutral-400" size={16}/>
          <input type="text" placeholder="Search broadcasts" className="h-10 bg-neutral-700 text-white grow px-4 rounded-md focus:outline-none" />
          </div>
          <button className="h-10 bg-gray-200 rounded-md px-4 font-semibold" onClick={() => setModal(true)}>
            + New Broadcast
          </button>
        </div>
        <div>
          <div className="text-xl font-bold text-white !mb-4">All Broadcasts</div>
          <div className="w-full flex flex-col max-h-[80vh] overflow-auto">
            <div className="bg-neutral-700 min-h-16 text-neutral-200 flex items-center font-bold sticky top-0">
              <div className="w-[15%] pl-4">Radio Station</div>
              <div className="w-[25%]">Broadcast Recording</div>
              <div className="w-[10%] text-center">Duration</div>
              <div className="w-[20%] text-center">Broadcast Date</div>
              <div className="w-[10%] text-center">Status</div>
              <div className="w-[20%] text-center"></div>
            </div>
            <div className="flex flex-col bg-white">
              {broadcasts.map((row, idx) => (
                <div className="odd:bg-gray-100 bg-white" key={row.id}>
                  <div key={idx} className="flex items-center py-4">
                    <div className="w-[15%] pl-4">{row.radio_station}</div>
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
                    <div className="w-[20%] flex justify-end gap-1 pr-4">
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                        title="Play"
                        onClick={() => handleMusic(row)}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Music" ? <PuffLoader color="black" size={15} /> : <FaMusic />}
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                        title="Waveform"
                        onClick={() => handleWaveformClick(row.id)}
                        disabled={row.status !== "Processed"}
                      >
                        <PiWaveformBold />
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                        onClick={() => handleProcessingStart(row.id, row.filename)}
                        disabled={row.status === "Processed" || row.status === "Processing" || disabledButtons.findIndex((i) => i === row.id) != -1}
                        title="Process Audio"
                      >
                        <GiDiamonds />
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                        title="Download"
                        onClick={() => handleDownload(row)}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Download" ? <PuffLoader color="black" size={15} /> : <FaCloudDownloadAlt />}
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-200 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                        title="View Report"
                        disabled={row.status !== "Processed"}
                        onClick={() => handleReport(row)}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Report" ? <PuffLoader color="black" size={15} /> : <FaRegFileAlt />}
                      </button>
                    </div>
                  </div>
                  {openWaveform === row.id && (
                    <div className="bg-white flex justify-around items-center px-4">
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="text-center">
                          <div className="">Ad instances</div>
                          <div className="text-2xl font-bold">{waveformData.length}</div>
                        </div>
                        <div className="text-center">
                          <div className="">Total Ad duration</div>
                          <div className="text-2xl font-bold">
                            {formatSecondsToHHMMSS(Math.floor(waveformData.reduce((sum, ad) => sum + ad.duration_seconds, 0)))}
                          </div>
                        </div>
                      </div>

                      <Waveform duration={row.duration} amplitudes={generateAmplitudes(row.broadcast_recording)} regions={waveformData} />
                    </div>
                  )}
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
      </div>
      <UploadBroadcastModal
        isOpen={modal}
        onClose={() => setModal(false)}
        onBroadcastUploaded={(newB: Broadcast) => setBroadcasts((prev) => [...prev, newB])}
      />
      {src !== "" ? <MusicControls audioSrc={src} title={metadata.broadcast_recording} header={metadata.radio_station} duration={metadata.duration} /> : null}
    </main>
  );
}
