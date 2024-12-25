#!/bin/bash

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

# Make it executable
chmod +x yt-dlp

# Build the Next.js application
npm run build 