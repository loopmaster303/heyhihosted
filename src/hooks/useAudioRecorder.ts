
"use client";

import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'inactive' | 'recording' | 'paused' | 'stopped';

export interface UseAudioRecorderControls {
  startRecording: () => void;
  stopRecording: () => void;
  togglePauseResume: () => void;
  recordingBlob?: Blob;
  recordingStatus: RecordingStatus;
  isRecording: boolean;
}

export const useAudioRecorder = (onRecordingComplete: (blob: Blob) => void): UseAudioRecorderControls => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('inactive');
  const [recordingBlob, setRecordingBlob] = useState<Blob>();
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStatus('recording');
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
        onRecordingComplete(blob);
        chunksRef.current = [];
        setRecordingStatus('stopped');
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
      setRecordingStatus('inactive');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const togglePauseResume = useCallback(() => {
    if (recordingStatus === 'paused') {
      mediaRecorderRef.current?.resume();
      setRecordingStatus('recording');
    } else if (recordingStatus === 'recording') {
      mediaRecorderRef.current?.pause();
      setRecordingStatus('paused');
    }
  }, [recordingStatus]);

  return {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    recordingStatus,
    isRecording: recordingStatus === 'recording',
  };
};
