
import AppHeader from '@/components/page/AppHeader';
import type { TileItem } from '@/types';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
    { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
    { id: 'personalization', title: 'settings/personalization', href: '/settings' },
    { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function AboutPage() {
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppHeader toolTileItems={toolTileItems} />
        <main className="flex flex-col flex-grow pt-16 items-center justify-center p-4 text-center">
            <h2 className="text-3xl font-code text-foreground">about/hey.hi/readme</h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              This section is under construction. Come back soon to learn more about the project!
            </p>
        </main>
    </div>
  );
}
