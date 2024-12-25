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

      try {
        // Copy binary to /tmp
        fs.copyFileSync(
          path.join(process.cwd(), "public", "yt-dlp"),
          binaryPath
        );
        // Make it executable
        execSync(`chmod +x ${binaryPath}`);
        // Test the binary
        execSync(`${binaryPath} --version`);
      } catch (error) {
        console.error("Error setting up yt-dlp:", error);
        return NextResponse.json(
          { error: "Failed to initialize video downloader" },
          { status: 500 }
        );
      }
    }

    console.log("Using binary path:", binaryPath);

    try {
      const { stdout } = await execFileAsync(
        binaryPath,
        [
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
        ],
        {
          timeout: 30000, // 30 seconds timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

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
        views: parseInt(
          videoInfo.view_count?.toString() || "0"
        ).toLocaleString(),
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
      console.error("Error executing yt-dlp:", error);
      return NextResponse.json(
        { error: "Failed to process video info" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in request handler:", error);
    return NextResponse.json(
      { error: "Failed to handle request" },
      { status: 500 }
    );
  }
}
