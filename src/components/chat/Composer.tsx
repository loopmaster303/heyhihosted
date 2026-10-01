'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, AudioWaveform, Camera, ChevronDown, CodeXml, FileText, Globe, ImagePlus, Loader2, Plus, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatComposer, useChatConversation, useChatMedia, useChatModes } from '@/components/ChatProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels';
import { ModelLogo } from './input/ModelLogo';
import { ModelSelectorPanel } from './input/ModelSelector';
import { ResearchDepthBadges, researchDepthLabelKey, resolveResearchDepth } from './input/ResearchDepthBadges';
import { AttachmentPreviewRow } from './input/AttachmentPreviewRow';

type Tray = 'attach' | 'model' | 'depth';

export const COMPOSER_INPUT_ID = 'composer-input';

/**
 * Die Eingabe des Chats. Alles, was vor dem Senden zu stellen ist, klappt in
 * genau eine Ablage ueber der Textzeile auf — Anhang, Modell oder
 * Recherche-Tiefe. Eine Ablage zur Zeit, Esc schliesst sie und gibt den Fokus
 * an den Knopf zurueck, der sie geoeffnet hat.
 */
export function Composer({ autoFocus = false }: { autoFocus?: boolean }) {
  const { t } = useLanguage();
  const { chatInputValue, setChatInputValue, sendMessage, isAiResponding } = useChatComposer();
  const { activeConversation } = useChatConversation();
  const { webBrowsingEnabled, toggleWebBrowsing, toggleCodeMode, handleModelChange } = useChatModes();
  const { isRecording, isTranscribing, startRecording, stopRecording, openCamera, handleFileSelect } = useChatMedia();
  const { findModelById } = useVisiblePollinationsTextModels();

  const [tray, setTray] = useState<Tray | null>(null);
  const trayOpenerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const selectedModelId = activeConversation?.selectedModelId ?? '';
  const isCodeMode = !!activeConversation?.isCodeMode;
  const uploadedPreview = activeConversation?.uploadedFilePreview ?? null;
  const busy = isAiResponding || isRecording || isTranscribing;
  const canSend = !busy && (!!chatInputValue.trim() || !!uploadedPreview);

  // Die Textzeile waechst mit, bis 12 Zeilen.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 260)}px`;
  }, [chatInputValue]);

  const closeTray = useCallback((returnFocus = false) => {
    setTray(null);
    if (returnFocus) trayOpenerRef.current?.focus();
  }, []);

  const toggleTray = (next: Tray, opener: HTMLButtonElement) => {
    trayOpenerRef.current = opener;
    setTray((current) => (current === next ? null : next));
  };

  useEffect(() => {
    if (!tray) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeTray(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tray, closeTray]);

  const outsideRefs = useMemo(() => [rootRef], []);
  useOnClickOutside(outsideRefs, () => { if (tray) closeTray(); });

  const submit = () => {
    if (!canSend) return;
    setTray(null);
    void sendMessage(chatInputValue.trim());
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'document') => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    handleFileSelect(file, kind);
    closeTray();
    textareaRef.current?.focus();
  };

  const modelName = findModelById(selectedModelId)?.name ?? selectedModelId;
  const depth = resolveResearchDepth(selectedModelId);

  const placeholder = isRecording
    ? t('chat.recording')
    : isTranscribing
      ? t('chat.transcribing')
      : webBrowsingEnabled
        ? t('chat.placeholder.web')
        : isCodeMode
          ? t('chat.placeholder.code')
          : t('chat.placeholder.standard');

  return (
    <form
      ref={rootRef}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className={cn(
        'relative w-full rounded-[28px] border border-border bg-card/90 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl',
        'transition-[border-color,box-shadow] duration-med ease-out focus-within:border-primary/50 focus-within:shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.35)]',
      )}
    >
      {/* Ablage: klappt ueber der Textzeile auf (grid 0fr → 1fr animiert die Hoehe). */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-med ease-out',
          tray ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden" inert={!tray}>
          <div id="composer-tray" role="region" aria-label={tray ? trayLabel(tray, t) : undefined} className="max-h-[45dvh] overflow-y-auto overscroll-contain px-3 pt-3">
            {tray === 'attach' && (
              <div className="grid grid-cols-3 gap-2 pb-1">
                <TrayAction icon={<ImagePlus className="h-5 w-5" />} label={t('chat.image')} onClick={() => imageInputRef.current?.click()} />
                <TrayAction icon={<FileText className="h-5 w-5" />} label={t('chat.document')} onClick={() => docInputRef.current?.click()} />
                <TrayAction icon={<Camera className="h-5 w-5" />} label={t('chat.camera')} onClick={() => { closeTray(); openCamera(); }} />
              </div>
            )}
            {tray === 'model' && (
              <ModelSelectorPanel
                selectedModelId={selectedModelId}
                onModelChange={(id) => { handleModelChange(id); closeTray(true); }}
              />
            )}
            {tray === 'depth' && (
              <div className="pb-1">
                <ResearchDepthBadges
                  selectedModelId={selectedModelId}
                  onModelChange={(id) => { handleModelChange(id); closeTray(true); }}
                  disabled={busy}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadedPreview && (
        <div className="px-3 pt-3">
          <AttachmentPreviewRow
            items={[{
              id: 'upload',
              type: uploadedPreview.startsWith('data:image/') ? 'image' : 'document',
              previewUrl: uploadedPreview,
              fileName: t('menu.section.upload'),
            }]}
            onRemove={() => handleFileSelect(null)}
          />
        </div>
      )}

      <label htmlFor={COMPOSER_INPUT_ID} className="sr-only">{placeholder}</label>
      <textarea
        id={COMPOSER_INPUT_ID}
        ref={textareaRef}
        value={chatInputValue}
        onChange={(e) => setChatInputValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter bestaetigt bei IME-Eingabe den Kandidaten, nicht die Nachricht.
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        autoFocus={autoFocus}
        enterKeyHint="send"
        disabled={isRecording || isTranscribing}
        className="block w-full resize-none bg-transparent px-5 pb-1 pt-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-60"
      />

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
        <div className="flex min-w-0 items-center gap-1">
          <BarButton
            label={t('menu.section.upload')}
            expanded={tray === 'attach'}
            onClick={(e) => toggleTray('attach', e.currentTarget)}
            disabled={busy}
          >
            <Plus className={cn('h-5 w-5 transition-transform duration-med ease-out', tray === 'attach' && 'rotate-45')} />
          </BarButton>
          <ToggleChip
            label={t('composer.research')}
            pressed={webBrowsingEnabled}
            onClick={() => toggleWebBrowsing()}
            icon={<Globe className="h-4 w-4" />}
          />
          <ToggleChip
            label={t('composer.code')}
            pressed={isCodeMode}
            onClick={() => toggleCodeMode()}
            icon={<CodeXml className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={(e) => toggleTray(webBrowsingEnabled ? 'depth' : 'model', e.currentTarget)}
            aria-expanded={tray === 'model' || tray === 'depth'}
            aria-controls="composer-tray"
            className="press flex h-11 min-w-0 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {webBrowsingEnabled ? (
              <span className="truncate font-mono">{t(researchDepthLabelKey(depth))}</span>
            ) : (
              <>
                <ModelLogo modelId={selectedModelId} />
                <span className="hidden max-w-[9rem] truncate font-mono sm:inline">{modelName}</span>
              </>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
            <span className="sr-only">{webBrowsingEnabled ? t('research.depth') : t('modelSelector.select')}</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <BarButton
            label={isRecording ? t('chat.stopRecording') : t('chat.startRecording')}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || isAiResponding}
            pressed={isRecording}
            className={isRecording ? 'text-destructive' : undefined}
          >
            {isTranscribing
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : isRecording ? <Square className="h-4 w-4 fill-current" /> : <AudioWaveform className="h-5 w-5" />}
          </BarButton>
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t('chat.send')}
            className={cn(
              'press grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform] duration-fast ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'disabled:opacity-30',
            )}
          >
            {isAiResponding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e, 'image')} tabIndex={-1} aria-hidden="true" />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => onFile(e, 'document')} tabIndex={-1} aria-hidden="true" />
    </form>
  );
}

function trayLabel(tray: Tray, t: (key: string) => string): string {
  if (tray === 'attach') return t('menu.section.upload');
  if (tray === 'depth') return t('research.depth');
  return t('modelSelector.title');
}

function BarButton({ label, onClick, children, disabled, expanded, pressed, className }: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  expanded?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      aria-controls={expanded !== undefined ? 'composer-tray' : undefined}
      aria-pressed={pressed}
      className={cn(
        'press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

function ToggleChip({ label, pressed, onClick, icon }: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn(
        'press flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        pressed ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {icon}
      <span className="hidden sm:inline" aria-hidden="true">{label}</span>
    </button>
  );
}

function TrayAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted/50 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {icon}
      {label}
    </button>
  );
}
