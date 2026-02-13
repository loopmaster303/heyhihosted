import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronUp, Settings, HelpCircle, Info } from "lucide-react";
import { getUserVisibleTextModels, AVAILABLE_TTS_VOICES } from "@/config/chat-options";
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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const hasCustomPrompt = customSystemPrompt.trim() !== "";
  const currentResponseStyle = hasCustomPrompt ? "User's Default" : selectedResponseStyle;

  // Track which info section is expanded
  const [activeInfoSection, setActiveInfoSection] = useState<'llm' | 'tts' | 'image' | null>(null);

  // Dynamische Response Styles basierend auf Sprache
  const getResponseStyles = () => [
    { value: "Precise", label: t('responseStyle.precise.label'), description: t('responseStyle.precise.description') },
    { value: "Basic", label: t('responseStyle.basic.label'), description: t('responseStyle.basic.description') },
    { value: "Deep Dive", label: t('responseStyle.deepdive.label'), description: t('responseStyle.deepdive.description') },
    { value: "Emotional Support", label: t('responseStyle.emotionalsupport.label'), description: t('responseStyle.emotionalsupport.description') },
    { value: "Philosophical", label: t('responseStyle.philosophical.label'), description: t('responseStyle.philosophical.description') },
    { value: "User's Default", label: t('responseStyle.usersdefault.label'), description: t('responseStyle.usersdefault.description') }
  ];

  // Aktueller System Prompt basierend auf gewähltem Style
  const getCurrentSystemPrompt = () => {
    if (hasCustomPrompt) {
      return customSystemPrompt;
    }

    // Verwende übersetzte System Prompts
    const styleKey = selectedResponseStyle.toLowerCase().replace(' ', '');
    const systemPromptKey = `systemPrompt.${styleKey}`;
    return t(systemPromptKey) || "Du bist ein präziser, faktenbasierter Assistent für den User.\nAntworte kurz, klar, direkt und kompetent.\n\nZiel:\nImmer schnell auf den Punkt. Fakten zuerst, Beispiel optional, Schrittstruktur wenn relevant.";
  };

  const responseStyles = getResponseStyles();

  // Helper to toggle info section
  const toggleInfo = (type: 'llm' | 'tts' | 'image') => {
    setActiveInfoSection(prev => prev === type ? null : type);
  };

  // Find selected model details
  const userVisibleTextModels = getUserVisibleTextModels();
  const currentLLM = userVisibleTextModels.find(m => m.id === selectedModelId);
  const currentVoice = AVAILABLE_TTS_VOICES.find(v => v.id === selectedVoice);
  const currentImageModel = getImageModels().find(m => m.id === selectedImageModelId);

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 p-6 md:p-8 ml-14 overflow-y-auto">
      {/* Reduced vertical spacing from space-y-12 to space-y-8 */}
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Header Section */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-code tracking-tight">{t('personalization.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('personalization.subtitle')}</p>
        </div>

        {/* Row 1: Name Setting */}
        <div className="space-y-2 max-w-xl">
          <Label htmlFor="displayName" className="text-sm font-semibold font-code text-foreground ml-1">
            {t('settings.howShouldMachineAddress')}
          </Label>
          <Input
            id="displayName"
            type="text"
            value={userDisplayName}
            onChange={(e) => setUserDisplayName(e.target.value)}
            placeholder={t('settings.namePlaceholder')}
            className={cn(
              "w-full h-14 px-4 transition-all duration-200",
              "border bg-card shadow-sm rounded-xl",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              isDark
                ? "border-gray-800 hover:border-gray-700 text-white placeholder:text-gray-600"
                : "border-gray-200 hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            )}
          />
          <p className="text-[10px] text-muted-foreground px-1">
            {t('settings.nameDescription')}
          </p>
        </div>

        {/* Row 2: Combined Style & System Prompt */}
        <div className="space-y-6 pt-4 border-t border-border/50">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-code text-foreground leading-snug max-w-4xl">
              {t('settings.responseStyleQuestion')}
            </h3>

            <div className="space-y-6">
              {/* Style Selection */}
              <div className="max-w-md space-y-2">
                <Select
                  value={currentResponseStyle}
                  onValueChange={setSelectedResponseStyle}
                  disabled={hasCustomPrompt}
                >
                  <SelectTrigger className={cn(
                    "w-full h-12 px-3 transition-all duration-200",
                    "border bg-card shadow-sm rounded-xl",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    isDark
                      ? "border-gray-800 hover:border-gray-700 text-white"
                      : "border-gray-200 hover:border-gray-300 text-gray-900"
                  )}>
                    <SelectValue placeholder={t('label.selectStyle')} />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-xl border shadow-lg", isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100")}>
                    {responseStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value} className="py-2.5 px-3 focus:bg-accent rounded-lg cursor-pointer my-0.5">
                        <span className="font-medium text-sm">{style.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* System Prompt - Full Width */}
              <div className="space-y-2 relative group">
                <Textarea
                  value={getCurrentSystemPrompt()}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder={t('settings.aiPromptPlaceholder')}
                  className={cn(
                    "w-full min-h-[300px] font-mono text-sm leading-7 p-6 transition-all duration-200",
                    "border bg-card shadow-sm rounded-xl resize-y",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    isDark
                      ? "border-gray-800 hover:border-gray-700 text-gray-200 placeholder:text-gray-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-800 placeholder:text-gray-300"
                  )}
                  readOnly={!hasCustomPrompt}
                />
                <div className="px-1">
                  <details className="text-xs text-muted-foreground cursor-pointer select-none">
                    <summary className="hover:text-primary transition-colors flex items-center gap-2">
                      <span>{t('tips.title')}</span>
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-primary/20 space-y-1.5 py-1 text-muted-foreground/80">
                      <p>• {t('tips.clear')}</p>
                      <p>• {t('tips.format')}</p>
                      <p>• {t('tips.constraints')}</p>
                      <p>• {t('tips.examples')}</p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Row 3: Models & Configuration (Educational Style) */}
        {(onModelChange || onVoiceChange || onImageModelChange) && (
          <div className="space-y-10 pt-2">

            {/* 1. LLM Model */}
            {onModelChange && selectedModelId && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base md:text-lg font-semibold font-code text-foreground leading-snug">
                    {t('settings.llmHeader')}
                  </h3>
                  <button
                    onClick={() => toggleInfo('llm')}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors group relative focus:outline-none"
                  >
                    <HelpCircle className={cn(
                      "w-5 h-5 transition-all duration-300",
                      activeInfoSection === 'llm'
                        ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                        : "text-muted-foreground group-hover:text-primary"
                    )} />
                    {/* Subtle Glow Effect Layer */}
                    <div className={cn(
                      "absolute inset-0 rounded-full bg-primary/20 blur-md transition-opacity duration-300 pointer-events-none",
                      activeInfoSection === 'llm' ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                </div>

                <div className="max-w-md">
                  <Select value={selectedModelId} onValueChange={onModelChange}>
                    <SelectTrigger className={cn(
                      "w-full h-12 px-3 transition-all duration-200",
                      "border bg-card shadow-sm rounded-lg",
                      isDark
                        ? "border-gray-800 hover:border-gray-700 text-white"
                        : "border-gray-200 hover:border-gray-300 text-black"
                    )}>
                    <SelectValue placeholder={t('label.selectModel')} />
                    </SelectTrigger>
                    <SelectContent className={cn("max-h-[400px] rounded-lg border shadow-lg", isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100")}>
                      {userVisibleTextModels.map((model) => (
                        <SelectItem key={model.id} value={model.id} className={cn("py-2.5", isDark ? "text-white focus:bg-gray-800" : "text-black focus:bg-gray-100")}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{model.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{model.category || 'General'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Inline Explanation - Expands below dropdown */}
                  {activeInfoSection === 'llm' && (
                    <div className="mt-3 bg-muted/30 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold text-primary mb-2 text-sm">{t('explain.llm.title')}</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t('explain.llm.description')}</p>

                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{t('explain.modelDetails')}</h5>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm text-foreground">{currentLLM?.name}</p>
                          <p className="text-xs text-muted-foreground">{currentLLM?.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. TTS Voice */}
            {onVoiceChange && selectedVoice && (
              <div className="space-y-3 border-t border-border/40 pt-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-base md:text-lg font-semibold font-code text-foreground leading-snug">
                    {t('settings.ttsHeader')}
                  </h3>
                  <button
                    onClick={() => toggleInfo('tts')}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors group relative focus:outline-none"
                  >
                    <HelpCircle className={cn(
                      "w-5 h-5 transition-all duration-300",
                      activeInfoSection === 'tts'
                        ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                        : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <div className={cn(
                      "absolute inset-0 rounded-full bg-primary/20 blur-md transition-opacity duration-300 pointer-events-none",
                      activeInfoSection === 'tts' ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                </div>

                <div className="max-w-md">
                  <Select value={selectedVoice} onValueChange={onVoiceChange}>
                    <SelectTrigger className={cn(
                      "w-full h-12 px-3 transition-all duration-200",
                      "border bg-card shadow-sm rounded-lg",
                      isDark
                        ? "border-gray-800 hover:border-gray-700 text-white"
                        : "border-gray-200 hover:border-gray-300 text-black"
                    )}>
                      <SelectValue placeholder={t('label.selectVoice')} />
                    </SelectTrigger>
                    <SelectContent className={cn("rounded-lg border shadow-lg", isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100")}>
                      {AVAILABLE_TTS_VOICES.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id} className={cn("py-2.5", isDark ? "text-white focus:bg-gray-800" : "text-black focus:bg-gray-100")}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Inline Explanation */}
                  {activeInfoSection === 'tts' && (
                    <div className="mt-3 bg-muted/30 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold text-primary mb-2 text-sm">{t('explain.tts.title')}</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t('explain.tts.description')}</p>

                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{t('explain.modelDetails')}</h5>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm text-foreground">{currentVoice?.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {currentVoice?.id}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Image Model */}
            {onImageModelChange && selectedImageModelId && (
              <div className="space-y-3 border-t border-border/40 pt-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-base md:text-lg font-semibold font-code text-foreground leading-snug">
                    {t('settings.imageHeader')}
                  </h3>
                  <button
                    onClick={() => toggleInfo('image')}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors group relative focus:outline-none"
                  >
                    <HelpCircle className={cn(
                      "w-5 h-5 transition-all duration-300",
                      activeInfoSection === 'image'
                        ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                        : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <div className={cn(
                      "absolute inset-0 rounded-full bg-primary/20 blur-md transition-opacity duration-300 pointer-events-none",
                      activeInfoSection === 'image' ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                </div>

                <div className="max-w-md">
                  <Select value={selectedImageModelId} onValueChange={onImageModelChange}>
                    <SelectTrigger className={cn(
                      "w-full h-12 px-3 transition-all duration-200",
                      "border bg-card shadow-sm rounded-lg",
                      isDark
                        ? "border-gray-800 hover:border-gray-700 text-white"
                        : "border-gray-200 hover:border-gray-300 text-black"
                    )}>
                      <SelectValue placeholder={t('label.selectModel')} />
                    </SelectTrigger>
                    <SelectContent className={cn("max-h-[300px] rounded-lg border shadow-lg", isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100")}>
                      {getImageModels().map((model: { id: string; name: string }) => (
                        <SelectItem key={model.id} value={model.id} className={cn("py-2.5", isDark ? "text-white focus:bg-gray-800" : "text-black focus:bg-gray-100")}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Inline Explanation */}
                  {activeInfoSection === 'image' && (
                    <div className="mt-3 bg-muted/30 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold text-primary mb-2 text-sm">{t('explain.imageModel.title')}</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t('explain.imageModel.description')}</p>

                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">{t('explain.modelDetails')}</h5>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm text-foreground">{currentImageModel?.name}</p>
                          <p className="text-xs text-muted-foreground">{currentImageModel?.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
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
