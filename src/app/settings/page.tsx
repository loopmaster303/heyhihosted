
"use client";
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import AppHeader from '@/components/page/AppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
    { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
    { id: 'personalization', title: 'settings/personalization', href: '/settings' },
    { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function SettingsPage() {
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
  
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName} />
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
