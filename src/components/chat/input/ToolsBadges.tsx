import React from 'react';
import { Palette, Code2, Globe, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToolMode = 'standard' | 'visualize' | 'research' | 'code';

interface ToolsBadgesProps {
    isImageMode: boolean;
    isCodeMode: boolean;
    webBrowsingEnabled: boolean;
    onSelectMode: (mode: ToolMode) => void;
    canToggleCodeMode?: boolean;
}

export const ToolsBadges: React.FC<ToolsBadgesProps> = ({
    isImageMode,
    isCodeMode,
    webBrowsingEnabled,
    onSelectMode,
    canToggleCodeMode = true,
}) => {
    const isStandardActive = !isImageMode && !isCodeMode && !webBrowsingEnabled;

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            {/* Standard Chat */}
            <div
                onClick={() => onSelectMode('standard')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 shrink-0",
                    isStandardActive
                        ? "bg-transparent border-border/60 text-foreground shadow-sm"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Standard</span>
            </div>

            {/* Visualize Mode */}
            <div
                onClick={() => onSelectMode('visualize')}
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
                onClick={() => onSelectMode('research')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-[transform,box-shadow,background-color,opacity,color] duration-200 ease-out hover:-translate-y-0.5 shrink-0",
                    webBrowsingEnabled
                        ? "bg-[#00d2ff]/5 text-[#00d2ff] font-bold border border-[#00d2ff]/60"
                        : "bg-transparent border-border/30 text-muted-foreground"
                )}
            >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Deep Research</span>
            </div>

            {/* Coding Assist Mode */}
            {canToggleCodeMode && (
                <div
                    onClick={() => onSelectMode('code')}
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
