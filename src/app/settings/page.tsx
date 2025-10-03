
"use client";
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

export default function SettingsPage() {
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Warte bis das Theme geladen ist, üm Hydration-Fehler zu vermeiden
  if (!isClient) {
    return <PageLoader text="Einstellungen werden geladen..." />;
  }
  
  const isDark = theme === 'dark';
  
  return (
    <ErrorBoundary
      fallbackTitle="Einstellungen konnten nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der Einstellungen. Bitte versuche es erneut."
    >
      <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
          <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
          <main className="flex flex-col flex-grow pt-16">
              <PersonalizationTool
                  userDisplayName={userDisplayName}
                  setUserDisplayName={setUserDisplayName}
                  customSystemPrompt={customSystemPrompt}
                  setCustomSystemPrompt={setCustomSystemPrompt}
                  replicateToolPassword={replicateToolPassword}
                  setReplicateToolPassword={setReplicateToolPassword}
              />
          </main>
      </div>
    </ErrorBoundary>
  );
}
