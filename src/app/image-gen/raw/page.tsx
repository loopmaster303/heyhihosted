
"use client";
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const params = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const current = params.get('g');
    if (current && /^g_[a-z0-9]{8,}$/i.test(current)) {
      setSlug(current);
      return;
    }
    // generate a new unguessable slug and add to URL once
    const rand = Array.from(crypto.getRandomValues(new Uint32Array(4)))
      .map(n => n.toString(36))
      .join('')
      .slice(0, 16);
    const newSlug = `g_${rand}`;
    setSlug(newSlug);
    const q = new URLSearchParams(params as any);
    q.set('g', newSlug);
    router.replace(`/image-gen/raw?${q.toString()}`);
  }, [params, router]);
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
        <main className="flex flex-col flex-grow pt-16">
            <ReplicateImageTool password={replicateToolPassword} gallerySlug={slug || undefined} />
        </main>
    </div>
  );
}
