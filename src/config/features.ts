/**
 * Zentrale Feature-Schalter. `false` blendet den Einstiegspunkt aus,
 * ohne Code/State zu entfernen — Re-Aktivierung durch Flip auf `true`.
 */
export const FEATURES = {
    compose: false,
} as const;
