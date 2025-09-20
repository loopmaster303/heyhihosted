
"use client";
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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
  
  // Warte bis das Theme geladen ist, um Hydration-Fehler zu vermeiden
  if (!isClient) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black">
        <div className="w-8 h-8 animate-spin text-white">Loading...</div>
      </div>
    );
  }
  
  const isDark = theme === 'dark';
  
  return (
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
  );
}
