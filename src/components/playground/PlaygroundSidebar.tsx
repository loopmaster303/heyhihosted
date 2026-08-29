"use client";

import type { PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import type { ParamValues } from '@/lib/playground/param-schema';
import { useState } from 'react';
import { ProviderSelect } from './ProviderSelect';
import { ModeTabs } from './ModeTabs';
import { ModelPicker } from './ModelPicker';
import { ReferenceSlots, uploadPlaygroundReference } from './ReferenceSlots';
import { ParamControls } from './ParamControls';
import { schemaForEntry } from '@/lib/playground/param-schema';

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75">
        {label}
      </span>
      {children}
    </div>
  );
}

export interface PlaygroundSidebarProps {
  state: PlaygroundState;
  entries: PlaygroundModelEntry[];
  currentModel?: PlaygroundModelEntry;
  loading: boolean;
  fallbackActive: boolean;
  onMode: (m: PlaygroundMode) => void;
  onModel: (id: string) => void;
  onParams: (patch: ParamValues) => void;
  onUploads: (u: string[]) => void;
  onSourceVideo: (v: string | null) => void;
}

export function PlaygroundSidebarContent({
  state,
  entries,
  currentModel,
  loading,
  fallbackActive,
  onMode,
  onModel,
  onParams,
  onUploads,
  onSourceVideo,
}: PlaygroundSidebarProps) {
  const schema = currentModel ? schemaForEntry(currentModel) : undefined;
  const showRefs = state.mode === 'i2i' || state.mode === 'i2v';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3.5">
      <Group label="Provider">
        <ProviderSelect />
      </Group>

      <Group label="Modus">
        <ModeTabs value={state.mode} onChange={onMode} />
      </Group>

      <Group label="Modell">
        <ModelPicker
          entries={entries}
          mode={state.mode}
          value={state.modelId}
          onChange={onModel}
          loading={loading}
          fallbackActive={fallbackActive}
        />
      </Group>

      {schema && (
        <ParamControls
          schema={schema}
          values={state.params}
          onChange={onParams}
          uploadCount={state.uploads.length}
        />
      )}

      {currentModel && showRefs && (
        <Group label="Referenzen">
          <ReferenceSlots
            model={currentModel}
            schema={schema}
            uploads={state.uploads}
            onChange={onUploads}
          />
        </Group>
      )}

      {schema?.sourceVideo && currentModel && (
        <Group label="Quellvideo">
          {/* Der Provider kommt vom Modell, nicht vom Provider-Schalter — der
              scopet nur die Modellliste. */}
          <VideoUpload
            value={state.sourceVideo}
            onChange={onSourceVideo}
            provider={currentModel.provider}
          />
        </Group>
      )}
    </div>
  );
}

/**
 * Quellvideo-Upload. Bisher schickte er multipart an /api/media/upload — die
 * Route lehnt das mit 415 ab, weil `formData()` sich nicht groessenbegrenzen
 * laesst. Selbst danach waere es der falsche Endpunkt: das einzige Modell mit
 * `sourceVideo` ist `vace`, und das ist ein Pruna-Modell. Der Upload lief also
 * gegen Pollinations Media (10 MB, anderer Key) statt gegen Pruna (100 MB).
 * Gescheitert ist er in jedem Fall, sichtbar war davon nichts.
 */
function VideoUpload({
  value,
  onChange,
  provider,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  provider: 'pollinations' | 'pruna';
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-xs truncate flex-1">{value}</span>
          <button type="button" onClick={() => onChange(null)} className="text-xs text-destructive">
            Entfernen
          </button>
        </div>
      ) : (
        <label className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground md:h-8">
          {uploading ? 'Lädt hoch…' : 'Video hochladen'}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              // Zuruecksetzen, sonst feuert dieselbe Datei kein zweites Mal.
              e.target.value = '';
              if (!file) return;
              setError(null);
              setUploading(true);
              try {
                onChange(await uploadPlaygroundReference(file, provider));
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-[10px] leading-snug text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function PlaygroundSidebar(props: PlaygroundSidebarProps) {
  return (
    <aside className="glass-panel hidden min-h-0 flex-col border-r border-border/45 md:flex">
      <PlaygroundSidebarContent {...props} />
    </aside>
  );
}
