# 🎬 Animation Quick-Start Guide

Kurzanleitung zum schnellen Umsetzen der Animations-Empfehlungen.

## TL;DR - Los geht's in 5 Minuten

### Was du brauchst:
- ✅ framer-motion (v11.18.2 – bereits installiert!)
- ✅ Tailwind CSS (already konfiguriert)
- ✅ 30 Minuten für Phase 1.1 + 1.2

### Phase 1.1: Suggestion Chips lebhaft machen

**File:** `src/components/chat/WelcomeScreen.tsx`, Zeile 124-138

**Vorher:**
```tsx
<button
  className="bg-muted/40 hover:bg-muted/70 text-xs md:text-sm px-3 py-1.5 rounded-lg text-muted-foreground transition-colors text-left"
>
  {s}
</button>
```

**Nachher:**
```tsx
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  onClick={() => setInputValue(s)}
  className="bg-muted/40 hover:bg-muted/60 text-xs md:text-sm px-3 py-1.5 rounded-lg text-muted-foreground transition-colors text-left group"
>
  {s}
  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-pink-500/20" />
</motion.button>
```

**Impact:** ⭐⭐⭐⭐⭐ Instantly lebhafter

---

### Phase 1.2: Input-Feld Glow auf Focus

**File:** `src/components/chat/ChatInput.tsx`

**Vorher:**
```tsx
<Textarea
  className="border-none shadow-none focus-visible:ring-0"
/>
```

**Nachher:**
```tsx
import { motion } from 'framer-motion';

const [isFocused, setIsFocused] = useState(false);

<motion.div
  animate={{
    boxShadow: isFocused
      ? '0 0 24px rgba(236,72,153,0.3)'
      : '0 0 0px rgba(236,72,153,0)',
  }}
  transition={{ duration: 0.2 }}
  className="relative"
>
  <Textarea
    onFocus={() => setIsFocused(true)}
    onBlur={() => setIsFocused(false)}
    className="border border-pink-500/20 focus:border-pink-500/50 transition-colors"
  />
</motion.div>
```

**Impact:** ⭐⭐⭐⭐ Input fühlt sich „einladend" an

---

### Phase 2.1: Chat ↔ Welcome Transition

**File:** `src/components/page/ChatInterface.tsx`

**Vorher:**
```tsx
{shouldShowWelcome ? (
  <WelcomeScreen ... />
) : (
  <ChatView ... />
)}
```

**Nachher:**
```tsx
import { AnimatePresence, motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

<AnimatePresence mode="wait">
  {shouldShowWelcome ? (
    <motion.div
      key="welcome"
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <WelcomeScreen ... />
    </motion.div>
  ) : (
    <motion.div
      key="chat"
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <ChatView ... />
    </motion.div>
  )}
</AnimatePresence>
```

**Impact:** ⭐⭐⭐⭐⭐ Wechsel wirkt „intentional" statt „ruckartig"

---

## Code-Patterns für Copy-Paste

### Pattern 1: Hover Scale + Shadow
```tsx
<motion.button
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  {content}
</motion.button>
```

### Pattern 2: Glow-Effekt
```tsx
<motion.div
  animate={{
    boxShadow: isActive
      ? '0 0 24px rgba(236,72,153,0.4)'
      : '0 0 0px rgba(236,72,153,0)',
  }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### Pattern 3: Fade-In + Slide-Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  {content}
</motion.div>
```

### Pattern 4: Staggered Children
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      }
    }
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Pattern 5: Pulse-Glow (Post-Response)
```tsx
<motion.div
  animate={{
    boxShadow: [
      '0 0 0px rgba(236,72,153,0)',
      '0 0 24px rgba(236,72,153,0.4)',
      '0 0 8px rgba(236,72,153,0.1)',
    ]
  }}
  transition={{
    duration: 1.5,
    times: [0, 0.5, 1],
    ease: 'easeInOut',
  }}
>
  {content}
</motion.div>
```

---

## Import-Statements

Für Framer-Motion:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

Das war's – keine weiteren Dependencies!

---

## Testing der Animationen

```bash
# Dev-Server starten
npm run dev

# Gehe zu http://localhost:3000/chat
# Teste:
# 1. Hover über Suggestion Chips → Scale-Effekt?
# 2. Focus auf Input → Glow-Shadow sichtbar?
# 3. Schreib erste Message → Animation smooth?
# 4. Klick "New Chat" → Fade-Transition sichtbar?
```

---

## Performance-Tipps

### DO ✅
```tsx
// GPU-accelerated properties
<motion.div animate={{ opacity: 1, x: 100 }} />
<motion.div animate={{ scale: 1.1 }} />
<motion.div animate={{ rotate: 90 }} />
```

### DON'T ❌
```tsx
// CPU-intensive properties
<motion.div animate={{ width: '100%' }} />
<motion.div animate={{ height: 300 }} />
<motion.div animate={{ backgroundColor: 'red' }} />
```

### Best Practice:
```tsx
<motion.div
  animate={{ opacity: 1, scale: 1 }}
  style={{ willChange: 'opacity, scale' }}
>
  {content}
</motion.div>
```

---

## Accessibility Note

```tsx
// Respektiere prefers-reduced-motion für Accessibility
import { useReducedMotion } from 'framer-motion';

const PulseButton = () => {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.button
      animate={{ scale: shouldReduceMotion ? 1 : 1.05 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      Click me
    </motion.button>
  );
};
```

---

## FAQ

**F: Soll ich alle animationen machen?**
A: Nein! Phase 1 + 2 = 80% Impact mit 30% effort. Phase 3 ist optional.

**F: Brauche ich CSS-Custom-Properties?**
A: Nein, framer-motion handhabt das. Nur Tailwind verwenden.

**F: Wird das laggy?**
A: Nein, wenn du transform/opacity/scale verwendest (GPU-accelerated). Teste mit DevTools.

**F: Können User Animationen deaktivieren?**
A: Ja! `useReducedMotion()` von framer-motion respektiert das automatisch.

---

## Nächste Schritte

1. ✅ Phase 1.1: Suggestion Chips (30 min)
2. ✅ Phase 1.2: Input Glow (30 min)
3. ✅ Phase 2.1: AnimatePresence (1-2h)
4. 📋 Phase 2.2-3: Nach Bedarf

Viel Erfolg! 🚀
