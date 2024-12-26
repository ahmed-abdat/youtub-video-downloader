#!/bin/bash

# Create necessary directories
mkdir -p public

# Download yt-dlp binary for Linux x64
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux.amd64 -o public/yt-dlp

# Make it executable
echo "Making yt-dlp executable..."
chmod +x public/yt-dlp

# Verify the binary
echo "Verifying binary..."
file public/yt-dlp
ls -la public/yt-dlp

# Print binary information
echo "Binary details:"
file public/yt-dlp

# Test the binary (optional, might fail during build)
echo "Testing yt-dlp binary..."
if ! ./public/yt-dlp --version; then
    echo "Binary test failed, but continuing build..."
fi

# Build the Next.js application
echo "Building Next.js application..."
npm run build 