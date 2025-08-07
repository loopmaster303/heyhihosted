
"use client";
import ReasoningTool from '@/components/tools/ReasoningTool';
import AppHeader from '@/components/page/AppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'code reasoning', title: '</code.reasoning>', href: '/reasoning' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

export default function ReasoningPage() {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName} />
        <main className="flex flex-col flex-grow pt-16">
            <ReasoningTool />
        </main>
    </div>
  );
}
