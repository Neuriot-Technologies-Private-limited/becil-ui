import { formatSecondsToHHMMSS } from "@utils/utils";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { MdFastRewind, MdFastForward } from "react-icons/md";

type MusicPlayerProps = {
  audioSrc: string;
  header: string;
  title: string;
  duration: number;
  curDurationProp: {duration: number, source: string};
  setCurDuration: (arg0: {duration: number, source: string}) => void;
};

export default function MusicControls({ audioSrc, header, title, duration, curDurationProp, setCurDuration }: MusicPlayerProps) {
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

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-[calc(50%-12rem)] w-[500px] shadow-md bg-neutral-700 text-white p-4 flex items-center justify-between z-50 rounded-2xl">
      <div className="flex items-center gap-4 w-full">
        {/* Seek buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => seekBy(-60)} title="Back 1 min" className="text-white hover:text-orange-400">
            <MdFastRewind size={24} />
          </button>
          <button onClick={() => seekBy(-5)} title="Back 5 sec" className="text-white hover:text-orange-400">
            <MdFastRewind size={18} />
          </button>

          <button onClick={togglePlay} className="bg-white text-black p-3 rounded-full hover:bg-gray-300 transition !mx-2">
            {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} />}
          </button>
          <button onClick={() => seekBy(5)} title="Forward 5 sec" className="text-white hover:text-orange-400">
            <MdFastForward size={18} />
          </button>
          <button onClick={() => seekBy(60)} title="Forward 1 min" className="text-white hover:text-orange-400">
            <MdFastForward size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="text-sm font-medium truncate">{header}</div>
          <div className="text-xs text-gray-300 truncate !mb-1">{title}</div>
          <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
            <div className="bg-orange-500 h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>{formatSecondsToHHMMSS(currentTime)}</span>
            <span>{formatSecondsToHHMMSS(duration)}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} />
    </div>
  );
}
