import { useState, useRef } from 'react';
import { AVAILABLE_TTS_VOICES } from '@/config/chat-options';

/**
 * Hook for managing Chat Media state (Audio, Recording, Camera)
 */
export function useChatMedia() {
  // Audio State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isTtsLoadingForId, setIsTtsLoadingForId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);

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
