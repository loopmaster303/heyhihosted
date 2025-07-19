
"use client";

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Fingerprint, Speech, X } from 'lucide-react';
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';

interface AdvancedSettingsPanelProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  selectedResponseStyleName: string;
  onStyleChange: (styleName: string) => void;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onClose: () => void;
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  selectedModelId,
  onModelChange,
  selectedResponseStyleName,
  onStyleChange,
  selectedVoice,
  onVoiceChange,
  onClose
}) => {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 w-full bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 max-h-80 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
    >
      <div className="flex justify-between items-center px-2 pt-1 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Advanced Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 mr-1.5" />
          Close
        </Button>
      </div>
      <ScrollArea className="h-full max-h-64">
        <div className="grid gap-4 p-2">
            <div className="space-y-2">
                <p className="font-medium leading-none text-sm flex items-center gap-2"><Brain className="w-4 h-4" />AI Model</p>
                <Select value={selectedModelId} onValueChange={onModelChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                    <p className="font-medium leading-none text-sm flex items-center gap-2"><Fingerprint className="w-4 h-4" />Response Style</p>
                    <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_RESPONSE_STYLES.map((style) => (
                            <SelectItem key={style.name} value={style.name}>{style.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                    <p className="font-medium leading-none text-sm flex items-center gap-2"><Speech className="w-4 h-4" />Voice</p>
                    <Select value={selectedVoice} onValueChange={onVoiceChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_TTS_VOICES.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdvancedSettingsPanel;
