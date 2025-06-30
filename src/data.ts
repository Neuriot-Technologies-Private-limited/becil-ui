import { v4 as uuidv4 } from 'uuid';
import { type AdDetectionResult } from './types';

export const sampleBroadcasts = [
  {
    radio_station: "Radio One 101.2 FM",
    broadcast_recording: "https://example.com/audio/morning-show.mp3",
    duration: 3600,
    broadcast_date: new Date("2025-06-10T08:00:00Z"),
    status: "completed"
  },
  {
    radio_station: "City Beats 99.5",
    broadcast_recording: "https://example.com/audio/evening-vibes.mp3",
    duration: 2700,
    broadcast_date: new Date("2025-06-09T18:30:00Z"),
    status: "scheduled"
  },
  {
    radio_station: "TalkTime 88.3",
    broadcast_recording: "https://example.com/audio/talkshow-ep42.mp3",
    duration: 5400,
    broadcast_date: new Date("2025-06-08T14:15:00Z"),
    status: "cancelled"
  }
];

export const emptyAdSlot: AdDetectionResult = {
  id: uuidv4(),
  ad_id: -1,
  broadcast_id: 0,
  brand: "Empty Slot",
  clip_type: "empty",
  description: "",
  start_time_seconds: 0,
  end_time_seconds: 0,
  duration_seconds: 0,
  correlation_score: 0,
  raw_correlation: 0,
  mfcc_correlation: 0,
  overlap_duration: 0,
  detection_timestamp: "",
  processing_status: "",
  total_matches_found: 0,
};
