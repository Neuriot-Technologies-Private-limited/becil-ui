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
import { useTranslation } from "react-i18next";
import ListEmptyState from "@components/ListEmptyState";

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
  const [listReady, setListReady] = useState(false);
  const { t } = useTranslation();

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
        const raw = response.data;
        setAds(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error("Error fetching ads:", error);
        setAds([]);
      } finally {
        setListReady(true);
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
      <header className="border-b border-neutral-800/80 px-4 py-4 sm:px-6 lg:px-10">
        <div className="uppercase font-light text-xl tracking-widest text-white sm:text-2xl lg:text-3xl">
          {t("adMasters.title")}
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("adMasters.searchByBrand")}
                className="dark min-w-0 flex-1"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={16} />
              <Input
                type="text"
                placeholder={t("adMasters.searchByAdvertisement")}
                className="dark min-w-0 flex-1"
                value={advertisementSearch}
                onChange={(e) => setAdvertisementSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-300 px-4 font-semibold text-neutral-900 hover:bg-neutral-200 sm:w-auto"
            onClick={() => setModal(true)}
          >
            <FaPlus />
            {t("adMasters.uploadNewAd")}
          </button>
        </div>
        <div className="rounded-xl bg-neutral-800 p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">{t("adMasters.title")}</h2>
            {listReady && filteredAndSortedAds.length > 0 ? (
              <p className="text-sm text-neutral-400">
                {filteredAndSortedAds.length}{" "}
                {filteredAndSortedAds.length === 1 ? t("common.result") : t("common.results")}
              </p>
            ) : null}
          </div>
          {!listReady ? (
            <SkeletonTheme baseColor={"#555555"} highlightColor={"#CCCCCC"}>
              <Skeleton count={10} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          ) : filteredAndSortedAds.length === 0 ? (
            ads.length === 0 && !brandSearch && !advertisementSearch ? (
              <ListEmptyState
                title={t("adMasters.noAdsFound")}
                description={t("adMasters.emptyLibraryHint")}
                actionLabel={t("adMasters.uploadNewAd")}
                onAction={() => setModal(true)}
              />
            ) : (
              <ListEmptyState
                title={t("common.noMatchingResults")}
                description={t("common.noMatchingDescription")}
                actionLabel={t("adMasters.uploadNewAd")}
                onAction={() => setModal(true)}
                secondaryActionLabel={t("common.clearFilters")}
                onSecondaryAction={() => {
                  setBrandSearch("");
                  setAdvertisementSearch("");
                  setStatusFilter("all");
                }}
              />
            )
          ) : (
            <div className="scroll-table flex max-h-[min(80vh,720px)] w-full flex-col overflow-auto rounded-lg">
              <div className="min-w-[56rem]">
              <div className="sticky top-0 z-30 flex min-h-16 items-center border border-orange-300 bg-[var(--bg-color)] font-bold text-neutral-200 rounded-t-xl">
                <div className="w-[15%] shrink-0 pl-3 sm:pl-4">
                  <SortableHeader sortKey="brand">{t("adMasters.brand")}</SortableHeader>
                </div>
                <div className="w-[35%] shrink-0 pr-2">
                  <SortableHeader sortKey="advertisement">{t("adMasters.advertisement")}</SortableHeader>
                </div>
                <div className="w-[15%] shrink-0">
                  <SortableHeader sortKey="duration" className="justify-center">
                    {t("common.duration")}
                  </SortableHeader>
                </div>
                <div className="w-[10%] shrink-0">
                  <SortableHeader sortKey="upload_date" className="justify-center">
                    {t("adMasters.uploadDate")}
                  </SortableHeader>
                </div>
                <div className="flex w-[15%] shrink-0 justify-center">
                  <Select onValueChange={(value: AdStatus | "all") => setStatusFilter(value)} value={statusFilter}>
                    <SelectTrigger className="w-fit border-none bg-transparent">
                      <p className="chevron-brother">{t("common.status")}</p>
                    </SelectTrigger>
                    <SelectContent className="dark">
                      <SelectItem value="all">
                        {t("common.all")} {t("common.status")}
                      </SelectItem>
                      <SelectItem value="Active">{t("common.active")}</SelectItem>
                      <SelectItem value="Inactive">{t("common.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[10%] shrink-0" />
              </div>
              <div className="flex flex-col text-white">
                {filteredAndSortedAds.map((row, idx) => (
                  <div
                    key={idx}
                    className={
                      "flex min-w-[56rem] items-center py-3 sm:py-4 " +
                      (playingAdId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")
                    }
                  >
                    <div className="w-[15%] shrink-0 truncate pl-3 sm:pl-4" title={row.brand}>
                      {row.brand}
                    </div>
                    <div className="w-[35%] shrink-0 truncate pr-2" title={row.advertisement}>
                      {row.advertisement}
                    </div>
                    <div className="w-[15%] shrink-0 text-center text-sm sm:text-base">{formatDuration(row.duration)}</div>
                    <div className="w-[10%] shrink-0 text-center text-sm sm:text-base">
                      {row.upload_date ? 
                        (() => {
                          try {
                            const date = new Date(row.upload_date);
                            return isNaN(date.getTime()) ? "Invalid Date" : date.toISOString().slice(0, 10);
                          } catch {
                            return "Invalid Date";
                          }
                        })() 
                        : "No Date"
                      }
                    </div>
                    <div className={"w-[15%] shrink-0 text-center text-sm sm:text-base" + (row.status === "Active" ? " text-green-300" : " text-red-300")}>
                      {row.status === "Active" ? t('common.active') : t('common.inactive')}
                    </div>
                    <div className="flex w-[10%] shrink-0 justify-end gap-1 pr-2 sm:gap-2 sm:pr-4">
                      <button
                        type="button"
                        className="h-10 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer shrink-0 disabled:cursor-default"
                        title={t('common.play')}
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
                        title={t('common.download')}
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
                        title={t('common.status')}
                        onClick={() => handleStatusUpdate(row.id, row.status as "Active" | "Inactive")}
                      >
                        {row.status === "Active" ? <FaXmark size={16} /> : <FaCheck size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
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
