import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

interface FakeWaveformProps {
  duration: number;
  resolution?: number;
  height?: number;
  color?: string;
}

const generateNaturalPeaks = (count: number): number[] =>
  Array.from({ length: count }, () => {
    const r = Math.random();
    return (Math.random() < 0.5 ? -1 : 1) * Math.pow(r, 2);
  });

const FakeWaveform: React.FC<FakeWaveformProps> = ({
  duration,
  resolution = 1000,
  height = 100,
  color = 'skyblue',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const peaks = generateNaturalPeaks(resolution);

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: color,
      progressColor: color,
      interact: false,
      cursorWidth: 0,
      peaks: [peaks],
      duration,
      url: '',

      plugins: [
        RegionsPlugin.create({
          regions: [], // we'll add after creation
        }),
      ],
    });

    const regionsPlugin = waveSurfer.getActivePlugins()
      .find(p => typeof p.clearRegions === 'function');

    // Manually add regions - we can't rely on a ready event
    regionsPlugin?.addRegion({ start: 2, end: 4, color: 'rgba(255,99,132,0.3)', drag: false, resize: false });
    regionsPlugin?.addRegion({ start: 6, end: 7.5, color: 'rgba(54,162,235,0.3)', drag: false, resize: false });

    return () => waveSurfer.destroy();
  }, [duration, resolution, height, color]);

  return <div ref={containerRef} />;
};

export default FakeWaveform;
