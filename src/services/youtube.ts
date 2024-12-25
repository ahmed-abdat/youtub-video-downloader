import youtubeDl from "youtube-dl-exec";
import {
  formatFileSize,
  getQualityLabel,
  getAudioQualityLabel,
} from "@/utils/format";
import type {
  VideoInfo,
  VideoFormat,
  ProcessedFormat,
  FormatGroup,
} from "@/types/youtube";

// Create a custom instance with the correct binary path
const yt = youtubeDl.create(process.env.YTDL_BIN_PATH || "./yt-dlp.exe");

export function extractVideoId(url: string): string {
  const normalMatch = url.match(/[?&]v=([^&]+)/);
  if (normalMatch) return normalMatch[1];

  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  return "";
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  try {
    // First, get the best available audio format
    const audioInfo = (await yt(url, {
      dumpSingleJson: true,
      format: "bestaudio",
      noPlaylist: true,
    })) as VideoInfo;

    const bestAudio = audioInfo.formats
      .filter((f) => f.vcodec === "none" && f.acodec !== "none" && f.abr)
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

    // Then get all video formats and merge with best audio
    const info = (await yt(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: "bestvideo+bestaudio/best", // Get best quality formats
      mergeOutputFormat: "mp4",
      embedThumbnail: true,
      addMetadata: true,
      noPlaylist: true,
      addHeader: [
        "referer:youtube.com",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    })) as VideoInfo;

    // Filter and process formats
    const validFormats = info.formats
      .filter((format) => {
        // Exclude storyboard or other special formats
        if (format.format_note?.includes("storyboard")) return false;
        if (format.ext === "mhtml") return false;

        // Only keep formats with valid URLs and both audio + video
        if (!format.url) return false;
        if (format.vcodec !== "none" && format.acodec !== "none") {
          return true;
        }
        return false;
      })
      .map((format) => {
        // Merge best audio's bitrate if missing
        if (!format.abr && bestAudio) {
          return {
            ...format,
            abr: bestAudio.abr,
            format_note: `${format.height || "?"}p${
              format.fps ? format.fps : ""
            } + ${bestAudio.abr}k`,
          };
        }
        return format;
      })
      .sort((a, b) => {
        const heightA = a.height || 0;
        const heightB = b.height || 0;
        if (heightA !== heightB) return heightB - heightA; // higher res first
        const fpsA = a.fps || 30;
        const fpsB = b.fps || 30;
        if (fpsA !== fpsB) return fpsB - fpsA; // higher fps first
        const abrA = a.abr || 0;
        const abrB = b.abr || 0;
        return abrB - abrA; // higher audio bitrate next
      });

    // Get audio-only formats
    const audioFormats = audioInfo.formats
      .filter((f) => f.vcodec === "none" && f.acodec !== "none" && f.abr)
      .sort((a, b) => (b.abr || 0) - (a.abr || 0));

    // Combine video and audio formats
    info.formats = [...validFormats, ...audioFormats];

    console.log(
      "Available formats:",
      info.formats.map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        height: f.height,
        vcodec: f.vcodec,
        acodec: f.acodec,
        filesize: f.filesize,
        fps: f.fps,
        abr: f.abr,
        format_note: f.format_note,
      }))
    );

    return info;
  } catch (error) {
    console.error("Error fetching video info:", error);
    throw error;
  }
}

