'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ModelSelector } from '@/components/chat/input/ModelSelector';
import { VisualModelSelector } from '@/components/tools/visualize/VisualModelSelector';
import { ParticleText } from '@/components/particle-text';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { getUnifiedModel } from '@/config/unified-image-models';

interface TopModelBarProps {
    appState: 'chat' | 'visualize';
    sidebarExpanded: boolean;
    // Chat Props
    selectedModelId?: string;
    onModelChange?: (modelId: string) => void;
    // Visualize Props
    visualSelectedModelId?: string;
    onVisualModelChange?: (modelId: string) => void;
    isVisualModelSelectorOpen?: boolean;
    onVisualModelSelectorToggle?: () => void;
}

export const TopModelBar: React.FC<TopModelBarProps> = ({
    appState,
    sidebarExpanded,
    selectedModelId,
    onModelChange,
    visualSelectedModelId,
    onVisualModelChange,
    isVisualModelSelectorOpen = false,
    onVisualModelSelectorToggle,
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get visual model display name
    const visualModelConfig = visualSelectedModelId ? getUnifiedModel(visualSelectedModelId) : null;
    const visualDisplayName = visualModelConfig?.name || 'Modell wählen';

    return (
        <div className={cn(
            "fixed top-6 z-[100] transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2",
            sidebarExpanded && !isMobile ? "translate-x-[-50%] md:ml-36" : "translate-x-[-50%]"
        )}>
            <div className="bg-transparent px-2 py-1.5 flex items-center justify-center">
                {appState === 'chat' && (
                    <ModelSelector
                        selectedModelId={selectedModelId || 'claude'}
                        onModelChange={onModelChange || (() => { })}
                        isMobile={isMobile}
                    />
                )}

                {appState === 'visualize' && (
                    <div className="relative">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onVisualModelSelectorToggle}
                            className={cn(
                                "group rounded-lg h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white",
                                isMobile ? "w-12 px-0" : "w-auto px-4"
                            )}
                            aria-label="Select model"
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                {/* Visual Name Shader - Hidden on mobile */}
                                {!isMobile && (
                                    <div className="w-[480px] h-12 flex items-center justify-center relative">
                                        <ParticleText
                                            key={visualDisplayName}
                                            text={visualDisplayName}
                                            fontSize={32}
                                            canvasHeight={48}
                                            baseSpacing={3}
                                            particleSize={2.5}
                                            mouseRepelRadius={60}
                                            className="pointer-events-auto"
                                        />
                                    </div>
                                )}
                                <ChevronDown className="w-6 h-6 flex-shrink-0 text-pink-500 opacity-100 ml-1" />
                            </div>
                        </Button>

                        <VisualModelSelector
                            isOpen={isVisualModelSelectorOpen}
                            onClose={() => onVisualModelSelectorToggle?.()}
                            selectedModelId={visualSelectedModelId || 'flux-2-pro'}
                            onModelChange={onVisualModelChange || (() => { })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
