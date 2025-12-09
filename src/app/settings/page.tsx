
"use client";
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import { DEFAULT_POLLINATIONS_MODEL_ID, AVAILABLE_TTS_VOICES, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';

export default function SettingsPage() {
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
  const [selectedModelId, setSelectedModelId] = useLocalStorageState<string>('selectedModelId', DEFAULT_POLLINATIONS_MODEL_ID);
  const [selectedVoice, setSelectedVoice] = useLocalStorageState<string>('selectedVoice', AVAILABLE_TTS_VOICES[0].id);
  const [selectedImageModelId, setSelectedImageModelId] = useLocalStorageState<string>('selectedImageModelId', DEFAULT_IMAGE_MODEL);
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
      <AppLayout>
        <main className="flex flex-col flex-grow p-4">
          <PersonalizationTool
            userDisplayName={userDisplayName}
            setUserDisplayName={setUserDisplayName}
            customSystemPrompt={customSystemPrompt}
            setCustomSystemPrompt={setCustomSystemPrompt}
            replicateToolPassword={replicateToolPassword}
            setReplicateToolPassword={setReplicateToolPassword}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            selectedImageModelId={selectedImageModelId}
            onImageModelChange={setSelectedImageModelId}
          />
        </main>
      </AppLayout>
    </ErrorBoundary>
  );
}
