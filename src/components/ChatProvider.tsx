
"use client";

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import useLocalStorageState from '@/hooks/useLocalStorageState';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, deleteDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, type User, signInAnonymously } from 'firebase/auth';


export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
}

const MAX_STORED_CONVERSATIONS = 50;

export function useChatLogic({ userDisplayName, customSystemPrompt }: UseChatLogicProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [isAiResponding, setIsAiResponding] = useState(false);
    
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
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

    const { toast } = useToast();

    const toDate = (timestamp: Date | Timestamp | undefined | null): Date => {
        if (!timestamp) return new Date();
        if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
            return (timestamp as Timestamp).toDate();
        }
        return timestamp as Date;
    };

    const updateFirestoreConversation = useCallback(async (conversationId: string, updates: Partial<Conversation>) => {
        if (!currentUser) return;
    
        // Create a shallow copy to modify for Firestore
        const dataToStore: Partial<Conversation> & { updatedAt: any } = { 
            ...updates, 
            updatedAt: serverTimestamp() 
        };
    
        // Explicitly delete properties that should not be stored in Firestore.
        // These properties only exist on the client-side state.
        delete dataToStore.uploadedFile;
        delete dataToStore.uploadedFilePreview;
        delete dataToStore.messagesLoaded; // This is a client-side flag
    
        if (dataToStore.messages) {
            dataToStore.messages = dataToStore.messages.map((msg: ChatMessage) => {
                const messageForStore = { ...msg };
                
                // Ensure timestamp is a JS Date object for Firestore to convert
                if (messageForStore.timestamp && typeof (messageForStore.timestamp as Timestamp).toDate === 'function') {
                    messageForStore.timestamp = (messageForStore.timestamp as Timestamp).toDate();
                } else if (!(messageForStore.timestamp instanceof Date)) {
                    messageForStore.timestamp = new Date();
                }

                // Sanitize content array to prevent storing large data URIs
                if (Array.isArray(messageForStore.content)) {
                    messageForStore.content = messageForStore.content.map(part => {
                        if (part.type === 'image_url' && part.image_url.url.startsWith('data:image') && part.image_url.url.length > 500 * 1024) { 
                            return { 
                                ...part, 
                                image_url: { 
                                    ...part.image_url, 
                                    url: 'https://placehold.co/512x512.png?text=Image+Too+Large+For+History' 
                                } 
                            };
                        }
                        return part;
                    });
                }
                return messageForStore;
            });
        }
        
        const convRef = doc(db, 'users', currentUser.uid, 'conversations', conversationId);
        try {
            await setDoc(convRef, dataToStore, { merge: true });
        } catch (error) {
            console.error("Error updating conversation in Firestore:", error);
            toast({ title: "Save Error", description: "Could not save changes to the cloud.", variant: "destructive" });
        }
    }, [currentUser, toast]);


    // Fetch only conversation metadata initially
    const loadConversations = useCallback(async (user: User) => {
        setIsHistoryLoading(true);
        const conversationsRef = collection(db, 'users', user.uid, 'conversations');
        const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

        try {
            const querySnapshot = await getDocs(q);
            const loadedConversations: Conversation[] = querySnapshot.docs
            .map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    title: data.title,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    toolType: data.toolType,
                    selectedModelId: data.selectedModelId,
                    selectedResponseStyleName: data.selectedResponseStyleName,
                    messages: [],
                    messagesLoaded: false,
                } as Conversation;
            }).filter(Boolean);

            setAllConversations(loadedConversations);
        } catch (error) {
            console.error("Error loading conversations from Firestore:", error);
            toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
        } finally {
            setIsHistoryLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                if (!isInitialLoadComplete) {
                   await loadConversations(user);
                   setIsInitialLoadComplete(true);
                }
            } else {
                try {
                    const userCredential = await signInAnonymously(auth);
                    setCurrentUser(userCredential.user);
                    setAllConversations([]);
                    setIsHistoryLoading(false); 
                    setIsInitialLoadComplete(true);
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                    toast({ title: "Authentication Error", description: "Could not connect. Please check your Firebase configuration and security rules.", variant: "destructive" });
                    setIsHistoryLoading(false);
                    setIsInitialLoadComplete(true); 
                }
            }
        });
        return () => unsubscribe();
    }, [toast, loadConversations, isInitialLoadComplete]);
    
    const updateActiveConversationState = useCallback((updates: Partial<Conversation> | ((prevState: Conversation | null) => Conversation | null)) => {
        setActiveConversation(prevActive => {
            const newState = typeof updates === 'function' ? updates(prevActive) : { ...prevActive, ...updates };
            // Ensure a null previous state doesn't break the spread operator
            if (prevActive === null && typeof updates !== 'function') {
                return updates as Conversation;
            }
            return newState as Conversation | null;
        });
    }, []);
  
    useEffect(() => {
        if (activeConversation) {
            setIsImageMode(activeConversation.isImageMode || false);

            setAllConversations(prevAllConvs => {
                const existingIndex = prevAllConvs.findIndex(c => c.id === activeConversation.id);
                if (existingIndex > -1) {
                    const newAllConvs = [...prevAllConvs];
                    newAllConvs[existingIndex] = activeConversation;
                    newAllConvs.sort((a,b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                    return newAllConvs;
                }
                return [activeConversation, ...prevAllConvs];
            });
        }
    }, [activeConversation]);
  
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

                  updateActiveConversationState({ title: finalTitle });
                  return finalTitle;

                } catch (error) { 
                    console.error("Failed to generate chat title:", error); 
                }
            }
        }
      }
      return convToUpdate.title;
    }, [allConversations, activeConversation, updateActiveConversationState]);
    
    const sendMessage = useCallback(async (
      _messageText: string,
      options: { isImageModeIntent?: boolean; } = {}
    ) => {
        if (!currentUser || !activeConversation || !activeConversation.messagesLoaded || activeConversation.toolType !== 'long language loops' || (!chatInputValue.trim() && !activeConversation.uploadedFile)) return;
    
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
    
        setIsAiResponding(true);
        setChatInputValue('');
        const isImagePrompt = options.isImageModeIntent || false;
        const isFileUpload = !!uploadedFile && !isImagePrompt;
    
        if (isFileUpload && !currentModel.vision) {
          toast({ title: "Model Incompatibility", description: `Model '${currentModel.name}' doesn't support images.`, variant: "destructive" });
          setIsAiResponding(false);
          return;
        }
    
        let userMessageContent: string | ChatMessageContentPart[] = chatInputValue.trim();
        if (isFileUpload && uploadedFilePreview) {
          userMessageContent = [
            { type: 'text', text: chatInputValue.trim() || "Describe this image." },
            { type: 'image_url', image_url: { url: uploadedFilePreview, altText: uploadedFile.name, isUploaded: true } }
          ];
        }
    
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: 'long language loops' };
        
        const updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
        updateActiveConversationState({ messages: updatedMessagesForState });

        const historyForApi: ApiChatMessage[] = updatedMessagesForState
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => {
            let apiContent: string | ChatMessageContentPart[];

            if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                const textPart = msg.content.find(p => p.type === 'text');
                apiContent = textPart ? [{ type: 'text', text: textPart.text }] : [];
            } else {
                apiContent = msg.content;
            }
            
            return {
              role: msg.role as 'user' | 'assistant',
              content: apiContent,
            };
        });
      
      let finalMessages = updatedMessagesForState;
      let finalTitle = activeConversation.title;

      try {
          let aiMessage: ChatMessage;
          if (isImagePrompt && chatInputValue.trim()) {
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
              aiMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: 'long language loops' };
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
              aiMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseText, timestamp: new Date(), toolType: 'long language loops' };
          }
          finalMessages = [...updatedMessagesForState, aiMessage];
          finalTitle = await updateConversationTitle(convId, finalMessages);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        const errorMsg: ChatMessage = {id: crypto.randomUUID(), role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}`, timestamp: new Date(), toolType: 'long language loops'};
        finalMessages = [...updatedMessagesForState, errorMsg];
      } finally {
        const newUpdatedAt = new Date();
        const finalConversationState = { messages: finalMessages, title: finalTitle, updatedAt: newUpdatedAt };
        updateActiveConversationState(finalConversationState);
        updateFirestoreConversation(convId, finalConversationState);
        setIsAiResponding(false);
        if (isImagePrompt || isFileUpload) {
            updateActiveConversationState({ isImageMode: false, uploadedFile: null, uploadedFilePreview: null });
        }
      }
    }, [activeConversation, customSystemPrompt, userDisplayName, toast, updateActiveConversationState, updateConversationTitle, chatInputValue, currentUser, updateFirestoreConversation]);
  
    const selectChat = useCallback(async (conversationId: string | null) => {
      if (conversationId === null) {
          setActiveConversation(null);
          return;
      }
      if (!currentUser) return;

      const conversationToSelect = allConversations.find(c => c.id === conversationId);
      if (conversationToSelect) {
        if (conversationToSelect.messagesLoaded) {
          setActiveConversation({ ...conversationToSelect, uploadedFile: null, uploadedFilePreview: null });
        } else {
          setActiveConversation({ ...conversationToSelect, messages: [], uploadedFile: null, uploadedFilePreview: null });

          const convRef = doc(db, 'users', currentUser.uid, 'conversations', conversationId);
          try {
            const docSnap = await getDoc(convRef);
            if (docSnap.exists()) {
              const fullConversationData = docSnap.data();
              const fullConversation: Conversation = {
                ...conversationToSelect,
                ...fullConversationData,
                messages: (fullConversationData.messages || []).map((msg: any) => ({
                    ...msg,
                    id: msg.id || crypto.randomUUID()
                })),
                messagesLoaded: true,
              };
              setActiveConversation(fullConversation);
            } else {
              throw new Error("Conversation document not found.");
            }
          } catch (error) {
            console.error("Error loading full conversation:", error);
            toast({ title: "Error", description: "Could not load chat messages.", variant: "destructive" });
            setActiveConversation(null);
          }
        }
      }
    }, [allConversations, currentUser, toast]);
    
    const startNewChat = useCallback(async (): Promise<Conversation | null> => {
        if (!currentUser) return null;

        const newConversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messagesLoaded'> = {
            title: "default.long.language.loop",
            messages: [],
            toolType: 'long language loops',
            isImageMode: false,
            selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID,
            selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
        };
        
        const newConversationId = crypto.randomUUID();
        const newConvForState: Conversation = {
            id: newConversationId,
            ...newConversationData,
            createdAt: new Date(),
            updatedAt: new Date(),
            messagesLoaded: true,
        };

        try {
            const dataForFirestore = {
                ...newConversationData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const convRef = doc(db, 'users', currentUser.uid, 'conversations', newConversationId);
            await setDoc(convRef, dataForFirestore);
            
            // This is now safe because we set the state *after* successful creation
            setActiveConversation(newConvForState);

            if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
                const sortedConvs = [...allConversations].sort((a, b) => toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime());
                const oldestConversation = sortedConvs[0];
                if (oldestConversation) {
                    const oldConvRef = doc(db, 'users', currentUser.uid, 'conversations', oldestConversation.id);
                    await deleteDoc(oldConvRef);
                    setAllConversations(prev => prev.filter(c => c.id !== oldestConversation.id));
                }
            }

            return newConvForState;

        } catch (error) {
            console.error("Error creating new conversation in Firestore:", error);
            toast({ title: "Error", description: "Could not start a new chat.", variant: "destructive" });
            return null;
        }
    }, [currentUser, allConversations, toast]);
    
    const requestEditTitle = (conversationId: string) => {
      const convToEdit = allConversations.find(c => c.id === conversationId);
      if (!convToEdit) return;
      setChatToEditId(conversationId);
      setEditingTitle(convToEdit.title);
      setIsEditTitleDialogOpen(true);
    };
    
    const confirmEditTitle = () => {
      if (!chatToEditId || !editingTitle.trim() || !currentUser) {
        toast({ title: "Invalid Title", description: "Title cannot be empty.", variant: "destructive" });
        return;
      }
      const newTitle = editingTitle.trim();
      
      updateFirestoreConversation(chatToEditId, { title: newTitle });

      setAllConversations(prev => prev.map(c => c.id === chatToEditId ? {...c, title: newTitle} : c));

      if (activeConversation?.id === chatToEditId) {
          updateActiveConversationState({ title: newTitle });
      }
      
      toast({ title: "Title Updated" });
      setIsEditTitleDialogOpen(false);
    };
  
    const cancelEditTitle = () => setIsEditTitleDialogOpen(false);
  
    const requestDeleteChat = (conversationId: string) => {
      setChatToDeleteId(conversationId);
      setIsDeleteDialogOpen(true);
    };
    
    const deleteChat = useCallback(async (conversationId: string) => {
        if (!currentUser) return;
        const wasActive = activeConversation?.id === conversationId;
        const conversationsBeforeDelete = allConversations;
        
        const updatedConversations = allConversations.filter(c => c.id !== conversationId);
        setAllConversations(updatedConversations);
  
        if (wasActive) {
          const nextChat = updatedConversations.find(c => c.toolType === 'long language loops') ?? null;
          selectChat(nextChat?.id ?? null);
        }

        toast({ title: "Chat Deleted" });
        
        const convRef = doc(db, 'users', currentUser.uid, 'conversations', conversationId);
        try {
            await deleteDoc(convRef);
        } catch (error) {
            console.error("Error deleting conversation from Firestore:", error);
            toast({ title: "Delete Error", description: "Could not delete chat from the cloud.", variant: "destructive" });
            setAllConversations(conversationsBeforeDelete);
        }
    }, [currentUser, activeConversation?.id, allConversations, selectChat, toast]);
  
    const confirmDeleteChat = () => {
      if (!chatToDeleteId) return;
      deleteChat(chatToDeleteId);
      setIsDeleteDialogOpen(false);
    };
  
    const cancelDeleteChat = () => setIsDeleteDialogOpen(false);
    
    const toggleImageMode = () => {
      if (!activeConversation) return;
      const newImageModeState = !isImageMode; 
      updateActiveConversationState({ isImageMode: newImageModeState, uploadedFile: null, uploadedFilePreview: null });
    };

    const handleFileSelect = (file: File | null) => {
      if (!activeConversation) return;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateActiveConversationState({ isImageMode: false, uploadedFile: file, uploadedFilePreview: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
      }
    };
  
    const clearUploadedImage = () => {
      if (activeConversation) handleFileSelect(null); 
    }
  
    const handleModelChange = useCallback((modelId: string) => {
      if (activeConversation && currentUser) {
        updateActiveConversationState({ selectedModelId: modelId });
        updateFirestoreConversation(activeConversation.id, { selectedModelId: modelId });
      }
    }, [activeConversation, currentUser, updateActiveConversationState, updateFirestoreConversation]);
  
    const handleStyleChange = useCallback((styleName: string) => {
       if (activeConversation && currentUser) {
        updateActiveConversationState({ selectedResponseStyleName: styleName });
        updateFirestoreConversation(activeConversation.id, { selectedResponseStyleName: styleName });
       }
    }, [activeConversation, currentUser, updateActiveConversationState, updateFirestoreConversation]);

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
      
      if (!text || !text.trim()) {
        return;
      }
      
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
      if (!activeConversation || !activeConversation.messagesLoaded) return;
      
      if (isAiResponding) {
        toast({ title: "Please Wait", description: "The AI is currently responding.", variant: "destructive" });
        return;
      }

      const lastMessageIndex = activeConversation.messages.length - 1;
      const lastMessage = activeConversation.messages[lastMessageIndex];
  
      if (!lastMessage || lastMessage.role !== 'assistant') {
        toast({ title: "Action Not Available", description: "You can only regenerate the AI's most recent response.", variant: "destructive" });
        return;
      }
  
      const historyForApi = activeConversation.messages.slice(0, lastMessageIndex);
      updateActiveConversationState({ messages: historyForApi });
      
      const lastUserMessage = historyForApi.filter(msg => msg.role === 'user').slice(-1)[0];
      
      if(lastUserMessage) {
        const promptText = typeof lastUserMessage.content === 'string' 
          ? lastUserMessage.content 
          : lastUserMessage.content.find(p => p.type === 'text')?.text || '';
        
        setChatInputValue(promptText);

        setTimeout(() => {
            sendMessage(promptText);
        }, 0);

      } else {
        toast({ title: "Cannot Regenerate", description: "Could not find a previous user prompt.", variant: "destructive"});
      }

    }, [isAiResponding, activeConversation, updateActiveConversationState, sendMessage, toast]);
  
  
    return {
      activeConversation,
      allConversations,
      isAiResponding, isImageMode,
      isHistoryPanelOpen, isAdvancedPanelOpen,
      isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      playingMessageId, isTtsLoadingForId, chatInputValue,
      selectedVoice,
      isInitialLoadComplete,
      isHistoryLoading,
      selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat, toggleImageMode,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange,
      toggleHistoryPanel, closeHistoryPanel, 
      toggleAdvancedPanel, closeAdvancedPanel,
      handlePlayAudio,
      setChatInputValue,
      handleCopyToClipboard,
      regenerateLastResponse,
      currentUser,
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
        if (chatLogic.activeConversation && chatLogic.activeConversation.messagesLoaded) {
            setCurrentMessages(chatLogic.activeConversation.messages);
        } else {
            setCurrentMessages([]);
        }
    }, [chatLogic.activeConversation]);

    const chatContextValue = {
        ...chatLogic,
        currentMessages
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
