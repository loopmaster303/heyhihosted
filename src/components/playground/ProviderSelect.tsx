"use client";

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePollenKey } from '@/hooks/usePollenKey';
import { usePrunaKey } from '@/hooks/usePrunaKey';
import { useProviderMode } from '@/hooks/useProviderMode';
import type { ImageProvider } from '@/config/unified-image-models';
import { cn } from '@/lib/utils';

interface ProviderOption {
  id: ImageProvider;
  name: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: 'pollinations', name: 'Pollinations' },
  { id: 'pruna', name: 'Pruna' },
];

/** What the sidebar says when the selected provider has no key yet. */
const HINT: Record<ImageProvider, string> = {
  pollinations:
    'Ohne Key stehen nur die freien Modelle bereit. Hinterleg deinen Pollen-Key, um alle freizuschalten.',
  pruna: 'Pruna braucht einen Key. Ohne ihn gibt es hier keine Modelle.',
};

function StatusDot({ hasKey }: { hasKey: boolean }) {
  return (
    <span
      className={cn(
        'h-1.5 w-1.5 shrink-0 rounded-full',
        hasKey
          ? 'bg-[hsl(150_55%_50%)] shadow-[0_0_7px_hsl(150_55%_50%/0.7)]'
          : 'bg-[hsl(38_85%_60%)] shadow-[0_0_7px_hsl(38_85%_60%/0.7)]'
      )}
    />
  );
}

export function ProviderSelect() {
  const { providerMode, setProviderMode } = useProviderMode();
  const pollen = usePollenKey();
  const pruna = usePrunaKey();
  const [draft, setDraft] = useState('');

  const hasKey: Record<ImageProvider, boolean> = {
    pollinations: pollen.isConnected,
    pruna: pruna.isConnected,
  };

  const selectedHasKey = hasKey[providerMode];
  const selected = PROVIDERS.find((p) => p.id === providerMode);

  const connect = () => {
    const key = draft.trim();
    if (!key) return;
    if (providerMode === 'pruna') pruna.connect(key);
    else pollen.connectManual(key);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto w-full justify-start gap-2.5 py-2.5">
            <StatusDot hasKey={selectedHasKey} />
            <span>{selected?.name}</span>
            <span className="flex-1" />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {PROVIDERS.map((provider) => (
            <DropdownMenuItem
              key={provider.id}
              onSelect={() => setProviderMode(provider.id)}
              className="flex items-center gap-2"
            >
              <StatusDot hasKey={hasKey[provider.id]} />
              <span>{provider.name}</span>
              <span className="flex-1" />
              {!hasKey[provider.id] && (
                <span className="text-[10px] text-muted-foreground">Benötigt Key in Settings</span>
              )}
              {provider.id === providerMode && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!selectedHasKey && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{HINT[providerMode]}</p>
          <div className="flex gap-1.5">
            <Input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={providerMode === 'pruna' ? 'Pruna-Key' : 'Pollen-Key'}
              aria-label={providerMode === 'pruna' ? 'Pruna-Key' : 'Pollen-Key'}
              autoComplete="off"
              spellCheck={false}
              className="h-11 flex-1 text-xs md:h-8"
            />
            <Button size="sm" className="h-11 shrink-0 px-3 text-xs md:h-8" onClick={connect} disabled={!draft.trim()}>
              Verbinden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
