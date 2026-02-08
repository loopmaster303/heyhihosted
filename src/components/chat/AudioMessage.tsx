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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

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
      "w-full max-w-sm flex items-center gap-3 px-4 py-2 rounded-2xl bg-glass-background/20 border border-glass-border/30 backdrop-blur-md shadow-sm transition-all hover:bg-glass-background/30",
      className
    )}>
      <audio ref={audioRef} src={audioUrl} />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex-none w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Progress & Time */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground/60 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        className="flex-none p-1.5 rounded-full hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
        title="Download"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
