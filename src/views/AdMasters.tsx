import UploadAdModal from "@components/UploadAdModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "@styles/audioMedia.css";
import { formatDuration } from "@utils/utils";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaChevronUp, FaCloudDownloadAlt, FaMusic, FaSearch, FaTimes } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useOutletContext } from "react-router";
import MusicControls from "@components/MusicControls";
import { FaCheck, FaChevronDown, FaPlay, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdMaster, CurDurationType } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@components/ui/select";
import { Input } from "@components/ui/input";

type SortKey = keyof AdMaster;
type AdStatus = "Active" | "Inactive";

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
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({
    key: "upload_date",
    direction: "descending",
  });
  const [statusFilter, setStatusFilter] = useState<AdStatus | "all">("all");
  const [brandSearch, setBrandSearch] = useState("");
  const [advertisementSearch, setAdvertisementSearch] = useState("");

  const filteredAndSortedAds = useMemo(() => {
    let sortableItems = [...ads];
    if (statusFilter && statusFilter !== "all") {
      sortableItems = sortableItems.filter((ad) => ad.status === statusFilter);
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
  }, [ads, sortConfig, statusFilter]);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const apiUrl = import.meta.env["VITE_API_URL"];
  const { setActiveLink } = useOutletContext<{ setActiveLink: (arg0: number) => null }>();

  useEffect(() => {
    setActiveLink(1);
    const fetchAds = async () => {
      try {
        const params = new URLSearchParams();
        if (brandSearch) params.append("brand", brandSearch);
        if (advertisementSearch) params.append("advertisement", advertisementSearch);
        const response = await axios.get(`${apiUrl}/ads?${params.toString()}`);
        console.log(response.data)
        setAds(response.data);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    const handler = setTimeout(() => {
      fetchAds();
    }, 500); // Debounce search queries

    return () => {
      clearTimeout(handler);
    };
  }, [brandSearch, advertisementSearch, apiUrl]);

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
      a.download = ad.filename;
      a.click();

      URL.revokeObjectURL(url);
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
        <div className="uppercase font-light text-3xl text-white tracking-widest">Ad Masters</div>
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
              <Input
                type="text"
                placeholder="Search by Brand"
                className="dark"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <FaSearch className="text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder="Search by Advertisement"
                className="dark"
                value={advertisementSearch}
                onChange={(e) => setAdvertisementSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="flex gap-2 items-center cursor-pointer h-10 bg-neutral-300 rounded-md px-4 font-semibold" onClick={() => setModal(true)}>
            <FaPlus />
            New Ad Master
          </button>
        </div>
        <div className="p-4 bg-neutral-800 rounded-xl">
          <div className="flex justify-between items-center !mb-4">
            <h2 className="text-xl font-bold text-white">All Ad Masters</h2>
            <p className="text-neutral-400 text-sm">
              {filteredAndSortedAds.length} result{filteredAndSortedAds.length === 1 ? "" : "s"}
            </p>
          </div>
          {ads.length ? (
            <div className="w-full flex flex-col max-h-[80vh] overflow-auto scroll-table">
              <div className="rounded-xl border-orange-300 border min-h-16 text-neutral-200 flex items-center font-bold bg-[var(--bg-color)] sticky top-0 z-30">
                <div className="w-[15%] pl-4">
                  <SortableHeader sortKey="brand">Brand</SortableHeader>
                </div>
                <div className="w-[35%]">
                  <SortableHeader sortKey="advertisement">Advertisement</SortableHeader>
                </div>
                <div className="w-[15%]">
                  <SortableHeader sortKey="duration" className="justify-center">
                    Duration
                  </SortableHeader>
                </div>
                <div className="w-[10%]">
                  <SortableHeader sortKey="upload_date" className="justify-center">
                    Upload Date
                  </SortableHeader>
                </div>
                <div className="w-[15%] flex justify-center">
                  <Select onValueChange={(value: AdStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                    <SelectTrigger className="w-fit bg-transparent border-none">
                      <p className="chevron-brother">Status</p>
                    </SelectTrigger>
                    <SelectContent className="dark">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[10%]"></div>
              </div>
              <div className="flex flex-col text-white">
                {filteredAndSortedAds.map((row, idx) => (
                  <div key={idx} className={"flex items-center py-4 " + (playingAdId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")}>
                    <div className="w-[15%] pl-4">{row.brand}</div>
                    <div className="w-[35%]">{row.advertisement}</div>
                    <div className="w-[15%] text-center">{formatDuration(row.duration)}</div>
                    <div className="w-[10%] text-center">{new Date(row.upload_date).toISOString().slice(0, 10)}</div>
                    <div className={"w-[15%] text-center" + (row.status === "Active" ? " text-green-300" : " text-red-300")}>{row.status}</div>
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
          ) : (
            <SkeletonTheme baseColor={"#555555"} highlightColor={"#CCCCCC"}>
              <Skeleton count={10} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          )}
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
    </main>
  );
}
