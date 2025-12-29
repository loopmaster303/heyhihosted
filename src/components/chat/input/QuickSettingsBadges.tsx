import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MessageSquare } from 'lucide-react';

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
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            
            {/* Style Badge */}
            <div className="flex items-center bg-transparent border border-border/30 rounded-lg p-1 pr-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-border/30 mr-2 text-xs text-muted-foreground font-medium">
                    <MessageSquare className="w-3 h-3" />
                    <span>Stil</span>
                </div>
                <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                    <SelectTrigger className="h-5 text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[60px] text-foreground font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Precise">Präzise</SelectItem>
                        <SelectItem value="Deep Dive">Deep Dive</SelectItem>
                        <SelectItem value="Emotional Support">Emotional</SelectItem>
                        <SelectItem value="Philosophical">Philosophical</SelectItem>
                        <SelectItem value="User Default">Default</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Voice Badge */}
            <div className="flex items-center bg-transparent border border-border/30 rounded-lg p-1 pr-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-border/30 mr-2 text-xs text-muted-foreground font-medium">
                    <Mic className="w-3 h-3" />
                    <span>Stimme</span>
                </div>
                <Select value={selectedVoice} onValueChange={onVoiceChange}>
                    <SelectTrigger className="h-5 text-xs border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[80px] text-foreground font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="English_ConfidentWoman">Luca</SelectItem>
                        <SelectItem value="Japanese_CalmLady">Sky</SelectItem>
                        <SelectItem value="French_Female_News Anchor">Charlie</SelectItem>
                        <SelectItem value="German_FriendlyMan">Mika</SelectItem>
                        <SelectItem value="German_PlayfulMan">Casey</SelectItem>
                        <SelectItem value="Korean_ReliableYouth">Taylor</SelectItem>
                        <SelectItem value="Japanese_InnocentBoy">Jamie</SelectItem>
                        <SelectItem value="R8_8CZH4KMY">Dev</SelectItem>
                    </SelectContent>
                </Select>
            </div>

        </div>
    );
};
