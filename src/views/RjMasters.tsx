import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "@/styles/audioMedia.css";
import { formatDuration } from "@/utils/utils";
import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useOutletContext } from "react-router";
import { FaCheck, FaPlay, FaPlus, FaTrash, FaXmark, FaMicrophoneLines } from "react-icons/fa6";
import { FaCloudDownloadAlt, FaMusic, FaTag } from "react-icons/fa";
import type { RjClip, RjBrandMention, CurDurationType } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { rjService, audioService } from "@/api/services";
import ListEmptyState from "@/components/ListEmptyState";
import MusicControls from "@/components/MusicControls";
import UploadRjModal from "@/components/UploadRjModal";

type SortKey = keyof RjClip;
type RjStatus = "Active" | "Inactive";

// ── Brand Mentions Panel ────────────────────────────────────────────────────
function BrandMentionsPanel({ clip, onClose }: { clip: RjClip; onClose: () => void }) {
  const [mentions, setMentions] = useState<RjBrandMention[] | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<{ romanized: string | null; hindi: string | null } | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  useEffect(() => {
    rjService.getBrandMentions(clip.id).then(setMentions).catch(() => setMentions([]));
    if (clip.transcript_romanized || clip.transcript_hindi) {
      setTranscript({ romanized: clip.transcript_romanized, hindi: clip.transcript_hindi });
    }
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [clip.id]);

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      await rjService.transcribe(clip.id, { threshold: 75 });
      // Poll until done
      const iv = window.setInterval(async () => {
        const res = await rjService.getTranscript(clip.id);
        if (res.status !== "Processing") {
          clearInterval(iv);
          setPollInterval(null);
          setTranscript({ romanized: res.transcript_romanized, hindi: res.transcript_hindi });
          const m = await rjService.getBrandMentions(clip.id);
          setMentions(m);
          setTranscribing(false);
        }
      }, 4000);
      setPollInterval(iv);
    } catch {
      setTranscribing(false);
    }
  };

  const fmtSec = (s: number | null) => {
    if (s == null) return "--:--";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(sec).padStart(2, "0")]
      .filter(Boolean).join(":");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl bg-neutral-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button className="absolute right-4 top-4 text-neutral-400 hover:text-white" onClick={onClose}><FaXmark /></button>
        <h2 className="text-lg font-bold text-white">RJ Clip Details</h2>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-800 p-3 text-sm">
          <span className="text-neutral-400">RJ Name</span><span className="text-white">{clip.rj_name || "—"}</span>
          <span className="text-neutral-400">Station</span><span className="text-white">{clip.radio_station || "—"}</span>
          <span className="text-neutral-400">Status</span>
          <span className={clip.status === "Active" ? "text-green-400" : clip.status === "Processing" ? "text-yellow-300" : "text-red-400"}>{clip.status}</span>
        </div>

        {/* Transcribe button */}
        <button
          onClick={handleTranscribe}
          disabled={transcribing || clip.status === "Processing"}
          className="flex items-center gap-2 self-start rounded-lg bg-orange-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {transcribing ? <PuffLoader size={14} color="black" /> : <FaMicrophoneLines />}
          {transcribing ? "Transcribing… (polling)" : "Transcribe & Detect Brands"}
        </button>

        {/* Transcript */}
        {transcript && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-neutral-300">Transcript</h3>
            {transcript.romanized && <p className="rounded bg-neutral-800 p-3 text-xs leading-relaxed text-white">{transcript.romanized}</p>}
            {transcript.hindi && <p className="rounded bg-neutral-800 p-3 text-xs leading-relaxed text-white" dir="auto">{transcript.hindi}</p>}
          </div>
        )}

        {/* Brand Mentions */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-300">Brand Mentions</h3>
          {mentions === null ? (
            <SkeletonTheme baseColor="#444" highlightColor="#666"><Skeleton count={3} height={32} /></SkeletonTheme>
          ) : mentions.length === 0 ? (
            <p className="text-sm text-neutral-500">No brand mentions detected yet. Run transcription first.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-sm text-white">
                <thead><tr className="bg-neutral-800 text-left text-xs text-neutral-400">
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Matched Text</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Score</th>
                </tr></thead>
                <tbody>
                  {mentions.map((m) => (
                    <tr key={m.id} className="border-t border-neutral-700 odd:bg-neutral-800/50">
                      <td className="px-3 py-2 font-medium text-orange-300">{m.brand}</td>
                      <td className="px-3 py-2 italic text-neutral-300">{m.matched_text || "—"}</td>
                      <td className="px-3 py-2">{fmtSec(m.start_sec)}</td>
                      <td className="px-3 py-2">{fmtSec(m.end_sec)}</td>
                      <td className="px-3 py-2">{m.match_score != null ? `${m.match_score.toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main View ───────────────────────────────────────────────────────────────
export default function RjMasters() {
  const [modal, setModal] = useState(false);
  const [playingId, setPlayingId] = useState(-1);
  const [curDuration, setCurDuration] = useState<CurDurationType>({ duration: 0, source: "controls" });
  const [src, setSrc] = useState("");
  const [metadata, setMetadata] = useState<RjClip>();
  const [clips, setClips] = useState<RjClip[] | null>(null);
  const [btnLoading, setBtnLoading] = useState({ id: -1, type: "" });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({ key: "upload_date", direction: "descending" });
  const [statusFilter, setStatusFilter] = useState<RjStatus | "all">("all");
  const [rjSearch, setRjSearch] = useState("");
  const [stationSearch, setStationSearch] = useState("");
  const [detailClip, setDetailClip] = useState<RjClip | null>(null);

  const { setActiveLink } = useOutletContext<{ setActiveLink: (n: number) => null }>();
  const { t } = useTranslation();

  const sorted = useMemo(() => {
    if (!clips) return [];
    let items = [...clips];
    if (statusFilter !== "all") items = items.filter(c => c.status === statusFilter);
    if (rjSearch) items = items.filter(c => (c.rj_name ?? "").toLowerCase().includes(rjSearch.toLowerCase()));
    if (stationSearch) items = items.filter(c => (c.radio_station ?? "").toLowerCase().includes(stationSearch.toLowerCase()));
    items.sort((a, b) => {
      const av = a[sortConfig.key] ?? "", bv = b[sortConfig.key] ?? "";
      if (av < bv) return sortConfig.direction === "ascending" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return items;
  }, [clips, sortConfig, statusFilter, rjSearch, stationSearch]);

  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending" }));
  };

  useEffect(() => {
    setActiveLink(3);
    rjService.list().then(data => setClips(Array.isArray(data) ? data : [])).catch(() => setClips([]));
  }, [setActiveLink]);

  async function handlePlay(clip: RjClip) {
    if (btnLoading.id !== -1) return;
    try {
      setBtnLoading({ id: clip.id, type: "Music" });
      const blob = await audioService.getBlob("rjmasters", clip.filename);
      setSrc(URL.createObjectURL(blob));
      setMetadata(clip);
      setPlayingId(clip.id);
    } catch (err) { console.error(err); }
    finally { setBtnLoading({ id: -1, type: "" }); }
  }

  async function handleDownload(clip: RjClip) {
    if (btnLoading.id !== -1) return;
    try {
      setBtnLoading({ id: clip.id, type: "Download" });
      const blob = await audioService.getBlob("rjmasters", clip.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = clip.filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setBtnLoading({ id: -1, type: "" }); }
  }

  async function handleStatusUpdate(clip: RjClip) {
    const next = clip.status === "Active" ? "Inactive" : "Active";
    try {
      const updated = await rjService.updateStatus(clip.id, next);
      setClips(prev => prev ? prev.map(c => c.id === updated.id ? updated : c) : prev);
    } catch (err) { console.error(err); }
  }

  async function handleDelete(clip: RjClip) {
    if (!window.confirm(`Delete "${clip.rj_name ?? clip.filename}"?`)) return;
    try {
      setBtnLoading({ id: clip.id, type: "Delete" });
      await rjService.remove(clip.id);
      setClips(prev => prev ? prev.filter(c => c.id !== clip.id) : prev);
      if (playingId === clip.id) { setSrc(""); setPlayingId(-1); }
    } catch (err: any) {
      const s = err?.response?.status;
      alert(s === 404 ? "Already deleted." : s === 502 ? "S3 delete failed." : "Delete failed.");
    } finally { setBtnLoading({ id: -1, type: "" }); }
  }

  const SortHdr = ({ k, children, cls }: { k: SortKey; children: React.ReactNode; cls?: string }) => (
    <div className={`flex items-center gap-1 ${cls ?? ""}`}>
      <button type="button" onClick={() => requestSort(k)} className="flex items-center gap-1">
        {children}
        {sortConfig.key === k && (sortConfig.direction === "ascending" ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />)}
      </button>
    </div>
  );

  return (
    <main className="audioai-main">
      <header className="border-b border-neutral-800/80 px-4 py-4 sm:px-6 lg:px-10">
        <div className="uppercase font-light text-xl tracking-widest text-white sm:text-2xl lg:text-3xl">
          RJ Clips
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={14} />
              <Input type="text" placeholder="Search by RJ name…" className="dark min-w-0 flex-1" value={rjSearch} onChange={e => setRjSearch(e.target.value)} />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white sm:min-w-[12rem] sm:max-w-xs">
              <FaSearch className="shrink-0 text-neutral-400" size={14} />
              <Input type="text" placeholder="Search by station…" className="dark min-w-0 flex-1" value={stationSearch} onChange={e => setStationSearch(e.target.value)} />
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-300 px-4 font-semibold text-neutral-900 hover:bg-neutral-200 sm:w-auto"
            onClick={() => setModal(true)}
          >
            <FaPlus /> Upload New RJ Clip
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-neutral-800 p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">RJ Clips</h2>
            {clips !== null && sorted.length > 0 && (
              <p className="text-sm text-neutral-400">{sorted.length} {sorted.length === 1 ? "result" : "results"}</p>
            )}
          </div>

          {clips === null ? (
            <SkeletonTheme baseColor="#555" highlightColor="#CCC">
              <Skeleton count={8} height={32} containerClassName="gap-0.5 flex flex-col" />
            </SkeletonTheme>
          ) : sorted.length === 0 ? (
            clips.length === 0 ? (
              <ListEmptyState title="No RJ clips found" description="Upload your first RJ clip to get started." actionLabel="Upload New RJ Clip" onAction={() => setModal(true)} />
            ) : (
              <ListEmptyState
                title="No matching results"
                description="Try adjusting your search filters."
                actionLabel="Upload New RJ Clip"
                onAction={() => setModal(true)}
                secondaryActionLabel="Clear filters"
                onSecondaryAction={() => { setRjSearch(""); setStationSearch(""); setStatusFilter("all"); }}
              />
            )
          ) : (
            <div className="scroll-table flex max-h-[min(80vh,720px)] w-full flex-col overflow-auto rounded-lg">
              <div className="min-w-[56rem]">
                {/* Header */}
                <div className="sticky top-0 z-30 flex min-h-14 items-center border border-orange-300 bg-[var(--bg-color)] font-bold text-neutral-200 rounded-t-xl text-sm">
                  <div className="w-[18%] shrink-0 pl-3"><SortHdr k="rj_name">RJ Name</SortHdr></div>
                  <div className="w-[18%] shrink-0"><SortHdr k="radio_station">Station</SortHdr></div>
                  <div className="w-[11%] shrink-0 text-center"><SortHdr k="duration" cls="justify-center">Duration</SortHdr></div>
                  <div className="w-[14%] shrink-0 text-center"><SortHdr k="upload_date" cls="justify-center">Upload Date</SortHdr></div>
                  <div className="w-[13%] shrink-0 text-center"><SortHdr k="status" cls="justify-center">Status</SortHdr></div>
                  <div className="flex w-[11%] shrink-0 justify-center">
                    <Select onValueChange={(v: RjStatus | "all") => setStatusFilter(v)} value={statusFilter}>
                      <SelectTrigger className="w-fit border-none bg-transparent">
                        <p className="chevron-brother">{t("common.status")}</p>
                      </SelectTrigger>
                      <SelectContent className="dark">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[15%] shrink-0" />
                </div>

                {/* Rows */}
                <div className="flex flex-col text-white text-sm">
                  {sorted.map((row) => (
                    <div key={row.id} className={"flex min-w-[56rem] items-center py-3 " + (playingId === row.id ? "music-bg" : "odd:bg-neutral-800 bg-neutral-900")}>
                      <div className="w-[18%] shrink-0 truncate pl-3" title={row.rj_name ?? ""}>{row.rj_name || <span className="text-neutral-500">—</span>}</div>
                      <div className="w-[18%] shrink-0 truncate pr-2" title={row.radio_station ?? ""}>{row.radio_station || <span className="text-neutral-500">—</span>}</div>
                      <div className="w-[11%] shrink-0 text-center">{formatDuration(row.duration ?? 0)}</div>
                      <div className="w-[14%] shrink-0 text-center">
                        {row.upload_date ? (() => { try { const d = new Date(row.upload_date); return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0,10); } catch { return "—"; } })() : "—"}
                      </div>
                      <div className={"w-[13%] shrink-0 text-center text-xs " + (row.status === "Active" ? "text-green-300" : row.status === "Processing" ? "text-yellow-300" : "text-red-300")}>
                        {row.status}
                      </div>
                      {/* Status filter col – empty spacer */}
                      <div className="w-[11%] shrink-0" />
                      {/* Actions */}
                      <div className="flex w-[15%] shrink-0 justify-end gap-1 pr-2 sm:pr-3">
                        {/* Brand Mentions */}
                        <button type="button" className="h-9 w-8 flex items-center justify-center hover:bg-orange-300 rounded-xl cursor-pointer" title="Brand Mentions / Transcript" onClick={() => setDetailClip(row)}>
                          <FaTag size={13} />
                        </button>
                        {/* Play */}
                        <button type="button" className="h-9 w-8 flex items-center justify-center disabled:hover:bg-transparent hover:bg-orange-300 rounded-xl cursor-pointer disabled:cursor-default" title="Play" onClick={() => handlePlay(row)} disabled={playingId === row.id}>
                          {btnLoading.id === row.id && btnLoading.type === "Music" ? <PuffLoader color="white" size={14} /> : playingId === row.id ? <FaMusic size={12} /> : <FaPlay size={12} />}
                        </button>
                        {/* Download */}
                        <button type="button" className="h-9 w-8 flex items-center justify-center hover:bg-orange-300 rounded-xl cursor-pointer" title="Download" onClick={() => handleDownload(row)}>
                          {btnLoading.id === row.id && btnLoading.type === "Download" ? <PuffLoader color="white" size={12} /> : <FaCloudDownloadAlt size={13} />}
                        </button>
                        {/* Toggle status */}
                        <button type="button" className="h-9 w-8 flex items-center justify-center hover:bg-orange-300 rounded-xl cursor-pointer" title="Toggle Status" onClick={() => handleStatusUpdate(row)}>
                          {row.status === "Active" ? <FaXmark size={14} /> : <FaCheck size={12} />}
                        </button>
                        {/* Delete */}
                        <button type="button" className="h-9 w-8 flex items-center justify-center hover:bg-orange-300 rounded-xl cursor-pointer" title="Delete" onClick={() => handleDelete(row)}>
                          {btnLoading.id === row.id && btnLoading.type === "Delete" ? <PuffLoader color="white" size={12} /> : <FaTrash size={12} />}
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

      {/* Modals */}
      <UploadRjModal isOpen={modal} onClose={() => setModal(false)} onRjUploaded={(c) => setClips(prev => prev ? [...prev, c] : [c])} />
      {detailClip && <BrandMentionsPanel clip={detailClip} onClose={() => setDetailClip(null)} />}
      {src && (
        <MusicControls
          audioSrc={src}
          title={metadata?.radio_station ?? "RJ Clip"}
          header={metadata?.rj_name ?? ""}
          duration={metadata?.duration ?? 0}
          curDurationProp={curDuration}
          setCurDuration={setCurDuration}
          setAudioSrc={setSrc}
          setPlayingAudioId={setPlayingId}
        />
      )}
    </main>
  );
}
