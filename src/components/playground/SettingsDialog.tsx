'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ModalPopup } from '@/components/ui/popup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { usePollenKey } from '@/hooks/usePollenKey'
import { useShowCommunityModels } from '@/hooks/useShowCommunityModels'
import { readLocal, writeLocal, removeLocal } from '@/lib/safe-storage'
import { cn } from '@/lib/utils'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pollenKey, isConnected: isPollenConnected, connectManual, disconnect } = usePollenKey()
  const { showCommunity, setShowCommunity } = useShowCommunityModels()
  const [pollenInput, setPollenInput] = useState(() => pollenKey ?? '')

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
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isPollenConnected ? 'bg-[hsl(150_55%_50%)]' : 'bg-[hsl(38_85%_60%)]'
              )}
            />
            <span
              className={cn(
                'text-[10px]',
                isPollenConnected
                  ? 'text-[hsl(150_55%_50%)]'
                  : 'text-muted-foreground'
              )}
            >
              {isPollenConnected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
          </div>
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
      </div>
    </ModalPopup>
  )
}
