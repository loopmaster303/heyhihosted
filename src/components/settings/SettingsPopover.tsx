'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ModalPopup } from '@/components/ui/popup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { usePollenKey } from '@/hooks/usePollenKey'
import { getStoredPollenKey } from '@/lib/client-pollen-key'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import useLocalStorageState from '@/hooks/useLocalStorageState'
import { useProviderMode } from '@/hooks/useProviderMode'
import { useHasPollenKey } from '@/hooks/useHasPollenKey'
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels'
import { AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES, DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_IMAGE_MODEL } from '@/config/chat-options'
import { TTS_SPEED_PRESETS } from '@/lib/chat/audio-settings'
import { getModelsByProvider, shouldIncludeByopHidden } from '@/config/unified-image-models'
import { unifiedModelConfigs } from '@/config/unified-model-configs'
import { useShowCommunityModels } from '@/hooks/useShowCommunityModels'
import { readLocal, writeLocal, removeLocal } from '@/lib/safe-storage'
import { cn } from '@/lib/utils'

export interface VoiceSettings {
  selectedVoice: string
  selectedTtsSpeed: number
  onVoiceChange: (voiceId: string) => void
  onTtsSpeedChange: (speed: number) => void
  onStyleChange: (styleName: string) => void
}

/**
 * Ein Popover fuer Chat und Playground. Die Stimme-Gruppe ist chat-only und
 * kommt als Prop herein: der Playground hat bewusst keinen ChatProvider, und
 * TTS gibt es dort nicht.
 */
