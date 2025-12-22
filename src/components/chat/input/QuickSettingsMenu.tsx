import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContextualPopup } from "@/components/ui/popup";
import { Mic, ImageIcon, MessageSquare, Settings2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickSettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    selectedImageModelId: string;
    onImageModelChange: (modelId: string) => void;
    selectedResponseStyleName: string;
    onStyleChange: (styleName: string) => void;
    mistralFallbackEnabled: boolean;
    onToggleMistralFallback: () => void;
}

export const QuickSettingsMenu: React.FC<QuickSettingsMenuProps> = ({
    isOpen,
    onClose,
    triggerRef,
    selectedVoice,
    onVoiceChange,
    selectedImageModelId,
    onImageModelChange,
    selectedResponseStyleName,
    onStyleChange,
    mistralFallbackEnabled,
    onToggleMistralFallback
}) => {
    if (!isOpen) return null;

    return (
        <ContextualPopup position="top-center" triggerRef={triggerRef} className="min-w-[340px] p-0">
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
                    onClick={onClose}
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
                        onValueChange={onVoiceChange}
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
                        onValueChange={onImageModelChange}
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
                        onValueChange={onStyleChange}
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
            </div>
        </ContextualPopup>
    );
};
