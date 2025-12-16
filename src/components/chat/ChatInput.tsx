'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, ImageIcon, Paperclip, Camera, File, FileImage, XCircle, Code2, MoreHorizontal, Palette, Globe, Settings, MoreVertical, ChevronUp, Plus, MessageSquare, FileText, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import { useLanguage } from '../LanguageProvider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContextualPopup, ModalPopup } from "@/components/ui/popup";
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';

// Model Icons
import ClaudeIcon from '../../../icons models/claude-color.png';
import DeepSeekIcon from '../../../icons models/deepseek-color.png';
import GeminiIcon from '../../../icons models/gemini-color.png';
import GrokIcon from '../../../icons models/grokfarbe.png';
import KimiIcon from '../../../icons models/kimifarbe.png';
import MistralIcon from '../../../icons models/mistral-color.png';
import OpenAIIcon from '../../../icons models/openfarbe.png';
import PerplexityIcon from '../../../icons models/perplexity-color.png';
import QwenIcon from '../../../icons models/qwen-color.png';

// Model Icon Mapping
const modelIcons: Record<string, any> = {
    'claude': ClaudeIcon,
    'claude-fast': ClaudeIcon,
    'claude-large': ClaudeIcon,
    'deepseek': DeepSeekIcon,
    'gemini-large': GeminiIcon,
    'gemini': GeminiIcon,
    'gemini-search': GeminiIcon,
    'openai-large': OpenAIIcon,
    'openai-reasoning': OpenAIIcon,
    'grok': GrokIcon,
    'moonshot': KimiIcon, // Moonshot Kimi uses kimi icon
    'perplexity-reasoning': PerplexityIcon,
    'perplexity-fast': PerplexityIcon,
    'qwen-coder': QwenIcon,
    'mistral': MistralIcon,
    'mistral-large': MistralIcon,
    'mistral-medium': MistralIcon,
    'mistral-small': MistralIcon,
};

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
    isAdvancedPanelOpen,
    advancedPanelRef,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    isHistoryPanelOpen,
    isGalleryPanelOpen,
    allConversations,
    activeConversation,
    selectChat,
    closeHistoryPanel,
    requestEditTitle,
    deleteChat,
    startNewChat,
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
    mistralFallbackEnabled,
    onToggleMistralFallback,
    isCodeMode = false,
    onToggleCodeMode,
}) => {
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isExpandedModelSelectorOpen, setIsExpandedModelSelectorOpen] = useState(false);
    const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);

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
    const quickSettingsButtonRef = useRef<HTMLButtonElement>(null);
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
                ? `Du bist jetzt in der INchat-Visualisierung. Tippe hier ein, was du sehen willst und die Maschine erstellt ein Bild.`
                : webBrowsingEnabled
                    ? `Du nutzt jetzt die Web-Recherche`
                    : isCodeMode
                        ? `Du bist jetzt im Code-Assistenz-Modus`
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
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="bg-white dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
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

                                    {/* Quick Settings Popup - Unified Design */}
                                    {isQuickSettingsOpen && (
                                        <ContextualPopup position="top-center" triggerRef={quickSettingsButtonRef} className="min-w-[340px] p-0">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold">Quick Settings</h3>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setIsQuickSettingsOpen(false)}
                                                    className="h-7 w-7 rounded-full hover:bg-muted"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 space-y-4">
                                                {/* Voice Selection */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <Mic className="w-4 h-4" />
                                                        Stimme
                                                    </label>
                                                    <Select
                                                        value={selectedVoice}
                                                        onValueChange={handleVoiceChange}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="English_ConfidentWoman">🎙️ Luca</SelectItem>
                                                            <SelectItem value="Japanese_CalmLady">🎙️ Sky</SelectItem>
                                                            <SelectItem value="French_Female_News Anchor">🎙️ Charlie</SelectItem>
                                                            <SelectItem value="German_FriendlyMan">🎙️ Mika</SelectItem>
                                                            <SelectItem value="German_PlayfulMan">🎙️ Casey</SelectItem>
                                                            <SelectItem value="Korean_ReliableYouth">🎙️ Taylor</SelectItem>
                                                            <SelectItem value="Japanese_InnocentBoy">🎙️ Jamie</SelectItem>
                                                            <SelectItem value="R8_8CZH4KMY">🎙️ Dev</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Image Model Selection */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <ImageIcon className="w-4 h-4" />
                                                        Bildmodell
                                                    </label>
                                                    <Select
                                                        value={selectedImageModelId}
                                                        onValueChange={handleImageModelChange}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="nanobanana">🎨 Nanobanana (Standard)</SelectItem>
                                                            <SelectItem value="kontext">🎨 Kontext</SelectItem>
                                                            <SelectItem value="nanobanana-pro">✨ Nanobanana Pro</SelectItem>
                                                            <SelectItem value="seedream">🎨 Seedream</SelectItem>
                                                            <SelectItem value="seedream-pro">✨ Seedream Pro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Response Style Selection */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Antwortstil
                                                    </label>
                                                    <Select
                                                        value={selectedResponseStyleName}
                                                        onValueChange={handleStyleChange}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Basic">💬 Basic</SelectItem>
                                                            <SelectItem value="Precise">🎯 Präzise</SelectItem>
                                                            <SelectItem value="Deep Dive">🔬 Deep Dive</SelectItem>
                                                            <SelectItem value="Emotional Support">💝 Emotional Support</SelectItem>
                                                            <SelectItem value="Philosophical">🤔 Philosophical</SelectItem>
                                                            <SelectItem value="User Default">⭐ User Default</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Provider Toggle */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <Settings2 className="w-4 h-4" />
                                                        Provider-Modus
                                                    </label>
                                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {mistralFallbackEnabled ? 'Mistral (Direct)' : 'Pollinations (Auto)'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={onToggleMistralFallback}
                                                            className={cn(
                                                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                                                mistralFallbackEnabled ? "bg-blue-600" : "bg-gray-300"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                                                    mistralFallbackEnabled ? "translate-x-5" : "translate-x-1"
                                                                )}
                                                            />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground px-1">
                                                        {mistralFallbackEnabled
                                                            ? 'Direkte Mistral API Nutzung'
                                                            : 'Automatischer Fallback bei Ausfällen'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </ContextualPopup>
                                    )}
                                </div>

                                {/* Plus Menu for Upload Functions - Unified Design */}
                                <DropdownMenu open={isPlusMenuOpen} onOpenChange={setIsPlusMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                            aria-label="Upload menu"
                                        >
                                            <Plus className="w-[20px] h-[20px]" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 p-0" align="start" side="top">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-semibold">Anhang hinzufügen</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-2">
                                            <DropdownMenuItem
                                                onClick={() => imageInputRef.current?.click()}
                                                disabled={isLoading || isImageMode}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer disabled:opacity-40 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Bild hochladen</span>
                                                    <span className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP</span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => docInputRef.current?.click()}
                                                disabled={isLoading || isImageMode}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer disabled:opacity-40 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Dokument hochladen</span>
                                                    <span className="text-xs text-muted-foreground">PDF, Bilder</span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={openCamera}
                                                disabled={isLoading || isImageMode}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer disabled:opacity-40 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Kamera aufnehmen</span>
                                                    <span className="text-xs text-muted-foreground">Direkt fotografieren</span>
                                                </div>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Tools Menu - Unified Design */}
                                <DropdownMenu open={isToolsMenuOpen} onOpenChange={setIsToolsMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className={cn(
                                                "group rounded-lg h-14 w-auto px-3 md:h-12 transition-all duration-300 relative",
                                                isImageMode || isCodeMode || webBrowsingEnabled
                                                    ? "bg-muted/50"
                                                    : "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                            )}
                                            aria-label="Tools menu"
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                {/* Mode Icon */}
                                                {isImageMode ? (
                                                    <Palette className="w-4 h-4" style={{ color: 'hsl(330 65% 62%)' }} />
                                                ) : isCodeMode ? (
                                                    <Code2 className="w-4 h-4 text-blue-500" />
                                                ) : webBrowsingEnabled ? (
                                                    <Globe className="w-4 h-4 text-green-500" />
                                                ) : null}
                                                <span className={cn(
                                                    "text-xs md:text-sm font-medium",
                                                    isImageMode ? "dark:text-purple-400" :
                                                        isCodeMode ? "text-blue-600 dark:text-blue-400" :
                                                            webBrowsingEnabled ? "text-green-600 dark:text-green-400" :
                                                                ""
                                                )}>
                                                    {isImageMode ? "Visualize" :
                                                        isCodeMode ? "Coding" :
                                                            webBrowsingEnabled ? "Web" : "Tools"}
                                                </span>
                                                <ChevronUp className="w-3 h-3 flex-shrink-0 opacity-60" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-80 p-0" align="start" side="top">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-border/50">
                                            <div className="flex items-center gap-2">
                                                <Settings className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-semibold">Tools & Modi</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Wähle einen Modus für dein Gespräch</p>
                                        </div>

                                        {/* Content */}
                                        <div className="p-2 space-y-1">
                                            {/* Standard Chat (Default) */}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    // Turn off all modes
                                                    if (isImageMode) onToggleImageMode();
                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                                                    !isImageMode && !isCodeMode && !webBrowsingEnabled
                                                        ? "bg-accent border border-border/50"
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                                    !isImageMode && !isCodeMode && !webBrowsingEnabled
                                                        ? "bg-foreground/10"
                                                        : "bg-muted"
                                                )}>
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium block">Standard Chat</span>
                                                    <span className="text-xs text-muted-foreground">Normale Unterhaltung</span>
                                                </div>
                                                {!isImageMode && !isCodeMode && !webBrowsingEnabled && (
                                                    <div className="w-2 h-2 rounded-full bg-foreground/50"></div>
                                                )}
                                            </DropdownMenuItem>

                                            {/* Image Generation Mode */}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    if (isImageMode) onToggleImageMode();
                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                    if (!isImageMode) onToggleImageMode();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                                                    isImageMode
                                                        ? "dark:bg-purple-900/20 border dark:border-purple-800"
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                                    isImageMode
                                                        ? "dark:bg-purple-900/50"
                                                        : "dark:bg-purple-900/20"
                                                )}>
                                                    <Palette className={cn("w-4 h-4")} style={{ color: isImageMode ? 'hsl(330 65% 62%)' : 'hsl(330 65% 62%)' }} />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium block">Visualize Mode</span>
                                                    <span className="text-xs text-muted-foreground">Bilder erstellen</span>
                                                </div>
                                                {isImageMode && (
                                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(330 65% 62%)' }}></div>
                                                )}
                                            </DropdownMenuItem>

                                            {/* Web Research Mode */}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    if (isImageMode) onToggleImageMode();
                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                    if (!webBrowsingEnabled) onToggleWebBrowsing();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                                                    webBrowsingEnabled
                                                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                                        : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                                    webBrowsingEnabled
                                                        ? "bg-green-100 dark:bg-green-900/50"
                                                        : "bg-green-50 dark:bg-green-900/20"
                                                )}>
                                                    <Globe className={cn("w-4 h-4", webBrowsingEnabled ? "text-green-600" : "text-green-500")} />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium block">Web Research</span>
                                                    <span className="text-xs text-muted-foreground">Aktuelle Informationen</span>
                                                </div>
                                                {webBrowsingEnabled && (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                )}
                                            </DropdownMenuItem>

                                            {/* Coding Assist Mode */}
                                            {onToggleCodeMode && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (isImageMode) onToggleImageMode();
                                                        if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                        if (webBrowsingEnabled) onToggleWebBrowsing();
                                                        if (!isCodeMode) onToggleCodeMode();
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                                                        isCodeMode
                                                            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                                            : "hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-lg flex items-center justify-center",
                                                        isCodeMode
                                                            ? "bg-blue-100 dark:bg-blue-900/50"
                                                            : "bg-blue-50 dark:bg-blue-900/20"
                                                    )}>
                                                        <Code2 className={cn("w-4 h-4", isCodeMode ? "text-blue-600" : "text-blue-500")} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium block">Coding Assist</span>
                                                        <span className="text-xs text-muted-foreground">Code-Erstellung</span>
                                                    </div>
                                                    {isCodeMode && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                    )}
                                                </DropdownMenuItem>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Right Side: Model Selector + Mic + Send */}
                            <div className="flex items-center gap-0">
                                {/* Compact Model Selector - Unified Design */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[100px] max-w-[180px] md:max-w-[200px]"
                                            aria-label="Select model"
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                {/* Model Icon */}
                                                <div className="w-5 h-5 flex-shrink-0">
                                                    {modelIcons[selectedModelId] ? (
                                                        <Image
                                                            src={modelIcons[selectedModelId]}
                                                            alt={selectedModelId}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-md"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-white">
                                                                {selectedModelId?.charAt(0)?.toUpperCase() || 'A'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs md:text-sm font-medium truncate">
                                                    {(() => {
                                                        const modelDisplayMap: Record<string, string> = {
                                                            'claude': 'Claude',
                                                            'claude-fast': 'Haiku',
                                                            'claude-large': 'Opus',
                                                            'gemini-large': 'Gemini 3',
                                                            'gemini': 'Gemini',
                                                            'gemini-search': 'Gemini+',
                                                            'openai-large': 'GPT 5.2',
                                                            'openai-reasoning': 'o4 Pro',
                                                            'deepseek': 'DeepSeek',
                                                            'grok': 'Grok',
                                                            'moonshot': 'Kimi',
                                                            'perplexity-reasoning': 'Perplexity',
                                                            'perplexity-fast': 'Perplexity',
                                                            'qwen-coder': 'Qwen',
                                                            'mistral': 'Mistral',
                                                            'mistral-large': 'Mistral L',
                                                            'mistral-medium': 'Mistral M',
                                                            'mistral-small': 'Mistral S'
                                                        };
                                                        return modelDisplayMap[selectedModelId] || 'Claude';
                                                    })()}
                                                </span>
                                                <ChevronUp className="w-3 h-3 flex-shrink-0 opacity-60" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[340px] p-0 max-h-[420px] overflow-y-auto" align="end" side="top">
                                        {/* Header */}
                                        <div className="px-4 py-3 border-b border-border/50 sticky top-0 bg-popover z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-gradient-to-br" style={{ backgroundImage: 'linear-gradient(to bottom right, hsl(330 65% 62%), rgb(59, 130, 246))' }} />
                                                <span className="text-sm font-semibold">KI-Modell wählen</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Beliebte Modelle für dein Gespräch</p>
                                        </div>

                                        {/* Featured Models */}
                                        <div className="p-2 space-y-1">
                                            {[
                                                { id: 'claude', emoji: '🧠', highlight: 'Best' },
                                                { id: 'openai-large', emoji: '🚀', highlight: 'Premium' },
                                                { id: 'gemini', emoji: '✨', highlight: 'Advanced' }
                                            ].map((modelConfig) => {
                                                const model = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === modelConfig.id);
                                                if (!model) return null;
                                                const modelDisplayMap: Record<string, string> = {
                                                    'claude': 'Claude',
                                                    'claude-fast': 'Haiku',
                                                    'claude-large': 'Opus',
                                                    'gemini-large': 'Gemini 3',
                                                    'gemini': 'Gemini',
                                                    'gemini-search': 'Gemini+',
                                                    'openai-large': 'GPT 5.2',
                                                    'openai-reasoning': 'o4 Pro',
                                                    'deepseek': 'DeepSeek',
                                                    'grok': 'Grok',
                                                    'moonshot': 'Kimi',
                                                    'perplexity-reasoning': 'Perplexity',
                                                    'perplexity-fast': 'Perplexity',
                                                    'qwen-coder': 'Qwen',
                                                    'mistral': 'Mistral',
                                                    'mistral-large': 'Mistral L',
                                                    'mistral-medium': 'Mistral M',
                                                    'mistral-small': 'Mistral S'
                                                };
                                                return (
                                                    <DropdownMenuItem
                                                        key={model.id}
                                                        onClick={() => handleModelChange(model.id)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                                                            selectedModelId === model.id
                                                                ? "bg-accent border border-border/50"
                                                                : "hover:bg-muted/50"
                                                        )}
                                                    >
                                                        {/* Model Icon */}
                                                        <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                            {modelIcons[model.id] ? (
                                                                <Image
                                                                    src={modelIcons[model.id]}
                                                                    alt={model.id}
                                                                    width={28}
                                                                    height={28}
                                                                    className="rounded-lg"
                                                                />
                                                            ) : (
                                                                <span className="text-lg">{modelConfig.emoji}</span>
                                                            )}
                                                        </div>

                                                        {/* Model Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm truncate">{modelDisplayMap[model.id] || model.name}</span>
                                                                {modelConfig.highlight && selectedModelId !== model.id && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                                        {modelConfig.highlight}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                {model.useCases && model.useCases.length > 0 ? (
                                                                    // Show use cases if available
                                                                    model.useCases.map((useCase, idx) => (
                                                                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                                            {useCase}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    // Fallback to technical tags if no use cases
                                                                    <>
                                                                        {model.vision && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                                                👁️ Bilder
                                                                            </span>
                                                                        )}
                                                                        {model.webBrowsing && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                                                🌐 Web
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Selection indicator */}
                                                        {selectedModelId === model.id && (
                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                        )}
                                                    </DropdownMenuItem>
                                                );
                                            })}

                                            {/* Divider */}
                                            <div className="my-2 border-t border-border/50" />

                                            {/* More Models Button */}
                                            <DropdownMenuItem
                                                className="flex items-center justify-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors"
                                                onClick={() => setIsExpandedModelSelectorOpen(true)}
                                            >
                                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Alle {AVAILABLE_POLLINATIONS_MODELS.length} Modelle anzeigen</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

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

            {/* Expanded Model Selector Modal - Unified Design */}
            {isExpandedModelSelectorOpen && (
                <ModalPopup maxWidth="4xl">
                    <div className="p-0">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                        <span className="text-white text-sm">🤖</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">Alle KI-Modelle</h2>
                                        <p className="text-xs text-muted-foreground">{AVAILABLE_POLLINATIONS_MODELS.length} Modelle verfügbar</p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpandedModelSelectorOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-muted"
                            >
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Category Groups */}
                            {['Premium', 'Standard', 'Specialized'].map((category) => {
                                const categoryModels = AVAILABLE_POLLINATIONS_MODELS.filter(m => m.category === category);
                                if (categoryModels.length === 0) return null;

                                return (
                                    <div key={category} className="mb-6 last:mb-0">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                            {category === 'Premium' && '⭐'}
                                            {category === 'Standard' && '🔷'}
                                            {category === 'Specialized' && '🔧'}
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {categoryModels.map((model) => (
                                                <div
                                                    key={model.id}
                                                    onClick={() => {
                                                        handleModelChange(model.id);
                                                        setIsExpandedModelSelectorOpen(false);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]",
                                                        selectedModelId === model.id
                                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                            : "border-border/50 hover:border-border hover:bg-muted/30"
                                                    )}
                                                >
                                                    {/* Model Icon */}
                                                    <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                        {modelIcons[model.id] ? (
                                                            <Image
                                                                src={modelIcons[model.id]}
                                                                alt={model.id}
                                                                width={36}
                                                                height={36}
                                                                className="rounded-lg"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                                                <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                                                                    {model.id?.charAt(0)?.toUpperCase() || 'A'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-sm">{model.name}</span>
                                                            {selectedModelId === model.id && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                                                    Aktiv
                                                                </span>
                                                            )}
                                                        </div>

                                                        {model.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                                {model.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            {model.vision && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                                                    👁️ Vision
                                                                </span>
                                                            )}
                                                            {model.webBrowsing && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                                                                    🌐 Web
                                                                </span>
                                                            )}
                                                            {model.contextWindow && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                                                    📝 {(model.contextWindow / 1000).toFixed(0)}K
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Selection indicator */}
                                                    {selectedModelId === model.id && (
                                                        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ModalPopup>
            )}
        </div>
    );
};

export default ChatInput;
