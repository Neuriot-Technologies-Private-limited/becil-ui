
import { Tooltip } from "react-tooltip";
import type { AdDetectionResult } from "src/types";

type WaveformProps = {
  duration: number; // in seconds
  amplitudes: number[]; // array of normalized values (0-1)
  regions: AdDetectionResult[];
};

export default function Waveform({ duration, amplitudes, regions }: WaveformProps) {
  const totalBars = amplitudes.length;
  const secondsPerBar = duration / totalBars;
  console.log(secondsPerBar)
  const barHeight = 75;

  const getRegionForIndex = (index: number): AdDetectionResult | undefined => {
    const time = index * secondsPerBar;
    return regions.find(r => time >= r.start_time_seconds && time <= r.end_time_seconds);
  };

  return (
    <div className="p-4 rounded-lg">
      <div className="flex items-center relative">
        {amplitudes.map((amp, index) => {
          const region = getRegionForIndex(index);
          const height = Math.max(amp * barHeight, 15); // minimum height for visibility
          const tooltipId = `tooltip-${index}`;

          return (
            <div
              key={index}
              className={"h-full flex items-center w-[2px] " + (region ? "bg-red-100" : "")}
              style={{ height: `${barHeight * 1.2}px` }}
              data-tooltip-id={tooltipId}
              data-tooltip-content={region ? `${region.brand}: ${region.description}` : ""}
            >
              {region && <Tooltip id={tooltipId} place="top" className="z-50" />}
              <div
                className={`w-full rounded-full transition-all duration-300 ${region ? "bg-red-500" : "bg-gray-300"} relative`}
                style={{ height: `${height}px` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

