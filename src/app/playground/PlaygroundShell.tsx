"use client";
import { useEffect, useRef, useState } from 'react';
import styles from './playground.module.css';
import { ProviderSwitch } from '@/components/playground/ProviderSwitch';
import { ApiKeyField } from '@/components/playground/ApiKeyField';
import { ModeSwitch } from '@/components/playground/ModeSwitch';
import { ModelSelect } from '@/components/playground/ModelSelect';
import { PromptPanel } from '@/components/playground/PromptPanel';
import { ReferenceUploads } from '@/components/playground/ReferenceUploads';
import { AspectRatioPills } from '@/components/playground/AspectRatioPills';
import { DurationSlider } from '@/components/playground/DurationSlider';
import { AdvancedPanel } from '@/components/playground/AdvancedPanel';
import { GenerateButton } from '@/components/playground/GenerateButton';
import { MobileBar } from '@/components/playground/MobileBar';
import { Hero, type HeroMedia } from '@/components/playground/Hero';
import { Gallery } from '@/components/playground/Gallery';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { buildGenerateBody, buildGenerateHeaders } from '@/lib/playground/generate-request';
import { isModelInMode } from '@/lib/playground/mode-mapping';
import { getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { BlobManager } from '@/lib/blob-manager';
import { OutputService } from '@/lib/services/output-service';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import type { GalleryItem } from '@/components/playground/Gallery';

export function PlaygroundShell() {
  const { state, setMode, setModelId, setPrompt, setAspectRatio, setDurationSeconds, setAdvanced, setUploads, resetForModel } = usePlaygroundState();
  const { entries, loading, fallbackActive } = usePlaygroundModels();
  const { pollenKey } = usePollenKey();
  const [enhancing, setEnhancing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroState, setHeroState] = useState<'empty'|'working'|'ready'|'error'>('empty');
  const [heroMedia, setHeroMedia] = useState<HeroMedia | undefined>();
  const [heroError, setHeroError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const modeEntries = entries.filter((e) => isModelInMode(e, state.mode));
  const currentModel = modeEntries.find((e) => e.id === state.modelId) ?? modeEntries[0];

  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
  }, [currentModel?.id]);

  useEffect(() => {
    if (!currentModel) return;
    const presetKeys = Object.keys(getAspectRatioPresetsForModel(currentModel.id));
    const defaultRatio = presetKeys[0] ?? null;
    const defaultDuration = getDefaultDurationSeconds(getUnifiedModel(currentModel.id)) ?? null;
    resetForModel({
      aspectRatio: state.aspectRatio && presetKeys.includes(state.aspectRatio) ? state.aspectRatio : defaultRatio,
      durationSeconds: state.durationSeconds ?? defaultDuration,
      uploads: state.uploads.slice(0, currentModel.maxImages),
    });
  }, [currentModel?.id]);

  const onEnhance = async () => {
    if (!state.prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: state.prompt }) });
      const data = await res.json();
      if (data?.enhanced) setPrompt(data.enhanced);
    } finally {
      setEnhancing(false);
    }
  };

  const onGenerate = async () => {
    if (!currentModel || !state.prompt.trim()) return;
    setHeroState('working');
    setHeroError(undefined);
    const body = buildGenerateBody(state, currentModel);
    const prunaKey = typeof window !== 'undefined' ? (localStorage.getItem('prunaApiKey') ?? undefined) : undefined;
    const headers = { 'Content-Type': 'application/json', ...buildGenerateHeaders(pollenKey || undefined, prunaKey || undefined) };
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
      if (!res.ok) throw new Error(`generate ${res.status}: ${await res.text()}`);
      const ct = res.headers.get('content-type') ?? '';
      let mediaUrl: string;
      let kind: 'image' | 'video';
      if (ct.startsWith('application/json')) {
        const data = await res.json();
        mediaUrl = data.videoUrl ?? data.imageUrl;
        kind = data.videoUrl ? 'video' : 'image';
      } else {
        const blob = await res.blob();
        mediaUrl = BlobManager.createURL(blob, 'playground');
        kind = ct.startsWith('video/') ? 'video' : 'image';
      }
      await OutputService.saveGeneratedAsset({
        url: mediaUrl,
        prompt: state.prompt,
        modelId: currentModel.id,
        conversationId: PLAYGROUND_CONVERSATION_ID,
        isVideo: kind === 'video',
        isPollinations: currentModel.provider === 'pollinations',
      });
      setHeroMedia({ url: mediaUrl, kind, prompt: state.prompt, modelName: currentModel.name, ratio: state.aspectRatio, durationSeconds: state.durationSeconds });
      setHeroState('ready');
    } catch (e) {
      if ((e as Error).name === 'AbortError') { setHeroState('empty'); return; }
      setHeroError((e as Error).message);
      setHeroState('error');
    } finally {
      abortRef.current = null;
    }
  };

  const genDisabled = loading || !currentModel || !state.prompt.trim();
  const genState = heroState === 'working' ? 'working' : (genDisabled ? 'disabled' : 'idle');

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}><span className={styles.logoDot} aria-hidden /><span>heyhi</span><span className={styles.slash}>/</span><span className={styles.sub}>playground</span></div>
      </header>
      <main className={styles.workspace}>
        <aside className={styles.params + (mobileOpen ? ' ' + styles.paramsMobileOpen : '')}>
          <button className={styles.paramsClose} onClick={() => setMobileOpen(false)} aria-label="Close settings">✕</button>
          <div className={styles.paramsScroll}>
            <ProviderSwitch />
            <ApiKeyField />
            <ModeSwitch value={state.mode} onChange={setMode} />
            <ModelSelect entries={entries} mode={state.mode} value={state.modelId} onChange={setModelId} loading={loading} fallbackActive={fallbackActive} />
            <PromptPanel value={state.prompt} onChange={setPrompt} onEnhance={onEnhance} enhancing={enhancing} />
            {currentModel && <ReferenceUploads model={currentModel} uploads={state.uploads} onChange={setUploads} />}
            {currentModel && <AspectRatioPills modelId={currentModel.id} value={state.aspectRatio} onChange={setAspectRatio} />}
            {currentModel && <DurationSlider modelId={currentModel.id} value={state.durationSeconds} onChange={setDurationSeconds} />}
            {currentModel && <AdvancedPanel modelId={currentModel.id} values={{ seed: state.seed, negativePrompt: state.negativePrompt, guidance: state.guidance, steps: state.steps }} onChange={setAdvanced} />}
          </div>
          <div className={styles.paramsFooter}>
            <GenerateButton state={genState} onClick={onGenerate} onCancel={() => abortRef.current?.abort()} />
          </div>
        </aside>
        <section className={styles.output}>
          <Hero state={heroState} media={heroMedia} error={heroError} />
          <Gallery onPick={(item: GalleryItem) => {
            setModelId(item.modelId);
            setPrompt(item.prompt);
            setHeroMedia({ url: item.url, kind: item.kind, prompt: item.prompt, modelName: item.modelId });
            setHeroState('ready');
          }} />
        </section>
      </main>
      <MobileBar prompt={state.prompt} onPrompt={setPrompt} onGenerate={onGenerate} onOpenParams={() => setMobileOpen(true)} />
    </div>
  );
}
