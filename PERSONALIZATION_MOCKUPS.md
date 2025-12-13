# Mockups für die überarbeitete Personalisierungsseite

## Übersicht

Die folgenden Mockups zeigen die geplante Überarbeitung der Personalisierungsseite mit Fokus auf konsistente Schriftgrößen, verbesserte Anordnung, reduzierte Komplexität und optimiertes mobiles Design.

## 1. Desktop-Ansicht (Breite > 1024px)

### 1.1 Gesamtlayout

```
┌─────────────────────────────────────────────────────────────────┐
│ (!hey.hi = 'username')                                         │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  Personalisierung                                               │
│  ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌─ Persönliche Einstellungen ──────────────────────────────┐   │
│  │                                                          │   │
│  │  Wie soll dich die Maschine ansprechen?                  │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ John                                            │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Wie soll die KI antworten?                             │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Präzise                                         │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Zusätzliche Anweisungen für die KI                     │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Du bist ein präziser, faktenbasierter Assistent │   │   │
│  │  │ für den User. Antworte kurz, klar, direkt und   │   │   │
│  │  │ kompetent.                                       │   │   │
│  │  │                                                  │   │   │
│  │  │                                                  │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Erweiterte Einstellungen (ausgeklappt)                        │
│  ┌─ Technische Einstellungen ────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌───┐ ┌───┐ ┌───┐                                     │   │
│  │  │KI │ │Sti│ │Bil│                                     │   │
│  │  │Mod│ │mm │ │der│                                     │   │
│  │  │ell│ │e  │ │-Mo│                                     │   │
│  │  │   │ │   │ │del│                                     │   │
│  │  └───┘ └───┘ └───┘                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Einstellungen speichern                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Schrift-Hierarchie Desktop

```
Personalisierung (H1):
- text-3xl md:text-4xl font-bold font-code text-glow

Persönliche Einstellungen (H2):
- text-xl md:text-2xl font-semibold font-code

Fragen (H3):
- text-lg md:text-xl font-medium

Beschreibungen:
- text-sm text-muted-foreground leading-relaxed

Input-Felder:
- text-base md:text-sm
```

## 2. Tablet-Ansicht (768px - 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ (!hey.hi = 'username')                                         │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  Personalisierung                                               │
│  ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌─ Persönliche Einstellungen ──────────────────────────────┐   │
│  │                                                          │   │
│  │  Wie soll dich die Maschine ansprechen?                  │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ John                                            │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Wie soll die KI antworten?                             │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Präzise                                         │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Zusätzliche Anweisungen für die KI                     │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Du bist ein präziser, faktenbasierter Assistent │   │   │
│  │  │ für den User. Antworte kurz, klar, direkt und   │   │   │
│  │  │ kompetent.                                       │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Erweiterte Einstellungen                                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Einstellungen speichern                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Mobile Ansicht (< 768px)

### 3.1 Gesamtlayout

```
┌─────────────────────────────────┐
│ (!hey.hi = 'username')          │
│ ─────────────────────────────── │
│                                 │
│  Personalisierung               │
│  ────────────────────────────── │
│                                 │
│  ┌─ Persönliche Einstellungen ─┐
│  │                             │
│  │  Wie soll dich die          │
│  │  Maschine ansprechen?       │
│  │  ┌────────────────────────┐ │
│  │  │ John                   │ │
│  │  └────────────────────────┘ │
│  │                             │
│  │  Wie soll die KI           │
│  │  antworten?                │
│  │  ┌────────────────────────┐ │
│  │  │ Präzise               │ │
│  │  └────────────────────────┘ │
│  │                             │
│  │  Zusätzliche               │
│  │  Anweisungen für die KI    │
│  │  ┌────────────────────────┐ │
│  │  │ Du bist ein präziser,  │ │
│  │  │ faktenbasierter        │ │
│  │  │ Assistent...           │ │
│  │  └────────────────────────┘ │
│  └─────────────────────────────┘
│                                 │
│  ▼ Erweiterte Einstellungen      │
│                                 │
│  ┌────────────────────────────┐ │
│  │   Einstellungen speichern  │ │
│  └────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### 3.2 Schrift-Hierarchie Mobile

```
Personalisierung (H1):
- text-2xl font-bold font-code text-glow

Persönliche Einstellungen (H2):
- text-lg font-semibold font-code

Fragen (H3):
- text-base font-medium

Beschreibungen:
- text-xs text-muted-foreground leading-relaxed

Input-Felder:
- text-base (min-height: 44px für Touch-Targets)
```

