import { NextResponse } from "next/server";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { formatDuration } from "@/utils/format";
import { processFormats } from "@/services/youtube";

const execFileAsync = promisify(execFile);

interface YTDLInfo {
  title: string;
  thumbnail: string;
  formats: any[];
  duration_string: string;
  uploader: string;
  view_count: number;
  description: string;
  id: string;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Set binary path based on environment
    const binaryPath =
      process.env.NODE_ENV === "development"
        ? "./yt-dlp.exe" // Use relative path for development
        : "/tmp/yt-dlp"; // Use /tmp directory in production

    // In production, copy the binary to /tmp and make it executable
    if (process.env.NODE_ENV !== "development") {
      const fs = require("fs");
      const { execSync } = require("child_process");

      // Copy binary to /tmp
      fs.copyFileSync(path.join(process.cwd(), "public", "yt-dlp"), binaryPath);
      // Make it executable
      execSync(`chmod +x ${binaryPath}`);
    }

    console.log("Using binary path:", binaryPath);

    const { stdout } = await execFileAsync(binaryPath, [
      url,
      "--dump-single-json",
      "--no-warnings",
      "--prefer-free-formats",
      "--no-check-certificates",
      "--format",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
      "--add-header",
      "referer:youtube.com",
      "--add-header",
      `user-agent:${process.env.USER_AGENT || "Mozilla/5.0"}`,
    ]);

    const videoInfo = JSON.parse(stdout) as YTDLInfo;

    if (!videoInfo || !videoInfo.formats) {
      throw new Error("Failed to fetch video information");
    }

    const { videoFormats, audioFormats } = processFormats(videoInfo.formats);

    const response = {
      title: videoInfo.title || "Untitled Video",
      thumbnail:
        videoInfo.thumbnail ||
        `https://i.ytimg.com/vi/${videoInfo.id}/maxresdefault.jpg`,
      duration: formatDuration(videoInfo.duration_string || "0:00"),
      author: videoInfo.uploader || "Unknown Author",
      views: parseInt(videoInfo.view_count?.toString() || "0").toLocaleString(),
      description: videoInfo.description
        ? videoInfo.description.slice(0, 200) + "..."
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
    console.error("Error fetching video info:", error);
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}
