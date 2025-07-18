import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { FaPlay } from "react-icons/fa";
import MusicControls from "@components/MusicControls";
import { GiDiamonds } from "react-icons/gi";
import UploadBroadcastModal from "@components/UploadBroadcastModal";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaChevronDown,
  FaChevronUp,
  FaCloudDownloadAlt,
  FaFilter,
  FaMusic,
  FaRegFileAlt,
  FaSearch,
} from "react-icons/fa";
import { PiWaveformBold } from "react-icons/pi";
import WaveformModal from "@components/WaveformModal";
import { formatDuration, getLastSegment } from "@utils/utils";
import "@styles/audioMedia.css";
import { useOutletContext } from "react-router";
import type { CurDurationType, AdDetectionResult, Broadcast } from "@/types";
import { PuffLoader } from "react-spinners";
import { FaPlus } from "react-icons/fa6";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@components/ui/select";
import { Input } from "@components/ui/input";
import CustomToast from "@components/CustomToast";

type SortKey = keyof Broadcast;
type BroadcastStatus = "Processed" | "Processing" | "Pending";

export default function Broadcasts() {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<Broadcast>();
  const [playingBroadcastId, setPlayingBroadcastId] = useState(-1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [curDuration, setCurDuration] = useState<CurDurationType>({ duration: 0, source: "controls" });
  const { setActiveLink } = useOutletContext<{ setActiveLink: (arg0: number) => null }>();
  const [waveformModalOpen, setWaveformModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [waveformData, setWaveformData] = useState<{ broadcast_id: number; data: AdDetectionResult[] }>({ broadcast_id: -1, data: [] });
  const [buttonLoading, setButtonLoading] = useState({
    id: -1,
    type: "Music",
  });
  const [disabledButtons, setDisabledButtons] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({
    key: "broadcast_date",
    direction: "descending",
  });
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus | "all">("all");
  const [stationSearch, setStationSearch] = useState("");
  const [recordingSearch, setRecordingSearch] = useState("");

  const toastRef = useRef(null);

  const filteredAndSortedBroadcasts = useMemo(() => {
    let sortableItems = [...broadcasts];
    if (statusFilter && statusFilter !== "all") {
      sortableItems = sortableItems.filter((broadcast) => broadcast.status === statusFilter);
    }
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [broadcasts, sortConfig, statusFilter]);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const startUpload = async (file: File = null, duration: number, radioStation: string, recordingName: string) => {
    const controller = new AbortController();

    try {
      // Upload the file to S3 via FastAPI
      setIsUploading(true);
      toast.custom(
        (t) => {
          toastRef.current = t;
          return <CustomToast status="Processing upload..." data={recordingName} />;
        },
        {
          duration: Infinity,
        }
      );

      const formData = new FormData();
      formData.append("file", file);

      const fileRes = await axios.post(`${apiUrl}/broadcasts/upload-audio`, formData, {
        signal: controller.signal,
      });
      toast.dismiss(toastRef.current);

      const { url } = fileRes.data;

      // Submit metadata to FastAPI
      const adRes = await axios.post(
        `${apiUrl}/broadcasts`,
        {
          radio_station: radioStation,
          broadcast_recording: recordingName,
          filename: decodeURIComponent(getLastSegment(url)!),
          duration: duration,
          status: "Pending",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const newAd = adRes.data;
      setBroadcasts((prev) => [newAd, ...prev]);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Upload cancelled");
      } else {
        console.error(err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    setActiveLink(3);
    const fetchBroadcasts = async () => {
      try {
        const params = new URLSearchParams();
        if (stationSearch) params.append("radio_station", stationSearch);
        if (recordingSearch) params.append("broadcast_recording", recordingSearch);
        const response = await fetch(`${apiUrl}/broadcasts?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch broadcasts");
        }
        const data = await response.json();
        setBroadcasts(data);
      } catch (error) {
        console.error("Error fetching broadcasts:", error);
      }
    };

    const handler = setTimeout(() => {
      fetchBroadcasts();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [stationSearch, recordingSearch, apiUrl, setActiveLink]);

  useEffect(() => {
    const closeAlert = (event) => {
      if (isUploading) {
        const message = "Are you sure you want to leave? Your changes may not be saved.";
        event.returnValue = message; // Standard for older browsers
        return message; // Standard for modern browsers
      }
    };
    window.addEventListener("beforeunload", closeAlert);

    return () => {
      window.removeEventListener("beforeunload", closeAlert);
    };
  }, [isUploading]);

  async function handleWaveformClick(broadcast: Broadcast) {
    setSelectedBroadcast(broadcast);
    try {
      const res = await fetch(`${apiUrl}/broadcasts/${broadcast.id}/detections`);
      const data = await res.json();
      setWaveformData({ broadcast_id: broadcast.id, data });
      setWaveformModalOpen(true);
    } catch (er) {
      console.log(er);
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
      setPlayingBroadcastId(brd.id);
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
      a.download = brd.filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleProcessingStart(id: number) {
    try {
      setDisabledButtons((prev) => [...prev, id]);
      const res = await fetch(`${apiUrl}/broadcasts/start-processing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broadcast_id: id,
        }),
      });
      if (res.status == 200) {
        setDisabledButtons((prev) => prev.filter((i) => i != id));
        const response = await fetch(`${apiUrl}/broadcasts`);
        if (!response.ok) {
          throw new Error("Failed to fetch broadcasts");
        }
        const data = await response.json();
        setBroadcasts(data);
      }
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
      a.download = `Report_${broadcast.broadcast_recording}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Report" });
    }
  }

  const SortableHeader = ({ sortKey, children, className }: { sortKey: SortKey; children: React.ReactNode; className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" onClick={() => requestSort(sortKey)} className="flex items-center gap-2">
        {children}
        {sortConfig.key === sortKey && (sortConfig.direction === "ascending" ? <FaChevronUp /> : <FaChevronDown />)}
      </button>
    </div>
  );

  return (
    <main className="audioai-main">
      <header className="flex px-12 items-end justify-between h-20">
        <div className="uppercase font-light text-3xl text-white tracking-widest">Broadcasts</div>
        <div className="audioai-header-user">
          <img src="/man.jpg" alt="User" className="w-8 h-8 overflow-hidden rounded-full" />
          <span className="text-neutral-400">Rohit</span>
        </div>
      </header>

      <div className="flex p-12 pb-30 flex-col">
        <div className="flex justify-between !mb-8">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <FaSearch className="text-neutral-400" size={16} />
              <Input type="text" placeholder="Search by Station" className="dark" value={stationSearch} onChange={(e) => setStationSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FaSearch className="text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder="Search by Recording"
                className="dark"
                value={recordingSearch}
                onChange={(e) => setRecordingSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="flex gap-2 items-center cursor-pointer h-10 bg-neutral-300 rounded-md px-4 font-semibold" onClick={() => setUploadModalOpen(true)}>
            <FaPlus />
            New Broadcast
          </button>
        </div>
        <div className="p-4 bg-neutral-800 rounded-xl">
          <div className="flex justify-between items-center !mb-4">
            <h2 className="text-xl font-bold text-white">All Broadcasts</h2>
            <p className="text-neutral-400 text-sm">
              {filteredAndSortedBroadcasts.length} result{filteredAndSortedBroadcasts.length === 1 ? "" : "s"}
            </p>
          </div>
          {broadcasts.length ? (
            <div className="w-full flex flex-col max-h-[80vh] overflow-auto scroll-table rounded-xl">
              <div className="rounded-xl border-orange-300 border min-h-16 text-neutral-200 flex items-center font-bold bg-[var(--bg-color)] sticky top-0 z-30">
                <div className="w-[15%] pl-4">
                  <SortableHeader sortKey="radio_station">Radio Station</SortableHeader>
                </div>
                <div className="w-[25%]">
                  <SortableHeader sortKey="broadcast_recording">Broadcast Recording</SortableHeader>
                </div>
                <div className="w-[10%]">
                  <SortableHeader sortKey="duration" className="justify-center">
                    Duration
                  </SortableHeader>
                </div>
                <div className="w-[20%]">
                  <SortableHeader sortKey="broadcast_date" className="justify-center">
                    Broadcast Date
                  </SortableHeader>
                </div>
                <div className="w-[10%] flex justify-center">
                  <Select onValueChange={(value: BroadcastStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                    <SelectTrigger className="w-fit bg-transparent border-none">
                      <p className="chevron-brother">Status</p>
                    </SelectTrigger>
                    <SelectContent className="dark">
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Processed">Processed</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[20%] text-center"></div>
              </div>
              <div className="flex flex-col text-white">
                {filteredAndSortedBroadcasts.map((row) => (
                  <div className="odd:bg-neutral-800 bg-neutral-900" key={row.id}>
                    <div className={"flex items-center py-4 " + (playingBroadcastId === row.id ? "music-bg" : "")}>
                      <div className="w-[15%] pl-4 flex items-center gap-4">{row.radio_station}</div>
                      <div className="w-[25%] whitespace-nowrap">
                        <p className="overflow-ellipsis">{row.broadcast_recording}</p>
                      </div>
                      <div className="w-[10%] text-center">{formatDuration(row.duration)}</div>
                      <div className="w-[20%] text-center">{new Date(row.broadcast_date).toISOString().slice(0, 10)}</div>
                      <div
                        className={
                          (row.status === "Processed" ? "text-green-300" : row.status === "Processing" ? "text-yellow-200" : "text-red-300") +
                          " w-[10%] flex justify-center"
                        }
                      >
                        {row.status}
                      </div>
                      <div className="w-[20%] flex justify-end gap-1 pr-4">
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer shrink-0 disabled:cursor-default"
                          title="Play"
                          onClick={() => handleMusic(row)}
                          disabled={playingBroadcastId === row.id}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Music" ? (
                            <PuffLoader color="white" size={15} />
                          ) : playingBroadcastId === row.id ? (
                            <FaMusic />
                          ) : (
                            <FaPlay size={10} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title="Waveform"
                          onClick={() => handleWaveformClick(row)}
                          disabled={row.status !== "Processed"}
                        >
                          <PiWaveformBold size={14} />
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          onClick={() => handleProcessingStart(row.id)}
                          disabled={row.status === "Processing" || disabledButtons.findIndex((i) => i === row.id) != -1}
                          title="Process Audio"
                        >
                          <GiDiamonds size={14} />
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title="Download"
                          onClick={() => handleDownload(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Download" ? (
                            <PuffLoader color="white" size={15} />
                          ) : (
                            <FaCloudDownloadAlt size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title="View Report"
                          disabled={row.status !== "Processed"}
                          onClick={() => handleReport(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Report" ? <PuffLoader color="white" size={15} /> : <FaRegFileAlt size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SkeletonTheme baseColor={"#555555"} highlightColor={"#CCCCCC"}>
              <Skeleton count={10} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          )}
        </div>
      </div>
      <UploadBroadcastModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} startUpload={startUpload} />
      {selectedBroadcast && (
        <WaveformModal
          isOpen={waveformModalOpen}
          onClose={() => {
            setWaveformData({ broadcast_id: -1, data: [] });
            setWaveformModalOpen(false);
          }}
          broadcast={selectedBroadcast}
          waveformData={waveformData}
          playingBroadcastId={playingBroadcastId}
          curDuration={curDuration}
          setCurDuration={setCurDuration}
        />
      )}
      {src !== "" && metadata && (
        <MusicControls
          audioSrc={src}
          setAudioSrc={setSrc}
          setPlayingAudioId={setPlayingBroadcastId}
          title={metadata.broadcast_recording}
          header={metadata.radio_station}
          duration={metadata.duration}
          curDurationProp={curDuration}
          setCurDuration={setCurDuration}
        />
      )}
    </main>
  );
}