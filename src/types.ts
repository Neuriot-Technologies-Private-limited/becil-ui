export interface Broadcast{
  id: number;
  radio_station: string;
  broadcast_recording: string;
  duration: number;
  broadcast_date: Date;
  filename: string;
  status: string;
  city: string;
  language: string;
}

export interface AdMaster{
  id: number;
  brand: string;
  advertisement: string;
  upload_date: Date;
  duration: number;
  filename: string;
  status: string;
  city: string;
  language: string;
  category: string;
  radio_station: string;
  creation_date: Date;
}

export interface AdDetectionResult {
  id: string | number;
  ad_id: number;
  broadcast_id: number;
  brand: string;
  description: string;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  correlation_score: number;
  raw_correlation: number;
  mfcc_correlation: number;
  overlap_duration: number;
  detection_timestamp: string;
  clip_type: string;
  processing_status: string;
  total_matches_found: number;
}

export interface CurDurationType{
  duration: number;
  source: "controls" | "waveform";
}

export interface SongMaster{
  id: number;
  artist: string;
  name: string;
  upload_date: Date;
  duration: number;
  filename: string;
  status: string;
}

/** @deprecated Use RjClip instead */
export interface RjMaster{
  id: number;
  rj_name: string;
  show_name: string;
  upload_date: Date;
  duration: number;
  filename: string;
  status: string;
}

/** Matches backend RJClipOut schema */
export interface RjClip {
  id: number;
  rj_name: string | null;
  radio_station: string | null;
  filename: string;
  duration: number | null;
  status: string;
  broadcast_id: number | null;
  start_sec: number | null;
  end_sec: number | null;
  upload_date: string;
  transcript_romanized: string | null;
  transcript_hindi: string | null;
}

/** Matches backend RJBrandMentionOut schema */
export interface RjBrandMention {
  id: number;
  rj_clip_id: number;
  brand: string;
  matched_text: string | null;
  start_sec: number | null;
  end_sec: number | null;
  match_score: number | null;
  transcript_fragment: string | null;
  created_at: string;
}
