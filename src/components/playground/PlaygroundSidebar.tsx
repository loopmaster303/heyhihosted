"use client";

import type { PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import { ProviderSelect } from './ProviderSelect';
import { ModeTabs } from './ModeTabs';
import { ModelPicker } from './ModelPicker';
import { AspectRatioPills } from './AspectRatioPills';
import { ReferenceSlots } from './ReferenceSlots';
import { DurationSlider } from './DurationSlider';
import { AdvancedPanel } from './AdvancedPanel';

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
  onOpenSettings: () => void;
  onMode: (m: PlaygroundMode) => void;
  onModel: (id: string) => void;
  onAspectRatio: (r: string) => void;
  onUploads: (u: string[]) => void;
  onDuration: (v: number) => void;
  onAdvanced: (patch: Partial<Pick<PlaygroundState, 'seed' | 'negativePrompt' | 'guidance' | 'steps'>>) => void;
}

/** The panel body, shared by the desktop rail and the mobile drawer. */
export function PlaygroundSidebarContent({
  state,
  entries,
  currentModel,
  loading,
  fallbackActive,
  onOpenSettings,
  onMode,
  onModel,
  onAspectRatio,
  onUploads,
  onDuration,
  onAdvanced,
}: PlaygroundSidebarProps) {
  const showRefs = state.mode === 'i2i' || state.mode === 'i2v';
  const showDuration = state.mode === 't2v' || state.mode === 'i2v';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3.5">
      <Group label="Provider">
        <ProviderSelect onOpenSettings={onOpenSettings} />
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

      {currentModel && (
        <Group label="Seitenverhältnis">
          <AspectRatioPills
            modelId={currentModel.id}
            value={state.aspectRatio}
            onChange={onAspectRatio}
          />
        </Group>
      )}

      {currentModel && showRefs && (
        <Group label="Referenzen">
          <ReferenceSlots model={currentModel} uploads={state.uploads} onChange={onUploads} />
        </Group>
      )}

      {currentModel && showDuration && (
        <Group label="Dauer">
          <DurationSlider
            modelId={currentModel.id}
            value={state.durationSeconds}
            onChange={onDuration}
          />
        </Group>
      )}

      {currentModel && (
        <AdvancedPanel
          modelId={currentModel.id}
          values={{
            seed: state.seed,
            negativePrompt: state.negativePrompt,
            guidance: state.guidance,
            steps: state.steps,
          }}
          onChange={onAdvanced}
        />
      )}
    </div>
  );
}

/** Desktop rail. The mobile drawer renders PlaygroundSidebarContent directly. */
export function PlaygroundSidebar(props: PlaygroundSidebarProps) {
  return (
    <aside className="glass-panel hidden min-h-0 flex-col border-r border-border/45 md:flex">
      <PlaygroundSidebarContent {...props} />
    </aside>
  );
}
