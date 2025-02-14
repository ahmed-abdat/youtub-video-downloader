# YouTube Video Downloader

A modern web application built with Next.js that allows users to download YouTube videos in various formats and qualities.

## Features

- Download YouTube videos in multiple qualities (4K to 144p)
- Download audio-only formats
- Support for both MP4 and WebM formats
- Display video quality, FPS, and file size
- Clean and modern UI
- Real-time format processing
- Support for short and full YouTube URLs

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- youtube-dl-exec
- yt-dlp

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/ahmed-abdat/youtub-video-downloader.git
```

2. Install dependencies:

```bash
cd youtub-video-downloader
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory and add:

```env
YTDL_BIN_PATH=./yt-dlp.exe
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy the application:

```bash
vercel
```

4. For production deployment:

```bash
vercel --prod
```

### Environment Variables on Vercel

After deploying, set up the following environment variable in your Vercel project settings:

- `YTDL_BIN_PATH`: Set to `/var/task/yt-dlp` for Linux runtime

### Important Notes

- Make sure to select the Node.js 18.x runtime when deploying
- The first deployment might take a few minutes as it sets up the environment
- If you encounter any issues, check the Vercel deployment logs

## License

MIT License
#   r i m c o d e 
 
 
