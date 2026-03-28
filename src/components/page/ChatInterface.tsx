import React, { useEffect } from 'react';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import {
    useChatComposer,
    useChatConversation,
    useChatMedia,
    useChatModes,
    useChatPanels,
} from '@/components/ChatProvider';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { ComposeMusicActions, ComposeMusicState } from '@/hooks/useComposeMusicState';
import { generateUUID } from '@/lib/uuid';
import { ChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
    visualizeToolState: UnifiedImageToolState;
    composeToolState: ComposeMusicState & ComposeMusicActions;
}

const LANDING_COMPOSE_AUTOSTART_KEY = 'landing-compose-autostart';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ visualizeToolState, composeToolState }) => {
    const composer = useChatComposer();
    const conversation = useChatConversation();
    const media = useChatMedia();
    const modes = useChatModes();
    const panels = useChatPanels();
    const { toast } = useToast();

    const handleComposeSubmit = async (e?: React.FormEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        const prompt = composer.chatInputValue.trim();
        if (!prompt || !conversation.activeConversation) return;

        composer.setIsAiResponding(true);

        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: generateUUID(),
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString(),
            toolType: 'compose'
        };

        conversation.setActiveConversation(prev => prev ? { ...prev, messages: [...(prev.messages || []), userMsg] } : null);
        composer.setChatInputValue('');

        // 2. Add temporary Loading Message
        const loadingMsg: ChatMessage = {
            id: 'loading',
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
        };
        conversation.setActiveConversation(prev => prev ? { ...prev, messages: [...(prev.messages || []), loadingMsg] } : null);

        // 3. Generate Music
        try {
            const audioUrl = await composeToolState.generateMusic(prompt);

            if (audioUrl) {
                // 4. Remove Loading and Add Assistant Message with Audio
                const assistantMsg: ChatMessage = {
                    id: generateUUID(),
                    role: 'assistant',
                    content: [
                        { 
                            type: 'audio_url', 
                            audio_url: { 
                                url: audioUrl, 
                                isGenerated: true,
                                metadata: { assetId: null }
                            } 
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    toolType: 'compose'
                };
                conversation.setActiveConversation(prev => {
                    if (!prev) return null;
                    const filtered = (prev.messages || []).filter(m => m.id !== 'loading');
                    return { ...prev, messages: [...filtered, assistantMsg] };
                });
            } else {
                // generateMusic already toasted — just clean up loading
                conversation.setActiveConversation(prev => prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== 'loading') } : null);
            }
        } catch (err) {
            console.error('Compose failed:', err);
            conversation.setActiveConversation(prev => prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== 'loading') } : null);
            toast({
                title: 'Fehler bei der Musikgenerierung',
                description: err instanceof Error ? err.message : 'Unbekannter Fehler',
                variant: 'destructive',
            });
        } finally {
            composer.setIsAiResponding(false);
        }
    };

    // Auto-submit compose only when explicitly requested by Landing -> Chat transition.
    // This prevents unexpected auto-generation when users switch modes manually in Chat.
    useEffect(() => {
        if (!modes.isComposeMode || !composer.chatInputValue.trim() || composer.isAiResponding) return;
        const messages = conversation.activeConversation?.messages;
        if (messages && messages.length > 0) return;

        try {
            const shouldAutostart = sessionStorage.getItem(LANDING_COMPOSE_AUTOSTART_KEY) === '1';
            if (!shouldAutostart) return;
            sessionStorage.removeItem(LANDING_COMPOSE_AUTOSTART_KEY);
        } catch {
            return;
        }

        handleComposeSubmit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modes.isComposeMode, composer.chatInputValue, composer.isAiResponding, conversation.activeConversation?.messages?.length]);

    // Keyboard shortcuts: Cmd+K = new chat
    useKeyboardShortcuts({
        onNewChat: conversation.startNewChat,
        onToggleSidebar: panels.toggleHistoryPanel,
        onEscape: () => {
            panels.closeHistoryPanel();
            panels.closeAdvancedPanel();
        },
    });

    // Sync image model when in image mode
    useEffect(() => {
        if (!modes.isImageMode) return;
        if (visualizeToolState.selectedModelId !== modes.selectedImageModelId) {
            modes.handleImageModelChange(visualizeToolState.selectedModelId);
        }
    }, [modes.isImageMode, visualizeToolState.selectedModelId, modes.selectedImageModelId, modes.handleImageModelChange]);

    if (!conversation.activeConversation) {
        return null; // Don't show anything while loading to prevent flicker
    }

    const activeConversation = conversation.activeConversation;
    const { messages, selectedModelId, selectedResponseStyleName, uploadedFilePreview } = activeConversation;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <div className="flex-grow overflow-hidden h-full relative">
                {messages && messages.length > 0 ? (
                    <ErrorBoundary
                        fallbackTitle="Chat konnte nicht geladen werden"
                        fallbackMessage="Es gab ein Problem beim Anzeigen der Nachrichten. Versuche die Seite neu zu laden."
                        showHomeButton={false}
                    >
                        <ChatView
                            messages={messages}
                            isAiResponding={composer.isAiResponding}
                            onPlayAudio={media.handlePlayAudio}
                            playingMessageId={media.playingMessageId}
                            isTtsLoadingForId={media.isTtsLoadingForId}
                            onCopyToClipboard={composer.handleCopyToClipboard}
                            onRegenerate={composer.regenerateLastResponse}
                        />
                    </ErrorBoundary>
                ) : (
                    // Completely empty area - no branding, no text, nothing
                    <div className="h-full"></div>
                )}
            </div>

            <div className="shrink-0 px-4 pb-4">
                <ChatInput
                    onSendMessage={(msg, opts) => composer.sendMessage(msg, {
                        ...opts,
                        imageConfig: {
                            formFields: visualizeToolState.formFields,
                            uploadedImages: visualizeToolState.uploadedImages,
                            selectedModelId: visualizeToolState.selectedModelId
                        }
                    })}
                    isLoading={composer.isAiResponding}
                    uploadedFilePreviewUrl={uploadedFilePreview || null}
                    onFileSelect={(file, type) => media.handleFileSelect(file, type)}
                    isLongLanguageLoopActive={true}
                    inputValue={composer.chatInputValue}
                    onInputChange={composer.setChatInputValue}
                    isImageMode={modes.isImageMode}
                    onToggleImageMode={modes.toggleImageMode}
                    webBrowsingEnabled={modes.webBrowsingEnabled}
                    onToggleWebBrowsing={modes.toggleWebBrowsing}
                    isCodeMode={!!activeConversation.isCodeMode}
                    onToggleCodeMode={(forcedState?: boolean) => {
                        const turnedOn = forcedState !== undefined ? forcedState : !activeConversation.isCodeMode;
                        conversation.setActiveConversation(prev => prev ? { ...prev, isCodeMode: turnedOn } : prev);
                    }}
                    isComposeMode={modes.isComposeMode}
                    onToggleComposeMode={modes.toggleComposeMode}
                    composeToolState={composeToolState}
                    onComposeSubmit={handleComposeSubmit}
                    selectedModelId={selectedModelId!}
                    handleModelChange={modes.handleModelChange}
                    selectedResponseStyleName={selectedResponseStyleName!}
                    handleStyleChange={modes.handleStyleChange}
                    selectedVoice={modes.selectedVoice}
                    handleVoiceChange={modes.handleVoiceChange}
                    selectedTtsSpeed={modes.selectedTtsSpeed}
                    handleTtsSpeedChange={modes.handleTtsSpeedChange}
                    isRecording={media.isRecording}
                    isTranscribing={media.isTranscribing}
                    startRecording={media.startRecording}
                    stopRecording={media.stopRecording}
                    openCamera={media.openCamera}
                    visualizeToolState={visualizeToolState}
                />
            </div>
        </div>
    );
};

export default ChatInterface;
