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
