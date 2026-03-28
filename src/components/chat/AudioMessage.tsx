'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Download, Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  audioUrl: string;
  prompt?: string;
  duration?: number;
  className?: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  audioUrl,
  prompt,
  duration: initialDuration,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${prompt?.slice(0, 30) || 'music'}.mp3`;
    link.click();
  };

  return (
    <div className={cn(
      "group w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md transition-all duration-300",
      isPlaying
        ? "bg-purple-500/10 shadow-[inset_0_0_30px_rgba(168,85,247,0.12)]"
        : "bg-glass-background/20 hover:bg-glass-background/30",
      className
    )}>
      <audio ref={audioRef} src={audioUrl} />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={cn(
          "flex-none w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300",
          isPlaying
            ? "bg-purple-500/20 text-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.35)]"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {isPlaying
          ? <Pause className="w-4 h-4 fill-current" />
          : <Play className="w-4 h-4 fill-current ml-0.5" />
        }
      </button>

      {/* Progress & Time */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Custom progress bar */}
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
          onClick={handleSeek}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            if (e.key === 'ArrowRight') { audio.currentTime = Math.min(duration, currentTime + 5); }
            if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, currentTime - 5); }
          }}
          className="relative w-full h-1.5 rounded-full bg-white/8 cursor-pointer group/bar"
        >
          {/* Played portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-purple-500/60 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-150",
              "opacity-0 group-hover:opacity-100 group-hover/bar:opacity-100",
              isPlaying && "opacity-100"
            )}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        <div className="text-[10px] font-medium text-muted-foreground/50 tabular-nums tracking-wide">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-0.5">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        aria-label="Download"
        className="flex-none p-2 rounded-full hover:bg-muted/40 transition-colors text-muted-foreground/50 hover:text-foreground"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
