
"use client";
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import ErrorBoundary from '@/components/ErrorBoundary';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

export default function NoCostImageGenPage() {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  return (
    <ErrorBoundary
      fallbackTitle="Bildgenerierung konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der Bildgenerierung. Bitte versuche es erneut."
    >
      <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
          <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
          <main className="flex flex-col flex-grow pt-16">
              <VisualizingLoopsTool />
          </main>
      </div>
    </ErrorBoundary>
  );
}
