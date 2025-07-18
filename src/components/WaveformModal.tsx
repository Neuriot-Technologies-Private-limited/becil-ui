import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import type { AdDetectionResult, Broadcast, CurDurationType } from "@/types";
import { formatSecondsToHHMMSS } from "@utils/utils";
import { useEffect, useRef, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { FaMusic, FaPause, FaPlay, FaXmark } from "react-icons/fa6";
import Waveform from "./Waveform";
import { toast } from "sonner";
import CustomToast from "./CustomToast";

type WaveformModalProps = {
  isOpen: boolean;
  onClose: () => void;
  broadcast: Broadcast;
  waveformData: { broadcast_id: number; data: AdDetectionResult[] };
  curDuration: CurDurationType;
  setCurDuration: (duration: CurDurationType) => void;
  playingBroadcastId: number;
};

export default function WaveformModal({ playingBroadcastId, isOpen, onClose, broadcast, waveformData, curDuration, setCurDuration }: WaveformModalProps) {
  const adCount = waveformData.data.filter((ad) => ad.clip_type === "ad").length;
  const totalAdDuration = waveformData.data.filter((ad) => ad.clip_type === "ad").reduce((sum, ad) => sum + ad.duration_seconds, 0);

  const [selectedRegion, setSelectedRegion] = useState<AdDetectionResult | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiUrl = import.meta.env["VITE_API_URL"];

  const [brandArtist, setBrandArtist] = useState("");
  const [advertisementName, setAdvertisementName] = useState("");
  const [status, setStatus] = useState("Active");
  const [type, setType] = useState("ad");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (selectedRegion) {
      setStartTime(selectedRegion.start_time_seconds);
      setEndTime(selectedRegion.end_time_seconds);
      setCurrentTime(selectedRegion.start_time_seconds);
      setBrandArtist("");
      setAdvertisementName("");
      setType("ad");
      setStatus("Active");
    }
  }, [selectedRegion]);

  const getProgress = () => {
    if (!selectedRegion) return 0;
    const num = (currentTime - selectedRegion.start_time_seconds) * 100;
    const den = selectedRegion.end_time_seconds - selectedRegion.start_time_seconds;
    return Math.max(Math.min(num / den, 100), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const res = await fetch(`${apiUrl}/broadcasts/${broadcast.id}/designate_clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_artist: brandArtist,
          advertisement_name: advertisementName,
          start_time: startTime,
          end_time: endTime,
          clip_type: type,
        }),
      });

      console.log(res)
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Metadata upload failed:", errorText);
      } else {
        toast.custom(() => <CustomToast status="Extraction has started for the new clip." />);
        setSelectedRegion(null); // Close form on success
        // TODO: refresh data
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
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
    async function fetchAudio() {
      try {
        const res = await fetch(`${apiUrl}/audio/broadcasts/${broadcast.filename}`);
        if (!res.ok) throw new Error("Failed to fetch audio");
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        setSrc(audioUrl);
      } catch (e: any) {
        console.log(e);
      }
    }
    if (isOpen) {
      fetchAudio();
    }
  }, [broadcast.id, broadcast.filename, apiUrl, isOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.currentTime = startTime;
  }, [src, startTime]);

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
    if (!audioRef.current) return;
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  function handleClose(){
    setSelectedRegion(null)
    onClose()
  }

  const handleNewAd = (region: AdDetectionResult) => {
    setSelectedRegion(region);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={handleClose} />
      <div className="fixed top-0 right-0 h-full w-[80vw] bg-neutral-900 text-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {broadcast.radio_station} - {broadcast.broadcast_recording}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-neutral-800">
            <FaXmark />
          </button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-6">
            <div className="flex justify-around items-center p-4 bg-neutral-800 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-neutral-400">Ad Instances</div>
                <div className="text-2xl font-bold">{adCount}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-neutral-400">Total Ad Duration</div>
                <div className="text-2xl font-bold">{formatSecondsToHHMMSS(Math.floor(totalAdDuration))}</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-neutral-800/50">
              <Waveform
                duration={broadcast.duration}
                filename={broadcast.filename}
                playingBroadcastId={playingBroadcastId}
                regionProps={waveformData}
                curDuration={curDuration}
                setCurDuration={setCurDuration}
                onNewAd={handleNewAd}
              />
            </div>
            <div className="h-64 overflow-y-auto border border-neutral-800 rounded-lg">
              <Table className="dark">
                <TableHeader>
                  <TableRow className="border-neutral-700 hover:bg-neutral-800">
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Description</TableHead>
                    <TableHead className="text-white">Start Time</TableHead>
                    <TableHead className="text-white">End Time</TableHead>
                    <TableHead className="text-white">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waveformData.data.map((item, index) => (
                    <TableRow key={index} className="border-neutral-800 hover:bg-neutral-800">
                      <TableCell>{item.clip_type === "ad" ? "Ad" : item.clip_type === "song" ? "Song" : item.clip_type === "speech" ? "Speech" : "Empty"}</TableCell>
                      <TableCell>{item.brand || "N/A"}</TableCell>
                      <TableCell>{formatSecondsToHHMMSS(item.start_time_seconds)}</TableCell>
                      <TableCell>{formatSecondsToHHMMSS(item.end_time_seconds)}</TableCell>
                      <TableCell>{formatSecondsToHHMMSS(item.duration_seconds)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="col-span-1">
            {selectedRegion ? (
              <div className="bg-neutral-800/50 rounded-lg p-6 sticky top-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Designate clip</h2>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
                  {/* Form content from DesignateGapModal */}
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
                    {selectedRegion && (
                      <>
                        <Slider
                          range
                          value={[startTime, endTime]}
                          onChange={(e) => handleSlider(e as number[])}
                          min={selectedRegion?.start_time_seconds}
                          max={selectedRegion?.end_time_seconds}
                          trackStyle={{ backgroundColor: "orange" }}
                          handleStyle={[{ backgroundColor: "white", border: "2px solid orange" }, { backgroundColor: "white", border: "2px solid orange" }]}
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
                          <p>{formatSecondsToHHMMSS(selectedRegion?.start_time_seconds)}</p>
                          <p>{formatSecondsToHHMMSS(selectedRegion?.end_time_seconds)}</p>
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
                  <audio ref={audioRef} src={src === "" ? undefined : src} onEnded={() => setIsPlaying(false)} />

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer"
                  >
                    Submit
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-neutral-800/50 rounded-lg p-6 sticky top-0 flex items-center justify-center h-full">
                <p className="text-neutral-400 text-center">Select a gap in the waveform to designate it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
