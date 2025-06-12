import React, { useRef, useState, useCallback } from "react";
import WaveSurfer from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";

const AUDIO_URL = "/audio.mp3";

export default function Waveform2 ({hidden} : {hidden: boolean}){
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [url, setUrl] = useState();
  const [loaded, setLoaded] = useState(false);
  
  const regions = [
    {
      id: "intro",
      start: 0,
      end: 5,
      color: "rgba(85, 132, 197, 0.1)",
      data: { label: "Intro" },
    },
    {
      id: "speech",
      start: 9,
      end: 12,
      color: "rgba(5, 127, 33, 0.1)",
      data: { label: "Speech" },
    },
    {
      id: "music",
      start: 12,
      end: 15,
      color: "rgba(213, 197, 149, 0.1)",
      data: { label: "Music Segment" },
    },
  ];

  const handleReady = useCallback((ws) => {
    console.log("WaveSurfer is ready");
    wavesurferRef.current = ws;
    
    // Register the regions plugin
    if (!regionsPluginRef.current) {
      regionsPluginRef.current = ws.registerPlugin(RegionsPlugin.create({
        dragSelection: false
      }));
      console.log("Regions plugin registered");
    }
  }, []);

  const handleDecode = useCallback(() => {
    console.log("Audio decoded/loaded");
    setLoaded(true);
    
    // Add regions after audio is decoded - with a small delay to ensure everything is ready
    setTimeout(() => {
      if (regionsPluginRef.current && wavesurferRef.current) {
        try {
          console.log("Attempting to add regions...");
          console.log("WaveSurfer duration:", wavesurferRef.current.getDuration());
          
          // Clear any existing regions
          regionsPluginRef.current.clearRegions();
          
          // Add each region with error handling
          regions.forEach(region => {
            try {
              console.log("Adding region:", region);
              const addedRegion = regionsPluginRef.current.addRegion({
                start: region.start,
                end: region.end,
                color: region.color,
                content: region.data?.label || region.id,
                id: region.id
              });
              console.log("Successfully added region:", region.id, addedRegion);
            } catch (regionError) {
              console.error("Error adding region:", region.id, regionError);
            }
          });
          
          console.log("Finished adding regions. Total regions:", regionsPluginRef.current.getRegions().length);
        } catch (error) {
          console.error("Error in regions setup:", error);
        }
      } else {
        console.log("Regions plugin or wavesurfer not available");
      }
    }, 100); // Small delay to ensure everything is fully initialized
  }, [regions]);

  const loadAudio = () => {
    setUrl(AUDIO_URL);
    setLoaded(false);
  };

  return (
    <div className={"p-4 border rounded shadow w-3/4" + (hidden ? " hidden" : "")}>
      <WaveSurfer
        height={100}
        barHeight={4}
        barWidth={2}
        waveColor="#ccc"
        progressColor="#333"
        cursorColor="#000"
        url={url}
        onReady={handleReady}
        onDecode={handleDecode}
      />
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={loadAudio}>
        {loaded ? "Reload Audio" : "Load Audio"}
      </button>
    </div>
  );
};
