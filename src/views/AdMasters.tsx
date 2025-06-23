import UploadAdModal from "@components/UploadAdModal";
import "@styles/audioMedia.css";
import { formatDuration } from "@utils/utils";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaSearch, FaTimes } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useOutletContext } from "react-router";
import MusicControls from "@components/MusicControls";
import { FaCheck, FaPlay, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdMaster, CurDurationType } from "src/types";

export default function AdMasters() {
  const [modal, setModal] = useState(false);
  const [playingAdId, setPlayingAdId] = useState(-1);
  const [curDuration, setCurDuration] = useState<CurDurationType>({ duration: 0, source: "controls" });
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<AdMaster>();
  const [ads, setAds] = useState<AdMaster[]>([]);
  const [buttonLoading, setButtonLoading] = useState({
    id: -1,
    type: "Music",
  });

  const apiUrl = import.meta.env["VITE_API_URL"];
  const { setActiveLink } = useOutletContext<{ setActiveLink: (arg0: number) => null }>();

  useEffect(() => {
    setActiveLink(1);
    const fetchAds = async () => {
      try {
        const response = await axios.get(`${apiUrl}/ads`);
        setAds(response.data);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchAds();
  }, []);

  async function handleMusic(ad: AdMaster) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: ad.id, type: "Music" });
      const res = await fetch(`${apiUrl}/audio/ads/${ad.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      setSrc(audioUrl);
      setMetadata(ad);
      setPlayingAdId(ad.id);
    } catch (err) {
      console.error("Error fetching audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleDownload(ad: AdMaster) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: ad.id, type: "Download" });
      const res = await fetch(`${apiUrl}/audio/ads/${ad.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = ad.filename; // You can customize the download name here
      a.click();

      URL.revokeObjectURL(url); // Clean up the object URL
    } catch (err) {
      console.error("Error downloading audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleStatusUpdate(id: number, status: "Active" | "Inactive") {
    const newStatus = status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch(`${apiUrl}/ads/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update status:", errorText);
        throw new Error("Status update failed");
      }

      const updatedAd = await res.json();
      setAds((prev: AdMaster[]) => prev.map((item: AdMaster) => (item.id === updatedAd.id ? updatedAd : item)));
      console.log("Status updated successfully:", updatedAd);
    } catch (err) {
      console.error("Error in statusUpdate:", err);
      throw err;
    }
  }

  return (
    <>
      <main className="audioai-main">
        <header className="flex px-12 items-end justify-between h-20">
          <div className="uppercase font-light text-3xl text-white tracking-widest">Ad Masters</div>
          <div className="audioai-header-user">
            <img src="/man.jpg" alt="User" className="w-8 h-8 overflow-hidden rounded-full" />
            <span className="text-neutral-400">Rohit</span>
          </div>
        </header>
        <div className="flex p-12 pb-30 flex-col">
          <div className="flex justify-between !mb-8">
            <div className="flex items-center gap-4 w-[300px]">
              <FaSearch className="text-neutral-400" size={16} />
              <input type="text" placeholder="Search Ads" className="h-10 bg-neutral-700 grow text-white px-4 rounded-md focus:outline-none" />
            </div>
            <button className="flex gap-2 items-center cursor-pointer h-10 bg-neutral-300 rounded-md px-4" onClick={() => setModal(true)}>
              <FaPlus />
              New Ad Master
            </button>
          </div>
          <div className="p-4 bg-neutral-800 rounded-xl">
            <h2 className="text-xl font-bold text-white !mb-4 relative">All Ad Masters</h2>
            <div className="w-full flex flex-col max-h-[80vh] overflow-auto scroll-table bg-[var(--bg-color)] sticky top-0">
              <div className="rounded-xl overflow-hidden border-orange-300 border min-h-16 text-neutral-200 flex items-center font-bold z-10">
                <div className="w-[15%] pl-4">Brand</div>
                <div className="w-[35%]">Advertisement</div>
                <div className="w-[15%] text-center">Duration</div>
                <div className="w-[10%] text-center">Upload Date</div>
                <div className="w-[15%] text-center">Status</div>
                <div className="w-[10%]"></div>
              </div>
              <div className="flex flex-col text-white">
                {ads.map((row, idx) => (
                  <div key={idx} className={"flex items-center py-4 " + (playingAdId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")}>
                    <div className="w-[15%] pl-4">{row.brand}</div>
                    <div className="w-[35%]">{row.advertisement}</div>
                    <div className="w-[15%] text-center">{formatDuration(row.duration)}</div>
                    <div className="w-[10%] text-center">{row.upload_date.toString().slice(0, 10)}</div>
                    <div className={"w-[15%] text-center" + (row.status === "Active" ? " text-green-600" : " text-red-500")}>{row.status}</div>
                    <div className="w-[10%] flex gap-2 justify-end pr-4">
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer shrink-0 disabled:cursor-default"
                        title="Play"
                        onClick={() => handleMusic(row)}
                        disabled={playingAdId === row.id}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Music" ? (
                          <PuffLoader color="white" size={15} />
                        ) : playingAdId === row.id ? (
                          <FaMusic />
                        ) : (
                          <FaPlay />
                        )}
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-gray-400 shrink-0 disabled:cursor-default"
                        title="Download"
                        onClick={() => handleDownload(row)}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Download" ? (
                          <PuffLoader color="white" size={12} />
                        ) : (
                          <FaCloudDownloadAlt size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-gray-400 shrink-0 disabled:cursor-default"
                        title="Status"
                        onClick={() => handleStatusUpdate(row.id, row.status)}
                      >
                        {row.status === "Active" ? <FaXmark size={16} /> : <FaCheck size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 hidden">
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
      <UploadAdModal isOpen={modal} onClose={() => setModal(false)} onAdUploaded={(newAd: AdMaster) => setAds([...ads, newAd])} />
      {src !== "" ? (
        <MusicControls
          audioSrc={src}
          title={metadata.advertisement}
          header={metadata.brand}
          duration={metadata.duration}
          curDurationProp={curDuration}
          setCurDuration={setCurDuration}
          setAudioSrc={setSrc}
          setPlayingAudioId={setPlayingAdId}
        />
      ) : null}
    </>
  );
}
