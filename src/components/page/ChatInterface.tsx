'use client';

import React, { useEffect, useRef, useState } from 'react'; // Added useState
import { useChat } from '@/components/ChatProvider';
import { useToast } from "@/hooks/use-toast"; // Added useToast

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
  const { toast } = useToast(); // Initialize useToast

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
        const audioFile = new File([audioBlob], "recording.webm", { type: mimeType });

        // Stop all tracks to turn off the microphone indicator
        stream.getTracks().forEach(track => track.stop());

        if (audioFile.size < 1000) { // Check if file is reasonably large (e.g., >1KB)
            toast({ title: "Recording Error", description: "Recording was too short or empty. Please try again for at least one second.", variant: "destructive" });
            return;
        }

        // Log file details before sending (for debugging)
        console.log("Recorded audio file details:", {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size
        });

        setIsTranscribing(true); // Set transcribing state

        const formData = new FormData();
        formData.append('audioFile', audioFile);

        try {
          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          // Log the raw response status and text
          console.log("STT API response status:", response.status);
          const responseText = await response.text();
          console.log("STT API raw response text:", responseText);

          // Try to parse as JSON
          let result;
          try {
              result = JSON.parse(responseText);
              console.log("STT API parsed JSON response:", result);
          } catch (jsonError) {
              console.error("Failed to parse STT API response as JSON:", jsonError);
              throw new Error("Invalid response from STT API."); // Throw a new error if JSON parsing fails
          }


          if (!response.ok) {
            throw new Error(result.error || "Failed to transcribe audio.");
          }

          // Check if transcription is in the result
          if (typeof result.transcription !== 'string') {
               console.error("STT API response missing transcription:", result);
               throw new Error("Invalid transcription format from STT API.");
          }


          // Add the transcription to the input field
          chat.setChatInputValue((prev: string) => `${prev}${prev ? ' ' : ''}${result.transcription}`.trim());
          toast({ title: "Transcription Successful", description: "Audio transcribed successfully.", variant: "default" });

        } catch (error) {
          console.error("Transcription Error:", error);
          toast({ title: "Transcription Failed", description: error instanceof Error ? error.message : "Could not process audio.", variant: "destructive" });
        } finally {
          setIsTranscribing(false); // Reset transcribing state
        }
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
