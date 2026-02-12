import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MessageSquare } from 'lucide-react';
import { AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import { useLanguage } from '@/components/LanguageProvider';

interface QuickSettingsBadgesProps {
    selectedVoice: string;
    onVoiceChange: (voiceId: string) => void;
    selectedResponseStyleName: string;
    onStyleChange: (styleName: string) => void;
}

export const QuickSettingsBadges: React.FC<QuickSettingsBadgesProps> = ({
    selectedVoice,
    onVoiceChange,
    selectedResponseStyleName,
    onStyleChange,
}) => {
    const { t } = useLanguage();

    const styleTranslationKeys: Record<string, string> = {
        Basic: 'responseStyle.basic',
        Precise: 'responseStyle.precise',
        'Deep Dive': 'responseStyle.deepdive',
        'Emotional Support': 'responseStyle.emotionalsupport',
        Philosophical: 'responseStyle.philosophical',
        Companion: 'responseStyle.companion',
        'User Defined': 'responseStyle.usersdefault',
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            
            {/* Style Badge */}
            <div className="flex items-center bg-transparent border border-border/30 rounded-lg p-1 pr-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-border/30 mr-2 text-xs text-muted-foreground font-medium">
                    <MessageSquare className="w-3 h-3" />
                    <span>{t('settings.responseStyle')}</span>
                </div>
                <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                    <SelectTrigger className="h-5 text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[60px] text-foreground font-medium">
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

            {/* Voice Badge */}
            <div className="flex items-center bg-transparent border border-border/30 rounded-lg p-1 pr-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-border/30 mr-2 text-xs text-muted-foreground font-medium">
                    <Mic className="w-3 h-3" />
                    <span>{t('settings.voice')}</span>
                </div>
                <Select value={selectedVoice} onValueChange={onVoiceChange}>
                    <SelectTrigger className="h-5 text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[80px] text-foreground font-medium">
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
    );
};
