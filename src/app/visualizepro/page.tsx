"use client";

import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';

export default function VisualizeProPage() {
  const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
  
  return (
    <ErrorBoundary
      fallbackTitle="Bildgenerierung konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der Bildgenerierung. Bitte versuche es erneut."
    >
      <AppLayout>
        <div className="flex flex-col h-full bg-background text-foreground">
          <UnifiedImageTool password={replicateToolPassword} />
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}
