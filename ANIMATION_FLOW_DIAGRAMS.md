# 🔄 Animation Flow Diagramme

Visuelle Übersicht der empfohlenen Animationabläufe.

---

## 1. Landing-State Flow (WelcomeScreen)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGE LOAD                               │
│                    (messages.length === 0)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  WelcomeScreen   │
                    │   mount/render   │
                    └──────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
   (1) Hero         (2) Mode-Toggle          (3) Input-Box
   Branding         Chat/Visualize             + Chips
   ─────────        ─────────────             ─────────
   - Fade-in        - Smooth BG-Change       - Fade-in
   - Zoom-in        - Icon-Rotation          - Glow-Border
   - ~500ms         - ~300ms                   Hover
                                              - ~400ms
   
        │                     │                      │
        └─────────────────────┼──────────────────────┘
                              │
                      ┌───────▼───────┐
                      │ READY STATE   │
                      └───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            (A) Call-to-Action  (B) User Interacts
            Pulse nach 800ms           │
                    │                   │
                    ▼                   ▼
            Input scale-pulse    Input getValue
            box-shadow glow      Suggestion setInputValue
            duration: 1.5s       OR Input Focus
                                 duration: instant
                                        │
                                        ▼
                                (await click handler)
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  SEND MESSAGE       │
                              │  (siehe Punkt 2)    │
                              └─────────────────────┘
```

**Timing-Details:**
```
T=0ms       WelcomeScreen mount
T=0-500ms   Fade-in zoom-in Animation (Tailwind)
T=300ms     Suggestion Chips staggered fade-in (je +50ms)
T=500ms     Input-Box glow border opacity: 0.3 → 0.75 (hover)
T=800ms     Call-to-Action pulse beginnt
              boxShadow: [0, 0, 20px, 0] (loop 2x)
T=1300ms    Call-to-Action pulse endet
T=∞         Ready für Input/Click
```

---

## 2. Message Send & Response Flow

```
┌────────────────────────────────────────────────────────────┐
│               USER SENDS MESSAGE                           │
│          (handleSubmit / onSendMessage)                    │
└────────────────────────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Add to messages array   │
        │ setLastUserMessageId    │
        │ setIsAiResponding=true  │
        └─────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
    (1) Scroll             (2) Show Loading
    ─────────              ─────────────────
    - scrollIntoView       - MessageBubble
    - behavior: smooth       id="loading"
    - block: start          - 3 Bouncing Dots
    - ~300ms                - Puls-Halo around
                            - opacity fade
                            - ~400ms visible
        │                            │
        └─────────────┬──────────────┘
                      │
                ┌─────▼──────┐
                │ API CALL   │
                │ Streaming  │
                │ SSE        │
                └─────┬──────┘
                      │
                      ▼ (T=200ms after start)
        ┌──────────────────────────┐
        │ Remove Loading Bubble    │
        │ Add AI Response Message  │
        │ message.isStreaming=true │
        │ message.id = UUID        │
        └──────────────────────────┘
                      │
        ┌─────────────┴──────────────────┐
        │                                │
        ▼                                ▼
   (A) Entrance          (B) Typewriter Effect
   ─────────             ─────────────────────
   - opacity: 0→1        - Char-by-char animation
   - translateY:         - Speed: 25ms per char
     16px→0px            - Smart Delays:
   - Duration: 400ms       • Space: 7.5ms (30%)
   - ease: easeOut       • Punctuation: 50ms (200%)
   ─                     • Comma: 37.5ms (150%)
                         - BlinkingCursor visible
                         - Can skip to end (click)
                         - Duration: ~5-30s depending
                                   on response length
        │                │
        └────────┬───────┘
                 │
          ┌──────▼──────────────┐
          │ Typewriter Complete │
          │ message.isStreaming=│
          │ false               │
          │ isComplete=true     │
          └──────┬──────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
  (A)Post-   (B) Scroll  (C) Input
  Glow       Down        Auto-Focus
  ──────     ──────      ────────
  -Pulse     -Smooth     - Focus()
  -Opacity:  -Delay:     - Glow-Border
   0→1→0.1   300ms       - Scale-up:
  -Dur:      -To Input   1.0 → 1.05
   1.5s      Area        - Dur: 200ms
  -Shadow:              - Auto-type
   0→24px→8px          emoji? (opt)
  
    │            │            │
    └────────────┼────────────┘
                 │
            ┌────▼────┐
            │READY    │
            │FOR NEXT │
            │MESSAGE  │
            └─────────┘
