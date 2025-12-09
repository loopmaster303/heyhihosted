
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from "@/config/chat-options";
import { getImageModels } from "@/config/unified-image-models";
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";

interface PersonalizationToolProps {
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  replicateToolPassword?: string;
  setReplicateToolPassword?: (password: string) => void;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  selectedVoice?: string;
  onVoiceChange?: (voiceId: string) => void;
  selectedImageModelId?: string;
  onImageModelChange?: (modelId: string) => void;
}

const PersonalizationTool: React.FC<PersonalizationToolProps> = ({
  userDisplayName,
  setUserDisplayName,
  customSystemPrompt,
  setCustomSystemPrompt,
  replicateToolPassword,
  setReplicateToolPassword,
  selectedModelId,
  onModelChange,
  selectedVoice,
  onVoiceChange,
  selectedImageModelId,
  onImageModelChange,
}) => {
  const [selectedResponseStyle, setSelectedResponseStyle] = useState("Precise");
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamische Response Styles basierend auf Sprache
  const getResponseStyles = () => [
    { value: "Precise", label: t('responseStyle.precise.label'), description: t('responseStyle.precise.description') },
    { value: "Basic", label: t('responseStyle.basic.label'), description: t('responseStyle.basic.description') },
    { value: "Deep Dive", label: t('responseStyle.deepdive.label'), description: t('responseStyle.deepdive.description') },
    { value: "Emotional Support", label: t('responseStyle.emotionalsupport.label'), description: t('responseStyle.emotionalsupport.description') },
    { value: "Philosophical", label: t('responseStyle.philosophical.label'), description: t('responseStyle.philosophical.description') },
    { value: "User's Default", label: t('responseStyle.usersdefault.label'), description: t('responseStyle.usersdefault.description') }
  ];

  // Automatisch Response Style basierend auf System Prompt setzen
  useEffect(() => {
    if (customSystemPrompt.trim() === "") {
      setSelectedResponseStyle("Precise");
    } else {
      setSelectedResponseStyle("User's Default");
    }
  }, [customSystemPrompt]);

  // Aktueller System Prompt basierend auf gewähltem Style
  const getCurrentSystemPrompt = () => {
    if (customSystemPrompt.trim() !== "") {
      return customSystemPrompt;
    }

    // Verwende übersetzte System Prompts
    const styleKey = selectedResponseStyle.toLowerCase().replace(' ', '');
    const systemPromptKey = `systemPrompt.${styleKey}`;
    return t(systemPromptKey) || "Du bist ein präziser, faktenbasierter Assistent für den User.\nAntworte kurz, klar, direkt und kompetent.\n\nZiel:\nImmer schnell auf den Punkt. Fakten zuerst, Beispiel optional, Schrittstruktur wenn relevant.";
  };

  const responseStyles = getResponseStyles();

  // Warte bis das Theme geladen ist, um Hydration-Fehler zu vermeiden
  if (!isClient) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="space-y-8">
              <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-48 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column - Questions */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-code text-glow mb-2">
                {t('settings.howShouldMachineAddress')}
              </h2>
              <p className={cn(
                "text-sm",
                "text-muted-foreground"
              )}>
                {t('settings.nameDescription')}
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-code text-glow mb-2">
                {t('settings.responseStyleQuestion')}
              </h2>
              <p className={cn(
                "text-sm",
                "text-muted-foreground"
              )}>
                {t('settings.responseStyleDescription')}
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-code text-glow mb-2">
                {t('settings.aiInstructions')}
              </h2>
              <div className={cn(
                "text-sm space-y-1",
                "text-muted-foreground"
              )}>
                <p>• {t('settings.aiInstructionsDescription1')}</p>
                <p>• {t('settings.aiInstructionsDescription2')}</p>
                <p>• {t('settings.aiInstructionsDescription3')}</p>
                <p>• {t('settings.aiInstructionsDescription4')}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Input Fields */}
          <div className="space-y-8">
            <div>
              <Input
                type="text"
                value={userDisplayName}
                onChange={(e) => setUserDisplayName(e.target.value)}
                placeholder={t('settings.namePlaceholder')}
                className={cn(
                  "w-full transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-pink-500"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-pink-500 focus:ring-pink-500"
                )}
              />
            </div>

            <div>
              <Select value={selectedResponseStyle} onValueChange={setSelectedResponseStyle}>
                <SelectTrigger className={cn(
                  "w-full transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                    : "bg-gray-50 border-gray-300 text-black focus:border-pink-500 focus:ring-pink-500"
                )}>
                  <SelectValue placeholder={t('settings.stylePlaceholder')} />
                </SelectTrigger>
                <SelectContent className={cn(
                  "transition-colors",
                  isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
                )}>
                  {responseStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value} className={cn(
                      "transition-colors",
                      isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"
                    )}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.label}</span>
                        <span className={cn(
                          "text-xs",
                          "text-muted-foreground"
                        )}>{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Textarea
                value={getCurrentSystemPrompt()}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder={t('settings.aiPromptPlaceholder')}
                className={cn(
                  "w-full min-h-[200px] resize-none transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-pink-500"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-pink-500 focus:ring-pink-500"
                )}
                readOnly={customSystemPrompt.trim() === ""}
              />
            </div>
          </div>

          {/* Advanced Settings - Only show if props provided */}
          {(onModelChange || onVoiceChange || onImageModelChange) && (
            <>
              <div className="col-span-full border-t border-border my-6" />

              <div className="col-span-full mb-4">
                <h2 className="text-2xl md:text-3xl font-code text-glow">
                  Erweiterte Einstellungen
                </h2>
              </div>

              {/* LLM Model */}
              {onModelChange && selectedModelId && (
                <>
                  <div>
                    <h3 className="text-xl font-code text-glow mb-2">KI-Modell</h3>
                    <p className="text-sm text-muted-foreground">
                      Wähle das Sprachmodell für deine Konversationen
                    </p>
                  </div>

                  <div>
                    <Select value={selectedModelId} onValueChange={onModelChange}>
                      <SelectTrigger className={cn("w-full", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn("max-h-[400px]", isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300")}>
                        {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id} className={isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              {model.description && <span className="text-xs text-muted-foreground">{model.description}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Voice */}
              {onVoiceChange && selectedVoice && (
                <>
                  <div>
                    <h3 className="text-xl font-code text-glow mb-2">Stimme</h3>
                    <p className="text-sm text-muted-foreground">Wähle die Stimme für Text-to-Speech</p>
                  </div>

                  <div>
                    <Select value={selectedVoice} onValueChange={onVoiceChange}>
                      <SelectTrigger className={cn("w-full", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"}>
                        {AVAILABLE_TTS_VOICES.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id} className={isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Image Model */}
              {onImageModelChange && selectedImageModelId && (
                <>
                  <div>
                    <h3 className="text-xl font-code text-glow mb-2">Bild-Modell</h3>
                    <p className="text-sm text-muted-foreground">Wähle das Modell für Bildgenerierung im Chat</p>
                  </div>

                  <div>
                    <Select value={selectedImageModelId} onValueChange={onImageModelChange}>
                      <SelectTrigger className={cn("w-full", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn("max-h-[300px]", isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300")}>
                        {getImageModels().map((model) => (
                          <SelectItem key={model.id} value={model.id} className={isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hidden Raw Image Key */}
      {setReplicateToolPassword && (
        <div className="hidden">
          <Input
            type="password"
            value={replicateToolPassword || ''}
            onChange={(e) => setReplicateToolPassword(e.target.value)}
            placeholder="Enter access key for image-gen/raw..."
            className="border-border focus-visible:ring-primary text-base font-code bg-tool-input-bg"
          />
        </div>
      )}
    </div>
  );
};

export default PersonalizationTool;
