'use client';

import React from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { AsciiSignature } from '@/components/ascii';
import type { ToolMode } from '@/hooks/useChatInputLogic';

/**
 * Kein Piktogramm, kein Rahmen. Die Identitaet eines Modus traegt sein Wort in
 * der Modusfarbe, darunter eine laufende Zeichensignatur.
 *
 * Die Signatur ist nicht Dekoration: sie unterscheidet die Modi ein zweites
 * Mal, unabhaengig von der Farbe. Mit reiner Einfaerbung ruecken Code und Chat
 * bei Rot-Gruen-Schwaeche zusammen.
 *
 * Ohne Rahmen ist der Klickbereich nicht mehr sichtbar begrenzt. Die
 * Trefferflaeche kommt deshalb ueber `py-3`, und der Hover-Zustand ist
 * deutlicher als vorher, weil er die Rolle des Rahmens uebernimmt.
 */
type ModeDef = {
    mode: ToolMode;
    labelKey: string;
    colorVar: string | null;
    /** Eigene Textur pro Modus — ersetzt das Symbol. */
    signature: string;
};

const MODES: ModeDef[] = [
    { mode: 'standard', labelKey: 'tools.chat', colorVar: null, signature: '· · · · · · · ·' },
    { mode: 'visualize', labelKey: 'tools.visualize', colorVar: 'var(--mode-visualize)', signature: '▚▞▚▞▚▞▚▞' },
    { mode: 'research', labelKey: 'tools.deepResearch', colorVar: 'var(--mode-research)', signature: '≈ ≈ ≈ ≈ ≈ ≈ ≈' },
    { mode: 'code', labelKey: 'tools.code', colorVar: 'var(--mode-code)', signature: '/ / / / / / / /' },
];

const tint = (colorVar: string | null) => (colorVar ? `hsl(${colorVar})` : 'hsl(var(--primary))');

const signatureClass = 'pointer-events-none absolute inset-x-0 bottom-0.5 text-[9px] leading-none opacity-80';

export const resolveActiveMode = (
    isImageMode: boolean,
    webBrowsingEnabled: boolean,
    isCodeMode: boolean,
): ToolMode => (
    isImageMode ? 'visualize' : webBrowsingEnabled ? 'research' : isCodeMode ? 'code' : 'standard'
);

interface ModeChipProps {
    activeMode: ToolMode;
    onToggle: () => void;
    isOpen: boolean;
    panelId: string;
    buttonRef?: React.Ref<HTMLButtonElement>;
}

/**
 * Nur der Ausloeser. Die Optionen leben im Feld, das die Leiste fuellt, damit
 * der Chip beim Oeffnen nicht seinen Platz raeumt.
 */
export const ModeChip: React.FC<ModeChipProps> = ({ activeMode, onToggle, isOpen, panelId, buttonRef }) => {
    const { t } = useLanguage();
    const current = MODES.find(m => m.mode === activeMode) ?? MODES[0];

    return (
        <button
            ref={buttonRef}
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            aria-label={t('menu.section.mode')}
            className={cn(
                'group relative shrink-0 bg-transparent px-1 py-3 font-mono text-sm',
                'transition-opacity focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-offset-2 focus-visible:outline-primary',
                isOpen ? 'opacity-100' : 'opacity-90 hover:opacity-100',
            )}
            style={{ color: tint(current.colorVar) }}
        >
            {t(current.labelKey)}
            <AsciiSignature pattern={current.signature} active={!isOpen} className={signatureClass} />
        </button>
    );
};

interface ModeOptionsProps {
    activeMode: ToolMode;
    onSelectMode: (mode: ToolMode) => void;
    canToggleCodeMode?: boolean;
}

export const ModeOptions: React.FC<ModeOptionsProps> = ({ activeMode, onSelectMode, canToggleCodeMode = true }) => {
    const { t } = useLanguage();
    const options = MODES.filter(m => m.mode !== 'code' || canToggleCodeMode);

    return (
        <div role="radiogroup" aria-label={t('menu.section.mode')} className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {options.map(({ mode, labelKey, colorVar, signature }) => {
                const isActive = mode === activeMode;
                return (
                    <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onSelectMode(mode)}
                        className={cn(
                            'relative bg-transparent px-1 py-3 font-mono text-sm transition-colors',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                            'focus-visible:outline-primary',
                            isActive ? '' : 'text-muted-foreground hover:text-foreground',
                        )}
                        style={isActive ? { color: tint(colorVar) } : undefined}
                    >
                        {t(labelKey)}
                        {isActive && <AsciiSignature pattern={signature} className={signatureClass} />}
                    </button>
                );
            })}
        </div>
    );
};
