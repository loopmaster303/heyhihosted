'use client';

import React, { useId, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet } from './Sheet';
import { usePollenKey } from '@/hooks/usePollenKey';
import { usePrunaKey } from '@/hooks/usePrunaKey';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels';
import { useShowCommunityModels } from '@/hooks/useShowCommunityModels';
import { useChatConversation, useChatModes } from '@/components/ChatProvider';
import { useLanguage } from '@/components/LanguageProvider';
import type { Language } from '@/config/translations';
import {
  AVAILABLE_RESPONSE_STYLES,
  AVAILABLE_TTS_VOICES,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_POLLINATIONS_MODEL_ID,
} from '@/config/chat-options';
import { getChatImageModelGroups } from '@/config/unified-image-models';
import { TTS_SPEED_PRESETS } from '@/lib/chat/audio-settings';

const COPY = {
  de: {
    title: 'Einstellungen',
    accounts: 'Konten',
    pollenHint: 'Für Chat, Bilder und Video. Liegt nur in diesem Browser.',
    prunaHint: 'Schaltet die p-*-Modelle in Create frei. Jeder Lauf kostet, auf deinem Konto.',
    connectOAuth: 'Mit Pollinations verbinden',
    orKey: 'oder Schlüssel einfügen',
    connect: 'Verbinden',
    disconnect: 'Trennen',
    connected: 'Verbunden',
    notConnected: 'Nicht verbunden',
    rejected: 'Schlüssel wird abgelehnt — neu verbinden',
    unverifiable: 'Verbunden — Kontostand nicht abrufbar, Erzeugen funktioniert trotzdem',
    invalid: 'Das sieht nicht wie ein gültiger Schlüssel aus.',
    balance: 'Guthaben',
    person: 'Du',
    name: 'Name',
    style: 'Antwortstil',
    instructions: 'Eigene Anweisung',
    instructionsHint: 'Gilt für jede Antwort. Zum Beispiel: „Antworte kurz und duze mich.“',
    models: 'Modelle',
    textModel: 'Textmodell für neue Unterhaltungen',
    imageModel: 'Bildmodell im Chat',
    imageModelHint: 'Nur freie Modelle. Alle anderen leben in Create.',
    community: 'Community-Modelle in Create zeigen',
    communityHint: 'Experimentell — Qualität und Verfügbarkeit schwanken.',
    voice: 'Stimme',
    voiceName: 'Stimme zum Vorlesen',
    speed: 'Sprechtempo',
    look: 'Darstellung',
    theme: 'Thema',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    language: 'Sprache',
  },
  en: {
    title: 'Settings',
    accounts: 'Accounts',
    pollenHint: 'For chat, images and video. Stays in this browser only.',
    prunaHint: 'Unlocks the p-* models in Create. Every run is billed to your account.',
    connectOAuth: 'Connect with Pollinations',
    orKey: 'or paste a key',
    connect: 'Connect',
    disconnect: 'Disconnect',
    connected: 'Connected',
    notConnected: 'Not connected',
    rejected: 'Key rejected — connect again',
    unverifiable: 'Connected — balance unavailable, generating still works',
    invalid: 'That does not look like a valid key.',
    balance: 'Balance',
    person: 'You',
    name: 'Name',
    style: 'Answer style',
    instructions: 'Own instruction',
    instructionsHint: 'Applies to every answer. For example: “Keep it short.”',
    models: 'Models',
    textModel: 'Text model for new conversations',
    imageModel: 'Image model in chat',
    imageModelHint: 'Free models only. Everything else lives in Create.',
    community: 'Show community models in Create',
    communityHint: 'Experimental — quality and availability vary.',
    voice: 'Voice',
    voiceName: 'Read-aloud voice',
    speed: 'Speaking rate',
    look: 'Appearance',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
  },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Der eine Ort fuer Einstellungen. Vorher lagen sie dreifach: als Abschnitt in
 * der Seitenleiste, als Popover in Create und als Seite /settings, die nur auf
 * den Umzug hinwies. Felder sind native Elemente — auf dem Telefon oeffnet sich
 * der Auswahlrad des Systems, und jede Bedienhilfe kennt sie.
 */
export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { language } = useLanguage();
  const c = COPY[language === 'en' ? 'en' : 'de'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title={c.title}>
      <div className="flex flex-col gap-7 pb-6">
        <AccountsSection c={c} />
        <PersonSection c={c} />
        <ModelsSection c={c} />
        <VoiceSection c={c} />
        <LookSection c={c} />
      </div>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

const fieldClass = 'h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm';

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusDot({ tone }: { tone: 'ok' | 'warn' | 'bad' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        tone === 'ok' && 'bg-[hsl(150_55%_45%)]',
        tone === 'warn' && 'bg-[hsl(38_85%_55%)]',
        tone === 'bad' && 'bg-destructive',
      )}
    />
  );
}

