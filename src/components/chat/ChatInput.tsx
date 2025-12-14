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
import GrokIcon from '../../../icons models/grok.png';
import KimiIcon from '../../../icons models/kimi-color.png';
import MistralIcon from '../../../icons models/mistral-color.png';
import OpenAIIcon from '../../../icons models/openai.png';
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

                                    {/* Quick Settings Popup */}
                                    {isQuickSettingsOpen && (
                                        <ContextualPopup position="top-center" triggerRef={quickSettingsButtonRef} className="min-w-[320px]">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-semibold">Quick Settings</h3>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setIsQuickSettingsOpen(false)}
                                                    className="h-6 w-6"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Voice Selection */}
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Stimme (Voice Mode)</label>
                                                    <Select
                                                        value={selectedVoice}
                                                        onValueChange={handleVoiceChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="English_ConfidentWoman">Luca</SelectItem>
                                                            <SelectItem value="Japanese_CalmLady">Sky</SelectItem>
                                                            <SelectItem value="French_Female_News Anchor">Charlie</SelectItem>
                                                            <SelectItem value="German_FriendlyMan">Mika</SelectItem>
                                                            <SelectItem value="German_PlayfulMan">Casey</SelectItem>
                                                            <SelectItem value="Korean_ReliableYouth">Taylor</SelectItem>
                                                            <SelectItem value="Japanese_InnocentBoy">Jamie</SelectItem>
                                                            <SelectItem value="R8_8CZH4KMY">Dev</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Image Model Selection */}
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bildmodell (In-Chat)</label>
                                                    <Select
                                                        value={selectedImageModelId}
                                                        onValueChange={handleImageModelChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="nanobanana">Nanobanana (Standard)</SelectItem>
                                                            <SelectItem value="kontext">Kontext</SelectItem>
                                                            <SelectItem value="nanobanana-pro">Nanobanana Pro</SelectItem>
                                                            <SelectItem value="seedream">Seedream</SelectItem>
                                                            <SelectItem value="seedream-pro">Seedream Pro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Response Style Selection */}
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Antwortstil</label>
                                                    <Select
                                                        value={selectedResponseStyleName}
                                                        onValueChange={handleStyleChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Basic">Basic</SelectItem>
                                                            <SelectItem value="Precise">Präzise</SelectItem>
                                                            <SelectItem value="Deep Dive">Deep Dive</SelectItem>
                                                            <SelectItem value="Emotional Support">Emotional Support</SelectItem>
                                                            <SelectItem value="Philosophical">Philosophical</SelectItem>
                                                            <SelectItem value="User Default">User Default</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </ContextualPopup>
                                    )}
                                </div>

                                {/* Plus Menu for Upload Functions */}
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
                                    <DropdownMenuContent className="w-56" align="start" side="top">
                                        <DropdownMenuItem
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isLoading || isImageMode}
                                            className="flex items-center gap-3 p-3 cursor-pointer disabled:opacity-40"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            <span className="text-sm">Bild hochladen</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => docInputRef.current?.click()}
                                            disabled={isLoading || isImageMode}
                                            className="flex items-center gap-3 p-3 cursor-pointer disabled:opacity-40"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Dokument hochladen</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={openCamera}
                                            disabled={isLoading || isImageMode}
                                            className="flex items-center gap-3 p-3 cursor-pointer disabled:opacity-40"
                                        >
                                            <Camera className="w-4 h-4" />
                                            <span className="text-sm">Kamera aufnehmen</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Tools Menu */}
                                <DropdownMenu open={isToolsMenuOpen} onOpenChange={setIsToolsMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="group rounded-lg h-14 w-auto px-4 md:h-12 transition-all duration-300 relative text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                            aria-label="Tools menu"
                                        >
                                            <div className="flex items-center gap-1 truncate">
                                                <span className={cn(
                                                    "text-xs md:text-sm font-medium",
                                                    isImageMode ? "text-purple-500" :
                                                        isCodeMode ? "text-blue-500" :
                                                            webBrowsingEnabled ? "text-green-500" :
                                                                ""
                                                )}>
                                                    {isImageMode ? "Visualize" :
                                                        isCodeMode ? "Coding" :
                                                            webBrowsingEnabled ? "Web Research" : "Tools"}
                                                </span>
                                                <ChevronUp className="w-3 h-3 flex-shrink-0" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-72" align="start" side="top">
                                        <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                                            Tools & Modi
                                        </div>

                                        {/* Image Generation Mode */}
                                        <DropdownMenuItem
                                            onClick={() => {
                                                // Toggle off all modes first
                                                if (isImageMode) onToggleImageMode();
                                                if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                if (webBrowsingEnabled) onToggleWebBrowsing();
                                                // Then toggle image mode
                                                if (!isImageMode) onToggleImageMode();
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 cursor-pointer transition-all duration-200",
                                                isImageMode && "bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500"
                                            )}
                                        >
                                            <ImageIcon className={cn("w-4 h-4", isImageMode ? "text-purple-600" : "text-purple-500")} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Image Generation Mode</span>
                                                <span className="text-xs text-muted-foreground">Bilder und Visualisierungen erstellen</span>
                                            </div>
                                            {isImageMode && (
                                                <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                            )}
                                        </DropdownMenuItem>

                                        {/* Web Research Mode */}
                                        <DropdownMenuItem
                                            onClick={() => {
                                                // Toggle off all modes first
                                                if (isImageMode) onToggleImageMode();
                                                if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                if (webBrowsingEnabled) onToggleWebBrowsing();
                                                // Then toggle web browsing
                                                if (!webBrowsingEnabled) onToggleWebBrowsing();
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 cursor-pointer transition-all duration-200",
                                                webBrowsingEnabled && "bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500"
                                            )}
                                        >
                                            <Globe className={cn("w-4 h-4", webBrowsingEnabled ? "text-green-600" : "text-green-500")} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Web Research Mode</span>
                                                <span className="text-xs text-muted-foreground">Web-Recherche und aktuelle Informationen</span>
                                            </div>
                                            {webBrowsingEnabled && (
                                                <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            )}
                                        </DropdownMenuItem>

                                        {/* Coding Assist Mode */}
                                        {onToggleCodeMode && (
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    // Toggle off all modes first
                                                    if (isImageMode) onToggleImageMode();
                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                    // Then toggle code mode
                                                    if (!isCodeMode) onToggleCodeMode();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 cursor-pointer transition-all duration-200",
                                                    isCodeMode && "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                                                )}
                                            >
                                                <Code2 className={cn("w-4 h-4", isCodeMode ? "text-blue-600" : "text-blue-500")} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">Coding Assist Mode</span>
                                                    <span className="text-xs text-muted-foreground">Code-Erstellung und Analyse</span>
                                                </div>
                                                {isCodeMode && (
                                                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                )}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Right Side: Model Selector + Mic + Send */}
                            <div className="flex items-center gap-0">
                                {/* Compact Model Selector */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="group rounded-lg h-14 w-auto px-4 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[120px] max-w-[220px] md:max-w-[250px]"
                                            aria-label="Select model"
                                        >
                                            <div className="flex items-center gap-1 truncate">
                                                {/* Model Icon */}
                                                <div className="w-4 h-4 flex-shrink-0">
                                                    {modelIcons[selectedModelId] ? (
                                                        <Image
                                                            src={modelIcons[selectedModelId]}
                                                            alt={selectedModelId}
                                                            width={16}
                                                            height={16}
                                                            className="rounded-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-sm bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                                                {selectedModelId?.charAt(0)?.toUpperCase() || 'A'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs md:text-sm font-medium truncate">
                                                    {(() => {
                                                        const modelDisplayMap: Record<string, string> = {
                                                            'claude': 'Claude Sonnet 4.5',
                                                            'gemini-large': 'Gemini 3',
                                                            'openai-large': 'GPT 5.2',
                                                            'deepseek': 'DeepSeek'
                                                        };
                                                        return modelDisplayMap[selectedModelId] ||
                                                            AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId)?.name.split(' ')[0] ||
                                                            'Claude';
                                                    })()}
                                                </span>
                                                <ChevronUp className="w-3 h-3 flex-shrink-0" />
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end" side="top">
                                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
                                            Chat Model Selection
                                        </div>

                                        {/* Main Models */}
                                        <div className="p-2">
                                            <div className="grid grid-cols-1 gap-1">
                                                {[
                                                    { id: 'claude', displayName: 'Claude Sonnet 4.5' },
                                                    { id: 'gemini-large', displayName: 'Gemini 3' },
                                                    { id: 'openai-large', displayName: 'GPT 5.2' },
                                                    { id: 'deepseek', displayName: 'DeepSeek' }
                                                ].map((modelConfig) => {
                                                    const model = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === modelConfig.id);
                                                    if (!model) return null;
                                                    return (
                                                        <DropdownMenuItem
                                                            key={model.id}
                                                            onClick={() => handleModelChange(model.id)}
                                                            className={cn(
                                                                "flex flex-col items-start p-3 cursor-pointer",
                                                                selectedModelId === model.id && "bg-accent"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                {/* Model Icon in Dropdown */}
                                                                <div className="w-5 h-5 flex-shrink-0">
                                                                    {modelIcons[model.id] ? (
                                                                        <Image
                                                                            src={modelIcons[model.id]}
                                                                            alt={model.id}
                                                                            width={20}
                                                                            height={20}
                                                                            className="rounded-sm"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-sm bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                                                                {model.id?.charAt(0)?.toUpperCase() || 'A'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-sm">{model.name}</span>
                                                                {model.category && (
                                                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                        {model.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {model.description && (
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    {model.description}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                                {model.vision && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                        Vision
                                                                    </span>
                                                                )}
                                                                {model.webBrowsing && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                        Web Search
                                                                    </span>
                                                                )}
                                                                {model.contextWindow && (
                                                                    <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                                                                )}
                                                            </div>
                                                        </DropdownMenuItem>
                                                    );
                                                })}

                                                {/* More Models Button */}
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2 p-2 cursor-pointer text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        // Open expanded model selector modal
                                                        setIsExpandedModelSelectorOpen(true);
                                                    }}
                                                >
                                                    <span className="text-sm">Weitere Modelle...</span>
                                                    <span className="text-xs text-muted-foreground">({AVAILABLE_POLLINATIONS_MODELS.length - 4} weitere)</span>
                                                </DropdownMenuItem>
                                            </div>
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

            {/* Expanded Model Selector Modal */}
            {isExpandedModelSelectorOpen && (
                <ModalPopup maxWidth="4xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alle Modelle auswählen</h2>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpandedModelSelectorOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => {
                                        handleModelChange(model.id);
                                        setIsExpandedModelSelectorOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                                        selectedModelId === model.id
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                >
                                    {/* Model Icon */}
                                    <div className="w-8 h-8 flex-shrink-0">
                                        {modelIcons[model.id] ? (
                                            <Image
                                                src={modelIcons[model.id]}
                                                alt={model.id}
                                                width={32}
                                                height={32}
                                                className="rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                                    {model.id?.charAt(0)?.toUpperCase() || 'A'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                                            {model.category && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                    {model.category}
                                                </span>
                                            )}
                                        </div>

                                        {model.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {model.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                            {model.vision && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    Vision
                                                </span>
                                            )}
                                            {model.webBrowsing && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    Web Search
                                                </span>
                                            )}
                                            {model.contextWindow && (
                                                <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalPopup>
            )}
        </div>
    );
};

export default ChatInput;
