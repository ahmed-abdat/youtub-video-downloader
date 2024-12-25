export function formatDuration(duration: string): string {
  const parts = duration.split(":").map((part) => parseInt(part));
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  return duration;
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
}

export function getQualityLabel(height?: number): string {
  if (!height) return "360p";
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  return "360p";
}

export function getAudioQualityLabel(bitrate: number): string {
  if (bitrate >= 256) return "High";
  if (bitrate >= 128) return "Medium";
  return "Low";
}
