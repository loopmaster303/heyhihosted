"use client";
import { useEffect, useRef, useState } from 'react';
import { Menu, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { PlaygroundSidebar, PlaygroundSidebarContent } from '@/components/playground/PlaygroundSidebar';
import { SettingsDialog } from '@/components/playground/SettingsDialog';
import { PromptBar } from '@/components/playground/PromptBar';
import { Gallery, type GalleryItem, type PendingGeneration, type FailedGeneration } from '@/components/playground/Gallery';
import { MetaRail } from '@/components/playground/MetaRail';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { buildGenerateBody, buildGenerateHeaders } from '@/lib/playground/generate-request';
import { isModelInMode } from '@/lib/playground/mode-mapping';
import { getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';
import { schemaForEntry, defaultsFor, type ParamValues } from '@/lib/playground/param-schema';
import { PLAYGROUND_PRUNA_IDS } from '@/lib/playground/param-schema';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { BlobManager } from '@/lib/blob-manager';
import { OutputService } from '@/lib/services/output-service';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import { readLocal } from '@/lib/safe-storage';

/**
 * Die Routen antworten mit { error }. Ohne das Auslesen landet der rohe
 * JSON-Text in der Oberfläche, was niemandem hilft.
 */
async function messageFrom(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Keine JSON-Antwort — der Statuscode muss reichen.
  }
  return `${fallback} (${res.status})`;
}

export function PlaygroundShell() {
  const {
    state, setMode, setModelId, setPrompt, setParams, setUploads, setSourceVideo, resetForModel,
  } = usePlaygroundState();
  const { entries, loading, fallbackActive } = usePlaygroundModels();
  const { pollenKey } = usePollenKey();
  const { providerMode } = useProviderMode();

  const [enhancing, setEnhancing] = useState(false);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState<PendingGeneration | null>(null);
  const [failed, setFailed] = useState<FailedGeneration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Gleiche 1280px-Grenze wie die Rail (xl) — darunter wandern die Details
  // bei Auswahl in den Bottom-Drawer.
  const isWide = useMediaQuery('(min-width: 1280px)');

  const abortRef = useRef<AbortController | null>(null);
  // Parameter, die ein "Nochmal" ueber einen Modellwechsel hinweg retten soll.
  const rerunParamsRef = useRef<ParamValues | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const filteredEntries = providerMode === 'pruna'
    ? entries.filter((e) => PLAYGROUND_PRUNA_IDS.includes(e.id as any))
    : entries;
  const modeEntries = filteredEntries.filter((e) => isModelInMode(e, state.mode));
  // Ohne Key ist ein kostenpflichtiges Modell nicht benutzbar — Pollinations
  // antwortet mit 401 und das Bild bleibt leer. Als Vorgabe deshalb erst ein
  // freies wählen; die Auswahl des Nutzers hat weiter Vorrang.
  const currentModel =
    modeEntries.find((e) => e.id === state.modelId) ??
    (pollenKey ? modeEntries[0] : modeEntries.find((e) => !e.paidOnly) ?? modeEntries[0]);

  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel?.id]);

  const currentSchema = currentModel ? schemaForEntry(currentModel) : undefined;

  useEffect(() => {
    if (!currentModel) return;
    // Bei "Nochmal" mit Modellwechsel liegen hier die uebernommenen
    // Parameter statt der Schema-Defaults.
    const override = rerunParamsRef.current;
    rerunParamsRef.current = null;
    const prev = stateRef.current;
    resetForModel({
      params: override ?? defaultsFor(schemaForEntry(currentModel)),
      uploads: prev.uploads.slice(0, currentModel.maxImages),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel?.id]);

  const onEnhance = async () => {
    if (!state.prompt.trim() || !currentModel) return;
    setEnhancing(true);
    setError(undefined);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Die Route zieht den Key aus dem Header; ohne ihn entfällt die
          // Web-Recherche und der Aufruf läuft auf dem freien Kontingent.
          ...(pollenKey ? { 'X-Pollen-Key': pollenKey } : {}),
        },
        // modelId ist Pflicht — die Route antwortet sonst mit 400 — und wählt
        // die modellspezifischen Richtlinien aus.
        body: JSON.stringify({ prompt: state.prompt, modelId: currentModel.id }),
      });
      if (!res.ok) throw new Error(await messageFrom(res, 'Enhance fehlgeschlagen'));
      const data = await res.json();
      if (data?.enhancedPrompt) setPrompt(data.enhancedPrompt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnhancing(false);
    }
  };

  const promptRequired = currentSchema?.promptRequired ?? true;

  const onSend = async () => {
    // p-image-upscale works from the image alone, so an empty prompt is valid
    // there. Anywhere else it still blocks.
    if (!currentModel) return;
    if (promptRequired && !state.prompt.trim()) return;
    setSending(true);
    setError(undefined);
    setFailed(null);
    // Eingefrorene Werte fuer diesen Lauf — der Composer darf sich waehrend
    // der Generierung aendern, ohne den laufenden Request zu verfaelschen.
    const sentPrompt = state.prompt;
    const sentParams = state.params;
    const gen: PendingGeneration = {
      prompt: sentPrompt,
      modelId: currentModel.id,
      startedAt: Date.now(),
      isVideo: state.mode === 't2v' || state.mode === 'i2v',
      aspectRatio: typeof sentParams?.aspect_ratio === 'string' ? sentParams.aspect_ratio : undefined,
    };
    setPending(gen);
    const body = buildGenerateBody(state, currentModel, currentSchema);
    const prunaKey = readLocal('prunaApiKey') ?? undefined;
    const headers = {
      'Content-Type': 'application/json',
      ...buildGenerateHeaders(pollenKey || undefined, prunaKey || undefined),
    };
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(await messageFrom(res, 'Generierung fehlgeschlagen'));
      const ct = res.headers.get('content-type') ?? '';
      let mediaUrl: string;
      let kind: 'image' | 'video';
      if (ct.startsWith('application/json')) {
        const data = await res.json();
        const candidate = data.videoUrl ?? data.imageUrl;
        if (typeof candidate !== 'string' || !candidate) {
          throw new Error('generate response missing videoUrl/imageUrl');
        }
        mediaUrl = candidate;
        kind = data.videoUrl ? 'video' : 'image';
      } else {
        const blob = await res.blob();
        mediaUrl = BlobManager.createURL(blob, 'playground');
        kind = ct.startsWith('video/') ? 'video' : 'image';
      }
      // Die Route liefert bei beiden Providern eine bereits persistierte
      // Media-Storage-URL — die darf direkt als remoteUrl gespeichert werden.
      // Der Blob-Pfad (isPollinations: false) speichert OHNE remoteUrl, und
      // solche Assets zeigt die Galerie schlicht nicht — darum durften Pruna-
      // Ergebnisse nie erscheinen. Nur der blob:-Fallback bleibt lokal.
      const assetId = await OutputService.saveGeneratedAsset({
        url: mediaUrl,
        prompt: sentPrompt,
        modelId: currentModel.id,
        conversationId: PLAYGROUND_CONVERSATION_ID,
        isVideo: kind === 'video',
        isPollinations: mediaUrl.startsWith('http'),
        params: sentParams,
      });
      // Echte Asset-ID, damit die Selektion den Galerie-Reload ueberlebt.
      setSelected({
        id: assetId ?? `${Date.now()}`, url: mediaUrl, kind,
        prompt: sentPrompt, modelId: currentModel.id, timestamp: Date.now(),
        params: sentParams,
      });
      setGalleryKey((k) => k + 1);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        // Generierungs-Fehler landen als Karte in der Galerie — der Alert
        // ueber der Leiste bleibt Enhance-Fehlern vorbehalten.
        setFailed({
          prompt: gen.prompt,
          modelId: gen.modelId,
          isVideo: gen.isVideo,
          aspectRatio: gen.aspectRatio,
          message: (e as Error).message,
        });
      }
    } finally {
      abortRef.current = null;
      setPending(null);
      setSending(false);
    }
  };

  const sidebarProps = {
    state, entries: filteredEntries, currentModel, loading, fallbackActive,
    onMode: setMode,
    onModel: setModelId,
    onParams: setParams,
    onUploads: setUploads,
    onSourceVideo: setSourceVideo,
  };

  // "Nochmal": Werte nur in die Eingabe uebernehmen — bewusst KEIN
  // Auto-Senden, damit vor dem erneuten Generieren angepasst werden kann.
  const loadIntoComposer = (item: GalleryItem) => {
    setPrompt(item.prompt);
    if (item.modelId === currentModel?.id) {
      if (item.params) setParams(item.params);
      return;
    }
    // Der Modellwechsel-Effekt wuerde Parameter sonst auf Defaults
    // zuruecksetzen — er bekommt die uebernommenen Werte als Override.
    rerunParamsRef.current = item.params ?? null;
    setModelId(item.modelId);
  };

  // Direkter Download per Blob; verweigert CORS/Netzwerk das, wenigstens
  // im neuen Tab oeffnen statt still zu scheitern.
  const downloadItem = async (item: GalleryItem) => {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = item.kind === 'video' ? 'mp4' : blob.type.split('/')[1] || 'jpg';
      a.href = objectUrl;
      a.download = `heyhi-${item.modelId || 'output'}-${item.timestamp}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(item.url, '_blank', 'noopener');
    }
  };

  return (
    <div className="relative isolate grid h-dvh grid-rows-[46px_1fr] bg-background bg-[radial-gradient(78%_52%_at_10%_-6%,hsl(var(--primary)/0.16),transparent_64%),radial-gradient(62%_48%_at_92%_104%,hsl(325_72%_60%/0.10),transparent_62%)] text-foreground">
      <header className="flex items-center justify-between bg-glass-background/55 px-3.5 backdrop-blur-2xl">
        <div className="flex items-center gap-2.5 font-mono text-[13px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
          <span>heyhi</span>
          <span className="font-light text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">playground</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" aria-label="Einstellungen"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" aria-label="Menü"
            className="md:hidden" onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
        <PlaygroundSidebar {...sidebarProps} />

        <main className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]">
          <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[1fr_296px]">
            <Gallery
              selectedId={selected?.id ?? null}
              onSelect={(item) => {
                setSelected(item);
                // Unter xl gibt es keine Rail — Details gehen als Bottom-Drawer auf.
                if (!isWide) setDetailsOpen(true);
              }}
              refreshKey={galleryKey}
              pending={pending}
              failed={failed}
              onRetryFailed={() => onSend()}
              onDismissFailed={() => setFailed(null)}
            />
            <div className="hidden min-h-0 xl:block">
              <MetaRail
                item={selected}
                onLoad={downloadItem}
                onRerun={loadIntoComposer}
                onUseAsReference={(item) => setUploads([...state.uploads, item.url])}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-4 mb-1 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <span className="flex-1">{error}</span>
              <button
                type="button"
                aria-label="Meldung schließen"
                onClick={() => setError(undefined)}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <PromptBar
            value={state.prompt}
            onChange={setPrompt}
            onEnhance={onEnhance}
            enhancing={enhancing}
            onSend={onSend}
            onCancel={() => abortRef.current?.abort()}
            sending={sending}
            modelName={currentModel?.name}
            providerName={providerMode === 'pruna' ? 'Pruna' : 'Pollinations'}
            promptRequired={promptRequired}
          />
        </main>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="left">
        <DrawerContent className="h-dvh w-[84%] max-w-[310px]">
          <DrawerTitle className="sr-only">Einstellungen und Parameter</DrawerTitle>
          <PlaygroundSidebarContent {...sidebarProps} />
        </DrawerContent>
      </Drawer>

      {/* Details fuer schmale Viewports — auf dem Desktop uebernimmt die Rail. */}
      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerTitle className="sr-only">Generierungs-Details</DrawerTitle>
          <MetaRail
            className="max-h-[80dvh] border-l-0"
            item={selected}
            onLoad={downloadItem}
            onRerun={(item) => {
              loadIntoComposer(item);
              setDetailsOpen(false);
            }}
            onUseAsReference={(item) => {
              setUploads([...state.uploads, item.url]);
              setDetailsOpen(false);
            }}
          />
        </DrawerContent>
      </Drawer>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