function AccountsSection({ c }: { c: Copy }) {
  const pollen = usePollenKey();
  const pruna = usePrunaKey();
  const [pollenInput, setPollenInput] = useState('');
  const [prunaInput, setPrunaInput] = useState('');
  const [prunaInvalid, setPrunaInvalid] = useState(false);

  const pollenTone = pollen.keyStatus === 'rejected' ? 'bad' : pollen.isConnected && pollen.keyStatus === 'ok' ? 'ok' : 'warn';
  const pollenLabel = pollen.keyStatus === 'rejected'
    ? c.rejected
    : pollen.keyStatus === 'unverifiable'
      ? c.unverifiable
      : pollen.isConnected ? c.connected : c.notConnected;

  return (
    <Section title={c.accounts}>
      <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Pollinations</span>
          <StatusDot tone={pollenTone} />
          <span className="text-xs text-muted-foreground" role="status">{pollenLabel}</span>
        </div>
        {pollen.isConnected ? (
          <>
            {pollen.accountInfo?.balance != null && (
              <p className="text-sm">
                {c.balance}: <span className="font-mono tabular-nums">{pollen.accountInfo.balance.toLocaleString()}</span> Pollen
              </p>
            )}
            <button type="button" onClick={pollen.disconnect} className="press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {c.disconnect}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={pollen.connectOAuth} className="press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover">
              <Zap className="h-4 w-4" aria-hidden="true" />
              {c.connectOAuth}
            </button>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (pollenInput.trim()) {
                  pollen.connectManual(pollenInput.trim());
                  setPollenInput('');
                }
              }}
            >
              <input
                type="password"
                value={pollenInput}
                onChange={(e) => setPollenInput(e.target.value)}
                placeholder={c.orKey}
                aria-label={`Pollen: ${c.orKey}`}
                autoComplete="off"
                className={cn(fieldClass, 'font-mono')}
              />
              <button type="submit" disabled={!pollenInput.trim()} className="press h-11 shrink-0 rounded-xl border border-border px-4 text-sm hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {c.connect}
              </button>
            </form>
          </>
        )}
        <p className="text-xs text-muted-foreground">{c.pollenHint}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Pruna</span>
          <StatusDot tone={pruna.isConnected ? 'ok' : 'warn'} />
          <span className="text-xs text-muted-foreground" role="status">{pruna.isConnected ? c.connected : c.notConnected}</span>
        </div>
        {pruna.isConnected ? (
          <button type="button" onClick={pruna.disconnect} className="press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {c.disconnect}
          </button>
        ) : (
          <form
            className="flex flex-col gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const accepted = pruna.connect(prunaInput);
              setPrunaInvalid(!accepted);
              if (accepted) setPrunaInput('');
            }}
          >
            <div className="flex gap-2">
              <input
                type="password"
                value={prunaInput}
                onChange={(e) => { setPrunaInput(e.target.value); setPrunaInvalid(false); }}
                placeholder={c.orKey}
                aria-label={`Pruna: ${c.orKey}`}
                aria-invalid={prunaInvalid}
                autoComplete="off"
                className={cn(fieldClass, 'font-mono')}
              />
              <button type="submit" disabled={!prunaInput.trim()} className="press h-11 shrink-0 rounded-xl border border-border px-4 text-sm hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {c.connect}
              </button>
            </div>
            {prunaInvalid && <p className="text-xs text-destructive" role="alert">{c.invalid}</p>}
          </form>
        )}
        <p className="text-xs text-muted-foreground">{c.prunaHint}</p>
      </div>
    </Section>
  );
}

