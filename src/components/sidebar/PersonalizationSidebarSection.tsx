"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, UserRoundPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from '@/components/LanguageProvider';
import { AVAILABLE_POLLINATIONS_MODELS, DEFAULT_IMAGE_MODEL, DEFAULT_POLLINATIONS_MODEL_ID } from '@/config/chat-options';
import { getImageModels } from '@/config/unified-image-models';
import { unifiedModelConfigs } from '@/config/unified-model-configs';

const PersonalizationSidebarSection: React.FC = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>('customSystemPrompt', '');
  const [defaultTextModelId, setDefaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);
  const [defaultImageModelId, setDefaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL);

  const imageModels = useMemo(
    () => getImageModels().filter(model => model.id in unifiedModelConfigs),
    []
  );

  useEffect(() => {
    if (!AVAILABLE_POLLINATIONS_MODELS.some(model => model.id === defaultTextModelId)) {
      setDefaultTextModelId(DEFAULT_POLLINATIONS_MODEL_ID);
    }
  }, [defaultTextModelId, setDefaultTextModelId]);

  useEffect(() => {
    if (!imageModels.some(model => model.id === defaultImageModelId)) {
      setDefaultImageModelId(DEFAULT_IMAGE_MODEL);
    }
  }, [defaultImageModelId, imageModels, setDefaultImageModelId]);

  const labels = language === 'en'
    ? {
        header: 'Personalization',
        name: 'Name',
        extra: 'Extra AI Instruction',
        defaultText: 'Default Text Model',
        defaultImage: 'Default Image Model',
        theme: 'Theme',
        language: 'Language',
        namePlaceholder: 'user',
        extraPlaceholder: 'Add a short instruction that complements the system prompt...',
      }
    : {
        header: 'Personalisation',
        name: 'Name',
        extra: 'Extra Anweisung für KI',
        defaultText: 'Default Text Modell',
        defaultImage: 'Default Bild Modell',
        theme: 'Farbschema',
        language: 'Sprache',
        namePlaceholder: 'user',
        extraPlaceholder: 'Kurze Zusatzanweisung, die den Systemprompt ergänzt...',
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
                {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.theme}
            </span>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {labels.language}
            </span>
            <LanguageToggle />
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationSidebarSection;
