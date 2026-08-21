"use client";
import { useEffect, useRef, useState } from 'react';
import { Menu, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { PlaygroundSidebar, PlaygroundSidebarContent } from '@/components/playground/PlaygroundSidebar';
import { SettingsDialog } from '@/components/playground/SettingsDialog';
import { PromptBar } from '@/components/playground/PromptBar';
import { Gallery, type GalleryItem, type GalleryRun } from '@/components/playground/Gallery';
import { MetaRail } from '@/components/playground/MetaRail';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { buildGenerateBody, buildGenerateHeaders, type GenerateBody } from '@/lib/playground/generate-request';
import { isModelInMode } from '@/lib/playground/mode-mapping';
import { getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';
import { schemaForEntry, defaultsFor, visibleFields, type ParamValues } from '@/lib/playground/param-schema';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { BlobManager } from '@/lib/blob-manager';
import { OutputService } from '@/lib/services/output-service';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import { readLocal } from '@/lib/safe-storage';

/**
 * Ein abgeschickter Lauf mit allem, was seine Wiederholung braucht. Ohne das
 * schickte "Erneut versuchen" den inzwischen veraenderten Composer-Zustand.
 */
interface QueuedRun {
  body: GenerateBody;
  prompt: string;
  params: ParamValues;
  modelId: string;
  isVideo: boolean;
  aspectRatio?: string;
}

/**
 * Ein Lauf im Flug oder gescheitert. Der Run *ist* der Retry-Kontext — daher
 * kein separater Merker fuer den letzten Fehlschlag. Der AbortController haengt
 * am einzelnen Lauf, damit ein Abbruch die anderen nicht mitreisst.
 */
interface ActiveRun extends QueuedRun {
  id: string;
  startedAt: number;
  status: 'running' | 'failed';
  message?: string;
  controller: AbortController;
}

/**
 * Pollinations quittiert Bursts mit 429, und eine Warteschlange waere Zustand,
 * den niemand angefordert hat. Darueber bleibt der Senden-Knopf gesperrt.
 */
const MAX_CONCURRENT_RUNS = 3;

let runCounter = 0;
const nextRunId = () => `run-${++runCounter}`;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [runs, setRuns] = useState<ActiveRun[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Gleiche 1280px-Grenze wie die Rail (xl) — darunter wandern die Details
  // bei Auswahl in den Bottom-Drawer.
  const isWide = useMediaQuery('(min-width: 1280px)');

  // Parameter, die ein "Nochmal" ueber einen Modellwechsel hinweg retten soll.
  const rerunParamsRef = useRef<ParamValues | null>(null);
  // Ob der Modellwechsel-Effekt schon einmal gelaufen ist. Nur beim ersten Mal
  // darf ein gespeicherter Zustand die Schema-Defaults schlagen.
  const hydratedRef = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  // Bei mehreren parallelen Laeufen wuerde jeder Abschluss die Detailansicht
  // umspringen lassen. Ein Ergebnis waehlt sich deshalb nur selbst aus, wenn
  // gerade nichts anderes ausgewaehlt ist — der State-Wert im Closure ist zum
  // Zeitpunkt des Abschlusses veraltet, darum der Ref.
  const selectedRef = useRef<GalleryItem | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // usePlaygroundModels liefert im Pruna-Modus bereits die gefilterte Liste
  // (PRUNA_HIDDEN_IN_PLAYGROUND) — hier nicht ein zweites Mal filtern.
  const modeEntries = entries.filter((e) => isModelInMode(e, state.mode));
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
    const schema = schemaForEntry(currentModel);
    const defaults = defaultsFor(schema);

    // Erster Lauf nach dem Mount: der aus dem localStorage geladene Zustand
    // gehoert zu genau diesem Modell und wird nicht mit Defaults ueberschrieben
    // — sonst waere das Persistieren von params wirkungslos. Uebernommen wird
    // nur, was das heutige Schema noch kennt; alles andere faellt weg.
    let restored: ParamValues | undefined;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      if (!override && prev.modelId === currentModel.id && Object.keys(prev.params).length > 0) {
        const known = new Set(visibleFields(schema, prev.params).map((f) => f.name));
        restored = {
          ...defaults,
          ...Object.fromEntries(Object.entries(prev.params).filter(([k]) => known.has(k))),
        };
      }
    }

    resetForModel({
      params: override ?? restored ?? defaults,
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

  /**
   * Startet einen bereits eingefrorenen Lauf. Der Run haengt zu diesem
   * Zeitpunkt schon in `runs` — diese Funktion verwaltet nur noch sein Ende.
   */
  const runGeneration = async (run: ActiveRun) => {
    setError(undefined);
    const { body, prompt: sentPrompt, params: sentParams } = run;
    const prunaKey = readLocal('prunaApiKey') ?? undefined;
    const headers = {
      'Content-Type': 'application/json',
      ...buildGenerateHeaders(pollenKey || undefined, prunaKey || undefined),
    };
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers, body: JSON.stringify(body), signal: run.controller.signal,
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
        modelId: run.modelId,
        conversationId: PLAYGROUND_CONVERSATION_ID,
        isVideo: kind === 'video',
        isPollinations: mediaUrl.startsWith('http'),
        params: sentParams,
      });
      // Echte Asset-ID, damit die Selektion den Galerie-Reload ueberlebt.
      const item: GalleryItem = {
        id: assetId ?? `${Date.now()}`, url: mediaUrl, kind,
        prompt: sentPrompt, modelId: run.modelId, timestamp: Date.now(),
        params: sentParams,
      };
      // Der Effekt schreibt den Ref erst nach dem Render — zwei im selben Tick
      // fertige Laeufe saehen sonst beide "nichts ausgewaehlt".
      if (selectedRef.current === null) {
        selectedRef.current = item;
        setSelected(item);
      }
      setRuns((rs) => rs.filter((r) => r.id !== run.id));
      setGalleryKey((k) => k + 1);
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setRuns((rs) => rs.filter((r) => r.id !== run.id));
        return;
      }
      // Generierungs-Fehler bleiben als Karte in der Galerie liegen — der Alert
      // ueber der Leiste bleibt Enhance-Fehlern vorbehalten. Der Lauf selbst ist
      // der Retry-Kontext und darf deshalb nicht verworfen werden.
      setRuns((rs) => rs.map((r) => (
        r.id === run.id ? { ...r, status: 'failed', message: (e as Error).message } : r
      )));
    }
  };

  // Nur laufende Generierungen zaehlen gegen die Grenze; gescheiterte Karten
  // liegen nur noch herum und blockieren nichts.
  const runningCount = runs.filter((r) => r.status === 'running').length;
  const canQueue = runningCount < MAX_CONCURRENT_RUNS;

  /** Haengt einen eingefrorenen Lauf an `runs` und startet ihn. */
  const startRun = (queued: QueuedRun) => {
    const run: ActiveRun = {
      ...queued,
      id: nextRunId(),
      startedAt: Date.now(),
      status: 'running',
      controller: new AbortController(),
    };
    setRuns((rs) => [run, ...rs]);
    void runGeneration(run);
  };

  const onSend = () => {
    // p-image-upscale works from the image alone, so an empty prompt is valid
    // there. Anywhere else it still blocks.
    if (!currentModel || !canQueue) return;
    if (promptRequired && !state.prompt.trim()) return;
    // Eingefrorene Werte fuer diesen Lauf — der Composer darf sich waehrend
    // der Generierung aendern, ohne den laufenden Request zu verfaelschen.
    startRun({
      body: buildGenerateBody(state, currentModel, currentSchema),
      prompt: state.prompt,
      params: state.params,
      modelId: currentModel.id,
      isVideo: state.mode === 't2v' || state.mode === 'i2v',
      aspectRatio: typeof state.params?.aspect_ratio === 'string' ? state.params.aspect_ratio : undefined,
    });
  };

  // Der gescheiterte Lauf traegt seinen Kontext selbst — wiederholt wird genau
  // er, nicht das, was inzwischen im Composer steht.
  const onRetryRun = (id: string) => {
    const failed = runs.find((r) => r.id === id);
    if (!failed || !canQueue) return;
    setRuns((rs) => rs.filter((r) => r.id !== id));
    startRun(failed);
  };

  const onCancelRun = (id: string) => {
    runs.find((r) => r.id === id)?.controller.abort();
  };

  const onDismissRun = (id: string) => setRuns((rs) => rs.filter((r) => r.id !== id));

  const sidebarProps = {
    state, entries, currentModel, loading, fallbackActive,
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

  /**
   * ReferenceSlots zeigt nur `min(gefuellt + 1, maxImages)` Plaetze. Ungeprueft
   * angehaengte Uploads waeren darueber hinaus unsichtbar und nicht mehr zu
   * entfernen, gingen aber trotzdem mit und liessen die Route mit 400 antworten.
   * Blob-URLs existieren nur im Browser — der Server koennte sie nicht abrufen.
   */
  const adoptAsReference = (item: GalleryItem) => {
    if (!currentModel?.supportsReference || currentModel.maxImages === 0) {
      setError(`${currentModel?.name ?? 'Dieses Modell'} nimmt keine Referenzbilder.`);
      return;
    }
    if (item.url.startsWith('blob:')) {
      setError('Dieses Ergebnis liegt nur lokal vor und lässt sich nicht als Referenz verwenden.');
      return;
    }
    if (state.uploads.length >= currentModel.maxImages) {
      setError(
        `${currentModel.name} nimmt höchstens ${currentModel.maxImages} `
        + `Referenzbild${currentModel.maxImages === 1 ? '' : 'er'}.`,
      );
      return;
    }
    setError(undefined);
    setUploads([...state.uploads, item.url]);
  };

  // Direkter Download per Blob; verweigert CORS/Netzwerk das, wenigstens
  // im neuen Tab oeffnen statt still zu scheitern.
  const downloadItem = async (item: GalleryItem) => {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = BlobManager.createURL(blob, 'playground-download');
      const a = document.createElement('a');
      const ext = item.kind === 'video' ? 'mp4' : blob.type.split('/')[1] || 'jpg';
      a.href = objectUrl;
      a.download = `heyhi-${item.modelId || 'output'}-${item.timestamp}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Der Download laeuft asynchron an: sofortiges Widerrufen bricht ihn in
      // Safari und Firefox ab. Die Freigabe wartet deshalb.
      setTimeout(() => BlobManager.releaseURL(objectUrl), 60_000);
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
              runs={runs}
              onCancelRun={onCancelRun}
              onRetryRun={onRetryRun}
              onDismissRun={onDismissRun}
            />
            <div className="hidden min-h-0 xl:block">
              <MetaRail
                item={selected}
                onLoad={downloadItem}
                onRerun={loadIntoComposer}
                onUseAsReference={adoptAsReference}
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
            canQueue={canQueue}
            queueFullHint={`${MAX_CONCURRENT_RUNS} Generierungen laufen bereits — warte auf eine davon.`}
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
              adoptAsReference(item);
              setDetailsOpen(false);
            }}
          />
        </DrawerContent>
      </Drawer>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
