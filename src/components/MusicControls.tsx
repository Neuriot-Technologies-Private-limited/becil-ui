import { formatSecondsToHHMMSS } from "@/utils/utils";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { MdFastRewind, MdFastForward } from "react-icons/md";

type MusicPlayerProps = {
  audioSrc: string;
  header: string;
  title: string;
  duration: number;
  curDurationProp: {duration: number, source: string};
  setCurDuration: (arg0: {duration: number, source: "controls" | "waveform"}) => void;
  setAudioSrc: (arg0: string) => void;
  setPlayingAudioId: (arg0: number) => void;
};

export default function MusicControls({ audioSrc, setAudioSrc, setPlayingAudioId, header, title, duration, curDurationProp, setCurDuration }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if(curDurationProp.duration){
      audio.currentTime = curDurationProp.duration;
    }

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(percent) ? 0 : percent);
      setCurDuration({duration: audio.currentTime, source: "controls"});
      setCurrentTime(audio.currentTime)
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  useEffect(() => {
    if(audioRef.current && curDurationProp.source === "waveform"){
      audioRef.current.currentTime = curDurationProp.duration;
      console.log('this')
    }
  }, [curDurationProp, audioRef])

  useEffect(() => {
    setIsPlaying(true)
    audioRef.current!.play()
  }, [audioSrc])


  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    let newTime = audio.currentTime + seconds;
    newTime = Math.max(0, Math.min(newTime, audio.duration));
    audio.currentTime = newTime;
  };

  function handleClose(){
    setAudioSrc("")
    setPlayingAudioId(-1);
    setCurrentTime(0)
    setCurDuration({duration: 0, source: 'controls'})
  }

  return (
    <div
      className="fixed left-1/2 z-50 w-[min(100%-1.25rem,36rem)] max-w-xl -translate-x-1/2 rounded-2xl bg-neutral-600 px-3 py-3 text-white shadow-lg sm:px-4 sm:py-4"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start sm:gap-2">
            <button type="button" onClick={() => seekBy(-60)} title="Back 1 min" className="hidden text-white hover:text-orange-400 sm:inline-flex">
              <MdFastRewind size={22} />
            </button>
            <button type="button" onClick={() => seekBy(-5)} title="Back 5 sec" className="text-white hover:text-orange-400">
              <MdFastRewind size={18} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="mx-1 rounded-full bg-white p-2.5 text-black transition hover:bg-gray-300 sm:p-3"
            >
              {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
            </button>
            <button type="button" onClick={() => seekBy(5)} title="Forward 5 sec" className="text-white hover:text-orange-400">
              <MdFastForward size={18} />
            </button>
            <button type="button" onClick={() => seekBy(60)} title="Forward 1 min" className="hidden text-white hover:text-orange-400 sm:inline-flex">
              <MdFastForward size={22} />
            </button>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden pr-7 sm:pr-8">
            <div className="truncate text-sm font-medium">{header}</div>
            <div className="mb-1 truncate text-xs text-gray-300">{title}</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-700">
              <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>{formatSecondsToHHMMSS(currentTime)}</span>
              <span>{formatSecondsToHHMMSS(duration)}</span>
            </div>
          </div>
      </div>
      <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} />
      <button
        type="button"
        className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-neutral-700 text-neutral-400 hover:bg-neutral-500 hover:text-white sm:size-6"
        onClick={handleClose}
        aria-label="Close player"
      >
        <FaXmark size={12} />
      </button>
    </div>
  );
}