export function SettingsPopover({ open, onClose, voice }: {
  open: boolean
  onClose: () => void
  voice?: VoiceSettings
}) {
  const { pollenKey, isConnected: isPollenConnected, keyStatus, keyDetail, connectManual, disconnect } = usePollenKey()
  const { providerMode, setProviderMode, prunaAvailable } = useProviderMode()
  const hasPollenKey = useHasPollenKey()
  const { visibleModels: allTextModels } = useVisiblePollinationsTextModels()
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>('userDisplayName', 'user')
  const [responseStyle, setResponseStyle] = useLocalStorageState<string>('responseStyleName', 'Basic')
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>('customSystemPrompt', '')
  const [defaultTextModelId, setDefaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID)
  const [defaultImageModelId, setDefaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL)
  const imageModels = React.useMemo(
    () => getModelsByProvider(providerMode, {
      includeByopHidden: shouldIncludeByopHidden(providerMode, { prunaAvailable, hasPollenKey }),
    }).filter((model) => model.kind === 'image' && model.id in unifiedModelConfigs),
    [providerMode, prunaAvailable, hasPollenKey],
  )
  const { showCommunity, setShowCommunity } = useShowCommunityModels()
  // Direkt aus dem Storage, nicht aus dem Hook: usePollenKey liefert den
  // Schluessel erst nach dem Mount nach, ein Startwert daraus bliebe leer —
  // Feld ohne Inhalt neben einer Lampe, die schon verbunden meldet.
  const [pollenInput, setPollenInput] = useState(() => getStoredPollenKey() ?? '')

  const [prunaInput, setPrunaInput] = useState(() => readLocal('prunaApiKey') ?? '')
  const [savedPrunaKey, setSavedPrunaKey] = useState(() => readLocal('prunaApiKey') ?? '')
  const isPrunaConnected = !!savedPrunaKey

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handlePrunaConnect = () => {
    writeLocal('prunaApiKey', prunaInput)
    setSavedPrunaKey(prunaInput)
  }

  const handlePrunaDisconnect = () => {
    removeLocal('prunaApiKey')
    setSavedPrunaKey('')
  }

  return (
    <ModalPopup open={open} onClose={onClose} maxWidth="lg" className="p-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold font-mono">Einstellungen</h2>
        <Button variant="ghost" size="icon" aria-label="Schließen" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">Pollinations</span>
            {/* Drei Lampenzustaende: 403 heisst "nicht pruefbar", nicht abgelehnt —
                Erzeugen funktioniert trotzdem. Nur 401 faerbt rot. */}
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                keyStatus === 'ok' && 'bg-[hsl(150_55%_50%)]',
                (keyStatus === 'unverifiable' || (keyStatus !== 'ok' && keyStatus !== 'rejected' && isPollenConnected)) && 'bg-[hsl(38_85%_60%)]',
                keyStatus === 'rejected' && 'bg-[hsl(0_72%_55%)]',
                !isPollenConnected && 'bg-[hsl(38_85%_60%)]'
              )}
            />
            <span
              className={cn(
                'text-[10px]',
                keyStatus === 'ok'
                  ? 'text-[hsl(150_55%_50%)]'
                  : 'text-muted-foreground'
              )}
            >
              {keyStatus === 'ok' && 'Verbunden'}
              {keyStatus === 'rejected' && 'Schlüssel wird abgelehnt — neu verbinden'}
              {keyStatus === 'unverifiable' && 'Verbunden — Kontostand nicht abrufbar, Erzeugen funktioniert trotzdem'}
              {keyStatus !== 'ok' && keyStatus !== 'rejected' && keyStatus !== 'unverifiable'
                && (isPollenConnected ? 'Verbunden' : 'Nicht verbunden')}
            </span>
          </div>
          {keyStatus === 'unverifiable' && keyDetail && (
            <p className="text-[10px] leading-snug text-muted-foreground">{keyDetail}</p>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="password"
              aria-label="Pollen-Key"
              value={pollenInput}
              onChange={(event) => setPollenInput(event.target.value)}
              className="flex-1"
            />
            {pollenKey ? (
              <Button variant="outline" onClick={disconnect}>
                Trennen
              </Button>
            ) : (
              <Button onClick={() => connectManual(pollenInput)}>Verbinden</Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Wird für Chat, Bilder und Video geteilt. Liegt im Browser-Speicher.
          </p>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">Pruna</span>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isPrunaConnected ? 'bg-[hsl(150_55%_50%)]' : 'bg-[hsl(38_85%_60%)]'
              )}
            />
            <span
              className={cn(
                'text-[10px]',
                isPrunaConnected
                  ? 'text-[hsl(150_55%_50%)]'
                  : 'text-muted-foreground'
              )}
            >
              {isPrunaConnected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              aria-label="Pruna-Key"
              value={prunaInput}
              onChange={(event) => setPrunaInput(event.target.value)}
              className="flex-1"
            />
            {isPrunaConnected ? (
              <Button variant="outline" onClick={handlePrunaDisconnect}>
                Trennen
              </Button>
            ) : (
              <Button onClick={handlePrunaConnect}>Verbinden</Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Schaltet die p-* Modellfamilie frei — Upscale, Video, Edit.
          </p>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold">Community-Modelle</span>
              <Badge variant="secondary">experimentell</Badge>
            </div>
            <Switch
              checked={showCommunity}
              onCheckedChange={setShowCommunity}
              aria-label="Community-Modelle anzeigen"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Von der Community bei Pollinations beigesteuerte Modelle. Qualität und
            Verfügbarkeit schwanken — deshalb standardmäßig ausgeblendet.
          </p>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">Standardmodelle</span>
            <Badge variant="secondary">später</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Pro Modus und Provider ein Standard festlegen.
          </p>
        </div>

        <Group title="Person">
          <Field label="Name">
            <Input value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} className="h-8 text-xs" />
          </Field>
          <Field label="Antwortstil">
            <Select value={responseStyle} onValueChange={(v) => { setResponseStyle(v); voice?.onStyleChange(v) }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABLE_RESPONSE_STYLES.map((style) => (
                  <SelectItem key={style.name} value={style.name}>{style.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Zusatz-Instruktionen">
            <Textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </Field>
        </Group>

        <Group title="Voreinstellungen">
          <Field label="Standard-Textmodell">
            <Select value={defaultTextModelId} onValueChange={setDefaultTextModelId}>
              <SelectTrigger className="h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {allTextModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="font-mono">{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Standard-Bildmodell">
            <Select value={defaultImageModelId} onValueChange={setDefaultImageModelId}>
              <SelectTrigger className="h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="font-mono">{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bild-Provider">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Pollinations</span>
              <Switch
                checked={providerMode === 'pruna'}
                disabled={!prunaAvailable}
                onCheckedChange={(checked) => setProviderMode(checked ? 'pruna' : 'pollinations')}
                aria-label="Bild-Provider"
              />
              <span className="text-xs text-muted-foreground">Pruna</span>
            </div>
          </Field>
        </Group>

        {voice && <Group title="Stimme">
          <Field label="Stimme">
            <Select value={voice.selectedVoice} onValueChange={voice.onVoiceChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABLE_TTS_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sprechtempo">
            <Select value={String(voice.selectedTtsSpeed)} onValueChange={(v) => voice.onTtsSpeedChange(Number(v))}>
              <SelectTrigger className="h-8 text-xs font-mono tabular-nums"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TTS_SPEED_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={String(preset.value)} className="font-mono">{preset.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Group>}
      </div>
    </ModalPopup>
  )
}

/**
 * Vier Gruppen nach *was es ist*, nicht nach *wo es gilt*: ein Playground/Chat-
 * Schalter haette eine leere Seite, weil der Playground seine Parameter lokal
 * pro Lauf haelt und keine Kontoeinstellungen besitzt.
 */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
