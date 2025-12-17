'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    ImageIcon,
    SlidersHorizontal,
    Plus,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualizeMobileMenuProps {
    // Settings
    onConfigPanelToggle: () => void;

    // Upload
    onUploadClick: () => void;
    uploadedImagesCount: number;
    maxImages: number;
    supportsReference: boolean;
    isUploading: boolean;
    disabled: boolean;
    loading: boolean;

    // Enhance
    onEnhancePrompt: () => void;
    canEnhance: boolean;
    isEnhancing: boolean;
}

export const VisualizeMobileMenu: React.FC<VisualizeMobileMenuProps> = ({
    onConfigPanelToggle,
    onUploadClick,
    uploadedImagesCount,
    maxImages,
    supportsReference,
    isUploading,
    disabled,
    loading,
    onEnhancePrompt,
    canEnhance,
    isEnhancing,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                        "group rounded-lg h-12 w-12 transition-all duration-300 relative",
                        "text-gray-600 dark:text-gray-200"
                    )}
                    aria-label="Options menu"
                >
                    <div className="relative">
                        <MoreVertical className="w-5 h-5" />
                        {/* Image count indicator */}
                        {uploadedImagesCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                                {uploadedImagesCount}
                            </div>
                        )}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 p-0"
                align="start"
                side="top"
                sideOffset={8}
            >
                {/* Einstellungen */}
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Optionen
                </DropdownMenuLabel>
                <div className="px-2 pb-2">
                    <DropdownMenuItem
                        onClick={onConfigPanelToggle}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
                    >
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm">Einstellungen</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onUploadClick}
                        disabled={loading || isUploading || disabled || (uploadedImagesCount >= maxImages && supportsReference)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg disabled:opacity-40"
                    >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm">Bild hinzufügen</span>
                            {supportsReference && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    ({uploadedImagesCount}/{maxImages})
                                </span>
                            )}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={onEnhancePrompt}
                        disabled={!canEnhance || loading || isEnhancing || disabled}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg disabled:opacity-40"
                    >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm">
                            {isEnhancing ? 'Wird verbessert...' : 'Prompt verbessern'}
                        </span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
