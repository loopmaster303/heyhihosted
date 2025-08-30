
"use client";
import NewAppHeader from '@/components/page/NewAppHeader';
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

export default function AboutPage() {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
        <main className="flex flex-col flex-grow pt-16 items-center justify-center p-4 text-center">
            <h2 className="text-3xl font-code text-white">about/hey.hi/readme</h2>
            <p className="text-gray-400 mt-4 max-w-md">
              This section is under construction. Come back soon to learn more about the project!
            </p>
        </main>
    </div>
  );
}
