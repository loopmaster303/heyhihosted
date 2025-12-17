'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MoreVertical,
    ImageIcon,
    FileText,
    Camera,
    Palette,
    Code2,
    Globe,
    MessageSquare,
    Mic,
    Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOptionsMenuProps {
    // Upload props
    isLoading: boolean;
    isImageMode: boolean;
    onImageUploadClick: () => void;
    onDocUploadClick: () => void;
    onCameraClick: () => void;

    // Tools props
    onToggleImageMode: () => void;
    isCodeMode: boolean;
    onToggleCodeMode?: () => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;

    // Quick Settings props
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    selectedImageModelId: string;
    onImageModelChange: (modelId: string) => void;
    selectedResponseStyleName: string;
    onStyleChange: (styleName: string) => void;
    mistralFallbackEnabled: boolean;
    onToggleMistralFallback: () => void;
}

export const MobileOptionsMenu: React.FC<MobileOptionsMenuProps> = ({
    // Upload
    isLoading,
    isImageMode,
    onImageUploadClick,
    onDocUploadClick,
    onCameraClick,
    // Tools
    onToggleImageMode,
    isCodeMode,
    onToggleCodeMode,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    // Quick Settings
    selectedVoice,
    onVoiceChange,
    selectedImageModelId,
    onImageModelChange,
    selectedResponseStyleName,
    onStyleChange,
    mistralFallbackEnabled,
    onToggleMistralFallback
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Determine active mode for display
    const getActiveModeIcon = () => {
        if (isImageMode) return <Palette className="w-4 h-4" style={{ color: 'hsl(330 65% 62%)' }} />;
        if (isCodeMode) return <Code2 className="w-4 h-4 text-blue-500" />;
        if (webBrowsingEnabled) return <Globe className="w-4 h-4 text-green-500" />;
        return null;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        "group rounded-lg h-12 w-12 transition-all duration-300 relative",
                        (isImageMode || isCodeMode || webBrowsingEnabled)
                            ? "bg-muted/50"
                            : "text-gray-600 dark:text-gray-200"
                    )}
                    aria-label="Options menu"
                >
                    <div className="relative">
                        <MoreVertical className="w-5 h-5" />
                        {/* Active mode indicator */}
                        {(isImageMode || isCodeMode || webBrowsingEnabled) && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                                style={{
                                    backgroundColor: isImageMode ? 'hsl(330 65% 62%)' :
                                        isCodeMode ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
                                }}
                            />
                        )}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-72 p-0 max-h-[70vh] overflow-y-auto"
                align="start"
                side="top"
                sideOffset={8}
            >
                {/* Upload Section */}
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Anhang
                </DropdownMenuLabel>
                <div className="px-2 pb-2">
                    <DropdownMenuItem
                        onClick={onImageUploadClick}
                        disabled={isLoading || isImageMode}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg"
                    >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm">Bild hochladen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onDocUploadClick}
                        disabled={isLoading || isImageMode}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg"
                    >
                        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm">Dokument</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onCameraClick}
                        disabled={isLoading || isImageMode}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg"
                    >
                        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Kamera</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                {/* Tools Section */}
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Modus
                </DropdownMenuLabel>
                <div className="px-2 pb-2 space-y-0.5">
                    {/* Standard Chat */}
                    <DropdownMenuItem
                        onClick={() => {
                            if (isImageMode) onToggleImageMode();
                            if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                            if (webBrowsingEnabled) onToggleWebBrowsing();
                        }}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg",
                            !isImageMode && !isCodeMode && !webBrowsingEnabled && "bg-accent"
                        )}
                    >
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm">Standard Chat</span>
                    </DropdownMenuItem>

                    {/* Visualize Mode */}
                    <DropdownMenuItem
                        onClick={() => {
                            if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                            if (webBrowsingEnabled) onToggleWebBrowsing();
                            if (!isImageMode) onToggleImageMode();
                            else onToggleImageMode();
                        }}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg",
                            isImageMode && "dark:bg-purple-900/20"
                        )}
                    >
                        <div className="w-7 h-7 rounded-lg dark:bg-purple-900/30 flex items-center justify-center">
                            <Palette className="w-3.5 h-3.5" style={{ color: 'hsl(330 65% 62%)' }} />
                        </div>
                        <span className="text-sm">Visualize</span>
                        {isImageMode && <div className="w-2 h-2 rounded-full animate-pulse ml-auto" style={{ backgroundColor: 'hsl(330 65% 62%)' }} />}
                    </DropdownMenuItem>

                    {/* Web Research */}
                    <DropdownMenuItem
                        onClick={() => {
                            if (isImageMode) onToggleImageMode();
                            if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                            if (!webBrowsingEnabled) onToggleWebBrowsing();
                            else onToggleWebBrowsing();
                        }}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg",
                            webBrowsingEnabled && "bg-green-50 dark:bg-green-900/20"
                        )}
                    >
                        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Globe className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <span className="text-sm">Web Research</span>
                        {webBrowsingEnabled && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" />}
                    </DropdownMenuItem>

                    {/* Coding Assist */}
                    {onToggleCodeMode && (
                        <DropdownMenuItem
                            onClick={() => {
                                if (isImageMode) onToggleImageMode();
                                if (webBrowsingEnabled) onToggleWebBrowsing();
                                if (!isCodeMode) onToggleCodeMode();
                                else onToggleCodeMode();
                            }}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg",
                                isCodeMode && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                        >
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Code2 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <span className="text-sm">Coding Assist</span>
                            {isCodeMode && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-auto" />}
                        </DropdownMenuItem>
                    )}
                </div>

                <DropdownMenuSeparator />

                {/* Quick Settings Section */}
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Einstellungen
                </DropdownMenuLabel>
                <div className="px-3 pb-3 space-y-3">
                    {/* Voice Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Mic className="w-3 h-3" />
                            Stimme
                        </label>
                        <Select value={selectedVoice} onValueChange={onVoiceChange}>
                            <SelectTrigger className="h-8 text-xs bg-muted/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="English_ConfidentWoman">🎙️ Luca</SelectItem>
                                <SelectItem value="Japanese_CalmLady">🎙️ Sky</SelectItem>
                                <SelectItem value="French_Female_News Anchor">🎙️ Charlie</SelectItem>
                                <SelectItem value="German_FriendlyMan">🎙️ Mika</SelectItem>
                                <SelectItem value="German_PlayfulMan">🎙️ Casey</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Image Model */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" />
                            Bildmodell
                        </label>
                        <Select value={selectedImageModelId} onValueChange={onImageModelChange}>
                            <SelectTrigger className="h-8 text-xs bg-muted/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nanobanana">🎨 Nanobanana</SelectItem>
                                <SelectItem value="kontext">🎨 Kontext</SelectItem>
                                <SelectItem value="nanobanana-pro">✨ Nanobanana Pro</SelectItem>
                                <SelectItem value="seedream">🎨 Seedream</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Response Style */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            Antwortstil
                        </label>
                        <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                            <SelectTrigger className="h-8 text-xs bg-muted/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Basic">💬 Basic</SelectItem>
                                <SelectItem value="Precise">🎯 Präzise</SelectItem>
                                <SelectItem value="Deep Dive">🔬 Deep Dive</SelectItem>
                                <SelectItem value="Emotional Support">💝 Emotional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Provider Toggle */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                            <Settings2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {mistralFallbackEnabled ? 'Mistral Direct' : 'Pollinations'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleMistralFallback();
                            }}
                            className={cn(
                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                mistralFallbackEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
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
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
