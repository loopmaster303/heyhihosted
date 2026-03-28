import { useState, useRef } from 'react';
import { AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import { DEFAULT_TTS_SPEED } from '@/lib/chat/audio-settings';

/**
 * Hook for managing Chat Media state (Audio, Recording, Camera)
 */
export function useChatMedia() {
  // Audio State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isTtsLoadingForId, setIsTtsLoadingForId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);
  const [selectedTtsSpeed, setSelectedTtsSpeed] = useState<number>(DEFAULT_TTS_SPEED);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return {
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
    setSelectedVoice,
    selectedTtsSpeed,
    setSelectedTtsSpeed,
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    isCameraOpen,
    setIsCameraOpen,
  };
}
