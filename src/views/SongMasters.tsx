import UploadSongModal from "@/components/UploadSongModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "@styles/audioMedia.css";
import { formatDuration } from "@utils/utils";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight, FaCloudDownloadAlt, FaMusic, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useOutletContext } from "react-router";
import MusicControls from "@components/MusicControls";
import { FaCheck, FaPlay, FaPlus, FaXmark } from "react-icons/fa6";
import type { CurDurationType, SongMaster } from "@/types";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@components/ui/select";

type SortKey = keyof SongMaster;
type SongStatus = "Active" | "Inactive";

export default function SongMasters() {
  const [modal, setModal] = useState(false);
  const [playingSongId, setPlayingSongId] = useState(-1);
  const [curDuration, setCurDuration] = useState<CurDurationType>({ duration: 0, source: "controls" });
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<SongMaster>();
  const [songs, setSongs] = useState<SongMaster[] | null>(null);
  const [buttonLoading, setButtonLoading] = useState({
    id: -1,
    type: "Music",
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({
    key: "upload_date",
    direction: "descending",
  });
  const [statusFilter, setStatusFilter] = useState<SongStatus | "all">("all");
  const [artistSearch, setArtistSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  const apiUrl = import.meta.env["VITE_API_URL"];
  const { setActiveLink } = useOutletContext<{ setActiveLink: (arg0: number) => null }>();

  const filteredAndSortedSongs = useMemo(() => {
    if (!songs) return [];
    let sortableItems = [...songs];

    if (statusFilter !== "all") {
      sortableItems = sortableItems.filter((song) => song.status === statusFilter);
    }

    if (artistSearch) {
      sortableItems = sortableItems.filter((song) => song.artist.toLowerCase().includes(artistSearch.toLowerCase()));
    }

    if (nameSearch) {
      sortableItems = sortableItems.filter((song) => song.name.toLowerCase().includes(nameSearch.toLowerCase()));
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
  }, [songs, sortConfig, statusFilter, artistSearch, nameSearch]);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    setActiveLink(2);
    const fetchSongs = async () => {
      try {
        const response = await axios.get(`${apiUrl}/songs`);
        setSongs(response.data);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchSongs();
  }, [apiUrl, setActiveLink]);

  async function handleMusic(song: SongMaster) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: song.id, type: "Music" });
      const res = await fetch(`${apiUrl}/audio/songs/${song.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      setSrc(audioUrl);
      setMetadata(song);
      setPlayingSongId(song.id);
    } catch (err) {
      console.error("Error fetching audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleDownload(song: SongMaster) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: song.id, type: "Download" });
      const res = await fetch(`${apiUrl}/audio/songs/${song.filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = song.filename; // You can customize the download name here
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
      const res = await fetch(`${apiUrl}/songs/status`, {
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

      const updatedSong = await res.json();
      setSongs((prev: SongMaster[]) => prev.map((item) => (item.id === updatedSong.id ? updatedSong : item)));
      console.log("Status updated successfully:", updatedSong);
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
        <div className="uppercase font-light text-3xl text-white tracking-widest">Song Masters</div>
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
              <Input type="text" placeholder="Search by Artist" className="dark" value={artistSearch} onChange={(e) => setArtistSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FaSearch className="text-neutral-400" size={16} />
              <Input type="text" placeholder="Search by Name" className="dark" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
            </div>
          </div>
          <button className="flex gap-2 items-center cursor-pointer h-10 bg-neutral-300 rounded-md px-4 font-semibold" onClick={() => setModal(true)}>
            <FaPlus />
            New Song Master
          </button>
        </div>
        <div className="p-4 bg-neutral-800 rounded-xl">
          <div className="flex justify-between items-center !mb-4">
            <h2 className="text-xl font-bold text-white">All Song Masters</h2>
            <p className="text-neutral-400 text-sm">
              {filteredAndSortedSongs.length} result{filteredAndSortedSongs.length === 1 ? "" : "s"}
            </p>
          </div>

          {songs ? (
            <div className="w-full flex flex-col max-h-[80vh] overflow-auto scroll-table">
              <div className="rounded-xl border-orange-300 border min-h-16 text-neutral-200 flex items-center font-bold bg-[var(--bg-color)] sticky top-0 z-30">
                <div className="w-[15%] pl-4">
                  <SortableHeader sortKey="artist">Artists</SortableHeader>
                </div>
                <div className="w-[35%]">
                  <SortableHeader sortKey="name">Name</SortableHeader>
                </div>
                <div className="w-[15%] text-center">
                  <SortableHeader sortKey="duration" className="justify-center">
                    Duration
                  </SortableHeader>
                </div>
                <div className="w-[10%] text-center">
                  <SortableHeader sortKey="upload_date" className="justify-center">
                    Upload Date
                  </SortableHeader>
                </div>
                <div className="w-[15%] flex justify-center">
                  <Select onValueChange={(value: SongStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                    <SelectTrigger className="w-fit bg-transparent border-none">
                      <p className="chevron-brother">Status</p>
                    </SelectTrigger>
                    <SelectContent className="dark">
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[10%]"></div>
              </div>
              <div className="flex flex-col text-white">
                {filteredAndSortedSongs.map((row, idx) => (
                  <div key={idx} className={"flex items-center py-4 " + (playingSongId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")}>
                    <div className="w-[15%] pl-4">{row.artist}</div>
                    <div className="w-[35%]">{row.name}</div>
                    <div className="w-[15%] text-center">{formatDuration(row.duration)}</div>
                    <div className="w-[10%] text-center">{row.upload_date.toString().slice(0, 10)}</div>
                    <div className={"w-[15%] text-center" + (row.status === "Active" ? " text-green-600" : " text-red-500")}>{row.status}</div>
                    <div className="w-[10%] flex gap-2 justify-end pr-4">
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer shrink-0 disabled:cursor-default"
                        title="Play"
                        onClick={() => handleMusic(row)}
                        disabled={playingSongId === row.id}
                      >
                        {buttonLoading.id === row.id && buttonLoading.type === "Music" ? (
                          <PuffLoader color="white" size={15} />
                        ) : playingSongId === row.id ? (
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
      <UploadSongModal isOpen={modal} onClose={() => setModal(false)} onSongUploaded={(newSong: SongMaster) => setSongs([...songs, newSong])} />
      {src !== "" ? (
        <MusicControls
          audioSrc={src}
          title={metadata.name}
          header={metadata.artist}
          duration={metadata.duration}
          curDurationProp={curDuration}
          setCurDuration={setCurDuration}
          setAudioSrc={setSrc}
          setPlayingAudioId={setPlayingSongId}
        />
      ) : null}
    </main>
  );
}
