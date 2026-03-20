import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { GiDiamonds } from "react-icons/gi";
import UploadBroadcastModal from "@/components/UploadBroadcastModal";
import {
  FaChevronDown,
  FaChevronUp,
  FaCloudDownloadAlt,
  FaRegFileAlt,
  FaSearch,
  FaRedoAlt,
  FaTrash,
} from "react-icons/fa";
import { PiWaveformBold } from "react-icons/pi";
import WaveformModal from "@/components/WaveformModal";
import { formatDuration } from "@/utils/utils";
import "@/styles/audioMedia.css";
import { useOutletContext } from "react-router";
import type { AdDetectionResult, Broadcast } from "@/types";
import { PuffLoader } from "react-spinners";
import { FaPlus } from "react-icons/fa6";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CustomToast from "@/components/CustomToast";
import { useTranslation } from "react-i18next";
import { broadcastsService, audioService } from "@/api/services";
import ListEmptyState from "@/components/ListEmptyState";

type SortKey = keyof Broadcast;
type BroadcastStatus = "Processed" | "Processing" | "Pending";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[] | null>(null);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
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

  const { t } = useTranslation();

  const filteredAndSortedBroadcasts = useMemo(() => {
    let sortableItems = [...(broadcasts ?? [])];
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



  useEffect(() => {
    setActiveLink(3);
    const fetchBroadcasts = async () => {
      try {
        const params: { radio_station?: string; broadcast_recording?: string } = {};
        if (stationSearch) params.radio_station = stationSearch;
        if (recordingSearch) params.broadcast_recording = recordingSearch;
        const data = await broadcastsService.list(params);
        setBroadcasts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching broadcasts:", error);
        setBroadcasts([]);
      }
    };

    const handler = setTimeout(() => {
      fetchBroadcasts();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [stationSearch, recordingSearch, setActiveLink]);



  async function handleWaveformClick(broadcast: Broadcast) {
    setSelectedBroadcast(broadcast);
    try {
      const data = await broadcastsService.getDetections(broadcast.id);
      setWaveformData({ broadcast_id: broadcast.id, data });
      setWaveformModalOpen(true);
    } catch (er) {
      console.log(er);
    }
  }

  

  async function handleDownload(brd: Broadcast) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: brd.id, type: "Download" });
      const blob = await audioService.getBlob("broadcasts", brd.filename);
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
      await broadcastsService.startProcessing(id);
      setDisabledButtons((prev) => prev.filter((i) => i != id));
      const data = await broadcastsService.list();
      setBroadcasts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log(e);
    }
  }

  async function handleReport(broadcast: Broadcast, forceRegenerate = false) {
    if (buttonLoading.id !== -1) {
      return;
    }
    try {
      setButtonLoading({ id: broadcast.id, type: forceRegenerate ? "RegenerateReport" : "Report" });
      const blob = await broadcastsService.getReport(broadcast.id, forceRegenerate);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${broadcast.broadcast_recording}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
    } finally {
      setButtonLoading({ id: -1, type: "Music" });
    }
  }

  async function handleDelete(broadcast: Broadcast) {
    const ok = window.confirm(`Delete "${broadcast.broadcast_recording}"? This removes DB + S3 data.`);
    if (!ok) return;
    try {
      setButtonLoading({ id: broadcast.id, type: "Delete" });
      await broadcastsService.remove(broadcast.id);
      setBroadcasts((prev) => (prev ? prev.filter((item) => item.id !== broadcast.id) : prev));
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) toast.custom(() => <CustomToast status="Broadcast already deleted or not found." />);
      else if (status === 502) toast.custom(() => <CustomToast status="S3 delete failed. Please retry." />);
      else if (status === 500) toast.custom(() => <CustomToast status="Cleanup failed on server. Contact support." />);
      else toast.custom(() => <CustomToast status="Failed to delete broadcast." />);
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
          {t("broadcasts.title")}
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("broadcasts.searchByStation")}
                className="dark min-w-0 flex-1"
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("broadcasts.searchByRecording")}
                className="dark min-w-0 flex-1"
                value={recordingSearch}
                onChange={(e) => setRecordingSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-300 px-4 font-semibold text-neutral-900 hover:bg-neutral-200 sm:w-auto"
            onClick={() => setUploadModalOpen(true)}
          >
            <FaPlus />
            {t("broadcasts.uploadNewBroadcast")}
          </button>
        </div>
        <div className="rounded-xl bg-neutral-800 p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t("broadcasts.title")}</h2>
            {broadcasts !== null && filteredAndSortedBroadcasts.length > 0 ? (
              <p className="text-sm text-neutral-400">
                {filteredAndSortedBroadcasts.length}{" "}
                {filteredAndSortedBroadcasts.length === 1 ? t("common.result") : t("common.results")}
              </p>
            ) : null}
          </div>
          {broadcasts === null ? (
            <SkeletonTheme baseColor={"#555555"} highlightColor={"#CCCCCC"}>
              <Skeleton count={10} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          ) : filteredAndSortedBroadcasts.length === 0 ? (
            broadcasts.length === 0 && !stationSearch && !recordingSearch ? (
              <ListEmptyState
                title={t("broadcasts.noBroadcastsFound")}
                description={t("broadcasts.emptyLibraryHint")}
                actionLabel={t("broadcasts.uploadNewBroadcast")}
                onAction={() => setUploadModalOpen(true)}
              />
            ) : (
              <ListEmptyState
                title={t("common.noMatchingResults")}
                description={t("common.noMatchingDescription")}
                actionLabel={t("broadcasts.uploadNewBroadcast")}
                onAction={() => setUploadModalOpen(true)}
                secondaryActionLabel={t("common.clearFilters")}
                onSecondaryAction={() => {
                  setStationSearch("");
                  setRecordingSearch("");
                  setStatusFilter("all");
                }}
              />
            )
          ) : (
            <div className="scroll-table flex max-h-[min(80vh,720px)] w-full flex-col overflow-auto rounded-lg">
              <div className="min-w-[60rem]">
              <div className="sticky top-0 z-30 flex min-h-16 items-center border border-orange-300 bg-[var(--bg-color)] font-bold text-neutral-200 rounded-t-xl">
                <div className="w-[15%] shrink-0 pl-3 sm:pl-4">
                  <SortableHeader sortKey="radio_station">{t("broadcasts.radioStation")}</SortableHeader>
                </div>
                <div className="w-[25%] shrink-0 pr-2">
                  <SortableHeader sortKey="broadcast_recording">{t("broadcasts.broadcastRecording")}</SortableHeader>
                </div>
                <div className="w-[10%] shrink-0">
                  <SortableHeader sortKey="duration" className="justify-center">
                    {t("common.duration")}
                  </SortableHeader>
                </div>
                <div className="w-[20%] shrink-0">
                  <SortableHeader sortKey="broadcast_date" className="justify-center">
                    {t("broadcasts.broadcastDate")}
                  </SortableHeader>
                </div>
                <div className="flex w-[10%] shrink-0 justify-center">
                  <Select onValueChange={(value: BroadcastStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                    <SelectTrigger className="w-fit border-none bg-transparent">
                      <p className="chevron-brother">{t("common.status")}</p>
                    </SelectTrigger>
                    <SelectContent className="dark">
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="Processed">{t("common.processed")}</SelectItem>
                      <SelectItem value="Processing">{t("common.processing")}</SelectItem>
                      <SelectItem value="Pending">{t("common.pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[20%] shrink-0 text-center" />
              </div>
              <div className="flex flex-col text-white">
                {filteredAndSortedBroadcasts.map((row) => (
                  <div className="odd:bg-neutral-800 bg-neutral-900" key={row.id}>
                    <div className="flex min-w-[60rem] items-center py-3 sm:py-4">
                      <div className="flex w-[15%] shrink-0 items-center gap-2 truncate pl-3 sm:gap-4 sm:pl-4" title={row.radio_station}>
                        {row.radio_station}
                      </div>
                      <div className="w-[25%] shrink-0 pr-2">
                        <p className="truncate" title={row.broadcast_recording}>
                          {row.broadcast_recording}
                        </p>
                      </div>
                      <div className="w-[10%] shrink-0 text-center text-sm sm:text-base">{formatDuration(row.duration)}</div>
                      <div className="w-[20%] shrink-0 text-center text-sm sm:text-base">
                        {new Date(row.broadcast_date).toISOString().slice(0, 10)}
                      </div>
                      <div
                        className={
                          (row.status === "Processed" ? "text-green-300" : row.status === "Processing" ? "text-yellow-200" : "text-red-300") +
                          " flex w-[10%] shrink-0 justify-center text-center text-xs sm:text-sm"
                        }
                      >
                        {row.status === "Processed" ? t('common.processed') : 
                         row.status === "Processing" ? t('common.processing') : 
                         t('common.pending')}
                      </div>
                      <div className="flex w-[20%] shrink-0 justify-end gap-0.5 pr-2 sm:gap-1 sm:pr-4">
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title={t('broadcasts.viewWaveform')}
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
                          title={t('common.processing')}
                        >
                          <GiDiamonds size={14} />
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title={t('common.download')}
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
                          title="Regenerate report"
                          disabled={row.status !== "Processed"}
                          onClick={() => handleReport(row, true)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "RegenerateReport" ? (
                            <PuffLoader color="white" size={15} />
                          ) : (
                            <FaRedoAlt size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title={t('broadcasts.detectionResults')}
                          disabled={row.status !== "Processed"}
                          onClick={() => handleReport(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Report" ? <PuffLoader color="white" size={15} /> : <FaRegFileAlt size={14} />}
                        </button>
                        <button
                          type="button"
                          className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:text-red-300 shrink-0 disabled:cursor-default"
                          title="Delete"
                          onClick={() => handleDelete(row)}
                        >
                          {buttonLoading.id === row.id && buttonLoading.type === "Delete" ? <PuffLoader color="white" size={15} /> : <FaTrash size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <UploadBroadcastModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onBroadcastUploaded={(newBroadcast) =>
          setBroadcasts((prev) => (prev === null ? [newBroadcast] : [newBroadcast, ...prev]))
        } 
      />
      {selectedBroadcast && (
        <WaveformModal
          isOpen={waveformModalOpen}
          onClose={() => {
            setWaveformData({ broadcast_id: -1, data: [] });
            setWaveformModalOpen(false);
          }}
          broadcast={selectedBroadcast}
          waveformData={waveformData}
          curDuration={{ duration: 0, source: "controls" }}
        />
      )}
      
    </main>
  );
}
