"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHasPollenKey } from "@/hooks/useHasPollenKey";
import { useHasPrunaKey } from "@/hooks/useHasPrunaKey";
import { useProviderMode } from "@/hooks/useProviderMode";
import type { ImageProvider } from "@/config/unified-image-models";
import { cn } from "@/lib/utils";

interface ProviderOption {
  id: ImageProvider;
  name: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: "pollinations", name: "Pollinations" },
  { id: "pruna", name: "Pruna" },
];

function StatusDot({ hasKey }: { hasKey: boolean }) {
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        hasKey
          ? "bg-[hsl(150_55%_50%)] shadow-[0_0_7px_hsl(150_55%_50%/0.7)]"
          : "bg-[hsl(38_85%_60%)] shadow-[0_0_7px_hsl(38_85%_60%/0.7)]"
      )}
    />
  );
}

export function ProviderSelect({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { providerMode, setProviderMode } = useProviderMode();
  const hasPollenKey = useHasPollenKey();
  const hasPrunaKey = useHasPrunaKey();

  const keyMap: Record<ImageProvider, boolean> = {
    pollinations: hasPollenKey,
    pruna: hasPrunaKey,
  };

  const selectedHasKey = keyMap[providerMode];
  const selectedProvider = PROVIDERS.find((p) => p.id === providerMode);

  return (
    <div className="flex flex-col gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 h-auto py-2.5"
          >
            <StatusDot hasKey={selectedHasKey} />
            <span>{selectedProvider?.name}</span>
            <span className="flex-1" />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {PROVIDERS.map((provider) => {
            const isSelected = provider.id === providerMode;
            const hasKey = keyMap[provider.id];

            return (
              <DropdownMenuItem
                key={provider.id}
                onClick={() => setProviderMode(provider.id)}
                className="flex items-center gap-2"
              >
                <StatusDot hasKey={hasKey} />
                <span>{provider.name}</span>
                <span className="flex-1" />
                {!hasKey && (
                  <span className="text-[10px] text-muted-foreground">
                    Key fehlt
                  </span>
                )}
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {!selectedHasKey && (
        <div className="flex items-center gap-1.5 text-[11px] text-[hsl(38_85%_60%)]">
          <span>Kein Key —</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Einstellungen
          </button>
        </div>
      )}
    </div>
  );
}
