export type FormatType = "Video + Audio" | "Audio Only";
export type VideoQuality = "4K" | "1440p" | "1080p" | "720p" | "480p" | "360p";

export interface VideoFormat {
  format_id: string;
  ext?: string;
  height?: number;
  width?: number;
  vcodec: string;
  acodec: string;
  filesize?: number;
  fps?: number;
  url: string;
  asr?: number;
  abr?: number;
  quality?: string;
  format_note?: string;
}

export interface ProcessedFormat {
  itag: string;
  quality: string;
  mimeType: string;
  url: string;
  hasAudio: boolean;
  hasVideo: boolean;
  fileSize?: string;
  fps?: number;
  audioBitrate?: string;
  videoQuality?: string;
  type: FormatType;
  label: string;
  ext?: string;
  height?: number;
}

export interface VideoInfo {
  title?: string;
  formats: VideoFormat[];
  thumbnail?: string;
  duration_string?: string;
  uploader?: string;
  view_count?: number;
  description?: string;
}

export interface FormatGroup {
  label: string;
  formats: ProcessedFormat[];
}

export interface VideoResponse {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  views: string;
  description: string;
  formatGroups: {
    bestVideo: ProcessedFormat;
    bestAudio: ProcessedFormat;
    videoFormats: FormatGroup[];
    audioFormats: FormatGroup[];
  };
}
