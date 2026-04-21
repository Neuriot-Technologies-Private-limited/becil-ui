import UploadRjModal from "@/components/UploadRjModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "@/styles/audioMedia.css";
import { formatDuration } from "@/utils/utils";
import { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaCloudDownloadAlt,
  FaSearch,
} from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useOutletContext } from "react-router";
import { FaCheck, FaPlay, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import type { CurDurationType, RjMaster } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { rjService, audioService } from "@/api/services";
import ListEmptyState from "@/components/ListEmptyState";
import MusicControls from "@/components/MusicControls";
import { FaMusic } from "react-icons/fa";

type SortKey = keyof RjMaster;
type RjStatus = "Active" | "Inactive";

export default function RjMasters() {
  const [modal, setModal] = useState(false);
  const [playingRjId, setPlayingRjId] = useState(-1);
  const [curDuration, setCurDuration] = useState<CurDurationType>({ duration: 0, source: "controls" });
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<RjMaster>();
  const [rjList, setRjList] = useState<RjMaster[] | null>(null);
  const [buttonLoading, setButtonLoading] = useState({ id: -1, type: "Music" });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({
    key: "upload_date",
    direction: "descending",
  });
  const [statusFilter, setStatusFilter] = useState<RjStatus | "all">("all");
  const [rjNameSearch, setRjNameSearch] = useState("");
  const [showNameSearch, setShowNameSearch] = useState("");

  const { setActiveLink } = useOutletContext<{ setActiveLink: (arg0: number) => null }>();
  const { t } = useTranslation();

  const filteredAndSortedRj = useMemo(() => {
    if (!rjList) return [];
    let items = [...rjList];

    if (statusFilter !== "all") {
      items = items.filter((rj) => rj.status === statusFilter);
    }
    if (rjNameSearch) {
      const q = rjNameSearch.toLowerCase();
      items = items.filter((rj) => (rj.rj_name ?? "").toLowerCase().includes(q));
    }
    if (showNameSearch) {
      const q = showNameSearch.toLowerCase();
      items = items.filter((rj) => (rj.show_name ?? "").toLowerCase().includes(q));
    }
    if (sortConfig.key) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [rjList, sortConfig, statusFilter, rjNameSearch, showNameSearch]);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    setActiveLink(3);
    const fetchRj = async () => {
      try {
        const raw = await rjService.list();
        setRjList(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error("Error fetching RJ masters:", error);
        setRjList([]);
      }
    };
    fetchRj();
  }, [setActiveLink]);

  async function handlePlay(rj: RjMaster) {
    if (buttonLoading.id !== -1) return;
    try {
      setButtonLoading({ id: rj.id, type: "Music" });
      const blob = await audioService.getBlob("rjmasters", rj.filename);
      const audioUrl = URL.createObjectURL(blob);
      setSrc(audioUrl);
      setMetadata(rj);
      setPlayingRjId(rj.id);
    } catch (err) {
      console.error("Error fetching audio:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleDownload(rj: RjMaster) {
    if (buttonLoading.id !== -1) return;
    try {
      setButtonLoading({ id: rj.id, type: "Download" });
      const blob = await audioService.getBlob("rjmasters", rj.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = rj.filename;
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
      const updated = await rjService.updateStatus(id, newStatus);
      setRjList((prev) => (prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  async function handleDelete(rj: RjMaster) {
    const ok = window.confirm(`Delete "${rj.show_name}"? This removes DB + S3 data.`);
    if (!ok) return;
    try {
      setButtonLoading({ id: rj.id, type: "Delete" });
      await rjService.remove(rj.id);
      setRjList((prev) => (prev ? prev.filter((item) => item.id !== rj.id) : prev));
      if (playingRjId === rj.id) {
        setSrc("");
        setPlayingRjId(-1);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) alert("RJ master already deleted or not found.");
      else if (status === 502) alert("S3 delete failed. Please retry.");
      else if (status === 500) alert("Cleanup failed on server. Contact support.");
      else alert("Failed to delete RJ master.");
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
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
      <header className="border-b border-neutral-800/80 px-4 py-4 sm:px-6 lg:px-10">
        <div className="uppercase font-light text-xl tracking-widest text-white sm:text-2xl lg:text-3xl">
          {t("rjMasters.title")}
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("rjMasters.searchByRjName")}
                className="dark min-w-0 flex-1"
                value={rjNameSearch}
                onChange={(e) => setRjNameSearch(e.target.value)}
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("rjMasters.searchByShowName")}
                className="dark min-w-0 flex-1"
                value={showNameSearch}
                onChange={(e) => setShowNameSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-300 px-4 font-semibold text-neutral-900 hover:bg-neutral-200 sm:w-auto"
            onClick={() => setModal(true)}
          >
            <FaPlus />
            {t("rjMasters.uploadNewRj")}
          </button>
        </div>

        <div className="rounded-xl bg-neutral-800 p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t("rjMasters.title")}</h2>
            {rjList !== null && filteredAndSortedRj.length > 0 ? (
              <p className="text-sm text-neutral-400">
                {filteredAndSortedRj.length}{" "}
                {filteredAndSortedRj.length === 1 ? t("common.result") : t("common.results")}
              </p>
            ) : null}
          </div>

          {rjList === null ? (
            <SkeletonTheme baseColor={"#555555"} highlightColor={"#CCCCCC"}>
              <Skeleton count={10} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          ) : filteredAndSortedRj.length === 0 ? (
            rjList.length === 0 ? (
              <ListEmptyState
                title={t("rjMasters.noRjFound")}
                description={t("rjMasters.emptyLibraryHint")}
                actionLabel={t("rjMasters.uploadNewRj")}
                onAction={() => setModal(true)}
              />
            ) : (
              <ListEmptyState
                title={t("common.noMatchingResults")}
                description={t("common.noMatchingDescription")}
                actionLabel={t("rjMasters.uploadNewRj")}
                onAction={() => setModal(true)}
                secondaryActionLabel={t("common.clearFilters")}
                onSecondaryAction={() => {
                  setRjNameSearch("");
                  setShowNameSearch("");
                  setStatusFilter("all");
                }}
              />
            )
          ) : (
            <div className="scroll-table flex max-h-[min(80vh,720px)] w-full flex-col overflow-auto rounded-lg">
              <div className="min-w-[55rem]">
                <div className="sticky top-0 z-30 flex min-h-16 items-center border border-orange-300 bg-[var(--bg-color)] font-bold text-neutral-200 rounded-t-xl">
                  <div className="w-[20%] shrink-0 pl-3 sm:pl-4">
                    <SortableHeader sortKey="rj_name">{t("rjMasters.rjName")}</SortableHeader>
                  </div>
                  <div className="w-[30%] shrink-0 pr-2">
                    <SortableHeader sortKey="show_name">{t("rjMasters.showName")}</SortableHeader>
                  </div>
                  <div className="w-[12%] shrink-0 text-center">
                    <SortableHeader sortKey="duration" className="justify-center">
                      {t("common.duration")}
                    </SortableHeader>
                  </div>
                  <div className="w-[15%] shrink-0 text-center">
                    <SortableHeader sortKey="upload_date" className="justify-center">
                      {t("rjMasters.uploadDate")}
                    </SortableHeader>
                  </div>
                  <div className="flex w-[10%] shrink-0 justify-center">
                    <Select onValueChange={(value: RjStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                      <SelectTrigger className="w-fit border-none bg-transparent">
                        <p className="chevron-brother">{t("common.status")}</p>
                      </SelectTrigger>
                      <SelectContent className="dark">
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="Active">{t("common.active")}</SelectItem>
                        <SelectItem value="Inactive">{t("common.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[13%] shrink-0" />
                </div>

                <div className="flex flex-col text-white">
                  {filteredAndSortedRj.map((row, idx) => (
                    <div
                      key={idx}
                      className={
                        "flex min-w-[55rem] items-center py-3 sm:py-4 " +
                        (playingRjId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")
                      }
                    >
                      <div className="w-[20%] shrink-0 truncate pl-3 sm:pl-4" title={row.rj_name}>
                        {row.rj_name}
                      </div>
                      <div className="w-[30%] shrink-0 truncate pr-2" title={row.show_name}>
                        {row.show_name}
                      </div>
                      <div className="w-[12%] shrink-0 text-center text-sm sm:text-base">{formatDuration(row.duration)}</div>
                      <div className="w-[15%] shrink-0 text-center text-sm sm:text-base">
                        {row.upload_date
                          ? (() => {
                              try {
                                const d = new Date(row.upload_date);
                                return isNaN(d.getTime()) ? "Invalid Date" : d.toISOString().slice(0, 10);
                              } catch {
                                return "Invalid Date";
                              }
                            })()
                          : "No Date"}
                      </div>
                      <div
                        className={
                          "w-[10%] shrink-0 text-center text-xs sm:text-sm " +
                          (row.status === "Active" ? "text-green-300" : "text-red-300")
                        }
                      >
                        {row.status === "Active" ? t("common.active") : t("common.inactive")}
                      </div>
                      <div className="flex w-[13%] shrink-0 justify-end gap-1.5 pr-2 sm:gap-2 sm:pr-4">
                        {/* Play */}
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer shrink-0 disabled:cursor-default"
                          title={t("common.play")}
                          onClick={() => handlePlay(row)}
                          disabled={playingRjId === row.id}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Music" ? (
                            <PuffLoader color="white" size={15} />
                          ) : playingRjId === row.id ? (
                            <FaMusic />
                          ) : (
                            <FaPlay />
                          )}
                        </button>

                        {/* Download */}
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-gray-400 shrink-0 disabled:cursor-default"
                          title={t("common.download")}
                          onClick={() => handleDownload(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Download" ? (
                            <PuffLoader color="white" size={12} />
                          ) : (
                            <FaCloudDownloadAlt size={14} />
                          )}
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-gray-400 shrink-0 disabled:cursor-default"
                          title={t("common.status")}
                          onClick={() => handleStatusUpdate(row.id, row.status as "Active" | "Inactive")}
                        >
                          {row.status === "Active" ? <FaXmark size={16} /> : <FaCheck size={14} />}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-gray-400 shrink-0 disabled:cursor-default"
                          title={t("common.delete")}
                          onClick={() => handleDelete(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Delete" ? (
                            <PuffLoader color="white" size={12} />
                          ) : (
                            <FaTrash size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <UploadRjModal
        isOpen={modal}
        onClose={() => setModal(false)}
        onRjUploaded={(newRj: RjMaster) => setRjList((prev) => (prev ? [...prev, newRj] : [newRj]))}
      />

      {src !== "" ? (
        <MusicControls
          audioSrc={src}
          title={metadata?.show_name}
          header={metadata?.rj_name}
          duration={metadata?.duration}
          curDurationProp={curDuration}
          setCurDuration={setCurDuration}
          setAudioSrc={setSrc}
          setPlayingAudioId={setPlayingRjId}
        />
      ) : null}
    </main>
  );
}