## 4. Interaktive Elemente

### 4.1 Erweiterte Einstellungen (eingeklappt)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▶ Erweiterte Einstellungen                                   │
│    Technische Konfiguration für Modelle und Funktionen        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Erweiterte Einstellungen (ausgeklappt)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▼ Erweiterte Einstellungen                                   │
│  ────────────────────────────────────────────────────────────── │
│                                                             │
│  ┌─ Technische Einstellungen ─────────────────────────────┐  │
│  │                                                         │  │
│  │  KI-Modell                                             │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ GPT-4 Turbo                                    │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                         │  │
│  │  Stimme                                                 │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ Nova                                           │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                         │  │
│  │  Bild-Modell                                           │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ Flux 2 Pro                                     │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Hover- und Focus-Zustände

```
Input-Feld (Focus):
┌─────────────────────────────────────────────────────────────────┐
│ John                                                         │
│ ─────────────────────────────────────────────────────────────── │
│  border-pink-500 focus:ring-pink-500                         │
└─────────────────────────────────────────────────────────────────┘

Button (Hover):
┌─────────────────────────────────────────────────────────────────┐
│                    Einstellungen speichern                    │
│ ─────────────────────────────────────────────────────────────── │
│  bg-primary/90 hover:bg-primary/80                            │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Dark Mode Variante

### 5.1 Desktop Dark Mode

```
┌─────────────────────────────────────────────────────────────────┐
│ (!hey.hi = 'username')                                         │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  Personalisierung                                               │
│  ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌─ Persönliche Einstellungen ──────────────────────────────┐   │
│  │                                                          │   │
│  │  Wie soll dich die Maschine ansprechen?                  │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ John                                            │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Wie soll die KI antworten?                             │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Präzise                                         │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Zusätzliche Anweisungen für die KI                     │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Du bist ein präziser, faktenbasierter Assistent │   │   │
│  │  │ für den User. Antworte kurz, klar, direkt und   │   │   │
│  │  │ kompetent.                                       │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Einstellungen speichern                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Dark Mode Farben:
- background: #111111
- card: #111111
- border: #252525
- input: #252525
- text: #f0f0f0
- muted-foreground: #888888
```

## 6. Animationen und Übergänge

### 6.1 Erweiterte Einstellungen Toggle

```
Ausklappen:
- Höhe: 0px → auto
- Dauer: 300ms
- Easing: ease-out
- Opacity: 0 → 1

Einklappen:
- Höhe: auto → 0px
- Dauer: 300ms
- Easing: ease-in
- Opacity: 1 → 0
```

### 6.2 Button-Interaktionen

```
Hover:
- Transform: scale(1.02)
- Dauer: 200ms
- Easing: ease-out

Active/Pressed:
- Transform: scale(0.98)
- Dauer: 100ms
- Easing: ease-in
```

### 6.3 Input-Focus

```
Focus Ring:
- Box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.5)
- Dauer: 200ms
- Easing: ease-out
```

## 7. Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  .settings-card {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .setting-input {
    min-height: 44px;
    font-size: 16px; /* Verhindert Zoom auf iOS */
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .settings-card {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .settings-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .settings-card {
    padding: 2rem;
  }
}
```

## 8. Accessibility-Features

### 8.1 Focus Management

```
Tab-Order:
1. Name-Input
2. Response-Style-Select
3. System-Prompt-Textarea
4. Erweiterte-Einstellungen-Toggle
5. KI-Modell-Select (wenn ausgeklappt)
6. Stimme-Select (wenn ausgeklappt)
7. Bild-Modell-Select (wenn ausgeklappt)
8. Speichern-Button
```

### 8.2 Screen Reader Support

```
ARIA-Labels:
- Erweiterte Einstellungen: aria-expanded="true/false"
- Select-Inputs: aria-describedby="[description-id]"
- Textarea: aria-label="Zusätzliche Anweisungen für die KI"
```

### 8.3 Keyboard Navigation

```
Shortcuts:
- Enter: Formular absenden
- Escape: Erweiterte Einstellungen einklappen
- Tab/Shift+Tab: Zwischen Elementen navigieren
- Space: Checkboxen und Toggles umschalten
```

Diese Mockups zeigen, wie die überarbeitete Personalisierungsseite aussehen wird, mit klaren Verbesserungen in Bezug auf Konsistenz, Benutzerfreundlichkeit und mobile Optimierung.