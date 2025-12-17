import React, { MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Paperclip, ImageIcon, FileText, Camera, Plus } from 'lucide-react';

interface UploadMenuProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    isImageMode: boolean;
    onImageUploadClick: () => void;
    onDocUploadClick: () => void;
    onCameraClick: () => void;
}

export const UploadMenu: React.FC<UploadMenuProps> = ({
    isOpen,
    onOpenChange,
    isLoading,
    isImageMode,
    onImageUploadClick,
    onDocUploadClick,
    onCameraClick
}) => {
    return (
        <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
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
                        onClick={onImageUploadClick}
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
                        onClick={onDocUploadClick}
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
                        onClick={onCameraClick}
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
    );
};
