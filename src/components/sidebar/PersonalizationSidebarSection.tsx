"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, UserRoundPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from '@/components/LanguageProvider';
import { DEFAULT_IMAGE_MODEL, DEFAULT_POLLINATIONS_MODEL_ID, AVAILABLE_TTS_VOICES, AVAILABLE_RESPONSE_STYLES } from '@/config/chat-options';
import { getModelsByProvider } from '@/config/unified-image-models';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { useChatConversation, useChatModes } from '@/components/ChatProvider';
import { Mic, MessageSquare, Lock } from 'lucide-react';
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import { TTS_SPEED_PRESETS } from '@/lib/chat/audio-settings';

const PersonalizationSidebarSection: React.FC = () => {
  const { language } = useLanguage();
  const { activeConversation } = useChatConversation();
  const { selectedVoice, selectedTtsSpeed, handleVoiceChange, handleTtsSpeedChange, handleStyleChange } = useChatModes();
  const hasPollenKey = useHasPollenKey();
  const { providerMode, setProviderMode, prunaAvailable } = useProviderMode();
  const { visibleModels: allTextModels, isKnownModelId } = useVisiblePollinationsTextModels();

  const [isOpen, setIsOpen] = useState(false);

  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>('customSystemPrompt', '');
  const [defaultTextModelId, setDefaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);
  const [defaultImageModelId, setDefaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL);

  const imageModels = useMemo(
    () => getModelsByProvider(providerMode, { includeByopHidden: hasPollenKey })
      .filter(model => model.kind === 'image' && model.id in unifiedModelConfigs),
    [providerMode, hasPollenKey]
  );

  useEffect(() => {
    if (!defaultTextModelId || !isKnownModelId(defaultTextModelId)) {
      setDefaultTextModelId(DEFAULT_POLLINATIONS_MODEL_ID);
    }
  }, [defaultTextModelId, isKnownModelId, setDefaultTextModelId]);

  // Keep the default image model valid for the selected provider.
  useEffect(() => {
    if (imageModels.length === 0) return;
    if (!imageModels.some(model => model.id === defaultImageModelId)) {
      const fallback = imageModels.some(m => m.id === DEFAULT_IMAGE_MODEL)
        ? DEFAULT_IMAGE_MODEL
        : imageModels[0].id;
      setDefaultImageModelId(fallback);
    }
  }, [defaultImageModelId, imageModels, setDefaultImageModelId]);

  const labels = language === 'en'
    ? {
        header: 'Personalization',
        name: 'Name',
        style: 'Assistant Role',
        extra: 'Individual AI Instruction',
        defaultText: 'Standard Text Model',
        provider: 'Image Provider',
        providerHint: 'Pruna API key required',
        defaultImage: 'Standard Image Model',
        voice: 'AI Voice',
        voiceSpeed: 'Speech Speed',
        namePlaceholder: 'user',
        extraPlaceholder: 'Special wishes for your Assistance? - just add it for a more individual Experience',
      }
    : {
        header: 'Personalisation',
        name: 'Name',
        style: 'Assistenten Rolle',
        extra: 'Individuelle KI Anweisung',
        defaultText: 'Standard Text Modell',
        provider: 'Bild-Provider',
        providerHint: 'Pruna API-Key erforderlich',
        defaultImage: 'Standard Bild Modell',
        voice: 'KI-Stimme',
        voiceSpeed: 'Sprechtempo',
        namePlaceholder: 'user',
        extraPlaceholder: 'Sonderwünsche für deinen Assistenten? - Schreibs einfach hier rein für eine individuellere Erfahrung.',
      };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <span className="flex items-center gap-2">
          <UserRoundPen className="h-3.5 w-3.5" />
          {labels.header}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="px-2 pb-3 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.name}
            </label>
            <Input
              value={userDisplayName}
              onChange={(e) => setUserDisplayName(e.target.value)}
              placeholder={labels.namePlaceholder}
              className="h-8 text-xs rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="h-2.5 w-2.5" /> {labels.style}
            </label>
            <Select 
              value={activeConversation?.selectedResponseStyleName || 'Basic'} 
              onValueChange={handleStyleChange}
            >
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_RESPONSE_STYLES.map((style) => (
                  <SelectItem key={style.name} value={style.name}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.extra}
            </label>
            <Textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder={labels.extraPlaceholder}
              className="min-h-[80px] text-xs rounded-lg resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.defaultText}
            </label>
            <Select value={defaultTextModelId} onValueChange={setDefaultTextModelId}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allTextModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.provider}
            </label>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/30 px-3 py-2">
              <button
                type="button"
                onClick={() => setProviderMode('pollinations')}
                className={cn(
                  "text-xs font-semibold transition-opacity",
                  providerMode === 'pollinations' ? "text-foreground" : "text-muted-foreground hover:opacity-70"
                )}
              >
                Pollinations
              </button>
              <div className="flex items-center gap-2">
                <Switch
                  id="sidebar-provider-mode-switch"
                  checked={providerMode === 'pruna'}
                  onCheckedChange={(checked) => setProviderMode(checked ? 'pruna' : 'pollinations')}
                  disabled={!prunaAvailable}
                  title={prunaAvailable ? '' : labels.providerHint}
                  className="data-[state=checked]:bg-primary"
                />
                <button
                  type="button"
                  onClick={() => prunaAvailable && setProviderMode('pruna')}
                  disabled={!prunaAvailable}
                  title={prunaAvailable ? '' : labels.providerHint}
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold transition-opacity",
                    providerMode === 'pruna' ? "text-foreground" : "text-muted-foreground hover:opacity-70",
                    !prunaAvailable && "opacity-40 cursor-not-allowed"
                  )}
                >
                  Pruna
                  {!prunaAvailable && <Lock className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.defaultImage}
            </label>
            <Select value={defaultImageModelId} onValueChange={setDefaultImageModelId}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Mic className="h-2.5 w-2.5" /> {labels.voice}
            </label>
            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
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

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.voiceSpeed}
            </label>
            <Select value={String(selectedTtsSpeed)} onValueChange={(value) => handleTtsSpeedChange(Number(value))}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTS_SPEED_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={String(preset.value)}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      )}
    </div>
  );
};

export default PersonalizationSidebarSection;
