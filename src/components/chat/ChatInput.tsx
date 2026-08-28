'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedInput } from '@/components/ui/unified-input';
import { cn } from '@/lib/utils';
import { Settings2, AudioWaveform, Square, ArrowUp, Plus, Sparkles, Loader2, ImageIcon, Music2, MessageSquare, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { AsciiSpinner } from '@/components/ascii';
import { ToolsBadges } from './input/ToolsBadges';
import { CapabilityUploadBadges, type AttachmentAction } from './input/UploadBadges';
import { ModeChip, ModeOptions, resolveActiveMode } from './input/InlineModeSwitch';
import { ImageModelOptions } from './input/ImageModelOptions';
import { ModelLogo } from './input/ModelLogo';
import { ImageParamOptions } from './input/ImageParamOptions';
import { ResearchDepthBadges, resolveResearchDepth, researchDepthLabelKey } from './input/ResearchDepthBadges';
import { AttachmentPreviewRow, AttachmentItem } from './input/AttachmentPreviewRow';
import { UnifiedMobileDrawer, DrawerSection } from './input/UnifiedMobileDrawer';
import { VisualizeInlineHeader } from '@/components/tools/visualize/VisualizeInlineHeader';
import { ComposeInlineHeader } from '@/components/tools/compose/ComposeInlineHeader';
import { ModelSelector, ModelSelectorPanel } from './input/ModelSelector';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useChatInputLogic, UseChatInputLogicProps } from '@/hooks/useChatInputLogic';
import { ComposeMusicState, ComposeMusicActions } from '@/hooks/useComposeMusicState';

interface ChatInputProps extends UseChatInputLogicProps {
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

/** Ausloeser fuer das Feld ueber der Textzeile — traegt seinen Wert im Etikett. */
const ConfigChip = React.forwardRef<HTMLButtonElement, {
    label: string;
    icon?: React.ReactNode;
    isOpen: boolean;
    panelId: string;
    onToggle: () => void;
    disabled?: boolean;
    ariaLabel: string;
    mono?: boolean;
}>(({ label, icon, isOpen, panelId, onToggle, disabled, ariaLabel, mono }, ref) => (
    <Button
        ref={ref}
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={ariaLabel}
        className={`h-auto shrink-0 gap-1.5 bg-transparent px-1 py-3 text-sm font-medium shadow-none transition-opacity hover:bg-transparent ${
            isOpen ? 'opacity-100' : 'opacity-70 hover:opacity-100'
        } ${mono ? 'font-mono tabular-nums' : ''}`}
    >
        {icon}
        <span className="truncate max-w-[140px]">{label}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
    </Button>
));
ConfigChip.displayName = 'ConfigChip';

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
        badgePanelRef,
        badgeActionsRef,
        uploadButtonRef,
        modeButtonRef,
        modelButtonRef,
        paramsButtonRef,
        docInputRef,
        imageInputRef,
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

    const handleAttachmentAction = (kind: AttachmentAction['kind']) => dispatchAttachmentAction(kind, {
        image: () => imageInputRef.current?.click(),
        document: () => docInputRef.current?.click(),
        camera: openCamera,
        sourceVideo: () => sourceVideoInputRef.current?.click(),
        startFrame: () => startFrameInputRef.current?.click(),
        endFrame: () => endFrameInputRef.current?.click(),
    });

    /**
     * Die Visualize-Einstellungen bleiben waehrend einer laufenden Generierung
     * bedienbar: der Sendepfad friert Modell, Parameter und Referenzen beim
     * Absenden ein (`imageConfig` in ChatInterface, `selectedImageModelId` als
     * useCallback-Dependency), eine Aenderung kann den Request also nicht mehr
     * verfaelschen — sie gilt fuer den naechsten Lauf. Nur Aufnahme und
     * Transkription sperren weiter, weil sie dasselbe Eingabefeld belegen.
     */
    const visualizeControlsDisabled = isRecording || isTranscribing;

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

        const visualizeDisabled = visualizeControlsDisabled || visualizeToolState.isUploading;
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

    /**
     * Genau eine Oeffnungsgeste: jedes aufklappbare Element der Leiste rendert
     * seinen Inhalt in dieses eine Feld ueber der Textzeile. Kein Modal, kein
     * Austausch an Ort und Stelle — die Zeile darunter bleibt stehen.
     */
    const activeMode = resolveActiveMode(isImageMode, webBrowsingEnabled, isCodeMode);
    const hasToolParameters = isImageMode || isComposeMode;

