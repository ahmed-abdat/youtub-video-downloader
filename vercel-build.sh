#!/bin/bash

# Create necessary directories
mkdir -p public

# Download yt-dlp
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o public/yt-dlp

# Make it executable
echo "Making yt-dlp executable..."
chmod +x public/yt-dlp

# Test the binary
echo "Testing yt-dlp binary..."
./public/yt-dlp --version

# Build the Next.js application
echo "Building Next.js application..."
npm run build 