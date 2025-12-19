'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Mic, Square, ArrowUp } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import type { Conversation } from '@/types';
import { QuickSettingsMenu } from './input/QuickSettingsMenu';
import { UploadMenu } from './input/UploadMenu';
import { ToolsMenu } from './input/ToolsMenu';
import { ModelSelector } from './input/ModelSelector';
import { MobileOptionsMenu } from './input/MobileOptionsMenu';

interface ChatInputProps {
    onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
    isLoading: boolean;
    uploadedFilePreviewUrl: string | null;
    onFileSelect: (file: File | null, fileType: string | null) => void;
    onClearUploadedImage: () => void;
    isLongLanguageLoopActive: boolean;
    inputValue: string;
    onInputChange: (value: string | ((prev: string) => string)) => void;
    isImageMode: boolean;
    onToggleImageMode: () => void;
    isCodeMode?: boolean;
    onToggleCodeMode?: () => void;
    chatTitle: string;
    onToggleHistoryPanel: () => void;
    onToggleGalleryPanel: () => void;
    onToggleAdvancedPanel: () => void;
    isHistoryPanelOpen: boolean;
    isGalleryPanelOpen: boolean;
    isAdvancedPanelOpen: boolean;
    advancedPanelRef: React.RefObject<HTMLDivElement>;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    selectChat: (id: string) => void;
    closeHistoryPanel: () => void;
    requestEditTitle: (id: string) => void;
    deleteChat: (id: string) => void;
    startNewChat: () => void;
    closeAdvancedPanel: () => void;
    toDate: (timestamp: Date | string | undefined | null) => Date;
    selectedModelId: string;
    handleModelChange: (modelId: string) => void;
    selectedResponseStyleName: string;
    handleStyleChange: (styleName: string) => void;
    selectedVoice: string;
    handleVoiceChange: (voiceId: string) => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;
    mistralFallbackEnabled: boolean;
    onToggleMistralFallback: () => void;
    isRecording: boolean;
    isTranscribing: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    openCamera: () => void;
    availableImageModels: string[];
    selectedImageModelId: string;
    handleImageModelChange: (modelId: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    isLoading,
    uploadedFilePreviewUrl,
    onFileSelect,
    isLongLanguageLoopActive,
    inputValue,
    onInputChange,
    isImageMode,
    onToggleImageMode,
    chatTitle,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    selectedModelId,
    handleModelChange,
    selectedResponseStyleName,
    handleStyleChange,
    selectedVoice,
    handleVoiceChange,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    openCamera,
    selectedImageModelId,
    handleImageModelChange,
    mistralFallbackEnabled,
    onToggleMistralFallback,
    isCodeMode = false,
    onToggleCodeMode,
}) => {
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const docInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const quickSettingsButtonRef = useRef<HTMLButtonElement>(null);

    const TEXTAREA_MIN_HEIGHT = 80;
    const TEXTAREA_MAX_HEIGHT = 220;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(
                Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
                TEXTAREA_MAX_HEIGHT
            );
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [inputValue]);

    const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (isLoading || isRecording) return;
        const canSendMessage = (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || (inputValue.trim() !== '');
        if (canSendMessage) {
            onSendMessage(inputValue.trim(), { isImageModeIntent: isImageMode });
            onInputChange('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    }, [isLoading, isRecording, isLongLanguageLoopActive, uploadedFilePreviewUrl, inputValue, onSendMessage, isImageMode, onInputChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInputChange(e.target.value);
    }, [onInputChange]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'image') => {
        const file = event.target.files?.[0];
        onFileSelect(file || null, fileType);
        if (event.currentTarget) {
            event.currentTarget.value = "";
        }
    }, [onFileSelect]);

    const placeholderText = isRecording
        ? t('chat.recording')
        : isTranscribing
            ? t('chat.transcribing')
            : isImageMode
                ? t('chat.placeholder.imageMode')
                : webBrowsingEnabled
                    ? t('chat.placeholder.web')
                    : isCodeMode
                        ? t('chat.placeholder.code')
                        : t('chat.placeholder.standard');

    // Listen for reuse prompt (from gallery - should also activate Image Mode)
    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<string>;
            if (typeof custom.detail === 'string') {
                // Activate Image Mode when reusing a prompt from gallery
                if (!isImageMode && onToggleImageMode) {
                    onToggleImageMode();
                }
                onInputChange(custom.detail);
                if (textareaRef.current) textareaRef.current.focus();
            }
        };
        window.addEventListener('sidebar-reuse-prompt', handler);
        try {
            const storedTarget = localStorage.getItem('sidebar-preload-target');
            const storedPrompt = localStorage.getItem('sidebar-preload-prompt');
            if (storedPrompt && storedTarget === 'chat') {
                onInputChange(storedPrompt);
                if (textareaRef.current) textareaRef.current.focus();
                localStorage.removeItem('sidebar-preload-prompt');
                localStorage.removeItem('sidebar-preload-target');
            }
        } catch { }
        return () => window.removeEventListener('sidebar-reuse-prompt', handler);
    }, [onInputChange, isImageMode, onToggleImageMode]);

    return (
        <div className="relative">
            <div className="relative">
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-3 shadow-xl border border-black/5 dark:border-white/10 transition-all duration-300 hover:shadow-2xl hover:border-black/10 dark:hover:border-white/20 flex flex-col min-h-0">
                        <div className="flex-grow">
                            <Textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={handleTextareaInput}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholderText}
                                className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                                rows={1}
                                disabled={isLoading || isRecording || isTranscribing}
                                aria-label="Chat message input"
                                style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                            />
                        </div>
                        <div className="flex w-full items-center justify-between gap-1">
                            {/* Left Side: Quick Settings + Plus Menu + Mode Selector */}
                            <div className="flex items-center gap-0">
                                {isMobile ? (
                                    /* Mobile: Consolidated three-dot menu */
                                    <MobileOptionsMenu
                                        isLoading={isLoading}
                                        isImageMode={isImageMode}
                                        onImageUploadClick={() => imageInputRef.current?.click()}
                                        onDocUploadClick={() => docInputRef.current?.click()}
                                        onCameraClick={openCamera}
                                        onToggleImageMode={onToggleImageMode}
                                        isCodeMode={isCodeMode || false}
                                        onToggleCodeMode={onToggleCodeMode}
                                        webBrowsingEnabled={webBrowsingEnabled}
                                        onToggleWebBrowsing={onToggleWebBrowsing}
                                        selectedVoice={selectedVoice}
                                        onVoiceChange={handleVoiceChange}
                                        selectedImageModelId={selectedImageModelId}
                                        onImageModelChange={handleImageModelChange}
                                        selectedResponseStyleName={selectedResponseStyleName}
                                        onStyleChange={handleStyleChange}
                                        mistralFallbackEnabled={mistralFallbackEnabled}
                                        onToggleMistralFallback={onToggleMistralFallback}
                                    />
                                ) : (
                                    /* Desktop: Separate buttons */
                                    <>
                                        {/* Quick Settings Button */}
                                        <div className="relative">
                                            <Button
                                                ref={quickSettingsButtonRef}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
                                                className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                                aria-label="Quick settings"
                                            >
                                                <Settings2 className="w-[20px] h-[20px]" />
                                            </Button>

                                            <QuickSettingsMenu
                                                isOpen={isQuickSettingsOpen}
                                                onClose={() => setIsQuickSettingsOpen(false)}
                                                triggerRef={quickSettingsButtonRef}
                                                selectedVoice={selectedVoice}
                                                onVoiceChange={handleVoiceChange}
                                                selectedImageModelId={selectedImageModelId}
                                                onImageModelChange={handleImageModelChange}
                                                selectedResponseStyleName={selectedResponseStyleName}
                                                onStyleChange={handleStyleChange}
                                                mistralFallbackEnabled={mistralFallbackEnabled}
                                                onToggleMistralFallback={onToggleMistralFallback}
                                            />
                                        </div>

                                        <UploadMenu
                                            isOpen={isPlusMenuOpen}
                                            onOpenChange={setIsPlusMenuOpen}
                                            isLoading={isLoading}
                                            isImageMode={isImageMode}
                                            onImageUploadClick={() => imageInputRef.current?.click()}
                                            onDocUploadClick={() => docInputRef.current?.click()}
                                            onCameraClick={openCamera}
                                        />

                                        <ToolsMenu
                                            isOpen={isToolsMenuOpen}
                                            onOpenChange={setIsToolsMenuOpen}
                                            isImageMode={isImageMode}
                                            onToggleImageMode={onToggleImageMode}
                                            isCodeMode={isCodeMode || false}
                                            onToggleCodeMode={onToggleCodeMode}
                                            webBrowsingEnabled={webBrowsingEnabled}
                                            onToggleWebBrowsing={onToggleWebBrowsing}
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-0">

                                {/* Mic / Stop Button */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`group rounded-full h-12 w-12 transition-all duration-300 ${isRecording ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white'}`}
                                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                                >
                                    {isRecording ? (
                                        <Square className="w-[20px] h-[20px] fill-current" />
                                    ) : (
                                        <Mic className="w-[20px] h-[20px]" />
                                    )}
                                </Button>

                                {/* Send Button - Arrow on mobile */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || isRecording || (!inputValue.trim() && !uploadedFilePreviewUrl)}
                                    className={`ml-2 transition-all duration-300 font-medium ${isMobile ? 'h-10 w-10 p-0 rounded-lg' : 'h-10 px-6 rounded-xl'
                                        } ${inputValue.trim() || uploadedFilePreviewUrl
                                            ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600'
                                        }`}
                                    aria-label="Send message"
                                >
                                    {isMobile ? (
                                        <ArrowUp className="w-5 h-5" />
                                    ) : (
                                        t('chat.send')
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Hidden Inputs */}
            <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileChange(e, 'image')}
                accept="image/*"
                className="hidden"
            />
            <input
                type="file"
                ref={docInputRef}
                onChange={(e) => handleFileChange(e, 'document')}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
            />
        </div>
    );
};

export default ChatInput;
