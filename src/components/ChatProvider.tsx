'use client';

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES, FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';


export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
}

const MAX_STORED_CONVERSATIONS = 50;
const CHAT_HISTORY_STORAGE_KEY = 'fluxflow-chatHistory';

// Helper to ensure dates are handled correctly (outside of component to avoid re-creation)
const toDate = (timestamp: Date | string | undefined | null): Date => {
    if (!timestamp) return new Date();
    if (typeof timestamp === 'string') return new Date(timestamp);
    return timestamp as Date;
};

export function useChatLogic({ userDisplayName, customSystemPrompt }: UseChatLogicProps) {
    // --- State Declarations ---
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
    const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Korrekte Typisierung und Initialisierung
    const audioChunksRef = useRef<Blob[]>([]);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    // New state to track the ID of the last user message for scrolling
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null);

    // Image Model State
    const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);
    const [selectedImageModelId, setSelectedImageModelId] = useLocalStorageState<string>('chatSelectedImageModel', DEFAULT_IMAGE_MODEL);
    
    const { toast } = useToast();

    // --- Helper Functions / Callbacks (defined early for dependencies) ---

    // Callback for file handling (used by toggleImageMode, clearUploadedImage)
    const dataURItoFile = useCallback((dataURI: string, filename: string): File => {
        const arr = dataURI.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }, []);

    const handleFileSelect = useCallback((fileOrDataUri: File | string | null, fileType: string | null) => {
      if (!activeConversation) return; // Stellen Sie sicher, dass activeConversation existiert
      if (fileOrDataUri) {
        setIsImageMode(false);
        if (typeof fileOrDataUri === 'string') {
            const file = dataURItoFile(fileOrDataUri, `capture-${Date.now()}.jpg`);
            setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: file, uploadedFilePreview: fileOrDataUri } : null);
        } else {
            const reader = new FileReader();
            reader.onloadend = () => {
                setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: fileOrDataUri, uploadedFilePreview: reader.result as string } : null);
            };
            reader.readAsDataURL(fileOrDataUri);
        }
      } else {
        setActiveConversation(prev => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
      }
    }, [activeConversation, dataURItoFile, setActiveConversation, setIsImageMode]);

    const clearUploadedImage = useCallback(() => {
      if (activeConversation) handleFileSelect(null, null); 
    }, [activeConversation, handleFileSelect]);

    // Callbacks for panel toggles (used by other toggle functions)
    const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), []);
    const closeAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(false), []);

    // Core Chat Logic Functions (can now reference helpers defined above)

    const toggleImageMode = useCallback(() => {
        if (!activeConversation) return;
        const newImageModeState = !isImageMode;
        setIsImageMode(newImageModeState);
        if(newImageModeState) {
           handleFileSelect(null, null); // handleFileSelect ist jetzt bekannt
        }
    }, [activeConversation, isImageMode, handleFileSelect]);

    const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]): Promise<string> => { // Rückgabetyp hinzugefügt
      const convToUpdate = allConversations.find(c => c.id === conversationId) ?? activeConversation;
      
      // Korrektur: Wenn convToUpdate null ist, einen Standardtitel zurückgeben
      if (!convToUpdate || convToUpdate.toolType !== 'long language loops') {
          return activeConversation?.title || "New Conversation"; // Sicherer Fallback
      }
  
      const isDefaultTitle = convToUpdate.title === "New Conversation" || convToUpdate.title.toLowerCase().startsWith("new ") || convToUpdate.title === "Chat";
  
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
                    return convToUpdate.title; // Fallback bei Fehler
                }
            }
        }
      }
      return convToUpdate.title;
    }, [allConversations, activeConversation, setActiveConversation]);
    
    const sendMessage = useCallback(async (
      _messageText: string,
      options: { 
        isImageModeIntent?: boolean; 
        isRegeneration?: boolean; 
        messagesForApi?: ChatMessage[];
      } = {}
    ) => {
        if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

        const { id: convId, selectedModelId, selectedResponseStyleName, messages } = activeConversation;
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
        // uploadedFile und uploadedFilePreview kommen jetzt aus activeConversation
        const isFileUpload = !!activeConversation.uploadedFile && !isImagePrompt; 
    
        if (isFileUpload && !currentModel.vision) {
          toast({ title: "Model Incompatibility", description: `Model '${currentModel.name}' doesn't support images.`, variant: "destructive" });
          setIsAiResponding(false);
          return;
        }
    
        let updatedMessagesForState = options.messagesForApi || messages;
        let newUserMessageId: string | null = null;

        if (!options.isRegeneration) {
            let userMessageContent: string | ChatMessageContentPart[] = chatInputValue.trim();
            if (isFileUpload && activeConversation.uploadedFilePreview) { // Zugriff über activeConversation
              userMessageContent = [
                { type: 'text', text: chatInputValue.trim() || "Describe this image." },
                { type: 'image_url', image_url: { url: activeConversation.uploadedFilePreview, altText: activeConversation.uploadedFile?.name, isUploaded: true } }
              ];
            }
        
            const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
            newUserMessageId = userMessage.id;
            
            updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
            setActiveConversation(prev => prev ? { ...prev, messages: updatedMessagesForState } : null);
            setLastUserMessageId(userMessage.id); // Track the new user message ID for scrolling
        } else {
           const lastUserMsg = updatedMessagesForState.slice().reverse().find(m => m.role === 'user');
           if (lastUserMsg) {
                newUserMessageId = lastUserMsg.id;
                setActiveConversation(prev => prev ? { ...prev, messages: updatedMessagesForState } : null);
                setLastUserMessageId(lastUserMsg.id); // Also track on regeneration
           }
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
          if (isImagePrompt && chatInputValue.trim()) {
              const endpoint = selectedImageModelId === 'gptimage' ? '/api/openai-image' : '/api/generate';
              const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: chatInputValue.trim(), model: selectedImageModelId, private: true }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to generate image.');
              
              const aiResponseContent: ChatMessageContentPart[] = [
                  { type: 'text', text: `Generated image for: "${chatInputValue.trim()}" (Model: ${selectedImageModelId})` },
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
                    systemPrompt: effectiveSystemPrompt,
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
      }
    }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setActiveConversation, setLastUserMessageId, selectedImageModelId]);
  
    const selectChat = useCallback((conversationId: string | null) => {
      if (conversationId === null) {
          setActiveConversation(null);
          return;
      }
      const conversationToSelect = allConversations.find(c => c.id === conversationId);
      if (conversationToSelect) {
          setActiveConversation({ ...conversationToSelect, uploadedFile: null, uploadedFilePreview: null });
          setLastUserMessageId(null); // Reset scroll target on chat switch
      }
    }, [allConversations, setActiveConversation, setLastUserMessageId]);
    
    // startNewChat muss vor dem useEffect definiert werden, der es aufruft
    const startNewChat = useCallback(() => {
        const newConversationId = crypto.randomUUID();
        const newConversationData: Conversation = {
            id: newConversationId,
            title: "New Conversation",
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
        setLastUserMessageId(null); // Reset scroll target on new chat

        return newConversationData;
    }, [allConversations, setAllConversations, setActiveConversation, setLastUserMessageId]);
    
    const requestEditTitle = useCallback((conversationId: string) => {
      const convToEdit = allConversations.find(c => c.id === conversationId);
      if (!convToEdit) return;
      setChatToEditId(conversationId);
      setEditingTitle(convToEdit.title);
      setIsEditTitleDialogOpen(true);
    }, [allConversations]);
    
    const confirmEditTitle = useCallback(() => {
      if (!chatToEditId || !editingTitle.trim()) {
        toast({ title: "Invalid Title", description: "Title cannot be empty.", variant: "destructive" });
        return;
      }
      const newTitle = editingTitle.trim();
      
      setAllConversations(prev => prev.map(c => c.id === chatToEditId ? { ...c, title: newTitle } : c));
      setActiveConversation(prev => (prev?.id === chatToEditId) ? { ...prev, title: newTitle } : prev);
      
      toast({ title: "Title Updated" });
      setIsEditTitleDialogOpen(false);
    }, [chatToEditId, editingTitle, setAllConversations, setActiveConversation, toast]);
  
    const cancelEditTitle = useCallback(() => setIsEditTitleDialogOpen(false), []);
  
    const requestDeleteChat = useCallback((conversationId: string) => {
      setChatToDeleteId(conversationId);
      setIsDeleteDialogOpen(true);
    }, []);
    
    const deleteChat = useCallback((conversationId: string) => {
        const wasActive = activeConversation?.id === conversationId;
        
        setAllConversations(prev => prev.filter(c => c.id !== conversationId));
  
        if (wasActive) {
          const nextChat = allConversations.filter(c => c.id !== conversationId && c.toolType === 'long language loops')
            .sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())[0] ?? null;
          
          if(nextChat) {
            selectChat(nextChat.id);
          } else {
            startNewChat(); // startNewChat ist jetzt bekannt
          }
        }

        toast({ title: "Chat Deleted" });
    }, [activeConversation?.id, allConversations, selectChat, setAllConversations, toast, startNewChat]);
  
    const confirmDeleteChat = useCallback(() => {
      if (!chatToDeleteId) return;
      deleteChat(chatToDeleteId);
      setIsDeleteDialogOpen(false);
    }, [chatToDeleteId, deleteChat]);
  
    const cancelDeleteChat = useCallback(() => setIsDeleteDialogOpen(false), []);
    
    const handleModelChange = useCallback((modelId: string) => {
      if (activeConversation) {
        setActiveConversation(prev => prev ? { ...prev, selectedModelId: modelId } : null);
      }
    }, [activeConversation, setActiveConversation]);

    const handleImageModelChange = useCallback((modelId: string) => {
        setSelectedImageModelId(modelId);
    }, [setSelectedImageModelId]);
  
    const handleStyleChange = useCallback((styleName: string) => {
       if (activeConversation) {
        setActiveConversation(prev => prev ? { ...prev, selectedResponseStyleName: styleName } : null);
       }
    }, [activeConversation, setActiveConversation]);

    const handleVoiceChange = useCallback((voiceId: string) => {
      setSelectedVoice(voiceId);
    }, []);
  
    const toggleHistoryPanel = useCallback(() => setIsHistoryPanelOpen(prev => !prev), []);
    const toggleAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(prev => !prev), []);
  
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
    }, [playingMessageId, toast, selectedVoice, setIsTtsLoadingForId, setPlayingMessageId]);
  
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
      
      await sendMessage("", { // `sendMessage` ist jetzt in Scope
        isRegeneration: true,
        messagesForApi: messagesForRegeneration
      });
  
    }, [isAiResponding, activeConversation, sendMessage, toast]);

    const startRecording = useCallback(async () => { // In useCallback gewickelt
        if (isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder; // mediaRecorderRef ist jetzt korrekt typisiert und zugreifbar
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
    }, [isRecording, toast, setChatInputValue, setIsRecording, setIsTranscribing]);

    const stopRecording = useCallback(() => { // In useCallback gewickelt
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording]);
  
    const openCamera = useCallback(() => setIsCameraOpen(true), []);
    const closeCamera = useCallback(() => setIsCameraOpen(false), []);

    // --- Effects ---
    // Fetch available image models on initial load
    useEffect(() => {
        const fetchImageModels = async () => {
          try {
            const res = await fetch('/api/image/models');
            if (!res.ok) throw new Error('Failed to fetch image models');
            const data = await res.json();
            const models = Array.isArray(data.models) ? data.models : FALLBACK_IMAGE_MODELS;
            setAvailableImageModels(models);
            // Ensure the selected model is valid
            if (!models.includes(selectedImageModelId)) {
              setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
            }
          } catch (error) {
            console.error("Error fetching image models for chat:", error);
            setAvailableImageModels(FALLBACK_IMAGE_MODELS);
            setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
          }
        };
        fetchImageModels();
    }, [selectedImageModelId, setSelectedImageModelId]);


    // Initial load from localStorage is now handled by the useLocalStorageState hook directly.
    // This effect now focuses on setting the active conversation on first load.
    useEffect(() => {
        if (!isInitialLoadComplete) { // Only run once on initial load
            const relevantConversations = allConversations.filter(c => c.toolType === 'long language loops');
            if (activeConversation === null && relevantConversations.length > 0) {
                const sortedConvs = [...relevantConversations].sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                setActiveConversation(sortedConvs[0]);
            } else if (activeConversation === null && relevantConversations.length === 0) {
                startNewChat(); // startNewChat ist jetzt bekannt
            }
            setIsInitialLoadComplete(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConversations, isInitialLoadComplete, activeConversation, startNewChat]);


    // Effect to update the allConversations in localStorage whenever active one changes
    useEffect(() => {
        if (activeConversation && isInitialLoadComplete) { // Ensure initial load is complete
            setAllConversations(prevAll => {
                const existingIndex = prevAll.findIndex(c => c.id === activeConversation.id);
                if (existingIndex > -1) {
                    const newAll = [...prevAll];
                    newAll[existingIndex] = { ...activeConversation, updatedAt: new Date().toISOString() }; // Update timestamp for active chat
                    return newAll.sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                } else {
                    const newAll = [activeConversation, ...prevAll];
                    return newAll.sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                }
            });
        }
    }, [activeConversation, setAllConversations, isInitialLoadComplete]);


    // --- Return Value ---
    return {
      activeConversation, allConversations,
      isAiResponding, isImageMode,
      isHistoryPanelOpen, isAdvancedPanelOpen,
      isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      playingMessageId, isTtsLoadingForId, chatInputValue,
      selectedVoice,
      isInitialLoadComplete,
      lastUserMessageId, // Expose for the view
      isRecording, isTranscribing,
      isCameraOpen,
      availableImageModels, selectedImageModelId,
      selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat, toggleImageMode,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange, handleImageModelChange,
      toggleHistoryPanel, closeHistoryPanel, 
      toggleAdvancedPanel, closeAdvancedPanel,
      handlePlayAudio,
      setChatInputValue,
      handleCopyToClipboard,
      regenerateLastResponse, // regenerateLastResponse ist jetzt in Scope
      startRecording, stopRecording,
      openCamera, closeCamera,
      toDate,
      setActiveConversation,
    };
}


interface ChatContextValue extends ReturnType<typeof useChatLogic> {
    // No extra fields needed, everything is in useChatLogic
}


const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");

    
    const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt });
    
    // This is a bit of a workaround to satisfy TypeScript's strictness
    // for the setChatInputValue function passed to the input component.
    const setChatInputValueWrapper = useCallback((value: string | ((prev: string) => string)) => {
        chatLogic.setChatInputValue(value);
    }, [chatLogic]);

    const chatContextValue: ChatContextValue = {
        ...chatLogic,
        setChatInputValue: setChatInputValueWrapper,
    };

    return (
        <ChatContext.Provider value={chatContextValue}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
