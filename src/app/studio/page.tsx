"use client";

import React, { Suspense } from 'react';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useImageHistory } from '@/hooks/useImageHistory';

function StudioContent() {
    const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');
    const { imageHistory } = useImageHistory();

    return (
        <AppLayout
            appState="studio"
            currentPath="/studio"
            // Minimal props - no ChatProvider needed
            onNewChat={() => window.location.href = '/'}
            allConversations={imageHistory.map(img => ({
                id: img.id,
                toolType: 'visualize',
                lastUpdated: img.timestamp,
                title: img.prompt?.slice(0, 30) || 'Image',
            }))}
        >
            <UnifiedImageTool password={replicateToolPassword} />
        </AppLayout>
    );
}

export default function StudioPage() {
    return (
        <ErrorBoundary
            fallbackTitle="Studio konnte nicht geladen werden"
            fallbackMessage="Es gab ein Problem beim Laden. Bitte versuche es erneut."
        >
            <Suspense fallback={<PageLoader text="Visualize Pro Studio wird geladen..." />}>
                <StudioContent />
            </Suspense>
        </ErrorBoundary>
    );
}
