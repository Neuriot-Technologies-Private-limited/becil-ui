import { formatSecondsToHHMMSS, getRandomHex, generateAmplitudes } from "@utils/utils";
import { useEffect, useState, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { emptyAdSlot } from "@/data";
import type { AdDetectionResult } from "@/types";
import { DesignateGapModal } from "./DesignateGapModal";

type WaveformProps = {
  duration: number;
  regionProps: { broadcast_id: number; data: AdDetectionResult[] };
  curDuration: { duration: number; source: string };
  setCurDuration: any;
  playingBroadcastId: number;
  filename: string;
};

const MIN_ZOOM_SECONDS = 10; // Minimum visible duration in seconds
const BAR_WIDTH = 2;
const BAR_HEIGHT = 75;

export default function Waveform({ duration, regionProps, curDuration, setCurDuration, playingBroadcastId, filename }: WaveformProps) {
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [modal, setModal] = useState({ open: false, region: null });
  const [regions, setRegions] = useState<AdDetectionResult[]>([]);
  const [colors, setColors] = useState<Record<string | number, string>>({});
  const [src, setSrc] = useState("");
  const [viewStart, setViewStart] = useState(0); // in seconds
  const [viewDuration, setViewDuration] = useState(duration); // in seconds
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const apiUrl = import.meta.env["VITE_API_URL"];

  useEffect(() => {
    const newAmplitudes = generateAmplitudes(filename, duration);
    setAmplitudes(newAmplitudes);
  }, [filename, duration]);

  const manipulateRegions = (regions: AdDetectionResult[]) => {
    regions.sort((a, b) => a.start_time_seconds - b.start_time_seconds);
    const rs = [];
    let last_end_time = -1;
    for (const r of regions) {
      let start_time = Math.floor(r.start_time_seconds);
      if (start_time === last_end_time) {
        start_time += 1;
      }
      r.start_time_seconds = start_time;
      r.end_time_seconds = Math.floor(r.end_time_seconds);
      rs.push(r);
    }

    const newRegions: AdDetectionResult[] = [];
    let lastAd: AdDetectionResult;
    last_end_time = -1;
    for (const r of rs) {
      if (r.start_time_seconds > last_end_time + 1) {
        const newRegion = { ...emptyAdSlot };
        newRegion.start_time_seconds = last_end_time + 1;
        newRegion.end_time_seconds = r.start_time_seconds - 1;
        newRegions.push(newRegion);
      }
      newRegions.push(r);
      lastAd = r;
      last_end_time = r.end_time_seconds;
    }

    if (lastAd! && lastAd.end_time_seconds < duration - 1) {
      const newRegion = { ...emptyAdSlot };
      newRegion.start_time_seconds = lastAd.end_time_seconds + 1;
      newRegion.end_time_seconds = duration;
      newRegions.push(newRegion);
    }
    return newRegions;
  };

  useEffect(() => {
    const newRegions = manipulateRegions(regionProps.data);
    setRegions(newRegions);
    const colorMap: Record<string | number, string> = {};
    for (const r of newRegions) {
      if (r.clip_type === "empty") colorMap[`${r.ad_id}-${r.clip_type}`] = "#222222";
      else if (r.clip_type === "song") colorMap[`${r.ad_id}-${r.clip_type}`] = getRandomHex("green");
      else if (r.clip_type === "ad") colorMap[`${r.ad_id}-${r.clip_type}`] = getRandomHex("orange");
      else if (r.clip_type === "speech") colorMap[`${r.ad_id}-${r.clip_type}`] = "#6784a8";
    }
    setColors(colorMap);
  }, [regionProps, duration]);

  useEffect(() => {
    async function fetchAudio() {
      try {
        const res = await fetch(`${apiUrl}/audio/broadcasts/${filename}`);
        if (!res.ok) throw new Error("Failed to fetch audio");
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        setSrc(audioUrl);
      } catch (e: any) {
        console.log(e);
      }
    }
    fetchAudio();
  }, [filename, apiUrl]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseTime = viewStart + (mouseX / rect.width) * viewDuration;

    const zoomFactor = 1.1;
    const newViewDuration = e.deltaY < 0 ? viewDuration / zoomFactor : viewDuration * zoomFactor;
    const clampedViewDuration = Math.max(MIN_ZOOM_SECONDS, Math.min(newViewDuration, duration));

    const newViewStart = mouseTime - (mouseX / rect.width) * clampedViewDuration;
    const clampedViewStart = Math.max(0, Math.min(newViewStart, duration - clampedViewDuration));

    setViewDuration(clampedViewDuration);
    setViewStart(clampedViewStart);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current || !containerRef.current) return;
    if (isScrolling.current) return; // Prevent feedback loop

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const newViewStart = (scrollLeft / (scrollWidth - clientWidth)) * (duration - viewDuration);
    setViewStart(Math.max(0, newViewStart));
  };

  useEffect(() => {
    if (!scrollContainerRef.current || !containerRef.current) return;
    isScrolling.current = true;
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const newScrollLeft = (viewStart / (duration - viewDuration)) * (scrollWidth - clientWidth);
    scrollContainerRef.current.scrollLeft = newScrollLeft;
    setTimeout(() => {
      isScrolling.current = false;
    }, 100);
  }, [viewStart, viewDuration, duration]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = viewStart + (clickX / rect.width) * viewDuration;
    if (regionProps.broadcast_id === playingBroadcastId) {
      setCurDuration({ duration: seekTime, source: "waveform" });
    }
  };

  function handleNewAd(region: AdDetectionResult) {
    setModal({ open: true, region });
  }

  function handleModalClose() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  if (!amplitudes.length || !regions.length) {
    return <div>Loading Waveform...</div>;
  }

  const pointsPerSecond = amplitudes.length / duration;
  const startIndex = Math.floor(viewStart * pointsPerSecond);
  const endIndex = Math.floor((viewStart + viewDuration) * pointsPerSecond);
  const visibleAmplitudes = amplitudes.slice(startIndex, endIndex);

  const totalWidth = (duration / viewDuration) * 100;

  return (
    <div className="p-4 rounded-lg w-full">
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#888 #333" }}
      >
        <div
          ref={containerRef}
          className="relative cursor-pointer"
          style={{ width: `${totalWidth}%` }}
          onWheel={handleWheel}
          onClick={handleSeek}
        >
          <div className="flex items-center h-full">
            {visibleAmplitudes.map((amp, index) => {
              const height = Math.max(amp * BAR_HEIGHT, 1);
              return (
                <div
                  key={index}
                  className="h-full flex items-center"
                  style={{
                    height: `${BAR_HEIGHT * 1.2}px`,
                    width: `${BAR_WIDTH}px`,
                  }}
                >
                  <div
                    className="w-full rounded-full"
                    style={{
                      height: `${height}px`,
                      backgroundColor: "#ccc", // Default color
                    }}
                  />
                </div>
              );
            })}
          </div>

          {regions.map((region, idx) => {
            const left = ((region.start_time_seconds - viewStart) / viewDuration) * 100;
            const width = ((region.end_time_seconds - region.start_time_seconds) / viewDuration) * 100;
            const color = colors[`${region.ad_id}-${region.clip_type}`] || "#FFFFFF22";
            const tooltipId = `region-tooltip-${idx}`;

            if (
              region.end_time_seconds < viewStart ||
              region.start_time_seconds > viewStart + viewDuration
            ) {
              return null;
            }

            return (
              <div
                key={idx}
                className="absolute top-0 h-full"
                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}80` }}
                data-tooltip-id={tooltipId}
                data-tooltip-content={`${region.brand} | ${formatSecondsToHHMMSS(region.start_time_seconds)} - ${formatSecondsToHHMMSS(region.end_time_seconds)}`}
              >
                <Tooltip id={tooltipId} place="top" className="z-50" />
                {region.clip_type === "empty" && (
                  <div
                    className="absolute bottom-2 h-2 w-2 rounded-full bg-black cursor-pointer"
                    style={{
                      left: `50%`,
                      transform: "translateX(-50%)",
                      boxShadow: "0px 0px 2px 1px white",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNewAd(region);
                    }}
                  />
                )}
              </div>
            );
          })}

          {regionProps.broadcast_id === playingBroadcastId && (
            <div
              className="bg-white border-r-2 border-white absolute h-full top-0 pointer-events-none z-20"
              style={{
                left: `${((curDuration.duration - viewStart) / viewDuration) * 100}%`,
                width: "2px",
              }}
            />
          )}
        </div>
      </div>
      <div className="flex text-neutral-400 gap-4 items-center justify-end pr-4 mt-2">
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 rounded-full bg-orange-400" />
          <p>Ads</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <p>Songs</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 rounded-full bg-[#6784a8]" />
          <p>Speech</p>
        </div>
      </div>
      {modal.region && (
        <DesignateGapModal
          onClose={handleModalClose}
          region={modal.region}
          src={src}
          isOpen={modal.open}
          broadcastId={regionProps.broadcast_id}
        />
      )}
    </div>
  );
}
