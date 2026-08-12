'use client';

import type React from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedInput } from '@/components/ui/unified-input';
import { Settings2, AudioWaveform, Square, ArrowUp, Plus, Sparkles, Loader2, Layers, ImageIcon, Music2, MessageSquare, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { QuickSettingsBadges } from './input/QuickSettingsBadges';
import { ToolsBadges } from './input/ToolsBadges';
import { CapabilityUploadBadges, type AttachmentAction } from './input/UploadBadges';
import { VisualCorner, VisualCornerMode } from './input/VisualCorner';
import { AttachmentPreviewRow, AttachmentItem } from './input/AttachmentPreviewRow';
import { UnifiedMobileDrawer, DrawerSection } from './input/UnifiedMobileDrawer';
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
    selectedTtsSpeed: number;
    handleTtsSpeedChange: (speed: number) => void;
    isTranscribing: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    openCamera: () => void;
    placeholder?: string;
    // Compose Tool Props
    composeToolState?: ComposeMusicState & ComposeMusicActions;
    onComposeSubmit?: (e: React.FormEvent) => void;
}

export interface AttachmentActionHandlers {
    image: () => void;
    document: () => void;
    camera: () => void;
    sourceVideo: () => void;
    startFrame: () => void;
    endFrame: () => void;
}

export const dispatchAttachmentAction = (kind: AttachmentAction['kind'], handlers: AttachmentActionHandlers) => {
    switch (kind) {
        case 'image':
        case 'reference':
            return handlers.image();
        case 'document':
            return handlers.document();
        case 'camera':
            return handlers.camera();
        case 'source-video':
            return handlers.sourceVideo();
        case 'start-frame':
            return handlers.startFrame();
        case 'end-frame':
            return handlers.endFrame();
        default: {
            const unreachable: never = kind;
            return unreachable;
        }
    }
};

