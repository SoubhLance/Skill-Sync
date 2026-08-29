import React, { useEffect, useRef, useState } from 'react';

export interface VideoPixelGridProps {
  videoSrc?: string;
  gridSize?: number;
  gapRatio?: number;
  colorMode?: 'monochrome' | 'original' | 'custom';
  monochromeColor?: string;
  darken?: number;
  elevationScale?: number;
  motionSensitivity?: number;
  mirror?: boolean;
  className?: string;
  showBorders?: boolean;
}

export const VideoPixelGrid: React.FC<VideoPixelGridProps> = ({
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-code-running-on-a-computer-screen-23580-large.mp4",
  gridSize = 12,
  gapRatio = 0.25,
  colorMode = 'monochrome',
  monochromeColor = '#C9A961',
  darken = 0.3,
  elevationScale = 8,
  motionSensitivity = 2.0,
  mirror = false,
  className = '',
  showBorders = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      video.play().catch((err) => {
        console.warn("Video autoplay blocked or error:", err);
      });
    };

    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);

    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
    };
  }, [videoSrc]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!container || !canvas || !video) return;

    let animId: number;

    // Create offscreen canvas for frame pixel extraction
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreenCanvas = offscreenCanvasRef.current;
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      if (!ctx || !offCtx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);

      offscreenCanvas.width = cols;
      offscreenCanvas.height = rows;

      // Draw current video frame to offscreen grid
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        try {
          offCtx.save();
          if (mirror) {
            offCtx.translate(cols, 0);
            offCtx.scale(-1, 1);
          }
          offCtx.drawImage(video, 0, 0, cols, rows);
          offCtx.restore();
        } catch (e) {
          // Fallback if video frame cross-origin security throws
        }
      } else {
        // Fallback procedural animation if video not ready
        const time = Date.now() * 0.001;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const v = Math.floor(
              (Math.sin(c * 0.1 + time) + Math.cos(r * 0.1 + time) + 2) * 60
            );
            offCtx.fillStyle = `rgb(${v},${v},${v})`;
            offCtx.fillRect(c, r, 1, 1);
          }
        }
      }

      let frameData: ImageData | null = null;
      try {
        frameData = offCtx.getImageData(0, 0, cols, rows);
      } catch (e) {
        // CORS fallback
      }

      const currData = frameData ? frameData.data : null;
      const prevData = prevFrameDataRef.current;

      const cellGap = gridSize * gapRatio;
      const cellSize = gridSize - cellGap;

      // Parse monochrome color hex to RGB
      let monoR = 201, monoG = 169, monoB = 97;
      if (monochromeColor.startsWith('#')) {
        const hex = monochromeColor.replace('#', '');
        if (hex.length === 6) {
          monoR = parseInt(hex.substring(0, 2), 16);
          monoG = parseInt(hex.substring(2, 4), 16);
          monoB = parseInt(hex.substring(4, 6), 16);
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4;

          let red = 120, green = 120, blue = 120;
          let brightness = 0.5;
          let motionDiff = 0;

          if (currData) {
            red = currData[idx];
            green = currData[idx + 1];
            blue = currData[idx + 2];
            brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;

            if (prevData && prevData.length === currData.length) {
              const pR = prevData[idx];
              const pG = prevData[idx + 1];
              const pB = prevData[idx + 2];
              motionDiff = (Math.abs(red - pR) + Math.abs(green - pG) + Math.abs(blue - pB)) / 765;
            }
          }

          // 3D elevation calculation
          const elevation = (brightness + motionDiff * motionSensitivity) * elevationScale;
          const drawX = c * gridSize + cellGap / 2;
          const drawY = r * gridSize + cellGap / 2 - elevation;

          // Color mode application
          let fillStyle = '';
          const finalDarken = 1 - darken;

          if (colorMode === 'monochrome') {
            const factor = brightness * finalDarken;
            const rVal = Math.round(monoR * factor);
            const gVal = Math.round(monoG * factor);
            const bVal = Math.round(monoB * factor);
            const alpha = Math.max(0.2, brightness);
            fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
          } else {
            const rVal = Math.round(red * finalDarken);
            const gVal = Math.round(green * finalDarken);
            const bVal = Math.round(blue * finalDarken);
            fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
          }

          ctx.fillStyle = fillStyle;
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, cellSize, cellSize, 2);
          ctx.fill();

          if (showBorders) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + motionDiff * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (currData) {
        prevFrameDataRef.current = new Uint8ClampedArray(currData);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [gridSize, gapRatio, colorMode, monochromeColor, darken, elevationScale, motionSensitivity, mirror, showBorders, videoLoaded]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Hidden Video element loading media stream / URL */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />
      
      {/* Canvas rendering output */}
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
};
