"use client";

import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
    onNewChat?: () => void;
    onToggleSidebar?: () => void;
    onEscape?: () => void;
    enabled?: boolean;
}

export function useKeyboardShortcuts({
    onNewChat,
    onToggleSidebar,
    onEscape,
    enabled = true,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Exception: Escape should still work
            if (event.key !== 'Escape') return;
        }

        const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
        const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

        // Cmd/Ctrl + K = New Chat
        if (cmdOrCtrl && event.key === 'k') {
            event.preventDefault();
            onNewChat?.();
            return;
        }

        // Cmd/Ctrl + / = Toggle Sidebar
        if (cmdOrCtrl && event.key === '/') {
            event.preventDefault();
            onToggleSidebar?.();
            return;
        }

        // Escape = Close panels
        if (event.key === 'Escape') {
            onEscape?.();
            return;
        }
    }, [enabled, onNewChat, onToggleSidebar, onEscape]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