const ChatInput: React.FC<ChatInputProps> = (props) => {
    const { t } = useLanguage();
    const sourceVideoInputRef = useRef<HTMLInputElement>(null);
    const startFrameInputRef = useRef<HTMLInputElement>(null);
    const endFrameInputRef = useRef<HTMLInputElement>(null);

    // Mobile drawer state
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileDrawerSection, setMobileDrawerSection] = useState<DrawerSection>('attachments');

    const openMobileDrawer = (section: DrawerSection) => {
        setMobileDrawerSection(section);
        setMobileDrawerOpen(true);
    };

    // Destructure props used directly in render
    const {
        isLoading,
        uploadedFilePreviewUrl,
        onFileSelect,
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
        selectedTtsSpeed,
        handleTtsSpeedChange,
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

    // Build attachment items for preview row
    const attachmentItems: AttachmentItem[] = [];

    // Standard mode: single uploaded file
    if (!isImageMode && !isComposeMode && uploadedFilePreviewUrl) {
        attachmentItems.push({
            id: 'standard-upload',
            type: uploadedFilePreviewUrl.startsWith('data:image/') ? 'image' : 'document',
            previewUrl: uploadedFilePreviewUrl,
            fileName: t('menu.section.upload'),
        });
    }

    // Visualize mode: multiple reference images
    if (isImageMode && visualizeToolState) {
        visualizeToolState.uploadedImages.forEach((img, idx) => {
            attachmentItems.push({
                id: `visualize-ref-${idx}`,
                type: 'image',
                previewUrl: img.url,
                fileName: `${t('chat.attachment.referenceImage')} ${idx + 1}`,
                isUploading: visualizeToolState.isUploading,
            });
        });
        if (visualizeToolState.sourceVideo) {
            attachmentItems.push({
                id: 'source-video',
                type: 'video',
                fileName: t('chat.attachment.sourceVideo'),
                isUploading: visualizeToolState.isUploading,
            });
        }
    }

    const handleRemoveAttachment = (id: string) => {
        if (id === 'standard-upload') {
            onFileSelect(null, null);
        } else if (id.startsWith('visualize-ref-')) {
            const idx = parseInt(id.replace('visualize-ref-', ''), 10);
            visualizeToolState?.handleRemoveImage(idx);
        } else if (id === 'source-video') {
            visualizeToolState?.handleRemoveSourceVideo();
        }
    };

    const getVisualCornerMode = (): VisualCornerMode => {
        if (isImageMode) return 'visualize';
        if (isComposeMode) return 'compose';
        if (webBrowsingEnabled) return 'research';
        if (isCodeMode) return 'code';
        return 'standard';
    };

    const hasActiveMode = isImageMode || isComposeMode || webBrowsingEnabled || isCodeMode;

    const handleAttachmentAction = (kind: AttachmentAction['kind']) => dispatchAttachmentAction(kind, {
        image: () => imageInputRef.current?.click(),
        document: () => docInputRef.current?.click(),
        camera: openCamera,
        sourceVideo: () => sourceVideoInputRef.current?.click(),
        startFrame: () => startFrameInputRef.current?.click(),
        endFrame: () => endFrameInputRef.current?.click(),
    });

    // One presentation model; the standard pending upload and provider-hosted
    // Visualize references deliberately remain separate state pipelines.
    const attachmentActions: AttachmentAction[] = (() => {
        const disabled = isLoading || isRecording || isTranscribing;
        if (isComposeMode) return [];
        if (!isImageMode) {
            return [
                { kind: 'image', disabled },
                { kind: 'document', disabled },
                { kind: 'camera', disabled },
            ];
        }
        if (!visualizeToolState) return [];

        const visualizeDisabled = disabled || visualizeToolState.isUploading;
        const actions: AttachmentAction[] = [];
        if (visualizeToolState.requiresSourceVideo) {
            actions.push({ kind: 'source-video', disabled: visualizeDisabled });
        }
        if (visualizeToolState.supportsReference) {
            if (visualizeToolState.isVideoModel) {
                actions.push({ kind: 'start-frame', disabled: visualizeDisabled });
                if (visualizeToolState.supportsEndFrame) {
                    actions.push({
                        kind: 'end-frame',
                        disabled: visualizeDisabled || visualizeToolState.uploadedImages.length === 0,
                    });
                }
            } else {
                actions.push({
                    kind: 'reference',
                    disabled: visualizeDisabled || visualizeToolState.uploadedImages.length >= visualizeToolState.maxImages,
                    count: visualizeToolState.uploadedImages.length,
                    maxCount: visualizeToolState.maxImages,
                });
            }
        }
        return actions;
    })();

    const renderTopBadges = () => {
        const rows: React.ReactNode[] = [];
        const panelRows: React.ReactNode[] = [];

        // Show VisualizeInlineHeader when image mode is active — desktop only
        if (isImageMode && visualizeToolState && !isMobile) {
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
                    inlineContent={null}
                    onDeactivate={() => setActiveMode('standard')}
                    variant="bare"
                    disabled={isLoading || isRecording || isTranscribing}
                    providerMode={visualizeToolState.providerMode}
                    prunaAvailable={visualizeToolState.prunaAvailable}
                />
            );
        }

        if (isComposeMode && composeToolState && !isMobile) {
            rows.push(
                <ComposeInlineHeader
                    key="compose-header"
                    selectedModel={composeToolState.selectedModel}
                    duration={composeToolState.duration}
                    availableDurations={composeToolState.availableDurations}
                    hasPollenKey={composeToolState.hasPollenKey}
                    instrumental={composeToolState.instrumental}
                    onModelChange={composeToolState.setSelectedModel}
                    onDurationChange={composeToolState.setDuration}
                    onInstrumentalChange={composeToolState.setInstrumental}
                    onDeactivate={() => setActiveMode('standard')}
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
        if (activeBadgeRow === 'upload' && !isComposeMode) {
            panelRows.push(
                <CapabilityUploadBadges
                    key="upload-badges"
                    actions={attachmentActions}
                    onActionSelect={handleAttachmentAction}
                />
            );
        }
        if (activeBadgeRow === 'settings') {
            panelRows.push(
                <QuickSettingsBadges
                    key="quick-settings-badges"
                    selectedVoice={selectedVoice}
                    onVoiceChange={handleVoiceChange}
                    selectedTtsSpeed={selectedTtsSpeed}
                    onTtsSpeedChange={handleTtsSpeedChange}
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
                    topElements={isMobile ? null : renderTopBadges()}
                    modeColor={
                        isImageMode ? 'var(--mode-visualize)' :
                        isComposeMode ? 'var(--mode-compose)' :
                        webBrowsingEnabled ? 'var(--mode-research)' :
                        (isCodeMode ? 'var(--mode-code)' : undefined)
                    }
                    visualCorner={<VisualCorner mode={getVisualCornerMode()} />}
                    attachmentRow={
                        attachmentItems.length > 0 ? (
                            <AttachmentPreviewRow
                                items={attachmentItems}
                                onRemove={handleRemoveAttachment}
                            />
                        ) : undefined
                    }
                    leftActions={
                        isMobile ? (
                            <div className="flex items-center gap-1.5">
                                {/* Mode toggle — opens unified drawer at mode section */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => openMobileDrawer('mode')}
                                    className={`flex items-center gap-1.5 rounded-full border border-border/30 px-3 py-1.5 text-xs font-medium transition-all bg-transparent text-foreground/80 hover:shadow-sm`}
                                >
                                    {isImageMode ? (
                                        <>
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span className="max-w-[60px] truncate">{t('tools.visualize')}</span>
                                        </>
                                    ) : isComposeMode ? (
                                        <>
                                            <Music2 className="w-3.5 h-3.5" />
                                            <span className="max-w-[60px] truncate">{t('tools.compose')}</span>
                                        </>
                                    ) : webBrowsingEnabled ? (
                                        <>
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="max-w-[60px] truncate">{t('tools.deepResearch')}</span>
                                        </>
                                    ) : isCodeMode ? (
                                        <>
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span className="max-w-[60px] truncate">{t('tools.code')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span className="max-w-[60px] truncate">{t('tools.standard')}</span>
                                        </>
                                    )}
                                    <ChevronDown className="h-3 w-3" />
                                </Button>

                                {/* Plus button — opens unified drawer */}
                                {!isComposeMode && <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => openMobileDrawer('attachments')}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all bg-transparent text-foreground/80 hover:shadow-sm"
                                    aria-label={t('menu.section.upload')}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>}

                                {/* Model chip — opens model section */}
                                {(isImageMode || isComposeMode) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => openMobileDrawer('model')}
                                        className="flex items-center gap-1.5 rounded-full border border-border/30 px-3 py-1.5 text-xs font-medium transition-all bg-transparent text-foreground/80 hover:shadow-sm"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span className="max-w-[80px] truncate">
                                            {isImageMode
                                                ? (visualizeToolState?.currentModelConfig?.name || t('modelSelector.select'))
                                                : (composeToolState?.selectedModel || t('modelSelector.select'))
                                            }
                                        </span>
                                    </Button>
                                )}

                                {/* Parameters button — opens parameters section */}
                                {(isImageMode || isComposeMode) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => openMobileDrawer('parameters')}
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all bg-transparent text-foreground/80 hover:shadow-sm"
                                        aria-label={t('menu.section.parameters')}
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div ref={badgeActionsRef} className="flex items-center gap-2">
                                {/* Mode toggle — always visible */}
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
                                    {isImageMode ? (
                                        <>
                                            <ImageIcon className="w-4 h-4" />
                                            <span>{t('tools.visualize')}</span>
                                        </>
                                    ) : isComposeMode ? (
                                        <>
                                            <Music2 className="w-4 h-4" />
                                            <span>{t('tools.compose')}</span>
                                        </>
                                    ) : webBrowsingEnabled ? (
                                        <>
                                            <Globe className="w-4 h-4" />
                                            <span>{t('tools.deepResearch')}</span>
                                        </>
                                    ) : isCodeMode ? (
                                        <>
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{t('tools.code')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{t('tools.standard')}</span>
                                        </>
                                    )}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${activeBadgeRow === 'tools' ? 'rotate-180' : ''}`} />
                                </Button>

                                {/* Upload Plus — ALWAYS visible (even in active modes) */}
                                {!isComposeMode && <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleBadgeRow('upload')}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/30 transition-all ${
                                        activeBadgeRow === 'upload'
                                            ? "text-foreground shadow-sm hover:shadow-md"
                                            : "bg-transparent text-foreground/80 hover:shadow-sm"
                                    }`}
                                    aria-label={t('menu.section.upload')}
                                    aria-expanded={activeBadgeRow === 'upload'}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>}

                                {/* Quick Settings — only in standard mode */}
                                {!hasActiveTool && (
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
                                    aria-label={t('chat.quickSettings')}
                                >
                                    <Settings2 className="w-4 h-4" />
                                </Button>
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
                                        aria-label={t('action.enhancePrompt')}
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
                                        aria-label={t('action.enhancePrompt')}
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
                                    aria-label={t('chat.send')}
                                >
                                    {isMobile ? <ArrowUp className="w-5 h-5" /> : (isComposeMode ? t('action.create') : t('chat.send'))}
                                </Button>
                            )}
                         </>
                    }
                />
             </form>

            {/* Unified Mobile Drawer */}
            <UnifiedMobileDrawer
                key={`${mobileDrawerOpen}-${mobileDrawerSection}`}
                isOpen={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                initialSection={mobileDrawerSection}
                currentMode={isImageMode ? 'visualize' : isComposeMode ? 'compose' : webBrowsingEnabled ? 'research' : isCodeMode ? 'code' : 'standard'}
                modeContent={
                    <ToolsBadges
                        isImageMode={isImageMode}
                        isComposeMode={isComposeMode || false}
                        isCodeMode={isCodeMode || false}
                        webBrowsingEnabled={webBrowsingEnabled}
                        onSelectMode={(mode) => {
                            handleSelectMode(mode);
                            setMobileDrawerOpen(false);
                        }}
                        canToggleCodeMode={!!onToggleCodeMode}
                    />
                }
                currentModelName={
                    isImageMode
                        ? visualizeToolState?.currentModelConfig?.name
                        : isComposeMode
                            ? composeToolState?.selectedModel
                            : undefined
                }
                attachmentContent={attachmentActions.length > 0 ? (
                    <CapabilityUploadBadges
                        actions={attachmentActions}
                        onActionSelect={handleAttachmentAction}
                        onAfterActionSelect={() => setMobileDrawerOpen(false)}
                    />
                ) : undefined}
                modelContent={
                    <div className="space-y-4">
                        {isImageMode && visualizeToolState && (
                            <VisualizeInlineHeader
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
                                inlineContent={null}
                                onDeactivate={() => setActiveMode('standard')}
                                variant="bare"
                                section="model"
                                disabled={isLoading || isRecording || isTranscribing}
                                providerMode={visualizeToolState.providerMode}
                                prunaAvailable={visualizeToolState.prunaAvailable}
                            />
                        )}
                        {isComposeMode && composeToolState && (
                            <ComposeInlineHeader
                                selectedModel={composeToolState.selectedModel}
                                duration={composeToolState.duration}
                                availableDurations={composeToolState.availableDurations}
                                hasPollenKey={composeToolState.hasPollenKey}
                                instrumental={composeToolState.instrumental}
                                onModelChange={composeToolState.setSelectedModel}
                                onDurationChange={composeToolState.setDuration}
                                onInstrumentalChange={composeToolState.setInstrumental}
                                onDeactivate={() => setActiveMode('standard')}
                                disabled={isLoading}
                                variant="bare"
                                section="model"
                            />
                        )}
                    </div>
                }
                parametersContent={
                    <div className="space-y-4">
                        {isImageMode && visualizeToolState && (
                            <VisualizeInlineHeader
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
                                inlineContent={null}
                                onDeactivate={() => setActiveMode('standard')}
                                variant="bare"
                                section="parameters"
                                disabled={isLoading || isRecording || isTranscribing}
                                providerMode={visualizeToolState.providerMode}
                                prunaAvailable={visualizeToolState.prunaAvailable}
                            />
                        )}
                        {isComposeMode && composeToolState && (
                            <ComposeInlineHeader
                                selectedModel={composeToolState.selectedModel}
                                duration={composeToolState.duration}
                                availableDurations={composeToolState.availableDurations}
                                hasPollenKey={composeToolState.hasPollenKey}
                                instrumental={composeToolState.instrumental}
                                onModelChange={composeToolState.setSelectedModel}
                                onDurationChange={composeToolState.setDuration}
                                onInstrumentalChange={composeToolState.setInstrumental}
                                onDeactivate={() => setActiveMode('standard')}
                                disabled={isLoading}
                                variant="bare"
                                section="parameters"
                            />
                        )}
                        {!isImageMode && !isComposeMode && (
                            <QuickSettingsBadges
                                selectedVoice={selectedVoice}
                                onVoiceChange={handleVoiceChange}
                                selectedTtsSpeed={selectedTtsSpeed}
                                onTtsSpeedChange={handleTtsSpeedChange}
                                selectedResponseStyleName={selectedResponseStyleName}
                                onStyleChange={handleStyleChange}
                            />
                        )}
                    </div>
                }
            />

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
                ref={sourceVideoInputRef}
                onChange={(e) => visualizeToolState?.handleSourceVideoFileChange(e)}
                accept="video/*"
                className="hidden"
            />
            <input
                type="file"
                ref={startFrameInputRef}
                onChange={(event) => { visualizeToolState?.handleFrameFileChange(event, 'start'); event.currentTarget.value = ''; }}
                accept="image/*"
                className="hidden"
            />
            <input
                type="file"
                ref={endFrameInputRef}
                onChange={(event) => { visualizeToolState?.handleFrameFileChange(event, 'end'); event.currentTarget.value = ''; }}
                accept="image/*"
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
