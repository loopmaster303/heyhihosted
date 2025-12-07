/**
 * Chat Effects Hook
 * Handles all useEffect logic for chat functionality
 */

import { useEffect, useRef } from 'react';
import useEscapeKey from '@/hooks/useEscapeKey';
import { toDate } from '@/utils/chatHelpers';
import type { Conversation } from '@/types';
import { FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import type { ImageModelsResponse, ApiErrorResponse } from '@/types/api';
import { isApiErrorResponse } from '@/types/api';

const MAX_STORED_CONVERSATIONS = 50;

interface UseChatEffectsProps {
    // State
    isHistoryPanelOpen: boolean;
    isAdvancedPanelOpen: boolean;
    isInitialLoadComplete: boolean;
    setIsInitialLoadComplete: (complete: boolean) => void;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    selectedImageModelId: string;
    
    // Setters
    setIsHistoryPanelOpen: (open: boolean) => void;
    setIsAdvancedPanelOpen: (open: boolean) => void;
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setAllConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setAvailableImageModels: (models: string[]) => void;
    setSelectedImageModelId: (modelId: string) => void;
    setLastUserMessageId: (id: string | null) => void;
    
    // Actions
    startNewChat: () => Conversation;
    retryLastRequest: () => Promise<void>;
    retryLastRequestRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function useChatEffects({
    isHistoryPanelOpen,
    isAdvancedPanelOpen,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    allConversations,
    activeConversation,
    selectedImageModelId,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
    setActiveConversation,
    setAllConversations,
    setAvailableImageModels,
    setSelectedImageModelId,
    setLastUserMessageId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
}: UseChatEffectsProps) {
    // ESC Key handlers for panels
    useEscapeKey(() => setIsHistoryPanelOpen(false), isHistoryPanelOpen);
    useEscapeKey(() => setIsAdvancedPanelOpen(false), isAdvancedPanelOpen);

    // Fetch available image models on initial load
    useEffect(() => {
        const fetchImageModels = async () => {
            try {
                const res = await fetch('/api/image/models?for=chat', {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (!res.ok) {
                    console.warn('Image models API returned non-OK status:', res.status);
                    setAvailableImageModels(FALLBACK_IMAGE_MODELS);
                    setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
                    return;
                }
                
                const data: ImageModelsResponse | ApiErrorResponse = await res.json();
                
                if (isApiErrorResponse(data) || !('models' in data) || !Array.isArray(data.models)) {
                    console.warn('Invalid response format from image models API:', data);
                    setAvailableImageModels(FALLBACK_IMAGE_MODELS);
                    setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
                    return;
                }
                
                const modelsResult = data as ImageModelsResponse;
                setAvailableImageModels(modelsResult.models);
                
                // Ensure the selected model is valid
                if (!modelsResult.models.includes(selectedImageModelId)) {
                    setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
                }
            } catch (error) {
                console.error("Error fetching image models for chat:", error);
                setAvailableImageModels(FALLBACK_IMAGE_MODELS);
                setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
            }
        };
        fetchImageModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount - no need to refetch when selectedImageModelId changes

    // Initial load from localStorage
    useEffect(() => {
        if (!isInitialLoadComplete) {
            const relevantConversations = allConversations.filter(c => c.toolType === 'long language loops');
            if (activeConversation === null && relevantConversations.length > 0) {
                const sortedConvs = [...relevantConversations].sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                setActiveConversation(sortedConvs[0]);
            } else if (activeConversation === null && relevantConversations.length === 0) {
                startNewChat();
            }
            setIsInitialLoadComplete(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConversations, isInitialLoadComplete, activeConversation, startNewChat, setIsInitialLoadComplete, setActiveConversation]);

    // Effect to update the allConversations in localStorage whenever active one changes
    useEffect(() => {
        if (activeConversation && isInitialLoadComplete) {
            setAllConversations(prevAll => {
                const existingIndex = prevAll.findIndex(c => c.id === activeConversation.id);
                if (existingIndex > -1) {
                    const newAll = [...prevAll];
                    newAll[existingIndex] = { ...activeConversation, updatedAt: new Date().toISOString() };
                    return newAll.sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                } else {
                    const newAll = [activeConversation, ...prevAll];
                    return newAll.sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                }
            });
        }
    }, [activeConversation, setAllConversations, isInitialLoadComplete]);

    // Update ref for toast callback
    useEffect(() => {
        retryLastRequestRef.current = retryLastRequest;
    }, [retryLastRequest, retryLastRequestRef]);
}