```

**Timing-Details für Response-Flow:**
```
T=0ms       User click "Send"
T=0-50ms    Add message, setIsAiResponding=true
T=50-300ms  Scroll smooth to user message
T=100-200ms Loading Bubble mount + fade-in
T=200ms     API call returns first chunk
T=250-500ms Remove Loading Bubble, show Response Bubble entrance
T=300ms     Response text begins typewriter
T=300-3000ms (variable) Typewriter animiert Text
T=3000ms    (example) Typewriter complete
T=3000-3300ms Post-glow pulse animation
T=3000-3500ms Scroll smooth to Input area
T=3100ms    Input receives focus
T=3100-3300ms Input scale-up + glow-border animation
T=3300ms    Ready für next message
```

---

## 3. New Chat Transition

```
┌──────────────────────────────────────┐
│  USER CLICKS "NEW CHAT"              │
│  (startNewChat button in Header)     │
└──────────────────────────────────────┘
            │
            ▼
  ┌─────────────────────┐
  │ Trigger New Chat    │
  │ Exit Animation      │
  └─────────────────────┘
            │
            ▼
  ┌──────────────────────────────┐
  │ ChatView Exit Animation      │
  │ (fade-out + slide-up -20px)  │
  │ Duration: 300ms              │
  │ via AnimatePresence exit     │
  │ key change                   │
  └──────────────────────────────┘
            │
            ├─ Scroll top (optional)
            │  behavior: smooth
            │  duration: 300ms parallel
            │
            ▼ (T=300ms)
  ┌──────────────────────────────┐
  │ Clear State                  │
  │ - messages = []              │
  │ - title = "New Conversation" │
  │ - messageId = null           │
  │ - isAiResponding = false     │
  └──────────────────────────────┘
            │
            ▼ (T=310ms)
  ┌──────────────────────────────┐
  │ WelcomeScreen Enter          │
  │ (fade-in + slide-down +20px) │
  │ Duration: 300ms              │
  │ via AnimatePresence initial  │
  │ key="welcome"                │
  └──────────────────────────────┘
            │
            ├─ Branding fade-in (parallel)
            ├─ Mode-toggle slide-in (stagger +50ms)
            ├─ Input box fade-in (stagger +100ms)
            ├─ Suggestion chips stagger (each +50ms)
            │
            ▼ (T=610ms)
  ┌──────────────────────────────┐
  │ READY FOR NEW CHAT           │
  │ Call-to-Action Pulse ready   │
  │ (will start at T=1410ms)     │
  └──────────────────────────────┘
