
"use client";
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

export default function RawImageGenPage() {
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'john');
  const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
        <main className="flex flex-col flex-grow pt-16">
            <ReplicateImageTool password={replicateToolPassword} />
        </main>
    </div>
  );
}
