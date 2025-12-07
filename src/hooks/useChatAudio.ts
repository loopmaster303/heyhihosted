/**
 * Chat Audio Hook
 * Handles Text-to-Speech functionality
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { TTSResponse, ApiErrorResponse } from '@/types/api';
import { isApiErrorResponse } from '@/types/api';

interface UseChatAudioProps {
    playingMessageId: string | null;
    setPlayingMessageId: (id: string | null) => void;
    isTtsLoadingForId: string | null;
    setIsTtsLoadingForId: (id: string | null) => void;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    selectedVoice: string;
}

export function useChatAudio({
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
}: UseChatAudioProps) {
    const { toast } = useToast();

    const handlePlayAudio = useCallback(async (text: string, messageId: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            const previouslyPlayingId = playingMessageId;
            setPlayingMessageId(null);
            if (previouslyPlayingId === messageId) {
                setIsTtsLoadingForId(null);
                return;
            }
        }
        
        if (!text || !text.trim()) return;
        
        setIsTtsLoadingForId(messageId);
        
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: selectedVoice }),
            });
            const result: TTSResponse | ApiErrorResponse = await response.json();
            if (!response.ok || isApiErrorResponse(result)) {
                const errorMsg = isApiErrorResponse(result) ? result.error : "Failed to generate audio.";
                throw new Error(errorMsg);
            }

            const ttsResult = result as TTSResponse;
            const { audioDataUri } = ttsResult;
            const audio = new Audio(audioDataUri);
            audioRef.current = audio;
            
            setIsTtsLoadingForId(null);
            setPlayingMessageId(messageId);

            audio.play();
            
            audio.onended = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlayingMessageId(null);
                }
            };
            
            audio.onerror = (e) => {
                toast({ title: "Audio Playback Error", variant: "destructive" });
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlayingMessageId(null);
                }
            };
        } catch (error) {
            console.error("TTS Error:", error);
            toast({ 
                title: "Text-to-Speech Error", 
                description: error instanceof Error ? error.message : "Could not generate audio.", 
                variant: "destructive" 
            });
            setIsTtsLoadingForId(null);
            if (playingMessageId === messageId) {
                setPlayingMessageId(null);
            }
        }
    }, [playingMessageId, toast, selectedVoice, setIsTtsLoadingForId, setPlayingMessageId, audioRef]);

    return {
        handlePlayAudio,
    };
}