export function processFormats(formats: VideoFormat[]): {
  videoFormats: FormatGroup[];
  audioFormats: FormatGroup[];
} {
  console.log("Processing formats:", formats.length);

  const processedFormats = formats
    .filter((format) => {
      // Only include formats with both video and audio
      const isValid =
        format.url && format.vcodec !== "none" && format.acodec !== "none"; // Removed height requirement

      if (isValid) {
        console.log("Valid format:", {
          id: format.format_id,
          vcodec: format.vcodec,
          acodec: format.acodec,
          ext: format.ext,
          height: format.height,
          abr: format.abr,
          format_note: format.format_note,
        });
      }

      return isValid;
    })
    .map((format): ProcessedFormat => {
      const height = format.height ?? 0;
      const quality = getQualityLabel(height);
      const fileSize = format.filesize
        ? formatFileSize(format.filesize)
        : "Unknown size";

      const label = `${quality} • ${format.fps ?? 30}fps • ${
        format.ext?.toUpperCase() ?? "MP4"
      }${format.abr ? ` • ${format.abr}kbps Audio` : ""}${
        fileSize !== "Unknown size" ? ` • ${fileSize}` : ""
      }`;

      return {
        itag: format.format_id,
        quality,
        mimeType: `video/${format.ext || "mp4"}`,
        url: format.url,
        hasAudio: true,
        hasVideo: true,
        fileSize,
        fps: format.fps ?? undefined,
        audioBitrate: format.abr ? `${format.abr}kbps` : undefined,
        videoQuality: format.format_note ?? undefined,
        type: "Video + Audio",
        label,
        ext: format.ext ?? "mp4",
        height,
      };
    });

  console.log("Processed formats:", processedFormats.length);

  const videoFormats = processedFormats;
  const audioFormats = formats
    .filter((f) => f.vcodec === "none" && f.acodec !== "none" && f.abr)
    .map((format): ProcessedFormat => {
      const bitrate = format.abr ? `${format.abr}kbps` : "";
      const fileSize = format.filesize
        ? formatFileSize(format.filesize)
        : "Unknown size";

      const label = `${getAudioQualityLabel(format.abr ?? 0)} Quality • ${
        format.ext?.toUpperCase() ?? "MP3"
      }${bitrate ? ` • ${bitrate}` : ""}${
        fileSize !== "Unknown size" ? ` • ${fileSize}` : ""
      }`;

      return {
        itag: format.format_id,
        quality: "Audio",
        mimeType: `audio/${format.ext || "mp3"}`,
        url: format.url,
        hasAudio: true,
        hasVideo: false,
        fileSize,
        audioBitrate: format.abr ? `${format.abr}kbps` : undefined,
        type: "Audio Only",
        label,
        ext: format.ext ?? "mp3",
        height: 0,
      };
    });

  const videoGroups: FormatGroup[] = [
    {
      label: "Ultra High Quality (2160p/4K)",
      formats: videoFormats.filter((f) => (f.height ?? 0) >= 2160),
    },
    {
      label: "Quad HD Quality (1440p)",
      formats: videoFormats.filter(
        (f) => (f.height ?? 0) >= 1440 && (f.height ?? 0) < 2160
      ),
    },
    {
      label: "Full HD Quality (1080p)",
      formats: videoFormats.filter(
        (f) => (f.height ?? 0) >= 1080 && (f.height ?? 0) < 1440
      ),
    },
    {
      label: "HD Quality (720p)",
      formats: videoFormats.filter(
        (f) => (f.height ?? 0) >= 720 && (f.height ?? 0) < 1080
      ),
    },
    {
      label: "Standard Definition (480p)",
      formats: videoFormats.filter(
        (f) => (f.height ?? 0) >= 480 && (f.height ?? 0) < 720
      ),
    },
    {
      label: "Low Definition (360p and below)",
      formats: videoFormats.filter((f) => (f.height ?? 0) < 480),
    },
  ].filter((group) => group.formats.length > 0);

  const audioGroups: FormatGroup[] = [
    {
      label: "High Quality Audio (256kbps+)",
      formats: audioFormats.filter((f) => {
        const bitrate = parseInt(f.audioBitrate?.replace(/kbps.*$/, "") ?? "0");
        return bitrate >= 256;
      }),
    },
    {
      label: "Medium Quality Audio (128-255kbps)",
      formats: audioFormats.filter((f) => {
        const bitrate = parseInt(f.audioBitrate?.replace(/kbps.*$/, "") ?? "0");
        return bitrate >= 128 && bitrate < 256;
      }),
    },
  ].filter((group) => group.formats.length > 0);

  return { videoFormats: videoGroups, audioFormats: audioGroups };
}