```

**Timeline:**
```
T=0ms      Click "New Chat"
T=0-5ms    setIsExitingConversation(true)
T=5-300ms  ChatView fade-out + slide-up exit animation
T=100-300ms Scroll window.scrollTo top (parallel)
T=305ms    State reset (messages=[], title=..., etc.)
T=310-310+300ms WelcomeScreen fade-in + slide-down
T=350ms    Branding element fade-in starts
T=400ms    Mode-toggle slide-in
T=450ms    Input box fade-in
T=500-700ms Suggestion chips stagger in (each 50ms)
T=610ms    All animations complete, READY
T=1410ms   Call-to-Action pulse begins (800ms delay from mount)
```

---

## 4. Suggestion Chip Interaction

```
┌───────────────────────────┐
│  SUGGESTION CHIP          │
│  [Erkläre mir LLMs]       │
└───────────────────────────┘
            │
            ├──────────────────────────┐
            │                          │
        (A) HOVER                  (B) CLICK
        ──────────                 ──────────
            │                          │
            ▼                          ▼
    ┌──────────────────┐      ┌─────────────────┐
    │ Scale: 1.0→1.05  │      │ Scale: 1.05→0.98│
    │ Y: 0→-2px        │      │ Y: -2→2px       │
    │ Shadow: subtle   │      │ Duration: 100ms │
    │ BG: muted/40→60  │      │ type: spring    │
    │ Duration: 200ms  │      │ stiffness: 400  │
    │ type: spring     │      │ damping: 17     │
    │ stiffness: 400   │      └────────┬────────┘
    │ damping: 17      │               │
    └────────┬─────────┘               ▼
             │          ┌──────────────────────────┐
             │          │ (async await handler)    │
             │          │ setInputValue(suggestion)│
             │          │ (input box receives      │
             │          │  text autofill)         │
             │          │ Optional: auto-submit    │
             │          │ after 100ms?             │
             │          └──────────┬───────────────┘
             │                     │
             └─────────────────────┴─────┐
                                         │
                                         ▼
                          ┌──────────────────────┐
                          │ INPUT BOX UPDATED    │
                          │ Focus + Glow border  │
                          │ Cursor ready         │
                          │ User can edit/send   │
                          └──────────────────────┘
```

---

## 5. Input Box State Machine

```
┌──────────────────────────────────────────────────────────┐
│                    INPUT BOX STATES                      │
└──────────────────────────────────────────────────────────┘

                    ┌─ IDLE ─┐
                    │ (empty)│
                    └────────┘
                       │    │
                  ┌────┘    └────┐
                  │               │
                  ▼               ▼
            FOCUSED         NOT FOCUSED
            ─────────       ────────────
            - Ring: 2px     - Ring: 0px
            - Glow: pink    - No glow
            - Shadow: 24px  - Shadow: 0
            - Scale: 1.02   - Scale: 1.0
            - Dur: 200ms    - Dur: 200ms
                  │               │
                  └────────┬──────┘
                           │
                ┌──────────▼───────────┐
                │ (user types)         │
                │ isLoading = false    │
                └──────────┬───────────┘
                           │
                    ┌──────▼──────┐
                    │ HAS CONTENT │
                    │ (not empty) │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────────┐
                │                         │
                ▼                         ▼
            FOCUSED             NOT FOCUSED
            ─────────           ────────────
            - Ring: 2px         - Ring: 0px
            - Glow: pink        - No glow
            - Shadow: 24px      - Shadow: 0
            - Height grows      - Height shrinks
            - Send-button       - Send-button
              enabled           disabled
                │                 │
                └────────┬────────┘
                         │
              ┌──────────▼───────────┐
              │ USER CLICKS SEND     │
              │ setIsAiResponding    │
              │ = true              │
              └──────────┬───────────┘
                         │
              ┌──────────▼────────────┐
              │ RESPONDING STATE      │
              │ (gray out, disable)   │
              │ (loading indicator)   │
              │ - Disabled: true      │
              │ - Opacity: 0.6        │
              │ - Cursor: not-allowed │
              │ Duration: ~2-30s      │
              │ (AI response time)    │
              └──────────┬────────────┘
                         │
              ┌──────────▼────────────┐
              │ RESPONSE COMPLETE     │
              │ (auto-focus + glow)   │
              │ - Scale: 1.0→1.05     │
              │ - Glow: animate       │
              │ - Focus: true         │
              │ - Ready for input     │
              │ - Duration: 200ms     │
              └──────────┬────────────┘
                         │
                    ┌────▼────┐
                    │ [LOOP]   │
                    │ Back to  │
                    │ FOCUSED  │
                    └──────────┘
