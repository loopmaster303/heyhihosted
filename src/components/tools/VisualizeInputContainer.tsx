'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SlidersHorizontal, Plus, ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { type UnifiedModelConfig } from '@/config/unified-model-configs';
import { imageModelIcons } from '@/config/ui-constants';

import { VisualModelSelector } from './visualize/VisualModelSelector';
import { VisualConfigPanel } from './visualize/VisualConfigPanel';
import { VisualUploadModal } from './visualize/VisualUploadModal';

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

    uploadedImages: string[];
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

    isModelSelectorOpen,
    onModelSelectorToggle,
    isConfigPanelOpen,
    onConfigPanelToggle,
    isImageUploadOpen,
    onImageUploadToggle,

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

    placeholder
}) => {
    const { language, t } = useLanguage();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const placeholderText = placeholder || t('imageGen.placeholder.gptImage');

    const displayModelName = currentModelConfig?.name || t('label.selectModel');

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 260);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [prompt]);

    return (
        <div className="w-full relative">
            {/* Model Selector Popup */}
            <VisualModelSelector
                isOpen={isModelSelectorOpen}
                onClose={onModelSelectorToggle}
                selectedModelId={selectedModelId}
                onModelChange={onModelChange}
            />

            {/* Config Panel */}
            <VisualConfigPanel
                isOpen={isConfigPanelOpen}
                onClose={onConfigPanelToggle}
                currentModelConfig={currentModelConfig}
                selectedModelId={selectedModelId}
                formFields={formFields}
                handleFieldChange={handleFieldChange}
                setFormFields={setFormFields}
                loading={loading}
                isGptImage={isGptImage}
                isSeedream={isSeedream}
                isNanoPollen={isNanoPollen}
                isPollenModel={isPollenModel}
                isPollinationsVideo={isPollinationsVideo}
            />

            {/* Image Upload Pop-up */}
            <VisualUploadModal
                isOpen={isImageUploadOpen}
                onClose={onImageUploadToggle}
                uploadedImages={uploadedImages}
                maxImages={maxImages}
                handleRemoveImage={handleRemoveImage}
                onUploadClick={() => fileInputRef.current?.click()}
                supportsReference={supportsReference}
            />

            <form onSubmit={onSubmit}>
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
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

                    <div className="flex-grow">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder={placeholderText}
                            className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                            rows={1}
                            disabled={loading || disabled}
                            style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                        />
                    </div>

                    <div className="flex w-full items-center justify-between gap-1">
                        {/* Left Side: Settings + Plus Menu */}
                        <div className="flex items-center gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onConfigPanelToggle}
                                className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                aria-label="Settings"
                            >
                                <SlidersHorizontal className="w-[20px] h-[20px]" />
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => supportsReference ? onImageUploadToggle() : fileInputRef.current?.click()}
                                disabled={loading || isUploading || disabled}
                                className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                                aria-label="Upload image"
                            >
                                <Plus className="w-[20px] h-[20px]" />
                            </Button>
                        </div>

                        {/* Right Side: Model Select + Enhance + Generate */}
                        <div className="flex items-center gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onModelSelectorToggle}
                                className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[120px] max-w-[200px]"
                                aria-label="Select model"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-5 h-5 flex-shrink-0">
                                        {imageModelIcons[selectedModelId] ? (
                                            typeof imageModelIcons[selectedModelId] === 'string' ? (
                                                <span className="text-lg">{imageModelIcons[selectedModelId]}</span>
                                            ) : (
                                                <Image
                                                    src={imageModelIcons[selectedModelId]}
                                                    alt={selectedModelId}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-md"
                                                />
                                            )
                                        ) : (
                                            <ImageIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="text-xs md:text-sm font-medium truncate">
                                        {displayModelName}
                                    </span>
                                </div>
                            </Button>

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

                            <Button
                                type="submit"
                                variant="ghost"
                                disabled={loading || isUploading || (!prompt.trim() && uploadedImages.length === 0) || disabled}
                                className="group rounded-lg h-14 w-auto px-4 md:h-12 transition-colors duration-300 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-40 disabled:text-gray-600"
                                aria-label="Generate"
                            >
                                <span className="text-xs md:text-sm font-medium">
                                    {loading ? t('message.loading') : t('action.generate')}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
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
