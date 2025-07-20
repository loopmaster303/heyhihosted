
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/components/ChatProvider';
import { useToast } from "@/hooks/use-toast";

// UI Components
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import HistoryPanel from '@/components/chat/HistoryPanel';
import AdvancedSettingsPanel from '@/components/chat/AdvancedSettingsPanel';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

// Types & Config
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';
import { Loader2 } from 'lucide-react';
import { X } from 'lucide-react';

export default function ChatInterface() {
  const chat = useChat();
  const { toast } = useToast();

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);

  // Speech-to-Text state and refs
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Custom hook to handle clicks outside of the history panel
  useOnClickOutside([historyPanelRef], () => {
    if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
  }, 'radix-select-content');

  useEffect(() => {
    return () => {
      // Ensure panels are closed on component unmount
      if (chat.isAdvancedPanelOpen) chat.closeAdvancedPanel();
      if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // STT: Start Recording
  const startRecording = async () => {
    try {
      const mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        toast({ title: "Browser Not Supported", description: "Your browser does not support the required audio format (WebM/Opus).", variant: "destructive" });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Stop all tracks to turn off the microphone indicator
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size < 1000) {
            toast({ title: "Recording Error", description: "Recording was too short or empty. Please try again.", variant: "destructive" });
            setIsTranscribing(false);
            return;
        }

        setIsTranscribing(true);

        // Convert Blob to Data URI to send to the backend
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const audioDataUri = reader.result as string;

            try {
              const response = await fetch('/api/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioDataUri }),
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || "Failed to transcribe audio.");
              }

              if (typeof result.transcription === 'string') {
                  chat.setChatInputValue((prev: string) => `${prev}${prev ? ' ' : ''}${result.transcription}`.trim());
                  toast({ title: "Transcription Successful" });
              } else {
                  throw new Error("Invalid transcription format from API.");
              }

            } catch (error) {
              console.error("Transcription Error:", error);
              toast({ title: "Transcription Failed", description: error instanceof Error ? error.message : "Could not process audio.", variant: "destructive" });
            } finally {
              setIsTranscribing(false);
            }
        };

        reader.onerror = () => {
            console.error("FileReader error");
            toast({ title: "File Read Error", description: "Could not read the recorded audio.", variant: "destructive" });
            setIsTranscribing(false);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser.", variant: "destructive"});
    }
  };

  // STT: Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };


  if (!chat.isInitialLoadComplete || !chat.activeConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing Chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-grow overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <ChatView
          conversation={chat.activeConversation}
          messages={chat.currentMessages}
          isLoading={chat.isAiResponding}
          className="h-full overflow-y-auto px-4 w-full max-w-4xl mx-auto pt-2 pb-4 no-scrollbar"
          onPlayAudio={chat.handlePlayAudio}
          playingMessageId={chat.playingMessageId}
          isTtsLoadingForId={chat.isTtsLoadingForId}
          onCopyToClipboard={chat.handleCopyToClipboard}
          onRegenerate={chat.regenerateLastResponse}
        />
      </div>
      <div className="px-4 pt-2 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {chat.activeConversation.uploadedFilePreview && !chat.isImageMode && (
            <div className="max-w-3xl mx-auto p-2 relative w-fit self-center">
              <img
                src={chat.activeConversation.uploadedFilePreview}
                alt="Uploaded preview"
                width={80}
                height={80}
                style={{ objectFit: "cover" }}
                className="rounded-md"
              />
              <button
                type="button"
                className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 flex items-center justify-center"
                onClick={chat.clearUploadedImage}
                aria-label="Clear uploaded image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <ChatInput
            onSendMessage={chat.sendMessage}
            isLoading={chat.isAiResponding}
            uploadedFilePreviewUrl={chat.activeConversation.uploadedFilePreview ?? null}
            onFileSelect={chat.handleFileSelect}
            isLongLanguageLoopActive={true}
            inputValue={chat.chatInputValue}
            onInputChange={chat.setChatInputValue}
            isImageMode={chat.isImageMode}
            onToggleImageMode={chat.toggleImageMode}
            chatTitle={chat.activeConversation.title || "New Chat"}
            onToggleHistoryPanel={chat.toggleHistoryPanel}
            onToggleAdvancedPanel={chat.toggleAdvancedPanel}
            // Pass STT props
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />

          {chat.isHistoryPanelOpen && (
            <div ref={historyPanelRef}>
                <HistoryPanel
                allConversations={chat.allConversations}
                activeConversation={chat.activeConversation}
                onSelectChat={(id) => {
                    chat.selectChat(id);
                    chat.closeHistoryPanel();
                }}
                onRequestEditTitle={chat.requestEditTitle}
                onRequestDeleteChat={chat.requestDeleteChat}
                onStartNewChat={() => {
                    chat.startNewChat();
                    chat.closeHistoryPanel();
                }}
                toDate={chat.toDate}
                onClose={chat.closeHistoryPanel}
                />
            </div>
          )}

          {chat.isAdvancedPanelOpen && (
            <div ref={advancedPanelRef}>
                <AdvancedSettingsPanel
                selectedModelId={chat.activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
                onModelChange={chat.handleModelChange}
                selectedResponseStyleName={chat.activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
                onStyleChange={chat.handleStyleChange}
                selectedVoice={chat.selectedVoice}
                onVoiceChange={chat.handleVoiceChange}
                onClose={chat.closeAdvancedPanel}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
