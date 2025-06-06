import React, { useRef, useState } from "react";
import WaveSurfer from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";

const AUDIO_URL = "/audio.mp3";

export default function Waveform ({hidden} : {hidden: boolean}){
  const wavesurferRef = useRef(null);
  const [url, setUrl] = useState();
  const [loaded, setLoaded] = useState(false);
  const regions = [
    {
      id: "intro",
      start: 0,
      end: 5,
      color: "rgba(0, 123, 255, 0.1)",
      data: { label: "Intro" },
    },
    {
      id: "speech",
      start: 6,
      end: 12,
      color: "rgba(40, 167, 69, 0.1)",
      data: { label: "Speech" },
    },
    {
      id: "music",
      start: 13,
      end: 15,
      color: "rgba(255, 193, 7, 0.1)",
      data: { label: "Music Segment" },
    },
  ];

  const handleReady = (ws) => {
    console.log("WaveSurfer is ready");
    wavesurferRef.current = ws;
  };

  const loadAudio = () => {
    setUrl(AUDIO_URL);
  };

  return (
    <div className={"p-4 border rounded shadow" + (hidden ? " hidden" : "")}>
      <WaveSurfer
        height={100}
        waveColor="#ccc"
        progressColor="#333"
        cursorColor="#000"
        url={url}
        onReady={handleReady}
        plugins={[
          RegionsPlugin.create({
            regions,
            dragSelection: false,
          }),
        ]}
      />
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={loadAudio}>
        {loaded ? "Reload Audio" : "Load Audio"}
      </button>
    </div>
  );
};
