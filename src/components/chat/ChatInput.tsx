'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, ImageIcon, Paperclip, Camera, File, FileImage, XCircle, Code2, MoreHorizontal, Palette, Globe, Settings, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';
import { useLanguage } from '../LanguageProvider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    onClearUploadedImage,
    isLongLanguageLoopActive,
    inputValue,
    onInputChange,
    isImageMode,
    onToggleImageMode,
    chatTitle,
    onToggleHistoryPanel,
    onToggleGalleryPanel,
    onToggleAdvancedPanel,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    isHistoryPanelOpen,
    isGalleryPanelOpen,
    isAdvancedPanelOpen,
    advancedPanelRef,
    allConversations,
    activeConversation,
    selectChat,
    closeHistoryPanel,
    requestEditTitle,
    deleteChat,
    startNewChat,
    closeAdvancedPanel,
    toDate,
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
    availableImageModels,
    selectedImageModelId,
    handleImageModelChange,
    isCodeMode = false,
    onToggleCodeMode,
}) => {
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const docInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isTitleHovered, setIsTitleHovered] = useState(false);

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

    const handleMicClick = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, stopRecording, startRecording]);

    const placeholderText = isRecording
        ? t('chat.recording')
        : isTranscribing
            ? t('chat.transcribing')
            : isImageMode
                ? `Imagination using ${selectedImageModelId}...`
                : isCodeMode
                    ? `Coding & reasoning with qwen-coder...`
                    : t('chat.placeholder');

    const iconColorClass = "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white";
    const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;
    const showChatTitle = chatTitle !== "default.long.language.loop" && !!chatTitle;

    // Listen for reuse prompt (sidebar / entry draft)
    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<string>;
            if (typeof custom.detail === 'string') {
                onInputChange(custom.detail);
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }
        };
        window.addEventListener('sidebar-reuse-prompt', handler);
        try {
            const storedTarget = localStorage.getItem('sidebar-preload-target');
            const storedPrompt = localStorage.getItem('sidebar-preload-prompt');
            if (storedPrompt && storedTarget === 'chat') {
                onInputChange(storedPrompt);
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
                localStorage.removeItem('sidebar-preload-prompt');
                localStorage.removeItem('sidebar-preload-target');
            }
        } catch { }
        return () => window.removeEventListener('sidebar-reuse-prompt', handler);
    }, [onInputChange]);


    return (
        <div className="relative">
            <div className="relative">
                {/* ThreeDots Quick Menu */}
                {isAdvancedPanelOpen && (
                    <div ref={advancedPanelRef} className="absolute bottom-full mb-2 left-0 w-64 z-30">
                        <div className="bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2">
                            {/* Image Mode Toggle */}
                            <button
                                onClick={onToggleImageMode}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left"
                            >
                                <ImageIcon className="w-4 h-4" />
                                <span className="flex-1">{isImageMode ? 'Bild-Modus An' : 'Bild-Modus Aus'}</span>
                                {isImageMode && <span className="text-xs text-blue-500">●</span>}
                            </button>

                            {/* Web Browsing Toggle */}
                            <button
                                onClick={onToggleWebBrowsing}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="flex-1">
                                    {webBrowsingEnabled
                                        ? 'Web-Suche An (Perplexity Fast)'
                                        : `Web-Suche Aus (${selectedModelId})`
                                    }
                                </span>
                                {webBrowsingEnabled && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-green-500">●</span>
                                        <span className="text-xs text-muted-foreground">WebBrowsing</span>
                                    </div>
                                )}
                            </button>

                            {/* Code Mode Toggle */}
                            <button
                                onClick={onToggleCodeMode}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left"
                            >
                                <Code2 className="w-4 h-4" />
                                <span className="flex-1">{isCodeMode ? 'Code-Modus An' : 'Code-Modus Aus'}</span>
                                {isCodeMode && <span className="text-xs text-purple-500">●</span>}
                            </button>

                            <div className="my-1 border-t border-border" />

                            {/* File Attachments */}
                            <button
                                onClick={() => docInputRef.current?.click()}
                                disabled={isLoading || isImageMode}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left disabled:opacity-40"
                            >
                                <File className="w-4 h-4" />
                                <span>Dokument hochladen</span>
                            </button>

                            <button
                                onClick={() => imageInputRef.current?.click()}
                                disabled={isLoading || isImageMode}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left disabled:opacity-40"
                            >
                                <FileImage className="w-4 h-4" />
                                <span>Bild hochladen</span>
                            </button>

                            <button
                                onClick={openCamera}
                                disabled={isLoading || isImageMode}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left disabled:opacity-40"
                            >
                                <Camera className="w-4 h-4" />
                                <span>Kamera aufnehmen</span>
                            </button>

                            <div className="my-1 border-t border-border" />
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="bg-pink-100 dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
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
                            {/* Left Side: Gear + ThreeDots */}
                            <div className="flex items-center gap-0">
                                <Link href="/settings">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                        aria-label="Open personalization settings"
                                    >
                                        <Settings className="w-[20px] h-[20px]" />
                                    </Button>
                                </Link>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onToggleAdvancedPanel}
                                    className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                    aria-label="Open menu"
                                >
                                    <MoreVertical className="w-[20px] h-[20px]" />
                                </Button>
                            </div>

                            {/* Right Side: Mic + Send */}
                            <div className="flex items-center gap-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleMicClick}
                                    disabled={isLoading || isTranscribing || isImageMode}
                                    className={cn(
                                        "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",
                                        isRecording ? "text-red-500 hover:text-red-600" : iconColorClass
                                    )}
                                >
                                    <Mic className="w-[18px] h-[18px]" style={{ maxWidth: '500px', width: '100%' }} />
                                </Button>
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-14 w-14 md:h-12 md:w-12",
                                        !isLoading && (inputValue.trim() || uploadedFilePreviewUrl)
                                            ? "text-blue-500 hover:text-blue-600"
                                            : iconColorClass
                                    )}
                                    disabled={isLoading || isRecording || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))}
                                    aria-label="Send message">
                                    <Send className="w-[26px] h-[26px]" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <input type="file" ref={docInputRef} onChange={(e) => handleFileChange(e, 'document')} accept="image/*,application/pdf" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
            <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
        </div>
    );
};

export default ChatInput;
