import { formatSecondsToHHMMSS } from "@utils/utils";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

type MusicPlayerProps = {
  audioSrc: string;
  header: string;
  title: string;
  duration: number;
};

export default function MusicControls({ audioSrc, header, title, duration }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(percent) ? 0 : percent);
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

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

  return (
    <div className="fixed bottom-0 left-0 w-80 shadow-md bg-neutral-700 text-white p-4 flex items-center justify-between z-50 rounded-t-xl">
      <div className="flex items-center gap-4 w-full">
        <button
          onClick={togglePlay}
          className="bg-white text-black p-3 rounded-full hover:bg-gray-300 transition"
        >
          {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} />}
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="text-sm font-medium truncate">{header}</div>
          <div className="text-xs text-gray-300 truncate">{title}</div>
          <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>{formatSecondsToHHMMSS(currentTime)}</span>
            <span>{formatSecondsToHHMMSS(duration)}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)}/>
    </div>
  );
}

