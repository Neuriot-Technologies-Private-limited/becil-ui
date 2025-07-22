import { formatSecondsToHHMMSS, getRandomHex, generateAmplitudes, deterministicRandomFromList } from "@utils/utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { Tooltip } from "react-tooltip";
import { emptyAdSlot } from "@/data";
import type { AdDetectionResult } from "@/types";
import { Slider } from "@components/ui/slider";

type WaveformProps = {
  duration: number;
  regionProps: { broadcast_id: number; data: AdDetectionResult[] };
  currentTime: number;
  filename: string;
  setSelectedRegion: any;
  onSeek: (time: number) => void;
};

const MIN_ZOOM_SECONDS = 20;
const WAVEFORM_HEIGHT = 90;

export default function Waveform({ duration, regionProps, currentTime, setCurrentTime, filename, setSelectedRegion, onSeek }: WaveformProps) {
  const [fullAmplitudes, setFullAmplitudes] = useState<number[]>([]);
  const [regions, setRegions] = useState<AdDetectionResult[]>([]);
  const [colors, setColors] = useState<Record<string | number, string>>({});
  const [viewRange, setViewRange] = useState<[number, number]>([0, duration]);

  const viewStart = viewRange[0];
  const viewDuration = viewRange[1] - viewRange[0];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    const newAmplitudes = generateAmplitudes(filename, duration);
    setFullAmplitudes(newAmplitudes);
    setViewRange([0, duration]);
  }, [filename, duration]);

  const manipulateRegions = (regions: AdDetectionResult[]) => {
    regions.sort((a, b) => a.start_time_seconds - b.start_time_seconds);
    const rs = [];
    let last_end_time = -1;
    for (const r of regions) {
      let start_time = Math.floor(r.start_time_seconds);
      if (start_time <= last_end_time) start_time += 1;

      r.start_time_seconds = start_time;
      r.end_time_seconds = Math.floor(r.end_time_seconds);
      last_end_time = r.end_time_seconds;
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

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || fullAmplitudes.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = WAVEFORM_HEIGHT * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pointsPerSecond = fullAmplitudes.length / duration;
    const startIndex = Math.floor(viewStart * pointsPerSecond);
    const endIndex = Math.floor((viewStart + viewDuration) * pointsPerSecond);
    const visibleAmplitudes = fullAmplitudes.slice(startIndex, endIndex);

    const barWidth = 2;
    const numBars = Math.floor(rect.width / barWidth);
    const step = Math.max(1, Math.floor(visibleAmplitudes.length / numBars));

    ctx.fillStyle = "#ccc";
    for (let i = 0; i < numBars; i++) {
      const chunkStart = i * step;
      const chunkEnd = chunkStart + step;
      const chunk = visibleAmplitudes.slice(chunkStart, chunkEnd);
      if (chunk.length === 0) continue;

      const amp = deterministicRandomFromList(chunk);
      const minAmp = Math.min(...chunk, 1);
      const maxAmp = Math.max(...chunk, 0);

      const barHeight = (maxAmp - minAmp) * WAVEFORM_HEIGHT;
      // const barHeight = (amp) * WAVEFORM_HEIGHT;
      const x = i * barWidth;
      const y = (WAVEFORM_HEIGHT - barHeight) / 2;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [fullAmplitudes, duration, viewStart, viewDuration]);

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [drawWaveform]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
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
    const newViewEnd = clampedViewStart + clampedViewDuration;

    setViewRange([clampedViewStart, Math.min(newViewEnd, duration)]);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = viewStart + (clickX / rect.width) * viewDuration;
    onSeek(seekTime);
  };

  const handleSliderChange = (newRange: [number, number]) => {
    if (newRange[1] - newRange[0] < MIN_ZOOM_SECONDS) {
      newRange[1] = newRange[0] + MIN_ZOOM_SECONDS;
    }
    setViewRange(newRange);
  };

  return (
    <div className="p-4 rounded-lg w-full">
      <div
        ref={containerRef}
        className="relative cursor-pointer w-full overflow-hidden"
        onWheel={handleWheel}
        onClick={handleSeek}
        style={{ height: `${WAVEFORM_HEIGHT * 1.2}px` }}
      >
        <canvas ref={canvasRef} className="w-full" style={{ height: `${WAVEFORM_HEIGHT}px` }} />
        {regions.map((region, idx) => {
          const left = ((region.start_time_seconds - viewStart) / viewDuration) * 100;
          const width = ((region.end_time_seconds - region.start_time_seconds + 1) / viewDuration) * 100;
          const color = colors[`${region.ad_id}-${region.clip_type}`] || "#FFFFFF22";
          const tooltipId = `region-tooltip-${idx}`;

          if (region.end_time_seconds < viewStart || region.start_time_seconds > viewStart + viewDuration) {
            return null;
          }

          return (
            <>
              <div
                key={idx}
                className="absolute top-0"
                style={{ left: `${left}%`, height: `${WAVEFORM_HEIGHT}px`, width: `${width}%`, backgroundColor: `${color}80` }}
                data-tooltip-id={tooltipId}
                data-tooltip-content={`${region.brand} | ${formatSecondsToHHMMSS(region.start_time_seconds)} - ${formatSecondsToHHMMSS(region.end_time_seconds)}`}
              >
                <Tooltip id={tooltipId} place="left" float={true} className="z-50" />
              </div>
              {region.clip_type === "empty" && (
                <div
                  className="absolute bottom-2 h-2 w-2 rounded-full bg-black cursor-pointer"
                  style={{
                    left: `${left + width / 2}%`,
                    translate: `-50% 0%`,
                    boxShadow: "0px 0px 2px 1px white",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRegion(region);
                  }}
                />
              )}
            </>
          );
        })}
        <div
          className="bg-white absolute h-full top-0 pointer-events-none z-20"
          style={{
            left: `${((currentTime - viewStart) / viewDuration) * 100}%`,
            height: `${WAVEFORM_HEIGHT}px`,
            width: "2px",
          }}
        />
      </div>
      <div className="w-full !my-4">
        <Slider
          min={0}
          max={duration}
          step={0.1}
          value={viewRange}
          onValueChange={handleSliderChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer dark"
        />
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
    </div>
  );
}
