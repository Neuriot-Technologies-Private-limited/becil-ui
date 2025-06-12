export function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const paddedHrs = String(hrs).padStart(2, '0');
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
}

export function getLastSegment(url: string) {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

function mulberry32(seed: number) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash >>> 0; // Ensure it's positive
}

// Generate deterministic amplitudes
export function generateAmplitudes(seedInput: string, count = 500): number[] {
  const seed = stringToSeed(seedInput);
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => rand() * 0.9 + 0.1);
}


export function formatSecondsToHHMMSS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}
