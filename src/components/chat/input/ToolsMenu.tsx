import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Code2, Globe, Settings, MessageSquare, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolsMenuProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isImageMode: boolean;
    onToggleImageMode: () => void;
    isCodeMode: boolean;
    onToggleCodeMode?: () => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({
    isOpen,
    onOpenChange,
    isImageMode,
    onToggleImageMode,
    isCodeMode,
    onToggleCodeMode,
    webBrowsingEnabled,
    onToggleWebBrowsing
}) => {
    return (
        <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
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
    );
};
