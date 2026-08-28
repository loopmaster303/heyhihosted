import { useState, useRef, useEffect, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_POLLINATIONS_MODEL_ID } from '@/config/chat-options';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useVisiblePollinationsTextModels } from './useVisiblePollinationsTextModels';

export type ToolMode = 'standard' | 'visualize' | 'compose' | 'research' | 'code';

/**
 * Jede aufklappbare Konfiguration der Leiste benutzt dasselbe Feld ueber der
 * Textzeile. Genau ein Panel ist offen — deshalb ein Wert, keine Flags.
 */
export type BadgeRow = 'upload' | 'mode' | 'model' | 'params';

export interface UseChatInputLogicProps {
    onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
    isLoading: boolean;
    uploadedFilePreviewUrl: string | null;
    onFileSelect: (file: File | null, fileType: string | null) => void;
    isLongLanguageLoopActive: boolean;
    inputValue: string;
    onInputChange: (value: string | ((prev: string) => string)) => void;
    isImageMode: boolean;
    onToggleImageMode: (forcedState?: boolean) => void;
    isCodeMode?: boolean;
    onToggleCodeMode?: (forcedState?: boolean) => void;
    isComposeMode?: boolean;
    onToggleComposeMode?: (forcedState?: boolean) => void;
    selectedModelId: string;
    handleModelChange: (modelId: string) => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: (forcedState?: boolean) => void;
    isRecording: boolean;
    visualizeToolState?: UnifiedImageToolState;
}

export function useChatInputLogic({
    onSendMessage,
    isLoading,
    uploadedFilePreviewUrl,
    onFileSelect,
    isLongLanguageLoopActive,
    inputValue,
    onInputChange,
    isImageMode,
    onToggleImageMode,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    selectedModelId,
    handleModelChange,
    isRecording,
    isCodeMode = false,
    onToggleCodeMode,
    isComposeMode = false,
    onToggleComposeMode,
    visualizeToolState,
}: UseChatInputLogicProps) {
    const isMobile = useMediaQuery('(max-width: 639px)');
    const [activeBadgeRow, setActiveBadgeRow] = useState<BadgeRow | null>(null);
    const badgePanelRef = useRef<HTMLDivElement>(null);
    const badgeActionsRef = useRef<HTMLDivElement>(null);
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const modeButtonRef = useRef<HTMLButtonElement>(null);
    const modelButtonRef = useRef<HTMLButtonElement>(null);
    const paramsButtonRef = useRef<HTMLButtonElement>(null);
    const lastOpenedRowRef = useRef<BadgeRow | null>(null);
	
    // Refs for hidden inputs
    const docInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [defaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);
    const { isKnownModelId } = useVisiblePollinationsTextModels();

    // Escape closes the open panel and returns focus to its toggle button
    useEffect(() => {
        if (!activeBadgeRow) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setActiveBadgeRow(null);
            const toggleRefs = {
                upload: uploadButtonRef,
                mode: modeButtonRef,
                model: modelButtonRef,
                params: paramsButtonRef,
            } as const;
            toggleRefs[lastOpenedRowRef.current ?? activeBadgeRow]?.current?.focus();
            lastOpenedRowRef.current = null;
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeBadgeRow]);

    const wasCodeMode = useRef(isCodeMode);

    // Restore default model when exiting code mode
    useEffect(() => {
        if (wasCodeMode.current && !isCodeMode) {
            const safeDefault =
                (defaultTextModelId && isKnownModelId(defaultTextModelId))
                    ? defaultTextModelId
                    : DEFAULT_POLLINATIONS_MODEL_ID;
            handleModelChange(safeDefault);
        }
        wasCodeMode.current = isCodeMode;
    }, [isCodeMode, defaultTextModelId, handleModelChange, isKnownModelId]);

    useOnClickOutside([badgePanelRef, badgeActionsRef], () => {
        if (activeBadgeRow) {
            setActiveBadgeRow(null);
            lastOpenedRowRef.current = null;
        }
    });

    const toggleBadgeRow = useCallback((row: BadgeRow) => {
        setActiveBadgeRow(current => {
            if (current !== row) lastOpenedRowRef.current = row;
            return current === row ? null : row;
        });
    }, []);

    const setActiveMode = useCallback((mode: ToolMode) => {
        const shouldEnableImage = mode === 'visualize';
        const shouldEnableCompose = mode === 'compose';
        const shouldEnableWeb = mode === 'research';
        const shouldEnableCode = mode === 'code';

        if (isImageMode !== shouldEnableImage) {
            onToggleImageMode(shouldEnableImage);
        }
        if (onToggleComposeMode && isComposeMode !== shouldEnableCompose) {
            onToggleComposeMode(shouldEnableCompose);
        }
        if (webBrowsingEnabled !== shouldEnableWeb) {
            onToggleWebBrowsing(shouldEnableWeb);
        }
        if (onToggleCodeMode && isCodeMode !== shouldEnableCode) {
            onToggleCodeMode(shouldEnableCode);
        }
        setActiveBadgeRow(null);
    }, [isImageMode, isComposeMode, webBrowsingEnabled, isCodeMode, onToggleImageMode, onToggleComposeMode, onToggleWebBrowsing, onToggleCodeMode]);

    const handleSelectMode = useCallback((mode: ToolMode) => {
        if (mode === 'visualize' && isImageMode) {
            setActiveMode('standard');
            return;
        }
        if (mode === 'compose' && isComposeMode) {
            setActiveMode('standard');
            return;
        }
        if (mode === 'research' && webBrowsingEnabled) {
            setActiveMode('standard');
            return;
        }
        if (mode === 'code' && isCodeMode) {
            setActiveMode('standard');
            return;
        }
        if (mode === 'standard') {
            setActiveMode('standard');
            return;
        }
        setActiveMode(mode);
    }, [isImageMode, isComposeMode, webBrowsingEnabled, isCodeMode, setActiveMode]);

    const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (isLoading || isRecording) return;
        const canSendMessage = (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || (inputValue.trim() !== '');
        if (canSendMessage) {
            onSendMessage(inputValue.trim(), { isImageModeIntent: isImageMode });
            onInputChange('');
            setActiveBadgeRow(null);
        }
    }, [isLoading, isRecording, isLongLanguageLoopActive, uploadedFilePreviewUrl, inputValue, onSendMessage, isImageMode, onInputChange]);

    // Sync prompt with visualizeToolState when in image mode
    useEffect(() => {
        if (!isImageMode || !visualizeToolState) return;
        if (visualizeToolState.prompt !== inputValue) {
            onInputChange(visualizeToolState.prompt);
        }
    }, [visualizeToolState, isImageMode, inputValue, onInputChange]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'image') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // In image mode with reference support, use visualize tool's handler
        if (fileType === 'image' && isImageMode && visualizeToolState?.supportsReference) {
            visualizeToolState.handleFileChange(event);
            if (event.currentTarget) {
                event.currentTarget.value = "";
            }
            setActiveBadgeRow(null);
            return;
        }

        onFileSelect(file, fileType);
        if (event.currentTarget) {
            event.currentTarget.value = "";
        }
        setActiveBadgeRow(null);
    }, [onFileSelect, isImageMode, visualizeToolState]);

    return {
        // State
        isMobile,
        activeBadgeRow,
        
        // Refs
        badgePanelRef,
        badgeActionsRef,
        uploadButtonRef,
        modeButtonRef,
        modelButtonRef,
        paramsButtonRef,
        docInputRef,
        imageInputRef,

        // Handlers
        toggleBadgeRow,
        setActiveMode,
        handleSelectMode,
        handleSubmit,
        handleFileChange,
    };
}
