'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedInput } from '@/components/ui/unified-input';
import { Settings2, AudioWaveform, Square, ArrowUp, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { MobileOptionsMenu } from './input/MobileOptionsMenu';
import { QuickSettingsBadges } from './input/QuickSettingsBadges';
import { ToolsBadges } from './input/ToolsBadges';
import { UploadBadges } from './input/UploadBadges';
import { VisualizeReferenceBadges } from './input/VisualizeReferenceBadges';
import { VisualizeInlineHeader } from '@/components/tools/visualize/VisualizeInlineHeader';
import { ComposeInlineHeader } from '@/components/tools/compose/ComposeInlineHeader';
import { ModelSelector } from './input/ModelSelector';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useChatInputLogic, UseChatInputLogicProps } from '@/hooks/useChatInputLogic';
import { ComposeMusicState, ComposeMusicActions } from '@/hooks/useComposeMusicState';

interface ChatInputProps extends UseChatInputLogicProps {
    selectedResponseStyleName: string;
    handleStyleChange: (styleName: string) => void;
    selectedVoice: string;
    handleVoiceChange: (voiceId: string) => void;
    isTranscribing: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    openCamera: () => void;
    placeholder?: string;
    // Compose Tool Props
    composeToolState?: ComposeMusicState & ComposeMusicActions;
    onComposeSubmit?: (e: React.FormEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = (props) => {
    const { t } = useLanguage();
    
    // Destructure props used directly in render
    const {
        isLoading,
        uploadedFilePreviewUrl,
        inputValue,
        onInputChange,
        isImageMode,
        onToggleImageMode,
        webBrowsingEnabled,
        onToggleWebBrowsing,
        selectedModelId,
        handleModelChange,
        selectedResponseStyleName,
        handleStyleChange,
        selectedVoice,
        handleVoiceChange,
        isRecording,
        isTranscribing,
        startRecording,
        stopRecording,
        openCamera,
        isCodeMode = false,
        onToggleCodeMode,
        isComposeMode = false,
        onToggleComposeMode,
        visualizeToolState,
        composeToolState,
        onComposeSubmit,
        placeholder,
    } = props;

    // Use the logic hook
    const logic = useChatInputLogic(props);
    const {
        isMobile,
        activeBadgeRow,
        hasActiveTool,
        badgePanelRef,
        badgeActionsRef,
        docInputRef,
        imageInputRef,
        quickSettingsButtonRef,
        toggleBadgeRow,
        setActiveMode,
        handleSelectMode,
        handleSubmit,
        handleFileChange,
    } = logic;

    const renderTopBadges = () => {
        const rows: React.ReactNode[] = [];
        const panelRows: React.ReactNode[] = [];

        // Show VisualizeInlineHeader when image mode is active
        if (isImageMode && visualizeToolState) {
            const referenceBadges = visualizeToolState.supportsReference ? (
                <VisualizeReferenceBadges
                    uploadedImages={visualizeToolState.uploadedImages}
                    maxImages={visualizeToolState.maxImages}
                    supportsReference={visualizeToolState.supportsReference}
                    isUploading={visualizeToolState.isUploading}
                    onRemove={visualizeToolState.handleRemoveImage}
                    onUploadClick={() => imageInputRef.current?.click()}
                    disabled={isLoading || isRecording || isTranscribing}
                    selectedModelId={visualizeToolState.selectedModelId}
                />
            ) : null;

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
                    inlineContent={referenceBadges}
                    variant="bare"
                    disabled={isLoading || isRecording || isTranscribing}
                />
            );
        }

        if (isComposeMode && composeToolState) {
            rows.push(
                <ComposeInlineHeader
                    key="compose-header"
                    duration={composeToolState.duration}
                    instrumental={composeToolState.instrumental}
                    onDurationChange={composeToolState.setDuration}
                    onInstrumentalChange={composeToolState.setInstrumental}
                    disabled={isLoading}
                    variant="bare"
                />
            );
        }

        if (activeBadgeRow === 'tools') {
            panelRows.push(
                <ToolsBadges
                    key="tools-badges"
                    isImageMode={isImageMode}
                    isComposeMode={isComposeMode}
                    isCodeMode={isCodeMode || false}
                    webBrowsingEnabled={webBrowsingEnabled}
                    onSelectMode={handleSelectMode}
                    canToggleCodeMode={!!onToggleCodeMode}
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

    const handleFormSubmit = (e?: React.FormEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        if (isComposeMode && onComposeSubmit) {
            onComposeSubmit(e as any);
        } else {
            handleSubmit(e as any);
        }
    };

    const placeholderText = placeholder || (isRecording
        ? t('chat.recording')
        : isTranscribing
            ? t('chat.transcribing')
            : isImageMode
                ? t('chat.placeholder.imageMode')
                : isComposeMode
                    ? t('chat.placeholder.compose')
                : webBrowsingEnabled
                    ? t('chat.placeholder.web')
                    : isCodeMode
                        ? t('chat.placeholder.code')
                        : t('chat.placeholder.standard'));

    return (
        <div className="relative w-full"> 
             <form onSubmit={handleFormSubmit} className="w-full">
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
                            handleFormSubmit();
                        }
                    }}
                    placeholder={placeholderText}
                    isLoading={isLoading}
                    disabled={isLoading || isRecording || isTranscribing}
                    topElements={renderTopBadges()}
                    topElementsVariant="bare"
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
                                />
                            </div>
                        ) : (
                            <div ref={badgeActionsRef} className="flex items-center gap-2">
                                {/* Quick Settings Toggle */}
                                {!isImageMode && (
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
                                )}

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
                                {!hasActiveTool && (
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
                                        <span>{t('menu.section.mode')}</span>
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
                                )}
                                {/* Active Mode Badges - Restored for deselection control */}
                                {isImageMode && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('standard')}
                                        className="flex items-center gap-1.5 rounded-full border border-mode-visualize/60 px-3 py-1.5 text-xs font-bold transition-all bg-mode-visualize/10 text-mode-visualize"
                                    >
                                        <span>{t('tools.visualize')}</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {webBrowsingEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('standard')}
                                        className="flex items-center gap-1.5 rounded-full border border-mode-research/60 px-3 py-1.5 text-xs font-bold transition-all bg-mode-research/10 text-mode-research"
                                    >
                                        <span>{t('tools.deepResearch')}</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {isCodeMode && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('standard')}
                                        className="flex items-center gap-1.5 rounded-full border border-mode-code/60 px-3 py-1.5 text-xs font-bold transition-all bg-mode-code/10 text-mode-code"
                                    >
                                        <span>{t('tools.code')}</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {isComposeMode && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('standard')}
                                        className="flex items-center gap-1.5 rounded-full border border-mode-compose/60 px-3 py-1.5 text-xs font-bold transition-all bg-mode-compose/10 text-mode-compose"
                                    >
                                        <span>{t('tools.compose')}</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )
                    }
                    rightActions={
                         <>
                            {/* LLM Model Selector always visible next to Record - hide in image/compose mode */}
                            {!isImageMode && !isComposeMode && (
                            <div className="mr-1">
                                <ModelSelector
                                    selectedModelId={selectedModelId}
                                    onModelChange={handleModelChange}
                                    disabled={isLoading || isRecording || isTranscribing}
                                    compact={true}
                                />
                            </div>
                            )}

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
                                    <AudioWaveform className="w-4 h-4" />
                                )}
                            </Button>

                            {/* Enhance Prompt Button - image mode */}
                            {isImageMode && visualizeToolState && (
                                <div className="flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={visualizeToolState.handleEnhancePrompt}
                                        disabled={!inputValue.trim() || isLoading || visualizeToolState.isEnhancing || visualizeToolState.isUploading || isRecording || isTranscribing}
                                        className="group rounded-lg h-9 w-9 md:w-auto px-0 md:px-3 transition-colors duration-300 text-foreground/80 hover:text-foreground disabled:opacity-40"
                                        aria-label="Enhance prompt"
                                    >
                                        {visualizeToolState.isEnhancing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
                                                <span className="hidden md:inline text-xs md:text-sm font-medium">
                                                    {t('message.loading')}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 md:hidden" />
                                                <span className="hidden md:inline text-xs md:text-sm font-medium">
                                                    {t('action.enhancePrompt')}
                                                </span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Enhance Prompt Button - compose mode */}
                            {isComposeMode && composeToolState && (
                                <div className="flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={async () => {
                                            const enhanced = await composeToolState.enhancePrompt(inputValue);
                                            if (enhanced) {
                                                onInputChange(enhanced);
                                            }
                                        }}
                                        disabled={!inputValue.trim() || isLoading || composeToolState.isEnhancing || isRecording || isTranscribing}
                                        className="group rounded-lg h-9 w-9 md:w-auto px-0 md:px-3 transition-colors duration-300 text-foreground/80 hover:text-foreground disabled:opacity-40"
                                        aria-label="Enhance prompt"
                                    >
                                        {composeToolState.isEnhancing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
                                                <span className="hidden md:inline text-xs md:text-sm font-medium">
                                                    {t('message.loading')}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 md:hidden" />
                                                <span className="hidden md:inline text-xs md:text-sm font-medium">
                                                    {t('action.enhancePrompt')}
                                                </span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Dynamic Send Button - only shows when has content or in compose mode */}
                            {(inputValue.trim() || uploadedFilePreviewUrl || isComposeMode) && (
                                <Button
                                    type="submit"
                                    disabled={isLoading || isRecording || (isComposeMode && !inputValue.trim())}
                                    className="ml-1 rounded-full px-6 font-medium h-9 text-sm transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90 shadow-md"
                                    aria-label="Send message"
                                >
                                    {isMobile ? <ArrowUp className="w-5 h-5" /> : (isComposeMode ? t('action.create') : t('chat.send'))}
                                </Button>
                            )}
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
