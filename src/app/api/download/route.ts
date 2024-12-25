import { NextResponse } from "next/server";
import { formatDuration } from "@/utils/format";
import {
  extractVideoId,
  getVideoInfo,
  processFormats,
} from "@/services/youtube";
import type { VideoResponse } from "@/types/youtube";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("youtube.com/") && !url.includes("youtu.be/")) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not extract video ID from URL" },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(url);

    if (!info || !info.formats) {
      throw new Error("Failed to fetch video information");
    }

    const { videoFormats, audioFormats } = processFormats(info.formats);

    const response: VideoResponse = {
      title: info.title || "Untitled Video",
      thumbnail:
        info.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: formatDuration(info.duration_string || "0:00"),
      author: info.uploader || "Unknown Author",
      views: parseInt(info.view_count?.toString() || "0").toLocaleString(),
      description: info.description
        ? info.description.slice(0, 200) + "..."
        : "No description available",
      formatGroups: {
        bestVideo: videoFormats[0]?.formats[0],
        bestAudio: audioFormats[0]?.formats[0],
        videoFormats,
        audioFormats,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Download error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Video unavailable")) {
        return NextResponse.json(
          { error: "This video is unavailable or private" },
          { status: 404 }
        );
      }
      if (error.message.includes("age-restricted")) {
        return NextResponse.json(
          { error: "This video is age-restricted and cannot be downloaded" },
          { status: 403 }
        );
      }
      if (error.message.includes("Private video")) {
        return NextResponse.json(
          { error: "This is a private video" },
          { status: 403 }
        );
      }
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process video. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
