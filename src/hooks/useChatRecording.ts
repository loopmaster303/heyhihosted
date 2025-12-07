/**
 * Chat Recording Hook
 * Handles Speech-to-Text recording functionality
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { STTResponse, ApiErrorResponse } from '@/types/api';
import { isApiErrorResponse } from '@/types/api';

interface UseChatRecordingProps {
    isRecording: boolean;
    setIsRecording: (recording: boolean) => void;
    isTranscribing: boolean;
    setIsTranscribing: (transcribing: boolean) => void;
    mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
    audioChunksRef: React.MutableRefObject<Blob[]>;
    setChatInputValue: (value: string | ((prev: string) => string)) => void;
}

export function useChatRecording({
    isRecording,
    setIsRecording,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    setChatInputValue,
}: UseChatRecordingProps) {
    const { toast } = useToast();

    const startRecording = useCallback(async () => {
        if (isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstart = () => {
                setIsRecording(true);
            };

            recorder.onstop = async () => {
                setIsRecording(false);
                setIsTranscribing(true);

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
                
                try {
                    const formData = new FormData();
                    formData.append('audioFile', audioFile);

                    const response = await fetch('/api/stt', {
                        method: 'POST',
                        body: formData,
                    });
                    const result: STTResponse | ApiErrorResponse = await response.json();

                    if (!response.ok || isApiErrorResponse(result)) {
                        const errorMsg = isApiErrorResponse(result) ? result.error : 'Speech-to-text failed.';
                        throw new Error(errorMsg);
                    }
                    
                    const sttResult = result as STTResponse;
                    if (sttResult.transcription && sttResult.transcription.trim() !== '') {
                        setChatInputValue(prev => prev + sttResult.transcription);
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    toast({ title: 'Transcription Error', description: errorMessage, variant: 'destructive' });
                } finally {
                    setIsTranscribing(false);
                    // Clean up the stream tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            recorder.start();
        } catch (error) {
            console.error('Error starting recording:', error);
            toast({ 
                title: 'Microphone Access Denied', 
                description: 'Please allow microphone access in your browser settings.', 
                variant: 'destructive' 
            });
        }
    }, [isRecording, toast, setChatInputValue, setIsRecording, setIsTranscribing, mediaRecorderRef, audioChunksRef]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording, mediaRecorderRef]);

    return {
        startRecording,
        stopRecording,
    };
}

