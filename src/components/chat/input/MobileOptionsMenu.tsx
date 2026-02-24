import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    Music2,
    Mic,
    ChevronDown,
    ChevronUp,
    Paperclip,
    Settings2,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';

interface MobileOptionsMenuProps {
    // Upload props
    isLoading: boolean;
    isImageMode: boolean;
    onImageUploadClick: () => void;
    onDocUploadClick: () => void;
    onCameraClick: () => void;
    allowImageUploadInImageMode?: boolean;
    disableImageUpload?: boolean;
    hideUploadSection?: boolean;

    // Tools props
    onToggleImageMode: () => void;
    isComposeMode: boolean;
    onToggleComposeMode: () => void;
    isCodeMode: boolean;
    onToggleCodeMode?: () => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;

    // Quick Settings props
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    selectedResponseStyleName: string;
    onStyleChange: (styleName: string) => void;
}

export const MobileOptionsMenu: React.FC<MobileOptionsMenuProps> = ({
    // Upload
    isLoading,
    isImageMode,
    onImageUploadClick,
    onDocUploadClick,
    onCameraClick,
    allowImageUploadInImageMode = false,
    disableImageUpload = false,
    hideUploadSection = false,
    // Tools
    onToggleImageMode,
    isComposeMode,
    onToggleComposeMode,
    isCodeMode,
    onToggleCodeMode,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    // Quick Settings
    selectedVoice,
    onVoiceChange,
    selectedResponseStyleName,
    onStyleChange
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>('mode');

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const sections = [
        {
            id: 'upload',
            title: t('menu.section.upload'),
            icon: Paperclip,
            visible: !hideUploadSection,
        },
        {
            id: 'mode',
            title: t('menu.section.mode'),
            icon: Layers,
            visible: true,
        }
    ];

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
                    aria-label={t('menu.options')}
                >
                    <div className="relative">
                        <MoreVertical className="w-5 h-5" />
                        {(isImageMode || isCodeMode || webBrowsingEnabled) && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse bg-primary/60" />
                        )}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-72 p-0 max-h-[85vh] overflow-hidden shadow-glass-heavy border-primary/10 bg-popover/95 backdrop-blur-xl"
                align="start"
                side="top"
                sideOffset={8}
            >
                <div className="overflow-y-auto max-h-[85vh] p-1.5 space-y-1.5 custom-scrollbar">
                    {sections.filter(s => s.visible).map((section) => (
                        <div key={section.id} className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/40",
                                    activeSection === section.id && "bg-muted/40 border-b border-border/20"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <section.icon className="w-4 h-4 text-primary/60" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">{section.title}</span>
                                </div>
                                {activeSection === section.id ? (
                                    <ChevronUp className="w-3.5 h-3.5 opacity-50" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {activeSection === section.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <div className="p-1 space-y-0.5">
                                            {section.id === 'upload' && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={onImageUploadClick}
                                                        disabled={isLoading || (isImageMode && !allowImageUploadInImageMode) || disableImageUpload}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('action.uploadImage')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={onDocUploadClick}
                                                        disabled={isLoading || isImageMode}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('action.uploadDocument')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={onCameraClick}
                                                        disabled={isLoading || isImageMode}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <Camera className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('action.camera')}</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            {section.id === 'mode' && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (isImageMode) { onToggleImageMode(); return; }
                                                            if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                            if (webBrowsingEnabled) onToggleWebBrowsing();
                                                            onToggleImageMode();
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10",
                                                            isImageMode && "bg-primary/10"
                                                        )}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <Palette className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('tools.visualize')}</span>
                                                        {isImageMode && <div className="w-2 h-2 rounded-full animate-pulse ml-auto bg-primary/60" />}
                                                    </DropdownMenuItem>

                                                    {!isImageMode && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                                    if (isComposeMode) onToggleComposeMode();
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10",
                                                                    !isCodeMode && !webBrowsingEnabled && !isComposeMode && "bg-primary/10"
                                                                )}
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm font-medium">{t('tools.standardChat')}</span>
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                                    if (webBrowsingEnabled) onToggleWebBrowsing();
                                                                    onToggleComposeMode();
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10",
                                                                    isComposeMode && "bg-mode-compose/10"
                                                                )}
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                                    <Music2 className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm font-medium">{t('tools.compose')}</span>
                                                                {isComposeMode && <div className="w-2 h-2 rounded-full bg-mode-compose/60 animate-pulse ml-auto" />}
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    if (isCodeMode && onToggleCodeMode) onToggleCodeMode();
                                                                    onToggleWebBrowsing();
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10",
                                                                    webBrowsingEnabled && "bg-primary/10"
                                                                )}
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                                    <Globe className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm font-medium">{t('tools.deepResearch')}</span>
                                                                {webBrowsingEnabled && <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse ml-auto" />}
                                                            </DropdownMenuItem>

                                                            {onToggleCodeMode && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (webBrowsingEnabled) onToggleWebBrowsing();
                                                                        onToggleCodeMode();
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10",
                                                                        isCodeMode && "bg-primary/10"
                                                                    )}
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                                        <Code2 className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-sm font-medium">{t('tools.code')}</span>
                                                                    {isCodeMode && <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse ml-auto" />}
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
