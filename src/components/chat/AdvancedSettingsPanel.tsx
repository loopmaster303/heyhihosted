
"use client";

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Fingerprint, Speech, X, Image as ImageIcon, Globe } from 'lucide-react';
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import { useLanguage } from '../LanguageProvider';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

interface AdvancedSettingsPanelProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  selectedResponseStyleName: string;
  onStyleChange: (styleName: string) => void;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  availableImageModels: string[];
  selectedImageModelId: string;
  onImageModelChange: (modelId: string) => void;
  onClose: () => void;
  webBrowsingEnabled: boolean;
  onWebBrowsingChange: (enabled: boolean) => void;
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  selectedModelId,
  onModelChange,
  selectedResponseStyleName,
  onStyleChange,
  selectedVoice,
  onVoiceChange,
  availableImageModels,
  selectedImageModelId,
  onImageModelChange,
  onClose,
  webBrowsingEnabled,
  onWebBrowsingChange
}) => {
  const { t } = useLanguage();
  const selectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId);
  const supportsBrowsing = !!selectedModel?.webBrowsing;
  return (
    <div
      className="absolute bottom-full mb-2 left-0 w-full max-w-[min(100vw-1.5rem,32rem)] bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[70vh]"
    >
      <div className="flex justify-between items-center px-2 pt-1 pb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">{t('imageGen.configuration')}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4 mr-1.5" />
          {t('imageGen.close')}
        </Button>
      </div>
      <ScrollArea className="flex-grow pr-1">
        <div className="grid gap-4 p-2 pb-4">
            <div className="space-y-2">
                <p className="font-medium leading-none text-sm flex items-center gap-2"><Brain className="w-4 h-4" />{t('settings.aiModelText') || 'AI Model (Text)'}</p>
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
            {supportsBrowsing && (
              <div className="flex items-center justify-between">
                <p className="font-medium leading-none text-sm flex items-center gap-2"><Globe className="w-4 h-4" />{t('settings.webBrowsing') || 'Web Browsing'}</p>
                <Switch checked={webBrowsingEnabled} onCheckedChange={(c) => onWebBrowsingChange(!!c)} />
              </div>
            )}
             <div className="space-y-2">
                <p className="font-medium leading-none text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" />{t('settings.aiModelImage') || 'AI Model (Image)'}</p>
                <Select value={selectedImageModelId} onValueChange={onImageModelChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an image model" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableImageModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                    <p className="font-medium leading-none text-sm flex items-center gap-2"><Fingerprint className="w-4 h-4" />{t('settings.responseStyle') || 'Response Style'}</p>
                    <Select value={selectedResponseStyleName} onValueChange={onStyleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_RESPONSE_STYLES.map((style) => {
                            const key = style.name.toLowerCase().replace(/\s+/g, '').replace(/'/g, '');
                            return (
                                <SelectItem key={style.name} value={style.name}>
                                    {t(`responseStyle.${key}`) || style.name}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                    <p className="font-medium leading-none text-sm flex items-center gap-2"><Speech className="w-4 h-4" />{t('settings.voice') || 'Voice'}</p>
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
