"use client";

import type { PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import type { ParamValues } from '@/lib/playground/param-schema';
import { ProviderSelect } from './ProviderSelect';
import { ModeTabs } from './ModeTabs';
import { ModelPicker } from './ModelPicker';
import { ReferenceSlots } from './ReferenceSlots';
import { ParamControls } from './ParamControls';
import { schemaFor, defaultsFor } from '@/lib/playground/param-schema';

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
  const schema = currentModel ? schemaFor(currentModel.id) : undefined;
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
            uploads={state.uploads}
            onChange={onUploads}
          />
        </Group>
      )}

      {schema?.sourceVideo && (
        <Group label="Quellvideo">
          <VideoUpload value={state.sourceVideo} onChange={onSourceVideo} />
        </Group>
      )}
    </div>
  );
}

function VideoUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
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
        <label className="flex h-8 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground">
          Video hochladen
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.append('file', file);
              try {
                const res = await fetch('/api/media/upload', { method: 'POST', body: form });
                if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
                const data = await res.json();
                onChange(data.url);
              } catch (err) {
                console.error('Video upload failed:', err);
              }
            }}
          />
        </label>
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
