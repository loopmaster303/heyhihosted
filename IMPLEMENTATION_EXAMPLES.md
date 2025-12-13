# Landing Page Redesign - Implementation Examples

## Phase 1: Grundlegende Struktur

### 1.1 Optimierter Typewriter-Effekt

```typescript
// src/hooks/useTypewriterEffect.ts
import { useState, useEffect, useCallback } from 'react';

export const useTypewriterEffect = (text: string, onComplete?: () => void) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const startTyping = useCallback(() => {
    if (hasInteracted) return;
    setIsTyping(true);
    setIsComplete(false);
    setTypedText('');
  }, [hasInteracted]);

  const handleInteraction = useCallback(() => {
    setHasInteracted(true);
    setIsTyping(false);
    setTypedText('');
  }, []);

  useEffect(() => {
    if (!isTyping || hasInteracted) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setTypedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isTyping, text, hasInteracted, onComplete]);

  return {
    typedText,
    isTyping,
    isComplete,
    hasInteracted,
    startTyping,
    handleInteraction
  };
};
```

### 1.2 Vereinfachte Landing Page Komponente

```typescript
// src/app/entry-draft/page.tsx (vereinfachte Version)
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider } from '@/components/ChatProvider';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useChat } from '@/components/ChatProvider';
import { useTypewriterEffect } from '@/hooks/useTypewriterEffect';
import PageLoader from '@/components/ui/PageLoader';

const quickPrompts = {
  chat: {
    de: [
      'Erzähl mir von deinem Tag',
      'Was beschäftigt dich gerade?',
      'Hilf mir bei einem Problem'
    ],
    en: [
      'Tell me about your day',
      'What\'s on your mind?',
      'Help me with a problem'
    ]
  },
  visualize: {
    de: [
      'Sonnenuntergang am Strand',
      'Modernes Büro im Cyberpunk-Stil',
      'Abstraktes Kunstwerk mit leuchtenden Farben'
    ],
    en: [
      'Sunset at the beach',
      'Modern cyberpunk office',
      'Abstract art with vibrant colors'
    ]
  }
};

function EntryDraftPageContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const chat = useChat();
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const isGerman = language === 'de';
  const [mode, setMode] = useState<'chat' | 'visualize'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);

  const targetLine = `(!hey.hi = '${(userDisplayName || 'user').trim() || 'user'}')`;
  const { typedText, isTyping, isComplete, handleInteraction } = useTypewriterEffect(
    targetLine,
    () => setShowPromptInput(true)
  );

  useEffect(() => {
    setIsClient(true);
    // Start typewriter effect after a short delay
    const timer = setTimeout(() => {
      // Auto-start would be handled by the hook
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleModeSelect = (selectedMode: 'chat' | 'visualize') => {
    handleInteraction();
    setMode(selectedMode);
    setShowPromptInput(true);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    
    try {
      localStorage.setItem('sidebar-preload-prompt', prompt.trim());
      localStorage.setItem('sidebar-preload-target', mode);
    } catch { }
    
    const event = new CustomEvent('sidebar-reuse-prompt', { detail: prompt.trim() });
    window.dispatchEvent(event);
    router.push(mode === 'chat' ? '/chat' : '/visualizepro');
  };

  const prompts = quickPrompts[mode][isGerman ? 'de' : 'en'];

  if (!isClient) {
    return <PageLoader text="Lade Startseite..." />;
  }

  return (
    <AppLayout
      onNewChat={chat.startNewChat}
      onToggleHistoryPanel={chat.toggleHistoryPanel}
      onToggleGalleryPanel={chat.toggleGalleryPanel}
      currentPath="/"
      chatHistory={chat.allConversations.filter(c => c.toolType === 'long language loops')}
      onSelectChat={chat.selectChat}
      onRequestEditTitle={chat.requestEditTitle}
      onDeleteChat={chat.deleteChat}
      isHistoryPanelOpen={chat.isHistoryPanelOpen}
      isGalleryPanelOpen={chat.isGalleryPanelOpen}
      allConversations={chat.allConversations}
      activeConversation={chat.activeConversation}
    >
      <div className="relative flex flex-col items-center justify-center h-full px-4 py-10 overflow-hidden">
        {/* Typewriter overlay - only shown when typing */}
        {isTyping && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="font-code text-4xl sm:text-5xl md:text-6xl font-bold text-foreground drop-shadow-[0_0_16px_rgba(255,105,180,0.55)]">
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
                {typedText}
              </span>
              <span className="animate-pulse text-foreground">|</span>
            </div>
          </div>
        )}

        {/* Main content - shown after typing or when interacted */}
        {!isTyping && (
          <>
            {/* Header with branding */}
            <div className="mb-10 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center text-foreground drop-shadow-[0_0_20px_rgba(255,105,180,0.65)]">
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
                {isComplete ? targetLine : 'hey.hi'}
              </span>
            </div>

            {/* Primary action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                variant={mode === 'chat' ? 'default' : 'outline'}
                onClick={() => handleModeSelect('chat')}
                className="px-8 py-3 text-lg"
              >
                {isGerman ? 'Gespräch beginnen' : 'Start Chat'}
              </Button>
              <Button
                size="lg"
                variant={mode === 'visualize' ? 'default' : 'outline'}
                onClick={() => handleModeSelect('visualize')}
                className="px-8 py-3 text-lg"
              >
                {isGerman ? 'Bild erstellen' : 'Create Image'}
              </Button>
            </div>

            {/* Prompt input section - shown after mode selection */}
            {showPromptInput && (
              <div className="w-full max-w-2xl bg-card/60 border border-border rounded-3xl shadow-2xl p-6 space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'chat'
                      ? isGerman
                        ? 'Worüber möchtest du sprechen?'
                        : 'What do you want to talk about?'
                      : isGerman
                        ? 'Beschreibe, was du sehen willst...'
                        : 'Describe what you want to see...'
                  }
                  className="min-h-[140px] bg-background/80"
                />

                {/* Quick prompts */}
                <div className="flex flex-wrap gap-2">
                  {prompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setPrompt(promptText)}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button disabled={!prompt.trim()} onClick={handleSubmit}>
                    {isGerman ? 'Los geht\'s' : "Let's go"}
                  </Button>
                </div>
              </div>
            )}

            {/* Secondary navigation */}
            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={() => router.push('/chat')}>
                {isGerman ? 'Verlauf' : 'History'}
              </Button>
              <Button variant="ghost" onClick={() => router.push('/settings')}>
                {isGerman ? 'Einstellungen' : 'Settings'}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function EntryDraftPage() {
  return (
    <ChatProvider>
      <EntryDraftPageContent />
    </ChatProvider>
  );
}
```

