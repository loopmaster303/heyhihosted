"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
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
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

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
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-code text-glow mb-2">
            Personalisierung
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Passe deine Einstellungen an, um die KI-Erfahrung optimal auf deine Bedürfnisse zuzuschneiden.
          </p>
        </div>

        {/* Personal Settings Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-semibold font-code">
              Persönliche Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Setting */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg md:text-xl font-medium font-code mb-2">
                  {t('settings.howShouldMachineAddress')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.nameDescription')}
                </p>
              </div>
              <Input
                type="text"
                value={userDisplayName}
                onChange={(e) => setUserDisplayName(e.target.value)}
                placeholder={t('settings.namePlaceholder')}
                className={cn(
                  "w-full h-12 transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-white focus:ring-white"
                )}
              />
            </div>

            {/* Response Style Setting */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg md:text-xl font-medium font-code mb-2">
                  {t('settings.responseStyleQuestion')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.responseStyleDescription')}
                </p>
              </div>
              <Select value={selectedResponseStyle} onValueChange={setSelectedResponseStyle}>
                <SelectTrigger className={cn(
                  "w-full h-12 transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-white focus:ring-white"
                    : "bg-gray-50 border-gray-300 text-black focus:border-white focus:ring-white"
                )}>
                  <SelectValue placeholder={t('settings.stylePlaceholder')} />
                </SelectTrigger>
                <SelectContent className={cn(
                  "transition-colors",
                  isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"
                )}>
                  {responseStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value} className={cn(
                      "transition-colors py-3",
                      isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"
                    )}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt Setting */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg md:text-xl font-medium font-code mb-2">
                  {t('settings.aiInstructions')}
                </h3>
                <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                  <p>• {t('settings.aiInstructionsDescription1')}</p>
                  <p>• {t('settings.aiInstructionsDescription2')}</p>
                  <p>• {t('settings.aiInstructionsDescription3')}</p>
                  <p>• {t('settings.aiInstructionsDescription4')}</p>
                </div>
              </div>
              <Textarea
                value={getCurrentSystemPrompt()}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder={t('settings.aiPromptPlaceholder')}
                className={cn(
                  "w-full min-h-[120px] resize-none transition-colors",
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-white focus:ring-white"
                )}
                readOnly={customSystemPrompt.trim() === ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings - Only show if props provided */}
        {(onModelChange || onVoiceChange || onImageModelChange) && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl md:text-2xl font-semibold font-code flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Erweiterte Einstellungen
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {isAdvancedSettingsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isAdvancedSettingsOpen && (
              <CardContent className="space-y-6">
                {/* LLM Model */}
                {onModelChange && selectedModelId && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-medium font-code mb-2">KI-Modell</h3>
                      <p className="text-xs text-muted-foreground">
                        Wähle das Sprachmodell für deine Konversationen
                      </p>
                    </div>
                    <Select value={selectedModelId} onValueChange={onModelChange}>
                      <SelectTrigger className={cn("w-full h-12", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn("max-h-[400px]", isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300")}>
                        {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id} className={isDark ? "text-white hover:bg-gray-800" : "text-black hover:bg-gray-100"}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{model.name}</span>
                                <div className="flex items-center gap-1">
                                  {model.category && (
                                    <Badge variant="secondary" className="text-[10px] tracking-wide uppercase">
                                      {model.category}
                                    </Badge>
                                  )}
                                  {model.vision && (
                                    <Badge variant="outline" className="text-[10px] tracking-wide uppercase">
                                      Vision
                                    </Badge>
                                  )}
                                  {model.webBrowsing && (
                                    <Badge variant="outline" className="text-[10px] tracking-wide uppercase bg-blue-100 text-blue-800 border-blue-300">
                                      Web Search
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {model.description && <span className="text-xs text-muted-foreground">{model.description}</span>}
                              {model.costPerToken && (
                                <span className="text-xs text-muted-foreground opacity-75">
                                  ${model.costPerToken}/1M tokens
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Voice */}
                {onVoiceChange && selectedVoice && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-medium font-code mb-2">Stimme</h3>
                      <p className="text-xs text-muted-foreground">Wähle die Stimme für Text-to-Speech</p>
                    </div>
                    <Select value={selectedVoice} onValueChange={onVoiceChange}>
                      <SelectTrigger className={cn("w-full h-12", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
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
                )}

                {/* Image Model */}
                {onImageModelChange && selectedImageModelId && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-medium font-code mb-2">Bild-Modell</h3>
                      <p className="text-xs text-muted-foreground">Wähle das Modell für Bildgenerierung im Chat</p>
                    </div>
                    <Select value={selectedImageModelId} onValueChange={onImageModelChange}>
                      <SelectTrigger className={cn("w-full h-12", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-black")}>
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
                )}
              </CardContent>
            )}
          </Card>
        )}

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
    </div>
  );
};

export default PersonalizationTool;
