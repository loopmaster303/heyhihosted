'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UnifiedInput } from '@/components/ui/unified-input';
import { SlidersHorizontal, Plus, Loader2, ArrowUp } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { type UnifiedModelConfig } from '@/config/unified-model-configs';
import { VisualizeInlineHeader } from './visualize/VisualizeInlineHeader';
import type { UploadedReference } from '@/types';

interface VisualizeInputContainerProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;

    // State from Hook
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    formFields: Record<string, any>;
    handleFieldChange: (name: string, value: any) => void;
    setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;

    uploadedImages: UploadedReference[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: (index: number) => void;

    // UI State
    isModelSelectorOpen: boolean;
    onModelSelectorToggle: () => void;
    isConfigPanelOpen: boolean;
    onConfigPanelToggle: () => void;
    isImageUploadOpen: boolean;
    onImageUploadToggle: () => void;

    // Status
    loading?: boolean;
    disabled?: boolean;
    isEnhancing?: boolean;
    isUploading?: boolean;
    onEnhancePrompt: () => void;

    // Computed
    currentModelConfig?: UnifiedModelConfig;
    supportsReference: boolean;
    maxImages: number;
    isGptImage: boolean;
    isSeedream: boolean;
    isNanoPollen: boolean;
    isPollenModel: boolean;
    isPollinationsVideo: boolean;

    placeholder?: string;
    showInlineSettings?: boolean;
}

const VisualizeInputContainer: React.FC<VisualizeInputContainerProps> = ({
    prompt,
    onPromptChange,
    onSubmit,

    selectedModelId,
    onModelChange,
    formFields,
    handleFieldChange,
    setFormFields,

    uploadedImages,
    handleFileChange,
    handleRemoveImage,

    loading = false,
    disabled = false,
    isEnhancing = false,
    isUploading = false,
    onEnhancePrompt,

    currentModelConfig,
    supportsReference,
    maxImages,
    isGptImage,
    isSeedream,
    isNanoPollen,
    isPollenModel,
    isPollinationsVideo,

    placeholder,
    showInlineSettings = false,
}) => {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const placeholderText = placeholder || t('imageGen.placeholder.gptImage');

    const canSubmit = !loading && !isUploading && (prompt.trim() || uploadedImages.length > 0) && !disabled;

    // Drawer State for Shadcn Drawers
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <div className="w-full relative">
            <form onSubmit={onSubmit}>
                <UnifiedInput
                    value={prompt}
                    onChange={(val) => onPromptChange(val)}
                    placeholder={placeholderText}
                    isLoading={loading}
                    disabled={loading || disabled}
                    topElements={showInlineSettings ? (
                        <VisualizeInlineHeader
                            selectedModelId={selectedModelId}
                            onModelChange={onModelChange}
                            currentModelConfig={currentModelConfig}
                            formFields={formFields}
                            handleFieldChange={handleFieldChange}
                            setFormFields={setFormFields}
                            isGptImage={isGptImage}
                            isSeedream={isSeedream}
                            isNanoPollen={isNanoPollen}
                            isPollenModel={isPollenModel}
                            isPollinationsVideo={isPollinationsVideo}
                            variant="bare"
                            disabled={loading || disabled}
                        />
                    ) : undefined}
                    topElementsVariant="bare"
                    leftActions={
                        <div className="flex items-center gap-0">
                            {/* Upload Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading || isUploading || disabled || (supportsReference && uploadedImages.length >= maxImages)}
                                className={cn(
                                    "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",
                                    "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                                )}
                                aria-label="Upload image"
                            >
                                <Plus className="w-[20px] h-[20px]" />
                            </Button>
                        </div>
                    }

                    rightActions={
                         <div className="flex items-center gap-0">
                            {/* Enhance - Hidden on Mobile */}
                            <div className="hidden md:flex">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onEnhancePrompt}
                                    disabled={!prompt.trim() || loading || isEnhancing || isUploading || disabled}
                                    className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                                    aria-label="Enhance prompt"
                                >
                                    <span className="text-xs md:text-sm font-medium">
                                        {isEnhancing ? t('message.loading') : t('action.enhancePrompt')}
                                    </span>
                                </Button>
                            </div>

                            {/* Generate Button - Arrow on mobile, text on desktop */}
                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className={`group rounded-lg transition-all duration-300 ${
                                    'h-10 w-10 p-0 md:h-14 md:w-auto md:px-4 md:py-0' 
                                    } ${canSubmit
                                        ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600'
                                    }`}
                                aria-label="Generate"
                            >
                                {/* Mobile Icon */}
                                <ArrowUp className="w-5 h-5 md:hidden" />
                                {/* Desktop Text */}
                                <span className="hidden md:inline text-xs md:text-sm font-medium">
                                    {loading ? t('message.loading') : t('action.generate')}
                                </span>
                            </Button>
                        </div>
                    }
                >
                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-x-4 top-3 z-10">
                            <div className="rounded-xl bg-black/70 text-white px-4 py-3 text-sm md:text-base shadow-lg flex items-start gap-2">
                                <Loader2 className="h-4 w-4 mt-0.5 animate-spin" />
                                <div className="leading-snug">
                                    {t('message.generating')}
                                </div>
                            </div>
                        </div>
                    )}
                </UnifiedInput>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </form>
        </div>
    );
};

export default VisualizeInputContainer;
