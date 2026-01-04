'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedInput } from '@/components/ui/unified-input';
import { Settings2, Mic, Square, ArrowUp, Plus, X } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import type { Conversation } from '@/types';
import { MobileOptionsMenu } from './input/MobileOptionsMenu';
import { QuickSettingsBadges } from './input/QuickSettingsBadges';
import { ToolsBadges } from './input/ToolsBadges';
import { UploadBadges } from './input/UploadBadges';
import { VisualizeReferenceBadges } from './input/VisualizeReferenceBadges';
import { VisualizeInlineHeader } from '@/components/tools/visualize/VisualizeInlineHeader';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface ChatInputProps {
    onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
    isLoading: boolean;
    uploadedFilePreviewUrl: string | null;
    onFileSelect: (file: File | null, fileType: string | null) => void;
    onClearUploadedImage: () => void;
    isLongLanguageLoopActive: boolean;
    inputValue: string;
    onInputChange: (value: string | ((prev: string) => string)) => void;
    isImageMode: boolean;
    onToggleImageMode: () => void;
    isCodeMode?: boolean;
    onToggleCodeMode?: () => void;
    chatTitle: string;
    onToggleHistoryPanel: () => void;
    onToggleGalleryPanel: () => void;
    onToggleAdvancedPanel: () => void;
    isHistoryPanelOpen: boolean;
    isGalleryPanelOpen: boolean;
    isAdvancedPanelOpen: boolean;
    advancedPanelRef: React.RefObject<HTMLDivElement>;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    selectChat: (id: string) => void;
    closeHistoryPanel: () => void;
    requestEditTitle: (id: string) => void;
    deleteChat: (id: string) => void;
    startNewChat: () => void;
    closeAdvancedPanel: () => void;
    toDate: (timestamp: Date | string | undefined | null) => Date;
    selectedModelId: string;
    handleModelChange: (modelId: string) => void;
    selectedResponseStyleName: string;
    handleStyleChange: (styleName: string) => void;
    selectedVoice: string;
    handleVoiceChange: (voiceId: string) => void;
    webBrowsingEnabled: boolean;
    onToggleWebBrowsing: () => void;
    mistralFallbackEnabled: boolean;
    onToggleMistralFallback: () => void;
    isRecording: boolean;
    isTranscribing: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    openCamera: () => void;
    visualizeToolState?: UnifiedImageToolState;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
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
    selectedResponseStyleName,
    handleStyleChange,
    selectedVoice,
    handleVoiceChange,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    openCamera,
    mistralFallbackEnabled,
    onToggleMistralFallback,
    isCodeMode = false,
    onToggleCodeMode,
    visualizeToolState,
    placeholder,
}) => {
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(false);
    const [activeBadgeRow, setActiveBadgeRow] = useState<'tools' | 'upload' | 'settings' | null>(null);
    const badgePanelRef = useRef<HTMLDivElement>(null);
    const badgeActionsRef = useRef<HTMLDivElement>(null);

    const toggleBadgeRow = (row: 'tools' | 'upload' | 'settings') => {
        setActiveBadgeRow(current => current === row ? null : row);
    };

    const renderTopBadges = () => {
        const rows: React.ReactNode[] = [];
        const panelRows: React.ReactNode[] = [];

        // Image Mode Header + Reference Badges
        if (isImageMode && visualizeToolState) {
            rows.push(
                <VisualizeInlineHeader
                    key="visualize-header"
                    selectedModelId={visualizeToolState.selectedModelId}
                    onModelChange={visualizeToolState.setSelectedModelId}
                    currentModelConfig={visualizeToolState.currentModelConfig}
                    formFields={visualizeToolState.formFields}
                    handleFieldChange={visualizeToolState.handleFieldChange}
                    setFormFields={visualizeToolState.setFormFields}
                    isGptImage={visualizeToolState.isGptImage}
                    isSeedream={visualizeToolState.isSeedream}
                    isNanoPollen={visualizeToolState.isNanoPollen}
                    isPollenModel={visualizeToolState.isPollenModel}
                    isPollinationsVideo={visualizeToolState.isPollinationsVideo}
                    disabled={isLoading || isRecording || isTranscribing}
                />
            );

            if (visualizeToolState.supportsReference) {
                rows.push(
                    <VisualizeReferenceBadges
                        key="visualize-references"
                        uploadedImages={visualizeToolState.uploadedImages}
                        maxImages={visualizeToolState.maxImages}
                        supportsReference={visualizeToolState.supportsReference}
                        isUploading={visualizeToolState.isUploading}
                        onRemove={visualizeToolState.handleRemoveImage}
                        onUploadClick={() => imageInputRef.current?.click()}
                        disabled={isLoading || isRecording || isTranscribing}
                    />
                );
            }
        }

        if (activeBadgeRow === 'tools') {
            panelRows.push(
                <ToolsBadges
                    key="tools-badges"
                    isImageMode={isImageMode}
                    onToggleImageMode={onToggleImageMode}
                    isCodeMode={isCodeMode || false}
                    onToggleCodeMode={onToggleCodeMode}
                    webBrowsingEnabled={webBrowsingEnabled}
                    onToggleWebBrowsing={onToggleWebBrowsing}
                    onClose={() => setActiveBadgeRow(null)}
                />
            );
        }
        if (activeBadgeRow === 'upload') {
            panelRows.push(
                <UploadBadges
                    key="upload-badges"
                    isLoading={isLoading}
                    isImageMode={isImageMode}
                    onImageUploadClick={() => imageInputRef.current?.click()}
                    onDocUploadClick={() => docInputRef.current?.click()}
                    onCameraClick={openCamera}
                    allowImageUploadInImageMode={!!(isImageMode && visualizeToolState?.supportsReference)}
                    disableImageUpload={!!(
                        isImageMode &&
                        visualizeToolState?.supportsReference &&
                        (visualizeToolState.isUploading || visualizeToolState.uploadedImages.length >= visualizeToolState.maxImages)
                    )}
                />
            );
        }
        if (activeBadgeRow === 'settings') {
            panelRows.push(
                <QuickSettingsBadges
                    key="quick-settings-badges"
                    selectedVoice={selectedVoice}
                    onVoiceChange={handleVoiceChange}
                    selectedResponseStyleName={selectedResponseStyleName}
                    onStyleChange={handleStyleChange}
                />
            );
        }
        if (panelRows.length > 0) {
            rows.push(
                <div key="badge-panel" ref={badgePanelRef} className="flex flex-col gap-2">
                    {panelRows}
                </div>
            );
        }
        if (rows.length === 0) return null;
        return <div className="flex flex-col gap-2">{rows}</div>;
    };

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isImageMode && activeBadgeRow === 'upload') {
            setActiveBadgeRow(null);
        }
    }, [isImageMode, activeBadgeRow]);

    const docInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const quickSettingsButtonRef = useRef<HTMLButtonElement>(null);

    useOnClickOutside([badgePanelRef, badgeActionsRef], () => {
        if (activeBadgeRow) setActiveBadgeRow(null);
    });

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
    }, [visualizeToolState?.prompt, isImageMode, inputValue, onInputChange]);

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

    const placeholderText = placeholder || (isRecording
        ? t('chat.recording')
        : isTranscribing
            ? t('chat.transcribing')
            : isImageMode
                ? t('chat.placeholder.imageMode')
                : webBrowsingEnabled
                    ? t('chat.placeholder.web')
                    : isCodeMode
                        ? t('chat.placeholder.code')
                        : t('chat.placeholder.standard'));

    return (
        <div className="relative w-full"> 
             <form onSubmit={handleSubmit} className="w-full">
                <UnifiedInput
                    value={inputValue}
                    onChange={(val) => {
                        onInputChange(val);
                        if (isImageMode && visualizeToolState) {
                            visualizeToolState.setPrompt(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    placeholder={placeholderText}
                    isLoading={isLoading}
                    disabled={isLoading || isRecording || isTranscribing}
                    topElements={renderTopBadges()}
                    leftActions={
                        isMobile ? (
                            <div ref={badgeActionsRef}>
                                <MobileOptionsMenu
                                    isLoading={isLoading}
                                    isImageMode={isImageMode}
                                    onImageUploadClick={() => imageInputRef.current?.click()}
                                    onDocUploadClick={() => docInputRef.current?.click()}
                                    onCameraClick={openCamera}
                                    allowImageUploadInImageMode={!!(isImageMode && visualizeToolState?.supportsReference)}
                                    disableImageUpload={!!(
                                        isImageMode &&
                                        visualizeToolState?.supportsReference &&
                                        (visualizeToolState.isUploading || visualizeToolState.uploadedImages.length >= visualizeToolState.maxImages)
                                    )}
                                    hideUploadSection={isImageMode}
                                    onToggleImageMode={onToggleImageMode}
                                    isCodeMode={isCodeMode || false}
                                    onToggleCodeMode={onToggleCodeMode}
                                    webBrowsingEnabled={webBrowsingEnabled}
                                    onToggleWebBrowsing={onToggleWebBrowsing}
                                    selectedVoice={selectedVoice}
                                    onVoiceChange={handleVoiceChange}
                                    selectedResponseStyleName={selectedResponseStyleName}
                                    onStyleChange={handleStyleChange}
                                    mistralFallbackEnabled={mistralFallbackEnabled}
                                    onToggleMistralFallback={onToggleMistralFallback}
                                />
                            </div>
                        ) : (
                            <div ref={badgeActionsRef} className="flex items-center gap-2">
                                {/* Quick Settings Toggle */}
                                <Button
                                    ref={quickSettingsButtonRef}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleBadgeRow('settings')}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all ${
                                        activeBadgeRow === 'settings' 
                                            ? "text-foreground shadow-sm hover:shadow-md" 
                                            : "bg-transparent text-foreground/80 hover:shadow-sm"
                                    }`}
                                    aria-label="Quick settings"
                                >
                                    <Settings2 className="w-4 h-4" />
                                </Button>

                                {/* Upload Toggle - hide in image mode */}
                                {!isImageMode && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => toggleBadgeRow('upload')}
                                        className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all ${
                                            activeBadgeRow === 'upload'
                                                ? "text-foreground shadow-sm hover:shadow-md"
                                                : "bg-transparent text-foreground/80 hover:shadow-sm"
                                        }`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                )}

                                {/* Tools Toggle */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleBadgeRow('tools')}
                                    className={`flex items-center gap-2 rounded-full border border-border/30 px-4 py-2 text-sm font-medium transition-all ${
                                        activeBadgeRow === 'tools'
                                            ? "text-foreground shadow-sm hover:shadow-md"
                                            : "bg-transparent text-foreground/80 hover:shadow-sm"
                                    }`}
                                >
                                    <span>Tools</span>
                                    <svg
                                        className={`h-4 w-4 transition-transform ${activeBadgeRow === 'tools' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="m19 9-7 7-7-7" />
                                    </svg>
                                </Button>

                                {/* Active Mode Badges - Right of Tools */}
                                {isImageMode && (
                                    <button
                                        type="button"
                                        onClick={onToggleImageMode}
                                        className="flex items-center gap-1.5 rounded-full border border-primary/60 px-3 py-1.5 text-xs font-bold transition-all bg-primary/5 text-primary"
                                    >
                                        <span>Visualize</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {webBrowsingEnabled && (
                                    <button
                                        type="button"
                                        onClick={onToggleWebBrowsing}
                                        className="flex items-center gap-1.5 rounded-full border border-[#00d2ff]/60 px-3 py-1.5 text-xs font-bold transition-all bg-[#00d2ff]/5 text-[#00d2ff]"
                                    >
                                        <span>Research</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {isCodeMode && (
                                    <button
                                        type="button"
                                        onClick={onToggleCodeMode}
                                        className="flex items-center gap-1.5 rounded-full border border-[#00ff88]/60 px-3 py-1.5 text-xs font-bold transition-all bg-[#00ff88]/5 text-[#00ff88]"
                                    >
                                        <span>Code</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )
                    }
                    rightActions={
                         <>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all duration-300 ${
                                    isRecording 
                                        ? 'text-red-500 shadow-sm hover:shadow-md' 
                                        : 'bg-transparent text-foreground/80 hover:shadow-sm'
                                }`}
                                aria-label={isRecording ? "Stop recording" : "Start recording"}
                            >
                                {isRecording ? (
                                    <Square className="w-4 h-4 fill-current" />
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
                            </Button>

                            {/* Enhance Prompt Button - only in image mode */}
                            {isImageMode && visualizeToolState && (
                                <div className="hidden md:flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={visualizeToolState.handleEnhancePrompt}
                                        disabled={!inputValue.trim() || isLoading || visualizeToolState.isEnhancing || visualizeToolState.isUploading || isRecording || isTranscribing}
                                        className="group rounded-lg h-9 w-auto px-3 transition-colors duration-300 text-foreground/80 hover:text-foreground disabled:opacity-40"
                                        aria-label="Enhance prompt"
                                    >
                                        <span className="text-xs md:text-sm font-medium">
                                            {visualizeToolState.isEnhancing ? t('message.loading') : t('action.enhancePrompt')}
                                        </span>
                                    </Button>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading || isRecording || (!inputValue.trim() && !uploadedFilePreviewUrl)}
                                className={`ml-1 rounded-full px-6 font-medium h-9 text-sm transition-all duration-300 ${
                                    inputValue.trim() || uploadedFilePreviewUrl
                                        ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-md'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                                aria-label="Send message"
                            >
                                {isMobile ? <ArrowUp className="w-5 h-5" /> : t('chat.send')}
                            </Button>
                         </>
                    }
                />
            </form>
            
            {/* Hidden Inputs */}
            <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileChange(e, 'image')}
                accept="image/*"
                multiple={!!(isImageMode && visualizeToolState?.supportsReference)}
                className="hidden"
            />
            <input
                type="file"
                ref={docInputRef}
                onChange={(e) => handleFileChange(e, 'document')}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
            />
        </div>
    );
};

export default ChatInput;
