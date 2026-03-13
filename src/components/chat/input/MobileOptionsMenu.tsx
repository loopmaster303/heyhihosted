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
import { AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';

interface MobileOptionsMenuProps {
    // Upload props
    isLoading: boolean;
    isImageMode: boolean;
    onImageUploadClick: () => void;
    onDocUploadClick: () => void;
    onCameraClick: () => void;
    disableImageUpload?: boolean;
    hideUploadSection?: boolean;

    // Tools props
    onToggleImageMode: (forcedState?: boolean) => void;
    isComposeMode: boolean;
    onToggleComposeMode: (forcedState?: boolean) => void;
    isCodeMode: boolean;
    onToggleCodeMode?: (forcedState?: boolean) => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: (forcedState?: boolean) => void;

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
    const styleTranslationKeys: Record<string, string> = {
        Basic: 'responseStyle.basic',
        Precise: 'responseStyle.precise',
        'Deep Dive': 'responseStyle.deepdive',
        'Emotional Support': 'responseStyle.emotionalsupport',
        Philosophical: 'responseStyle.philosophical',
        Companion: 'responseStyle.companion',
        'User Defined': 'responseStyle.usersdefault',
    };

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
        },
        {
            id: 'settings',
            title: t('menu.section.settings'),
            icon: Settings2,
            visible: !isImageMode,
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
                        (isImageMode || isCodeMode || webBrowsingEnabled || isComposeMode)
                            ? "bg-muted/50"
                            : "text-gray-600 dark:text-gray-200"
                    )}
                    aria-label={t('menu.options')}
                >
                    <div className="relative">
                        <MoreVertical className="w-5 h-5" />
                        {(isImageMode || isCodeMode || webBrowsingEnabled || isComposeMode) && (
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
                                                        disabled={isLoading || disableImageUpload}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('action.uploadImage')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={onDocUploadClick}
                                                        disabled={isLoading}
                                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-primary/10"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-sm font-medium">{t('action.uploadDocument')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={onCameraClick}
                                                        disabled={isLoading}
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
                                                            if (isImageMode) {
                                                                onToggleImageMode(false);
                                                                return;
                                                            }
                                                            if (onToggleCodeMode) onToggleCodeMode(false);
                                                            onToggleWebBrowsing(false);
                                                            onToggleComposeMode(false);
                                                            onToggleImageMode(true);
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
                                                                    if (onToggleCodeMode) onToggleCodeMode(false);
                                                                    onToggleWebBrowsing(false);
                                                                    onToggleComposeMode(false);
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
                                                                    if (onToggleCodeMode) onToggleCodeMode(false);
                                                                    onToggleWebBrowsing(false);
                                                                    onToggleImageMode(false);
                                                                    onToggleComposeMode(!isComposeMode);
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
                                                                    if (onToggleCodeMode) onToggleCodeMode(false);
                                                                    onToggleComposeMode(false);
                                                                    onToggleImageMode(false);
                                                                    onToggleWebBrowsing(!webBrowsingEnabled);
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
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {section.id === 'settings' && (
                                                <div className="p-2 space-y-3">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            <span>{t('settings.responseStyle')}</span>
                                                        </div>
                                                        <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                                                            <SelectTrigger className="h-10 rounded-lg border-border/40 bg-background/40 text-sm font-medium">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {AVAILABLE_RESPONSE_STYLES.map((style) => (
                                                                    <SelectItem key={style.name} value={style.name}>
                                                                        {t(styleTranslationKeys[style.name] || style.name)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                                            <Mic className="w-3.5 h-3.5" />
                                                            <span>{t('settings.voice')}</span>
                                                        </div>
                                                        <Select value={selectedVoice} onValueChange={onVoiceChange}>
                                                            <SelectTrigger className="h-10 rounded-lg border-border/40 bg-background/40 text-sm font-medium">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {AVAILABLE_TTS_VOICES.map((voice) => (
                                                                    <SelectItem key={voice.id} value={voice.id}>
                                                                        {voice.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
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