```

---

## 6. Message Bubble Lifecycle

```
┌────────────────────────────────────────────────────┐
│         MESSAGE BUBBLE LIFECYCLE                   │
└────────────────────────────────────────────────────┘

CREATED (via sendMessage)
  │
  ├─ AI Response starts (streaming)
  │
  ▼
┌────────────────────────────────┐
│ MOUNT: Show Loading Bubble      │
│ - id: "loading"                │
│ - 3 bouncing dots animation    │
│ - Puls-halo: opacity fade      │
│ - Duration: until first chunk  │
└────────────┬───────────────────┘
             │ (T = ~100-200ms)
             ▼
┌────────────────────────────────────────────┐
│ MOUNT: Show Response Bubble                │
│ - id: <UUID>                              │
│ - initial: { opacity: 0, y: 16 }          │
│ - animate: { opacity: 1, y: 0 }           │
│ - transition: { duration: 0.4, easeOut }  │
│ - Shows BlinkingCursor                    │
└────────────┬──────────────────────────────┘
             │ (T = 200-300ms)
             ▼
┌────────────────────────────────────────────┐
│ TYPEWRITER ANIMATION ACTIVE                │
│ - shouldAnimate: true                      │
│ - useTypewriter hook running               │
│ - Char-per-char with variable speed       │
│ - Can skip: click anywhere                │
│ - BlinkingCursor visible during typing    │
└────────────┬──────────────────────────────┘
             │ (T = 300ms to 3000ms+, variable)
             ▼
┌────────────────────────────────────────────┐
│ TYPEWRITER COMPLETE                        │
│ - displayedText: full text                 │
│ - isTyping: false                          │
│ - isComplete: true                         │
│ - onTypewriterComplete callback fired     │
└────────────┬──────────────────────────────┘
             │ (T = 3000ms+)
             ▼
┌────────────────────────────────────────────┐
│ POST-GLOW ANIMATION (OPTIONAL)             │
│ - animate: boxShadow puls                  │
│ - [0px, 24px, 8px] progression            │
│ - times: [0, 0.5, 1]                      │
│ - duration: 1.5s                          │
│ - ease: easeInOut                         │
└────────────┬──────────────────────────────┘
             │ (T = 3000-4500ms)
             ▼
┌────────────────────────────────────────────┐
│ READY / DISPLAY STATE                      │
│ - Message rendered in full                 │
│ - Copy button available                    │
│ - TTS button available (if enabled)        │
│ - Regenerate button available (if last)    │
│ - No further animations                    │
└────────────────────────────────────────────┘
             │
             ├─ User scrolls up → older messages visible
             ├─ User sends new message → stays in view
             ├─ User regenerates → back to TYPEWRITER
             └─ User clears chat → cleanup
```

---

## 7. Performance Impact Summary

```
╔════════════════════════════════════════════════════════╗
║            ANIMATION PERFORMANCE MATRIX                ║
╠═════════════════════════════════╦════════════╦═════════╣
║ Animation                       ║ GPU-Accel  ║ Risk    ║
╠═════════════════════════════════╬════════════╬═════════╣
║ Suggestion Chips Scale + Y      ║ ✅ YES     ║ 🟢 LOW  ║
║ Input Glow (boxShadow)          ║ ✅ YES*    ║ 🟡 MED  ║
║ Fade-in (opacity)               ║ ✅ YES     ║ 🟢 LOW  ║
║ Slide-up (translateY)           ║ ✅ YES     ║ 🟢 LOW  ║
║ Bounce (keyframes Y)            ║ ✅ YES     ║ 🟢 LOW  ║
║ Typewriter (char-by-char)       ║ ⚠️ PARTIAL ║ 🟡 MED  ║
║ Puls-Glow (boxShadow multi)     ║ ✅ YES*    ║ 🟡 MED  ║
║ Stagger (many children)         ║ ✅ YES     ║ 🟡 MED  ║
║ Confetti (many particles)       ║ ⚠️ PARTIAL ║ 🔴 HIGH ║
╚═════════════════════════════════╩════════════╩═════════╝

