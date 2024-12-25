"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

interface VideoFormat {
  itag: number;
  quality: string;
  mimeType: string;
  url: string;
  hasAudio: boolean;
  hasVideo: boolean;
  fileSize?: string;
  fps?: number;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  formats: VideoFormat[];
  duration: string;
  author: string;
  views: string;
  description?: string;
}

type FormatType = "Video + Audio" | "Video Only" | "Audio Only";

interface ProcessedFormat {
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
}

interface FormatGroup {
  label: string;
  formats: ProcessedFormat[];
}

interface VideoResponse {
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

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoResponse | null>(null);
  const [urlError, setUrlError] = useState("");
  const [showAllFormats, setShowAllFormats] = useState(false);

  const validateUrl = (input: string) => {
    if (!input.trim()) {
      setUrlError("Please enter a YouTube URL");
      return false;
    }
    if (!input.includes("youtube.com/") && !input.includes("youtu.be/")) {
      setUrlError("Please enter a valid YouTube URL");
      return false;
    }
    setUrlError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    setLoading(true);
    const loadingToast = toast.loading("Fetching video information...");

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video info");
      }

      setVideoInfo(data);
      toast.success("Video information fetched successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
        { id: loadingToast }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: ProcessedFormat) => {
    const downloadToast = toast.loading("Starting download...");
    try {
      window.open(format.url, "_blank");
      toast.success("Download started! Check your browser downloads.", {
        id: downloadToast,
        duration: 5000,
      });
    } catch (error) {
      toast.error("Failed to start download. Please try again.", {
        id: downloadToast,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            YouTube Video Downloader
          </h1>
          <p className="text-gray-300 text-lg">
            Download your favorite YouTube videos in various formats
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) validateUrl(e.target.value);
                }}
                placeholder="Paste YouTube URL here..."
                className={`w-full px-6 py-4 pr-12 bg-gray-700/50 border-2 ${
                  urlError ? "border-red-500" : "border-gray-600"
                } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400 transition-all duration-200`}
                disabled={loading}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {urlError && (
                <p className="absolute -bottom-6 left-0 text-red-500 text-sm">
                  {urlError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Get Video"
              )}
            </button>
          </form>
        </div>

        {videoInfo && (
          <div className="space-y-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl animate-fade-in">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2 line-clamp-2">
                    {videoInfo.title}
                  </h2>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-400 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      {videoInfo.author}
                    </p>
                    <p className="text-gray-400 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                      </svg>
                      {videoInfo.duration}
                    </p>
                    <p className="text-gray-400 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {videoInfo.views} views
                    </p>
                  </div>
                  {videoInfo.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {videoInfo.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 mb-6">
                {videoInfo.formatGroups.bestVideo && (
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Best Video Quality
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">
                            {videoInfo.formatGroups.bestVideo.quality}
                          </span>
                          {videoInfo.formatGroups.bestVideo.fps && (
                            <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                              {videoInfo.formatGroups.bestVideo.fps} FPS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {videoInfo.formatGroups.bestVideo.label}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleDownload(videoInfo.formatGroups.bestVideo)
                        }
                        className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Download Video
                      </button>
                    </div>
                  </div>
                )}

                {videoInfo.formatGroups.bestAudio && (
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Best Audio Quality
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">
                            {videoInfo.formatGroups.bestAudio.ext?.toUpperCase() ||
                              "MP3"}
                          </span>
                          {videoInfo.formatGroups.bestAudio.audioBitrate && (
                            <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                              {videoInfo.formatGroups.bestAudio.audioBitrate}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {videoInfo.formatGroups.bestAudio.label}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleDownload(videoInfo.formatGroups.bestAudio)
                        }
                        className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Download Audio
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAllFormats(!showAllFormats)}
                className="w-full mt-4 px-4 py-3 bg-gray-700/30 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>{showAllFormats ? "Hide" : "Show"} All Formats</span>
                <svg
                  className={`w-4 h-4 transform transition-transform duration-200 ${
                    showAllFormats ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showAllFormats && (
                <div className="space-y-6 mt-6">
                  {videoInfo.formatGroups.videoFormats.length > 0 && (
                    <div className="space-y-4">
                      {videoInfo.formatGroups.videoFormats.map(
                        (group, groupIndex) => (
                          <div
                            key={group.label}
                            className="bg-gray-700/30 rounded-xl p-6"
                          >
                            <h3 className="text-xl font-semibold mb-4">
                              {group.label}
                            </h3>
                            <div className="space-y-3">
                              {group.formats.map((format) => (
                                <div
                                  key={format.itag}
                                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {format.quality}
                                      </span>
                                      {format.fps && (
                                        <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                                          {format.fps} FPS
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {format.label}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDownload(format)}
                                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {videoInfo.formatGroups.audioFormats.length > 0 && (
                    <div className="space-y-4">
                      {videoInfo.formatGroups.audioFormats.map((group) => (
                        <div
                          key={group.label}
                          className="bg-gray-700/30 rounded-xl p-6"
                        >
                          <h3 className="text-xl font-semibold mb-4">
                            {group.label}
                          </h3>
                          <div className="space-y-3">
                            {group.formats.map((format) => (
                              <div
                                key={format.itag}
                                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {format.ext?.toUpperCase() || "MP3"}
                                    </span>
                                    {format.audioBitrate && (
                                      <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                                        {format.audioBitrate}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {format.label}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDownload(format)}
                                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            borderRadius: "0.75rem",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