function PersonSection({ c }: { c: Copy }) {
  const { activeConversation } = useChatConversation();
  const { handleStyleChange } = useChatModes();
  const [name, setName] = useLocalStorageState<string>('userDisplayName', 'user');
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>('customSystemPrompt', '');

  return (
    <Section title={c.person}>
      <Field label={c.name}>
        {(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" className={fieldClass} />}
      </Field>
      <Field label={c.style}>
        {(id) => (
          <select
            id={id}
            value={activeConversation?.selectedResponseStyleName || 'Basic'}
            onChange={(e) => handleStyleChange(e.target.value)}
            className={fieldClass}
          >
            {AVAILABLE_RESPONSE_STYLES.map((style) => (
              <option key={style.name} value={style.name}>{style.name}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label={c.instructions} hint={c.instructionsHint}>
        {(id) => (
          <textarea
            id={id}
            value={customSystemPrompt}
            onChange={(e) => setCustomSystemPrompt(e.target.value)}
            rows={3}
            className={cn(fieldClass, 'h-auto min-h-[5.5rem] resize-y py-2.5')}
          />
        )}
      </Field>
    </Section>
  );
}

function ModelsSection({ c }: { c: Copy }) {
  const { visibleModels } = useVisiblePollinationsTextModels();
  const [defaultTextModelId, setDefaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);
  const [defaultImageModelId, setDefaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL);
  const { showCommunity, setShowCommunity } = useShowCommunityModels();
  const imageModels = useMemo(() => getChatImageModelGroups().flatMap((group) => group.models), []);
  const communityId = useId();

  return (
    <Section title={c.models}>
      <Field label={c.textModel}>
        {(id) => (
          <select id={id} value={defaultTextModelId} onChange={(e) => setDefaultTextModelId(e.target.value)} className={cn(fieldClass, 'font-mono')}>
            {visibleModels.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label={c.imageModel} hint={c.imageModelHint}>
        {(id) => (
          <select id={id} value={defaultImageModelId} onChange={(e) => setDefaultImageModelId(e.target.value)} className={cn(fieldClass, 'font-mono')}>
            {imageModels.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={communityId} className="text-sm font-medium">{c.community}</label>
          <p className="text-xs text-muted-foreground">{c.communityHint}</p>
        </div>
        <input
          id={communityId}
          type="checkbox"
          role="switch"
          aria-checked={showCommunity}
          checked={showCommunity}
          onChange={(e) => setShowCommunity(e.target.checked)}
          className="mt-1 h-6 w-6 shrink-0 accent-[hsl(var(--primary))]"
        />
      </div>
    </Section>
  );
}

function VoiceSection({ c }: { c: Copy }) {
  const { selectedVoice, selectedTtsSpeed, handleVoiceChange, handleTtsSpeedChange } = useChatModes();
  return (
    <Section title={c.voice}>
      <Field label={c.voiceName}>
        {(id) => (
          <select id={id} value={selectedVoice} onChange={(e) => handleVoiceChange(e.target.value)} className={fieldClass}>
            {AVAILABLE_TTS_VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.name}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label={c.speed}>
        {(id) => (
          <select id={id} value={String(selectedTtsSpeed)} onChange={(e) => handleTtsSpeedChange(Number(e.target.value))} className={cn(fieldClass, 'font-mono tabular-nums')}>
            {TTS_SPEED_PRESETS.map((preset) => (
              <option key={preset.value} value={String(preset.value)}>{preset.label}</option>
            ))}
          </select>
        )}
      </Field>
    </Section>
  );
}

function LookSection({ c }: { c: Copy }) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  return (
    <Section title={c.look}>
      <Field label={c.theme}>
        {(id) => (
          <select id={id} value={theme ?? 'system'} onChange={(e) => setTheme(e.target.value)} className={fieldClass}>
            <option value="system">{c.themeSystem}</option>
            <option value="light">{c.themeLight}</option>
            <option value="dark">{c.themeDark}</option>
          </select>
        )}
      </Field>
      <Field label={c.language}>
        {(id) => (
          <select id={id} value={language} onChange={(e) => setLanguage(e.target.value as Language)} className={fieldClass}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        )}
      </Field>
    </Section>
  );
}
