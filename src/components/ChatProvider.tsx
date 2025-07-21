
"use client";

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from '@/config/chat-options';


export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
}

const MAX_STORED_CONVERSATIONS = 50;
const CHAT_HISTORY_STORAGE_KEY = 'fluxflow-chatHistory';

export function useChatLogic({ userDisplayName, customSystemPrompt }: UseChatLogicProps) {
    const [allConversations, setAllConversations] = useLocalStorageState<Conversation[]>(CHAT_HISTORY_STORAGE_KEY, []);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

    const [isAiResponding, setIsAiResponding] = useState(false);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
    
    const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
    const [chatToEditId, setChatToEditId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    
    const [isImageMode, setIsImageMode] = useState(false);
    const [isWebSearchMode, setIsWebSearchMode] = useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);
  
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [isTtsLoadingForId, setIsTtsLoadingForId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [chatInputValue, setChatInputValue] = useState('');

    const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);

    // STT State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const { toast } = useToast();

    // Helper to ensure dates are handled correctly
    const toDate = (timestamp: Date | string | undefined | null): Date => {
        if (!timestamp) return new Date();
        if (typeof timestamp === 'string') return new Date(timestamp);
        return timestamp as Date;
    };
    
    // Initial load from localStorage is now handled by the useLocalStorageState hook directly.
    // This effect now focuses on setting the active conversation on first load.
    useEffect(() => {
        const relevantConversations = allConversations.filter(c => c.toolType === 'long language loops');
        if (activeConversation === null && relevantConversations.length > 0) {
            // Sort to get the most recently updated one
            const sortedConvs = [...relevantConversations].sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
            setActiveConversation(sortedConvs[0]);
        } else if (activeConversation === null && relevantConversations.length === 0) {
            // No chats exist, so create a new one.
            startNewChat();
        }
        setIsInitialLoadComplete(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConversations]); // Dependency on allConversations ensures this runs when data is loaded.


    // Effect to update the allConversations in localStorage whenever active one changes
    useEffect(() => {
        if (activeConversation) {
            setAllConversations(prevAll => {
                const existingIndex = prevAll.findIndex(c => c.id === activeConversation.id);
                if (existingIndex > -1) {
                    const newAll = [...prevAll];
                    newAll[existingIndex] = activeConversation;
                    return newAll.sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                } else {
                    return [activeConversation, ...prevAll].sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                }
            });
        }
    }, [activeConversation, setAllConversations]);

  
    const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
      const convToUpdate = allConversations.find(c => c.id === conversationId) ?? activeConversation;
      if (!convToUpdate || convToUpdate.toolType !== 'long language loops') return;
  
      const isDefaultTitle = convToUpdate.title === "default.long.language.loop" || convToUpdate.title.toLowerCase().startsWith("new ") || convToUpdate.title === "Chat";
  
      if (messagesForTitleGen.length >= 1 && isDefaultTitle) {
        const firstUserMessage = messagesForTitleGen.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            const textContent = typeof firstUserMessage.content === 'string'
              ? firstUserMessage.content
              : firstUserMessage.content.find(p => p.type === 'text')?.text || '';
            
            if (textContent.trim()) {
                try {
                  const response = await fetch('/api/chat/title', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: textContent }),
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || 'Failed to generate title.');
                  
                  const newTitle = result.title || "Chat";
                  const finalTitle = newTitle.replace(/^"|"$/g, '').trim();

                  setActiveConversation(prev => prev ? { ...prev, title: finalTitle } : null);
                  return finalTitle;

                } catch (error) { 
                    console.error("Failed to generate chat title:", error); 
                }
            }
        }
      }
      return convToUpdate.title;
    }, [allConversations, activeConversation]);
    
    const sendMessage = useCallback(async (
      _messageText: string,
      options: { 
        isImageModeIntent?: boolean; 
        isRegeneration?: boolean; 
        messagesForApi?: ChatMessage[];
      } = {}
    ) => {
        if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

        const { id: convId, selectedModelId, selectedResponseStyleName, messages, uploadedFile, uploadedFilePreview } = activeConversation;
        const currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
        
        let effectiveSystemPrompt = '';
        const basicStylePrompt = (AVAILABLE_RESPONSE_STYLES.find(s => s.name === 'Basic') || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;
    
        if (selectedResponseStyleName === "User's Default") {
            if (customSystemPrompt && customSystemPrompt.trim()) {
                effectiveSystemPrompt = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User");
            } else {
                effectiveSystemPrompt = basicStylePrompt;
            }
        } else {
            const selectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName);
            effectiveSystemPrompt = selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt;
        }

        if (options.isRegeneration) {
          const regenerationInstruction = "Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers. Wiederhole deine vorherige Antwort nicht. Biete eine andere Perspektive oder einen anderen Stil.";
          effectiveSystemPrompt = `${regenerationInstruction}\n\n${effectiveSystemPrompt}`;
        }
    
        setIsAiResponding(true);
        if (!options.isRegeneration) {
            setChatInputValue('');
        }
        
        const isImagePrompt = options.isImageModeIntent || false;
        const isFileUpload = !!uploadedFile && !isImagePrompt;
    
        if (isFileUpload && !currentModel.vision) {
          toast({ title: "Model Incompatibility", description: `Model '${currentModel.name}' doesn't support images.`, variant: "destructive" });
          setIsAiResponding(false);
          return;
        }
    
        let updatedMessagesForState = options.messagesForApi || messages;

        if (!options.isRegeneration) {
            let userMessageContent: string | ChatMessageContentPart[] = chatInputValue.trim();
            if (isFileUpload && uploadedFilePreview) {
              userMessageContent = [
                { type: 'text', text: chatInputValue.trim() || "Describe this image." },
                { type: 'image_url', image_url: { url: uploadedFilePreview, altText: uploadedFile?.name, isUploaded: true } }
              ];
            }
        
            const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
            
            updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
            setActiveConversation(prev => prev ? { ...prev, messages: updatedMessagesForState } : null);
        }

        const historyForApi: ApiChatMessage[] = updatedMessagesForState
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
           }));
      
      let finalMessages = updatedMessagesForState;
      let finalTitle = activeConversation.title;

      try {
          let aiMessage: ChatMessage;
          if (isWebSearchMode) {
              const response = await fetch('/api/web-search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: chatInputValue.trim() }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to perform web search.');

              const searchResponseText = result.responseText || "Web search yielded no results.";
              aiMessage = { id: crypto.randomUUID(), role: 'assistant', content: searchResponseText, timestamp: new Date().toISOString(), toolType: 'web search' };
          } else if (isImagePrompt && chatInputValue.trim()) {
              const response = await fetch('/api/openai-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: chatInputValue.trim(), model: 'gptimage', private: true }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to generate image.');
              
              const aiResponseContent: ChatMessageContentPart[] = [
                  { type: 'text', text: `Generated image for: "${chatInputValue.trim()}"` },
                  { type: 'image_url', image_url: { url: result.imageUrl, altText: `Generated image for ${chatInputValue.trim()}`, isGenerated: true } }
              ];
              aiMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
          } else {
              const response = await fetch('/api/chat/completion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: historyForApi,
                    modelId: currentModel.id,
                    systemPrompt: effectiveSystemPrompt
                })
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to get chat completion.');
              
              const aiResponseText = result.choices?.[0]?.message?.content || result.responseText || "Sorry, I couldn't get a response.";
              aiMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseText, timestamp: new Date().toISOString(), toolType: 'long language loops' };
          }
          finalMessages = [...updatedMessagesForState, aiMessage];
          finalTitle = await updateConversationTitle(convId, finalMessages);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        const errorMsg: ChatMessage = {id: crypto.randomUUID(), role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}`, timestamp: new Date().toISOString(), toolType: 'long language loops'};
        finalMessages = [...updatedMessagesForState, errorMsg];
      } finally {
        const finalConversationState = { messages: finalMessages, title: finalTitle, updatedAt: new Date().toISOString(), isImageMode: false, uploadedFile: null, uploadedFilePreview: null };
        
        setActiveConversation(prev => prev ? { ...prev, ...finalConversationState } : null);
        setIsAiResponding(false);
        setIsWebSearchMode(false); // Always turn off web search mode after a message is sent
      }
    }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setAllConversations, isWebSearchMode]);
  
    const selectChat = useCallback((conversationId: string | null) => {
      if (conversationId === null) {
          setActiveConversation(null);
          return;
      }
      const conversationToSelect = allConversations.find(c => c.id === conversationId);
      if (conversationToSelect) {
          setActiveConversation({ ...conversationToSelect, uploadedFile: null, uploadedFilePreview: null });
      }
    }, [allConversations]);
    
    const startNewChat = useCallback(() => {
        const newConversationId = crypto.randomUUID();
        const newConversationData: Conversation = {
            id: newConversationId,
            title: "default.long.language.loop",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            toolType: 'long language loops',
            isImageMode: false,
            selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID,
            selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
        };
    
        // Prune old conversations if necessary
        if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
            const sortedConvs = [...allConversations].sort((a, b) => toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime());
            const oldestConversation = sortedConvs[0];
            if (oldestConversation) {
                 setAllConversations(prev => prev.filter(c => c.id !== oldestConversation.id));
            }
        }
        
        setActiveConversation(newConversationData);

        return newConversationData;
    }, [allConversations, setAllConversations]);
    
    const requestEditTitle = (conversationId: string) => {
      const convToEdit = allConversations.find(c => c.id === conversationId);
      if (!convToEdit) return;
      setChatToEditId(conversationId);
      setEditingTitle(convToEdit.title);
      setIsEditTitleDialogOpen(true);
    };
    
    const confirmEditTitle = () => {
      if (!chatToEditId || !editingTitle.trim()) {
        toast({ title: "Invalid Title", description: "Title cannot be empty.", variant: "destructive" });
        return;
      }
      const newTitle = editingTitle.trim();
      
      setAllConversations(prev => prev.map(c => c.id === chatToEditId ? { ...c, title: newTitle } : c));
      setActiveConversation(prev => (prev?.id === chatToEditId) ? { ...prev, title: newTitle } : prev);
      
      toast({ title: "Title Updated" });
      setIsEditTitleDialogOpen(false);
    };
  
    const cancelEditTitle = () => setIsEditTitleDialogOpen(false);
  
    const requestDeleteChat = (conversationId: string) => {
      setChatToDeleteId(conversationId);
      setIsDeleteDialogOpen(true);
    };
    
    const deleteChat = useCallback((conversationId: string) => {
        const wasActive = activeConversation?.id === conversationId;
        
        setAllConversations(prev => prev.filter(c => c.id !== conversationId));
  
        if (wasActive) {
          const nextChat = allConversations.filter(c => c.id !== conversationId && c.toolType === 'long language loops')
            .sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())[0] ?? null;
          
          if(nextChat) {
            selectChat(nextChat.id);
          } else {
            startNewChat();
          }
        }

        toast({ title: "Chat Deleted" });
    }, [activeConversation?.id, allConversations, selectChat, setAllConversations, toast, startNewChat]);
  
    const confirmDeleteChat = () => {
      if (!chatToDeleteId) return;
      deleteChat(chatToDeleteId);
      setIsDeleteDialogOpen(false);
    };
  
    const cancelDeleteChat = () => setIsDeleteDialogOpen(false);
    
    const toggleImageMode = () => {
        if (!activeConversation) return;
        const newImageModeState = !isImageMode;
        setIsImageMode(newImageModeState);
        if(newImageModeState) {
           setIsWebSearchMode(false);
           handleFileSelect(null, null);
        }
    };
    
    const toggleWebSearchMode = () => {
        const newWebSearchState = !isWebSearchMode;
        setIsWebSearchMode(newWebSearchState);
        if (newWebSearchState) {
            setIsImageMode(false);
            handleFileSelect(null, null);
        }
    };

    const dataURItoFile = (dataURI: string, filename: string): File => {
        const arr = dataURI.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleFileSelect = (fileOrDataUri: File | string | null, fileType: string | null) => {
      if (!activeConversation) return;
      if (fileOrDataUri) {
        setIsWebSearchMode(false);
        setIsImageMode(false);
        if (typeof fileOrDataUri === 'string') {
            // It's a data URI from camera
            const file = dataURItoFile(fileOrDataUri, `capture-${Date.now()}.jpg`);
            setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: file, uploadedFilePreview: fileOrDataUri } : null);
        } else {
            // It's a file from input
            const reader = new FileReader();
            reader.onloadend = () => {
                setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: fileOrDataUri, uploadedFilePreview: reader.result as string } : null);
            };
            reader.readAsDataURL(fileOrDataUri);
        }
      } else {
        setActiveConversation(prev => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
      }
    };
  
    const clearUploadedImage = () => {
      if (activeConversation) handleFileSelect(null, null); 
    }
  
    const handleModelChange = useCallback((modelId: string) => {
      if (activeConversation) {
        setIsWebSearchMode(false);
        setActiveConversation(prev => prev ? { ...prev, selectedModelId: modelId } : null);
      }
    }, [activeConversation]);
  
    const handleStyleChange = useCallback((styleName: string) => {
       if (activeConversation) {
        setIsWebSearchMode(false);
        setActiveConversation(prev => prev ? { ...prev, selectedResponseStyleName: styleName } : null);
       }
    }, [activeConversation]);

    const handleVoiceChange = (voiceId: string) => {
      setSelectedVoice(voiceId);
    };
  
    const toggleHistoryPanel = () => setIsHistoryPanelOpen(prev => !prev);
    const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), []);

    const toggleAdvancedPanel = () => setIsAdvancedPanelOpen(prev => !prev);
    const closeAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(false), []);
  
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
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to generate audio.");

        const { audioDataUri } = result;
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
        toast({ title: "Text-to-Speech Error", description: error instanceof Error ? error.message : "Could not generate audio.", variant: "destructive" });
        setIsTtsLoadingForId(null);
        if (playingMessageId === messageId) {
            setPlayingMessageId(null);
        }
      }
    }, [playingMessageId, toast, selectedVoice]);
  
    const handleCopyToClipboard = useCallback((text: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied to Clipboard" });
      }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast({ title: "Copy Failed", variant: "destructive" });
      });
    }, [toast]);
  
    const regenerateLastResponse = useCallback(async () => {
      if (!activeConversation || isAiResponding) return;
  
      const lastMessageIndex = activeConversation.messages.length - 1;
      const lastMessage = activeConversation.messages[lastMessageIndex];
  
      if (!lastMessage || lastMessage.role !== 'assistant') {
        toast({ title: "Action Not Available", description: "You can only regenerate the AI's most recent response.", variant: "destructive" });
        return;
      }
  
      const messagesForRegeneration = activeConversation.messages.slice(0, lastMessageIndex);
      setActiveConversation(prev => prev ? { ...prev, messages: messagesForRegeneration } : null);
  
      sendMessage("", {
        isRegeneration: true,
        messagesForApi: messagesForRegeneration
      });
  
    }, [isAiResponding, activeConversation, sendMessage, toast]);

    const startRecording = async () => {
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
                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Speech-to-text failed.');
                    }
                    if (result.transcription && result.transcription.trim() !== '') {
                        setChatInputValue(prev => prev + result.transcription);
                    }
                } catch (err: any) {
                    toast({ title: 'Transcription Error', description: err.message, variant: 'destructive' });
                } finally {
                    setIsTranscribing(false);
                    // Clean up the stream tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            recorder.start();
        } catch (error) {
            console.error('Error starting recording:', error);
            toast({ title: 'Microphone Access Denied', description: 'Please allow microphone access in your browser settings.', variant: 'destructive' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };
  
    const openCamera = () => setIsCameraOpen(true);
    const closeCamera = () => setIsCameraOpen(false);

    return {
      activeConversation, allConversations,
      isAiResponding, isImageMode, isWebSearchMode,
      isHistoryPanelOpen, isAdvancedPanelOpen,
      isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      playingMessageId, isTtsLoadingForId, chatInputValue,
      selectedVoice,
      isInitialLoadComplete,
      isRecording, isTranscribing,
      isCameraOpen,
      selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat, toggleImageMode,
      toggleWebSearchMode,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange,
      toggleHistoryPanel, closeHistoryPanel, 
      toggleAdvancedPanel, closeAdvancedPanel,
      handlePlayAudio,
      setChatInputValue,
      handleCopyToClipboard,
      regenerateLastResponse,
      startRecording, stopRecording,
      openCamera, closeCamera,
      toDate,
      setActiveConversation,
    };
}


type ChatContextType = ReturnType<typeof useChatLogic> & {
    currentMessages: ChatMessage[];
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
    
    const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt });
    
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (chatLogic.activeConversation) {
            setCurrentMessages(chatLogic.activeConversation.messages);
        } else {
            setCurrentMessages([]);
        }
    }, [chatLogic.activeConversation]);

    // This is a bit of a workaround to satisfy TypeScript's strictness
    // for the setChatInputValue function passed to the input component.
    const setChatInputValueWrapper = (value: string | ((prev: string) => string)) => {
        chatLogic.setChatInputValue(value);
    };

    const chatContextValue = {
        ...chatLogic,
        currentMessages,
        setChatInputValue: setChatInputValueWrapper,
    };

    return (
        <ChatContext.Provider value={chatContextValue}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
