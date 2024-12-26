#!/bin/bash

# Create necessary directories
mkdir -p public

# Install Python and pip
echo "Installing Python and pip..."
apt-get update && apt-get install -y python3 python3-pip

# Install yt-dlp using pip
echo "Installing yt-dlp..."
pip3 install yt-dlp

# Create a wrapper script
echo "Creating wrapper script..."
cat > public/yt-dlp << 'EOF'
#!/bin/bash
python3 -m yt_dlp "$@"
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