    /**
     * Platz 2 traegt hoechstens drei Chips. Der dritte erscheint nur, wo es
     * vor dem Absenden etwas zu stellen gibt — Format, Dauer oder Tiefe.
     * Alles, was erst am fertigen Ergebnis eine Entscheidung ist, lebt dort.
     */
    const paramsChip: { label: string; icon: React.ReactNode } | null = (() => {
        if (isImageMode && visualizeToolState) {
            const ratio = typeof visualizeToolState.formFields.aspect_ratio === 'string'
                ? visualizeToolState.formFields.aspect_ratio
                : '1:1';
            const duration = visualizeToolState.formFields.duration;
            const label = duration ? `${ratio} · ${duration}s` : ratio;
            return { label, icon: null };
        }
        if (isComposeMode && composeToolState) {
            return { label: `${composeToolState.duration}s`, icon: null };
        }
        if (webBrowsingEnabled) {
            return {
                label: t(researchDepthLabelKey(resolveResearchDepth(selectedModelId))),
                icon: null,
            };
        }
        return null;
    })();

    const renderTopBadges = () => {
        let panel: React.ReactNode = null;

        if (activeBadgeRow === 'upload' && !isComposeMode) {
            panel = (
                <CapabilityUploadBadges
                    actions={attachmentActions}
                    onActionSelect={handleAttachmentAction}
                />
            );
        } else if (activeBadgeRow === 'mode') {
            panel = (
                <ModeOptions
                    activeMode={activeMode}
                    onSelectMode={handleSelectMode}
                    canToggleCodeMode={!!onToggleCodeMode}
                />
            );
        } else if (activeBadgeRow === 'model') {
            if (isImageMode && visualizeToolState) {
                panel = (
                    <ImageModelOptions
                        selectedModelId={visualizeToolState.selectedModelId}
                        onModelChange={(id) => {
                            visualizeToolState.setSelectedModelId(id);
                            toggleBadgeRow('model');
                        }}
                        providerMode={visualizeToolState.providerMode}
                        prunaAvailable={visualizeToolState.prunaAvailable}
                        disabled={visualizeControlsDisabled}
                    />
                );
            } else if (isComposeMode && composeToolState) {
                panel = (
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
                );
            } else {
                panel = (
                    <ModelSelectorPanel
                        selectedModelId={selectedModelId}
                        onModelChange={(modelId) => {
                            handleModelChange(modelId);
                            toggleBadgeRow('model');
                        }}
                    />
                );
            }
        } else if (activeBadgeRow === 'params') {
            if (isImageMode && visualizeToolState) {
                panel = (
                    <ImageParamOptions
                        selectedModelId={visualizeToolState.selectedModelId}
                        currentModelConfig={visualizeToolState.currentModelConfig}
                        formFields={visualizeToolState.formFields}
                        onFieldChange={visualizeToolState.handleFieldChange}
                        setFormFields={visualizeToolState.setFormFields}
                        isPollenModel={visualizeToolState.isPollenModel}
                        disabled={visualizeControlsDisabled}
                        onAfterSelect={() => toggleBadgeRow('params')}
                    />
                );
            } else if (isComposeMode && composeToolState) {
                panel = (
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
                );
            } else if (webBrowsingEnabled) {
                panel = (
                    <ResearchDepthBadges
                        selectedModelId={selectedModelId}
                        onModelChange={(modelId) => {
                            handleModelChange(modelId);
                            toggleBadgeRow('params');
                        }}
                        disabled={isLoading || isRecording || isTranscribing}
                    />
                );
            }
        }

        if (!panel) return null;

        const labelKey: Record<Exclude<typeof activeBadgeRow, null>, string> = {
            mode: 'menu.section.mode',
            model: 'modelSelector.title',
            params: 'menu.section.parameters',
            upload: 'menu.section.upload',
        };

        return (
            <div id={`badge-panel-${activeBadgeRow}`} ref={badgePanelRef} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {t(labelKey[activeBadgeRow!])}
                    </span>
                    <button
                        type="button"
                        onClick={() => toggleBadgeRow(activeBadgeRow!)}
                        className="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                        &larr; {t('action.close')}
                    </button>
                </div>
                <div className="max-h-[220px] overflow-y-auto overscroll-contain">
                    {panel}
                </div>
            </div>
        );
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

    /**
     * Prompt-Verbesserung gehoert zum Text, nicht zur Werkzeugleiste: sie sitzt
     * in der Textzeile, damit die rechte Seite in jedem Modus dieselben zwei
     * Elemente traegt und der Sende-Button nicht mehr wandert.
     */
    const enhanceAction = (() => {
        if (isImageMode && visualizeToolState) {
            return {
                onEnhance: visualizeToolState.handleEnhancePrompt,
                isEnhancing: visualizeToolState.isEnhancing,
                disabled: !inputValue.trim() || isLoading || visualizeToolState.isEnhancing
                    || visualizeToolState.isUploading || isRecording || isTranscribing,
            };
        }
        if (isComposeMode && composeToolState) {
            return {
                onEnhance: async () => {
                    const enhanced = await composeToolState.enhancePrompt(inputValue);
                    if (enhanced) onInputChange(enhanced);
                },
                isEnhancing: composeToolState.isEnhancing,
                disabled: !inputValue.trim() || isLoading || composeToolState.isEnhancing
                    || isRecording || isTranscribing,
            };
        }
        return null;
    })();

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
                    picker={isMobile ? null : renderTopBadges()}
                    modeColor={
                        isImageMode ? 'var(--mode-visualize)' :
                        isComposeMode ? 'var(--mode-compose)' :
                        webBrowsingEnabled ? 'var(--mode-research)' :
                        (isCodeMode ? 'var(--mode-code)' : undefined)
                    }
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
                                    className={`flex items-center gap-1.5 bg-transparent px-1 py-2 font-mono text-xs font-medium text-foreground/70 transition-opacity hover:text-foreground`}
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
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-foreground/60 transition-opacity hover:text-foreground"
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
                                        className="flex items-center gap-1.5 bg-transparent px-1 py-2 font-mono text-xs font-medium text-foreground/70 transition-opacity hover:text-foreground"
                                    >
                                        {isImageMode && visualizeToolState && (
                                            <ModelLogo modelId={visualizeToolState.selectedModelId} />
                                        )}
                                        <span className="max-w-[80px] truncate">
                                            {isImageMode
                                                ? (visualizeToolState?.currentModelConfig?.name || t('modelSelector.select'))
                                                : (composeToolState?.selectedModel || t('modelSelector.select'))
                                            }
                                        </span>
                                    </Button>
                                )}

                                {/* Parameters button — in jedem Modus: in Chat und Deep
                                    Research liegen dahinter die Schnelleinstellungen. */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => openMobileDrawer('parameters')}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-foreground/60 transition-opacity hover:text-foreground"
                                    aria-label={hasToolParameters ? t('menu.section.parameters') : t('chat.quickSettings')}
                                >
                                    <Settings2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div ref={badgeActionsRef} className="flex items-center gap-2 min-w-0">
                                {/* Upload Plus — ALWAYS visible (even in active modes) */}
                                {!isComposeMode && <Button
                                    ref={uploadButtonRef}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleBadgeRow('upload')}
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent transition-opacity ${
                                        activeBadgeRow === 'upload'
                                            ? "text-foreground shadow-sm hover:shadow-md"
                                            : "bg-transparent text-foreground/80 hover:shadow-sm"
                                    }`}
                                    aria-label={t('menu.section.upload')}
                                    aria-expanded={activeBadgeRow === 'upload'}
                                    aria-controls={activeBadgeRow === 'upload' ? 'badge-panel-upload' : undefined}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>}

                                {/* Platz 2: Modus, Modell und — wo es etwas zu stellen
                                    gibt — ein Parameter-Chip. Nie mehr als drei. */}
                                <ModeChip
                                    activeMode={activeMode}
                                    onToggle={() => toggleBadgeRow('mode')}
                                    isOpen={activeBadgeRow === 'mode'}
                                    panelId="badge-panel-mode"
                                    buttonRef={modeButtonRef}
                                />

                                {isImageMode && visualizeToolState ? (
                                    <ConfigChip
                                        ref={modelButtonRef}
                                        label={visualizeToolState.currentModelConfig?.name || t('modelSelector.select')}
                                        mono
                                        icon={<ModelLogo modelId={visualizeToolState.selectedModelId} />}
                                        isOpen={activeBadgeRow === 'model'}
                                        panelId="badge-panel-model"
                                        onToggle={() => toggleBadgeRow('model')}
                                        disabled={visualizeControlsDisabled}
                                        ariaLabel={t('modelSelector.select')}
                                    />
                                ) : isComposeMode && composeToolState ? (
                                    <ConfigChip
                                        ref={modelButtonRef}
                                        label={composeToolState.selectedModel || t('modelSelector.select')}
                                        mono
                                        icon={null}
                                        isOpen={activeBadgeRow === 'model'}
                                        panelId="badge-panel-model"
                                        onToggle={() => toggleBadgeRow('model')}
                                        disabled={isLoading}
                                        ariaLabel={t('modelSelector.select')}
                                    />
                                ) : (
                                    <ModelSelector
                                        selectedModelId={selectedModelId}
                                        onModelChange={handleModelChange}
                                        disabled={isLoading || isRecording || isTranscribing}
                                        compact={true}
                                        isOpen={activeBadgeRow === 'model'}
                                        onToggle={() => toggleBadgeRow('model')}
                                        panelId="badge-panel-model"
                                        buttonRef={modelButtonRef}
                                    />
                                )}

                                {paramsChip && (
                                    <ConfigChip
                                        ref={paramsButtonRef}
                                        label={paramsChip.label}
                                        icon={paramsChip.icon}
                                        isOpen={activeBadgeRow === 'params'}
                                        panelId="badge-panel-params"
                                        onToggle={() => toggleBadgeRow('params')}
                                        disabled={isImageMode ? visualizeControlsDisabled : isLoading}
                                        ariaLabel={t('menu.section.parameters')}
                                        mono
                                    />
                                )}
                            </div>
                        )
                    }
                    rightActions={
                         <>
                            {/*
                              Prompt-Verbesserung steht bei Aufnahme und Senden:
                              die drei gehoeren als Aktionen zusammen. Sie existiert
                              nur in Visualize und Compose — dort ist die Gruppe eben
                              einen Knopf breiter.
                            */}
                            {enhanceAction && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={enhanceAction.onEnhance}
                                    disabled={enhanceAction.disabled}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-foreground/60 transition-opacity hover:text-foreground disabled:opacity-30"
                                    aria-label={t('action.enhancePrompt')}
                                    title={t('action.enhancePrompt')}
                                >
                                    {enhanceAction.isEnhancing
                                        ? <AsciiSpinner />
                                        : <Sparkles className="h-4 w-4" />}
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex h-9 w-9 items-center justify-center rounded-full bg-transparent transition-opacity duration-300 ${
                                    isRecording
                                        ? 'text-red-500 shadow-sm hover:shadow-md'
                                        : 'bg-transparent text-foreground/80 hover:shadow-sm'
                                }`}
                                aria-label={isRecording ? t('chat.stopRecording') : t('chat.startRecording')}
                            >
                                {isRecording ? (
                                    <Square className="w-4 h-4 fill-current" />
                                ) : (
                                    <AudioWaveform className="w-4 h-4" />
                                )}
                            </Button>

                            {/*
                              Senden bleibt gemountet — beim Aus- und Einhaengen
                              verliert das Eingabefeld waehrend des Tippens den Fokus.
                              Statt `invisible` (belegt weiter Platz) kollabiert die
                              Breite: ohne Text sitzen Aufnahme und Verbesserung am
                              rechten Rand, beim ersten Zeichen schiebt Senden sie
                              sanft zur Seite.
                            */}
                            {(() => {
                                const showSend = !!(inputValue.trim() || uploadedFilePreviewUrl || isComposeMode);
                                return (
                                    <Button
                                        type="submit"
                                        tabIndex={showSend ? undefined : -1}
                                        disabled={!showSend || isLoading || isRecording || (isComposeMode && !inputValue.trim())}
                                        className={cn(
                                            'h-9 shrink-0 overflow-hidden rounded-full bg-primary font-medium text-sm text-primary-foreground shadow-md',
                                            'transition-[max-width,opacity,padding,margin] duration-300 ease-out hover:opacity-90',
                                            showSend
                                                ? 'ml-1 max-w-[10rem] px-6 opacity-100'
                                                : 'pointer-events-none ml-0 max-w-0 px-0 opacity-0',
                                        )}
                                        aria-label={t('chat.send')}
                                    >
                                        {isMobile ? <ArrowUp className="w-5 h-5" /> : (isComposeMode ? t('action.create') : t('chat.send'))}
                                    </Button>
                                );
                            })()}
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
                                isPollenModel={visualizeToolState.isPollenModel}
                                isPollinationsVideo={visualizeToolState.isPollinationsVideo}
                                inlineContent={null}
                                onDeactivate={() => setActiveMode('standard')}
                                variant="bare"
                                section="model"
                                disabled={visualizeControlsDisabled}
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
                                isPollenModel={visualizeToolState.isPollenModel}
                                isPollinationsVideo={visualizeToolState.isPollinationsVideo}
                                inlineContent={null}
                                onDeactivate={() => setActiveMode('standard')}
                                variant="bare"
                                section="parameters"
                                disabled={visualizeControlsDisabled}
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
                            <>
                                {webBrowsingEnabled && (
                                    <ResearchDepthBadges
                                        selectedModelId={selectedModelId}
                                        onModelChange={handleModelChange}
                                        disabled={isLoading || isRecording || isTranscribing}
                                    />
                                )}
                            </>
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
