/**
 * Zentrale Feature-Schalter. `false` blendet den Einstiegspunkt aus,
 * ohne Code/State zu entfernen — Re-Aktivierung durch Flip auf `true`.
 */
export const FEATURES = {
    compose: false,
    // Pruna ist im Create zuhause (ProviderSelect, SettingsPopover). Der Chat
    // bot denselben Schalter und eine eigene Pruna-Konto-Sektion an, obwohl
    // seine Bildauswahl nur Pollinations fuehrt (getChatImageModelGroups) und
    // der Dispatch ohnehin am Modell haengt: ein Schalter, der nichts schaltet,
    // ist ein Versprechen ohne Deckung. Flag statt Loeschung.
    chatPrunaProvider: false,
} as const;
