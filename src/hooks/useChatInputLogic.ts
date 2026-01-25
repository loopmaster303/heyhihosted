import { useState, useRef, useEffect, useCallback } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_POLLINATIONS_MODEL_ID } from '@/config/chat-options';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

export type ToolMode = 'standard' | 'visualize' | 'research' | 'code';
export const CODE_MODE_MODEL_IDS = ['qwen-coder', 'deepseek', 'glm', 'gemini-large'];

export interface UseChatInputLogicProps {
    onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
    isLoading: boolean;
    uploadedFilePreviewUrl: string | null;
    onFileSelect: (file: File | null, fileType: string | null) => void;
    isLongLanguageLoopActive: boolean;
    inputValue: string;
    onInputChange: (value: string | ((prev: string) => string)) => void;
    isImageMode: boolean;
    onToggleImageMode: () => void;
    isCodeMode?: boolean;
    onToggleCodeMode?: () => void;
    selectedModelId: string;
    handleModelChange: (modelId: string) => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;
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
    visualizeToolState,
}: UseChatInputLogicProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [activeBadgeRow, setActiveBadgeRow] = useState<'tools' | 'upload' | 'settings' | null>(null);
    const badgePanelRef = useRef<HTMLDivElement>(null);
    const badgeActionsRef = useRef<HTMLDivElement>(null);
    
    // Refs for hidden inputs
    const docInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const quickSettingsButtonRef = useRef<HTMLButtonElement>(null);

    const hasActiveTool = isImageMode || webBrowsingEnabled || isCodeMode;
    const [defaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close upload row if image mode becomes active
    useEffect(() => {
        if (isImageMode && activeBadgeRow === 'upload') {
            setActiveBadgeRow(null);
        }
    }, [isImageMode, activeBadgeRow]);

    // Close tools panel if any tool becomes active
    useEffect(() => {
        if (hasActiveTool && activeBadgeRow === 'tools') {
            setActiveBadgeRow(null);
        }
    }, [hasActiveTool, activeBadgeRow]);

    // Code mode auto-model switching
    useEffect(() => {
        if (!isCodeMode) return;
        if (!CODE_MODE_MODEL_IDS.includes(selectedModelId)) {
            handleModelChange('qwen-coder');
        }
    }, [isCodeMode, selectedModelId, handleModelChange]);

    const wasCodeMode = useRef(isCodeMode);

    // Restore default model when exiting code mode
    useEffect(() => {
        if (wasCodeMode.current && !isCodeMode) {
            handleModelChange(defaultTextModelId || DEFAULT_POLLINATIONS_MODEL_ID);
        }
        wasCodeMode.current = isCodeMode;
    }, [isCodeMode, defaultTextModelId, handleModelChange]);

    useOnClickOutside([badgePanelRef, badgeActionsRef], () => {
        if (activeBadgeRow) setActiveBadgeRow(null);
    });

    const toggleBadgeRow = (row: 'tools' | 'upload' | 'settings') => {
        setActiveBadgeRow(current => current === row ? null : row);
    };

    const setActiveMode = useCallback((mode: ToolMode) => {
        const shouldEnableImage = mode === 'visualize';
        const shouldEnableWeb = mode === 'research';
        const shouldEnableCode = mode === 'code';

        if (isImageMode !== shouldEnableImage) {
            onToggleImageMode();
        }
        if (webBrowsingEnabled !== shouldEnableWeb) {
            onToggleWebBrowsing();
        }
        if (onToggleCodeMode && isCodeMode !== shouldEnableCode) {
            onToggleCodeMode();
        }
        if (shouldEnableCode && !isCodeMode) {
            handleModelChange('qwen-coder');
        }
        setActiveBadgeRow(null);
    }, [isImageMode, webBrowsingEnabled, isCodeMode, onToggleImageMode, onToggleWebBrowsing, onToggleCodeMode, handleModelChange]);

    const handleSelectMode = useCallback((mode: ToolMode) => {
        if (mode === 'visualize' && isImageMode) {
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
    }, [isImageMode, webBrowsingEnabled, isCodeMode, setActiveMode]);

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
    }, [visualizeToolState?.prompt, isImageMode, inputValue, onInputChange]); // visualizeToolState is mutable object, be careful

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
        hasActiveTool,
        CODE_MODE_MODEL_IDS,
        
        // Refs
        badgePanelRef,
        badgeActionsRef,
        docInputRef,
        imageInputRef,
        quickSettingsButtonRef,

        // Handlers
        toggleBadgeRow,
        setActiveMode,
        handleSelectMode,
        handleSubmit,
        handleFileChange,
    };
}
