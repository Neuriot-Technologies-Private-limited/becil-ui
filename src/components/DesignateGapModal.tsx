import { useEffect, useRef, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { FaMusic, FaPause, FaPlay, FaXmark } from "react-icons/fa6";
import { formatSecondsToHHMMSS } from "@utils/utils";
import type { AdDetectionResult } from "@/types";

interface DesignateGapModalProps {
  onClose: any;
  region: AdDetectionResult;
  src: string;
  isOpen: boolean;
  broadcastId: number;
}

export const DesignateGapModal = ({ isOpen, onClose, region, src, broadcastId }: DesignateGapModalProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiUrl = import.meta.env["VITE_API_URL"];

  const [brandArtist, setBrandArtist] = useState("");
  const [advertisementName, setAdvertisementName] = useState("");
  const [status, setStatus] = useState("Active");
  const [type, setType] = useState("ad");
  const [startTime, setStartTime] = useState(region.start_time_seconds);
  const [endTime, setEndTime] = useState(region.end_time_seconds);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const getProgress = () => {
    const num = (currentTime - region.start_time_seconds) * 100,
      den = region.end_time_seconds - region.start_time_seconds;
    return Math.max(Math.min(num / den, 100), 0);
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const res = await fetch(`${apiUrl}/broadcasts/${broadcastId}/designate_clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "brand_artist": brandArtist,
          "advertisement_name": advertisementName,
          "start_time": startTime,
          "end_time": endTime,
          "clip_type": type,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Metadata upload failed:", errorText);
      }
    } catch (err) {
      console.error(err);
      // alert("Upload failed. See console for details.");
    } finally {
      setIsUploading(false);
      setBrandArtist("");
      setAdvertisementName("");
      setStatus("Active");
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.currentTime > endTime) {
        setIsPlaying(false);
        audio.pause();
        audio.currentTime = startTime;
        setCurrentTime(startTime);
      } else {
        setCurrentTime(audio.currentTime);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, [startTime, endTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = startTime;
  }, [src]);

  function handleSlider(e: number[]) {
    const st = e[0],
      et = e[1];
    setStartTime(st);
    setEndTime(et);
    if (audioRef.current.currentTime < st) {
      audioRef.current.currentTime = st;
      setCurrentTime(st);
    } else if (audioRef.current.currentTime > et) {
      audioRef.current.currentTime = et;
      setCurrentTime(et);
    }
  }

  function handlePlay() {
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]">
      <div className="bg-black text-white px-8 py-5 rounded-lg max-w-md w-full relative modal-shadow" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Designate clip</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="">Type</label>
            <select name="" id="" className="rounded-md h-10 bg-neutral-800 focus:outline-none px-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ad">Advertisement</option>
              <option value="song">Song</option>
              <option value="speech">Speech</option>
            </select>
          </div>
          {type !== "speech" && (
            <>
              <div className="flex flex-col gap-2">
                <label>{type === "ad" ? "Brand" : "Artists"}</label>
                <input
                  type="text"
                  value={brandArtist}
                  onChange={(e) => setBrandArtist(e.target.value)}
                  required
                  className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label>{type === "ad" ? "Advertisement" : "Name"}</label>
                <input
                  type="text"
                  value={advertisementName}
                  onChange={(e) => setAdvertisementName(e.target.value)}
                  required
                  className="rounded-md h-10 bg-neutral-800 focus:outline-none px-4"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md h-10 bg-neutral-800 focus:outline-none px-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="">Duration</label>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral-400">Start</p>
                <div className="p-2 rounded-md bg-neutral-800 text-center">{formatSecondsToHHMMSS(startTime)}</div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <p className="text-sm text-neutral-400">End</p>
                <div className="p-2 rounded-md bg-neutral-800 text-center">{formatSecondsToHHMMSS(endTime)}</div>
              </div>
            </div>
            {region && (
              <>
                <Slider
                  range
                  value={[startTime, endTime]}
                  onChange={(e) => handleSlider(e as number[])}
                  min={region?.start_time_seconds}
                  max={region?.end_time_seconds}
                  trackStyle={{ backgroundColor: "orange" }}
                  handleStyle={[
                    { backgroundColor: "white", border: "2px solid orange", opacity: "100%" },
                    { backgroundColor: "white", border: "2px solid orange", opacity: "100%" },
                  ]}
                  allowCross={false}
                />
                <div className="h-2 rounded-full mt-1 relative">
                  <FaMusic className="-translate-x-1/2 transition-all absolute" style={{ left: `${getProgress()}%` }} />
                  <div className="flex justify-between items-center">
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-4 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-4 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-4 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                    <div className="w-1 h-1 bg-neutral-700" />
                  </div>
                </div>

                <div className="flex justify-between text-sm text-neutral-400">
                  <p>{formatSecondsToHHMMSS(region?.start_time_seconds)}</p>
                  <p>{formatSecondsToHHMMSS(region?.end_time_seconds)}</p>
                </div>
                <div className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm cursor-pointer" onClick={handlePlay}>
                  {src === "" ? (
                    <p>Loading...</p>
                  ) : !isPlaying ? (
                    <>
                      <FaPlay />
                      <p>Play selected clip</p>
                    </>
                  ) : (
                    <>
                      <FaPause />
                      <p>Pause</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <audio ref={audioRef} src={src === "" ? null : src} onEnded={() => setIsPlaying(false)} />

          <button
            type="submit"
            disabled={isUploading}
            className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};
