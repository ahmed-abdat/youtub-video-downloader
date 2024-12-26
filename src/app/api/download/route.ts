import { NextResponse } from "next/server";
import path from "path";
import { execFile, execSync } from "child_process";
import { promisify } from "util";
import fs from "fs";
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

async function setupBinary(sourcePath: string, targetPath: string) {
  try {
    // Copy file using cp command
    execSync(`cp "${sourcePath}" "${targetPath}"`);

    // Make it executable
    execSync(`chmod +x "${targetPath}"`);

    // Add Python packages to PYTHONPATH
    const pythonPath = `${process.env.HOME}/.local/lib/python3.9/site-packages`;
    process.env.PYTHONPATH = process.env.PYTHONPATH
      ? `${process.env.PYTHONPATH}:${pythonPath}`
      : pythonPath;

    // Verify yt-dlp is available
    try {
      execSync("python3 -m yt_dlp --version");
    } catch (error) {
      console.error("yt-dlp not available:", error);
      return false;
    }

    // Verify the file exists and is executable
    const stats = await fs.promises.stat(targetPath);
    const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);

    if (!isExecutable) {
      throw new Error("Binary is not executable");
    }

    // Log file information for debugging
    console.log("Binary setup complete:", {
      size: stats.size,
      mode: stats.mode.toString(8),
      isExecutable,
      pythonPath: process.env.PYTHONPATH,
      ytdlpVersion: execSync("python3 -m yt_dlp --version").toString(),
    });

    return true;
  } catch (error) {
    console.error("Error setting up binary:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Set binary path based on environment
    const binaryPath =
      process.env.YTDL_BIN_PATH ||
      (process.env.NODE_ENV === "development" ? "./yt-dlp.exe" : "/tmp/yt-dlp");

    // In production, set up the binary
    if (process.env.NODE_ENV === "production") {
      const sourcePath = path.join(process.cwd(), "public", "yt-dlp");
      const success = await setupBinary(sourcePath, binaryPath);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to initialize video downloader" },
          { status: 500 }
        );
      }
    }

    console.log("Using binary path:", binaryPath);

    try {
      const { stdout } = await execFileAsync(
        "python3",
        [
          "-m",
          "yt_dlp",
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
          env: {
            ...process.env,
            PYTHONPATH:
              process.env.PYTHONPATH ||
              `${process.env.HOME}/.local/lib/python3.9/site-packages`,
          },
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
