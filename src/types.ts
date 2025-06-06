export interface Broadcast{
  radio_station: string;
  broadcast_recording: string;
  duration: number;
  broadcast_date: Date;
  status: string;
}

export interface AdMaster{
  brand: string;
  advertisement: string;
  upload_date: Date;
  duration: number;
  status: string;
}
