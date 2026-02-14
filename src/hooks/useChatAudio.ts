/**
 * Chat Audio Hook
 * Handles Text-to-Speech functionality
 */

import { useCallback, useRef } from 'react';
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
    // In-memory cache: lets the second click play without any async fetch (avoids autoplay restrictions).
    const cacheRef = useRef<Map<string, string>>(new Map());
    const cache = cacheRef.current;

    const safePlay = useCallback(async (audio: HTMLAudioElement, messageId: string) => {
        try {
            // play() returns a promise and can reject due to autoplay policies.
            await audio.play();
            setPlayingMessageId(messageId);
            return true;
        } catch (err) {
            const name = (err as any)?.name;
            if (name === 'NotAllowedError') {
                toast({
                    title: "Audio bereit",
                    description: "Dein Browser blockiert Autoplay. Klick nochmal auf Play, um die Stimme abzuspielen.",
                });
                return false;
            }
            throw err;
        }
    }, [setPlayingMessageId, toast]);

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

        // If cached, we can play synchronously (no fetch/await) which is much more likely to be allowed.
        const cachedAudio = cache.get(messageId);
        if (cachedAudio) {
            const audio = new Audio(cachedAudio);
            audioRef.current = audio;
            const started = await safePlay(audio, messageId);
            if (!started) {
                // Don't mark as "playing" if autoplay is blocked; next click will try again.
                setPlayingMessageId(null);
            }
            audio.onended = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlayingMessageId(null);
                }
            };
            audio.onerror = () => {
                toast({ title: "Audio Playback Error", variant: "destructive" });
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setPlayingMessageId(null);
                }
            };
            return;
        }

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
            cache.set(messageId, audioDataUri);
            const audio = new Audio(audioDataUri);
            audioRef.current = audio;
            
            setIsTtsLoadingForId(null);
            const started = await safePlay(audio, messageId);
            if (!started) {
                setPlayingMessageId(null);
            }
            
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
    }, [playingMessageId, toast, selectedVoice, setIsTtsLoadingForId, setPlayingMessageId, audioRef, cache, safePlay]);

    return {
        handlePlayAudio,
    };
}
