import React from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Code2, Globe, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolsBadgesProps {
    isImageMode: boolean;
    onToggleImageMode: () => void;
    isCodeMode: boolean;
    onToggleCodeMode?: () => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;
    onClose?: () => void;
}

export const ToolsBadges: React.FC<ToolsBadgesProps> = ({
    isImageMode,
    onToggleImageMode,
    isCodeMode,
    onToggleCodeMode,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    onClose
}) => {
    const resetModes = () => {
        if (isImageMode) onToggleImageMode();
        if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
        if (webBrowsingEnabled) onToggleWebBrowsing();
    };

    if (isImageMode) {
        return (
            <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
                <div
                    onClick={() => {
                        onToggleImageMode();
                        onClose?.();
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff4ecd]/60 cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                        "bg-[#ff4ecd]/5 text-[#ff4ecd] font-bold"
                    )}
                >
                    <Palette className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Visualize</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            {/* Standard Chat */}
            <div
                onClick={() => {
                    resetModes();
                    onClose?.();
                }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 shrink-0",
                    !isImageMode && !isCodeMode && !webBrowsingEnabled
                        ? "bg-transparent border-border/60 text-foreground shadow-sm"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Standard</span>
            </div>

            {/* Visualize Mode */}
            <div
                onClick={() => {
                   resetModes();
                   if (!isImageMode) onToggleImageMode();
                   onClose?.();
                }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    isImageMode
                        ? "bg-[#ff4ecd]/5 text-[#ff4ecd] font-bold border border-[#ff4ecd]/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Palette className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Visualize</span>
            </div>

             {/* Deep Research Mode */}
             <div
                onClick={() => {
                   resetModes();
                   if (!webBrowsingEnabled) onToggleWebBrowsing();
                   onClose?.();
                }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    webBrowsingEnabled
                        ? "bg-[#00d2ff]/5 text-[#00d2ff] font-bold border border-[#00d2ff]/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Research</span>
            </div>

            {/* Coding Assist Mode */}
            {onToggleCodeMode && (
                <div
                    onClick={() => {
                       resetModes();
                       if (!isCodeMode) onToggleCodeMode();
                       onClose?.();
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                        isCodeMode
                            ? "bg-[#00ff88]/5 text-[#00ff88] font-bold border border-[#00ff88]/60"
                            : "bg-transparent border-border/30 text-muted-foreground"
                    )}
                >
                    <Code2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Code</span>
                </div>
            )}
        </div>
    );
};