* boxShadow: Hardware-accelerated aber nicht filter-optimiert
  → Limit zu max 2-3 boxShadow simultaneous animations

✅ GPU-accelerated: transform, opacity, filter, will-change
⚠️ Partial: boxShadow (GPU aber expensive), Einzelne DOM-Updates
❌ CPU: width, height, max-height, backgroundColor (zu viele layout reflows)

EMPFEHLUNG:
- Nutze willChange: 'opacity, transform' für animated Elemente
- Maximal 3-5 gleichzeitige Animationen pro Screen
- Typewriter: Limit auf <2000 Zeichen, sonst sentence-based
- Confetti: Optional, max bei speziellen Meilensteinen
```

---

## 8. User Journey mit Animationen

```
┌────────────────┐
│ Page Load      │
│ messages = []  │
└────────┬───────┘
         │
         ├─────────────────── 0-500ms ───────────────────┐
         │                                               │
         ▼                                               │
    WelcomeScreen                                        │
    - Branding zoom-in fade-in                          │
    - Mode-toggle smooth transition                     │
    - Input box glow border                             │
         │                                               │
         ├─ Call-to-Action Puls (nach 800ms)            │
         │  [Psychologisch: "Klick mich!"]               │
         │                                               │
         ▼ (User hoverts über Suggestion)                │
    Suggestion Chip                                      │
    - scale 1.05, y -2px                                │
    - User SIEHT dass es interaktiv ist                 │
         │                                               │
         ▼ (User clicks)                                  │
    Suggestion fills Input                               │
    - Input gets focus + glow                           │
    - User kann edit oder direkt senden                 │
         │                                               │
         ▼ (User clicks "Los geht's")                    │
    ┌─────────────────────────────────────────────────┐ │
    │ SEND MESSAGE                                    │ │
    │                                                │ │
    │ Scroll zu User Message (smooth) ──┬────────────┼─┤ <= 500ms
    │ Loading Bubble mit Puls-Halo       │            │ │
    │                                    │            │ │
    │ [AI is thinking...]               │            │ │
    │ ~ooo (spinning)                   │            │ │
    └────────────────────┬───────────────┼────────────┘ │
         │                │              │              │
         │ 200-1000ms     │ 300ms        │              │
         ▼                ▼              ▼              │
    Remove Loading    Response Bubble  Scroll smooth   │
    Show Response     Entrance                         │
    with Typewriter   (fade+slide)                     │
         │                                              │
         ├──────── Typewriter animiert (5-30s) ─────────┼─┐
         │                                              │ │
         ▼                                              │ │
    Text tippt sich ein                                 │ │
    Charakter für Charakter                            │ │
    [User liest mit]                                   │ │
         │                                              │ │
         ├─── Nach ~3000ms (Typewriter done) ───────────┼─┤ <= 4.5s post-response
         │                                              │ │
         ▼                                              │ │
    Post-Glow Animation                                │ │
    boxShadow puls (subtil)                            │ │
    [Psychologisch: "Fertig!"]                          │ │
         │                                              │ │
         ├─ Scroll zu Input (smooth)                   │ │
         ├─ Input auto-focus + glow                    │ │
         │                                              │ │
         ▼                                              │ │
    READY FOR NEXT MESSAGE                             │ │
    Input blinking cursor sichtbar                     │ │
    User kann tippen                                   │ │
         │                                              │ │
         └──────────────────── [LOOP] ─────────────────┘ │
                                                        │
         [Am Ende jeden Turns: User fühlt sich         │
          "belohnt" durch subtile visuellen Effekte]  └──
```

---

Diese Diagramme sollten dir als Referenz beim Implementieren helfen! 🚀

