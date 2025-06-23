import { formatSecondsToHHMMSS, getRandomOrangeHex } from "@utils/utils";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { emptyAdSlot } from "/src/data";
import type { AdDetectionResult } from "src/types";

type WaveformProps = {
  duration: number;
  amplitudes: number[];
  regionProps: {broadcast_id: number, data: AdDetectionResult[]}
  curDuration: {duration: number, source: string};
  setCurDuration: any;
  playingBroadcastId: number;
};

export default function Waveform({ duration, amplitudes, regionProps, curDuration, setCurDuration, playingBroadcastId }: WaveformProps) {
  const totalBars = amplitudes.length;
  const secondsPerBar = duration / totalBars;
  const barHeight = 75, barWidth = 2;

  const [regions, setRegions] = useState<AdDetectionResult[]>([]);
  const [colors, setColors] = useState<Record<string | number, string>>({});
  const getRegionForIndex = (index: number): AdDetectionResult => {
    const time = Math.floor(index * secondsPerBar);
    const res = regions.find((r) => time >= r.start_time_seconds && time <= r.end_time_seconds);
    return res!;
  };

  const manipulateRegions = (regions: AdDetectionResult[]) => {
    // Sort regions by start time and round start and end times
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

    // Add empty time slot regions to regions
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

    // Add empty time slot between last ad
    // occurence and broadcast end, if exists
    if (lastAd!) {
      if (lastAd.end_time_seconds < duration - 1) {
        const newRegion = { ...emptyAdSlot };
        newRegion.start_time_seconds = lastAd.end_time_seconds + 1;
        newRegion.end_time_seconds = duration;
        newRegions.push(newRegion);
      }
    }
    return newRegions;
  };

  function handleSeek(time: number){
    if(regionProps.broadcast_id === playingBroadcastId)
      setCurDuration({duration: time, source: "waveform"})
  }

  useEffect(() => {
    const newRegions = manipulateRegions(regionProps.data);
    setRegions(newRegions);
    const colorMap: Record<string | number, string> = {};
    for (const r of newRegions) {
      if (r.ad_id === -1) {
        colorMap[r.ad_id] = "#222222";
      } else {
        colorMap[r.ad_id] = getRandomOrangeHex();
      }
    }
    setColors(colorMap);
  }, [regionProps]);

  if (!regions.length) {
    return <div>Loading Waveform...</div>;
  }

  return (
    <div className="p-4 rounded-lg">
      <div className="flex items-center relative">
        <div className={"bg-[#FFFFFF22] border-r-2 border-white absolute h-full left-0 w-12 pointer-events-none z-20 " + (regionProps.broadcast_id !== playingBroadcastId ? "hidden" : "")} style={{width: `${barWidth * curDuration.duration / secondsPerBar}px`}}></div>
        {amplitudes.map((amp, index) => {
          const region = getRegionForIndex(index);
          const height = Math.max(amp * barHeight, 15); // minimum height for visibility
          const tooltipId = `tooltip-${index}`;

          return (
            <div
              key={index}
              className={"h-full flex items-center relative " + (region.ad_id !== -1 ? "" : "bg-neutral-200")}
              style={{ height: `${barHeight * 1.2}px`, width: `${barWidth}px` }}
              data-tooltip-id={tooltipId}
              data-tooltip-content={
                region ? `${region.brand}  |  ${formatSecondsToHHMMSS(region.start_time_seconds)} - ${formatSecondsToHHMMSS(region.end_time_seconds)}` : ""
              }
              onClick={() => handleSeek(index * secondsPerBar)}
            >
              {region && <Tooltip id={tooltipId} place="top" className="z-50" />}
              <div
                className={`w-full rounded-full transition-all duration-300 relative`}
                style={{ height: `${height}px`, backgroundColor: colors[region.ad_id]}}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
