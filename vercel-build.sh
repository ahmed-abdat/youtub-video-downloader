#!/bin/bash

# Create necessary directories
mkdir -p public

# Install yt-dlp using pip into user directory
echo "Installing yt-dlp..."
python3 -m pip install --user yt-dlp

# Create a wrapper script
echo "Creating wrapper script..."
cat > public/yt-dlp << 'EOF'
#!/bin/bash
export PATH=$PATH:$HOME/.local/bin
yt-dlp "$@"
EOF

# Make it executable
echo "Making wrapper script executable..."
chmod +x public/yt-dlp

# Verify installation
echo "Verifying installation..."
python3 -m yt_dlp --version

# Build the Next.js application
echo "Building Next.js application..."
npm run build 