## Phase 2: Performance-Optimierung

### 2.1 Memoized Components

```typescript
// src/components/optimized/ModeButton.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModeButtonProps {
  mode: 'chat' | 'visualize';
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ModeButton = React.memo<ModeButtonProps>(({ mode, active, onClick, children }) => {
  return (
    <Button
      size="lg"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className={cn(
        "px-8 py-3 text-lg transition-all duration-200",
        active && "shadow-lg transform scale-105"
      )}
    >
      {children}
    </Button>
  );
});

ModeButton.displayName = 'ModeButton';
export default ModeButton;
```

### 2.2 Optimized Prompt Suggestions

```typescript
// src/hooks/usePromptSuggestions.ts
import { useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export const usePromptSuggestions = (mode: 'chat' | 'visualize') => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  return useMemo(() => {
    const suggestions = {
      chat: {
        de: [
          'Erzähl mir von deinem Tag',
          'Was beschäftigt dich gerade?',
          'Hilf mir bei einem Problem'
        ],
        en: [
          'Tell me about your day',
          'What\'s on your mind?',
          'Help me with a problem'
        ]
      },
      visualize: {
        de: [
          'Sonnenuntergang am Strand',
          'Modernes Büro im Cyberpunk-Stil',
          'Abstraktes Kunstwerk mit leuchtenden Farben'
        ],
        en: [
          'Sunset at the beach',
          'Modern cyberpunk office',
          'Abstract art with vibrant colors'
        ]
      }
    };

    return suggestions[mode][isGerman ? 'de' : 'en'];
  }, [mode, isGerman]);
};
```

## Phase 3: Barrierefreiheit und Responsive Design

### 3.1 Accessible Navigation

```typescript
// src/components/accessible/AccessibleNavigation.tsx
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface AccessibleNavigationProps {
  onNavigate: (path: string) => void;
}

const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isGerman = language === 'de';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            onNavigate('/chat');
            break;
          case 'v':
            e.preventDefault();
            onNavigate('/visualizepro');
            break;
          case 'h':
            e.preventDefault();
            onNavigate('/chat'); // History is part of chat
            break;
          case 's':
            e.preventDefault();
            onNavigate('/settings');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <nav
      className="flex flex-col sm:flex-row gap-4 mb-8"
      role="navigation"
      aria-label={isGerman ? 'Hauptnavigation' : 'Main navigation'}
    >
      <Button
        size="lg"
        variant="outline"
        onClick={() => onNavigate('/chat')}
        className="px-8 py-3 text-lg"
        aria-keyshortcuts="Ctrl+K"
      >
        {isGerman ? 'Gespräch beginnen' : 'Start Chat'}
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={() => onNavigate('/visualizepro')}
        className="px-8 py-3 text-lg"
        aria-keyshortcuts="Ctrl+V"
      >
        {isGerman ? 'Bild erstellen' : 'Create Image'}
      </Button>
    </nav>
  );
};

export default AccessibleNavigation;
```

### 3.2 Responsive Layout

```typescript
// src/hooks/useResponsiveLayout.ts
import { useState, useEffect } from 'react';

export const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return { isMobile, isTablet, isDesktop };
};
```

## Phase 4: Analytics und Testing

### 4.1 Analytics Integration

```typescript
// src/lib/analytics.ts
export const trackLandingPageInteraction = (action: string, context?: string) => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'landing_page_interaction', {
      action,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Custom analytics
  if (typeof window !== 'undefined') {
    const eventData = {
      event: 'landing_page_interaction',
      action,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to custom endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    }).catch(err => console.error('Analytics error:', err));
  }
};
```

### 4.2 Feature Flag System

```typescript
// src/hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';

export const useFeatureFlag = (flagName: string) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        // Check localStorage first
        const storedFlag = localStorage.getItem(`feature_${flagName}`);
        if (storedFlag !== null) {
          setIsEnabled(storedFlag === 'true');
          setIsLoading(false);
          return;
        }

        // Fetch from API if not in localStorage
        const response = await fetch(`/api/feature-flags/${flagName}`);
        const data = await response.json();
        
        setIsEnabled(data.enabled);
        localStorage.setItem(`feature_${flagName}`, data.enabled.toString());
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureFlag();
  }, [flagName]);

  return { isEnabled, isLoading };
};
```

Diese Implementierungsbeispiele zeigen, wie die Landing Page schrittweise verbessert werden kann, mit Fokus auf Benutzererfahrung, Performance und Barrierefreiheit.