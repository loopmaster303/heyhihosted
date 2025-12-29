'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ModelSelector } from '@/components/chat/input/ModelSelector';
import { VisualModelSelector } from '@/components/tools/visualize/VisualModelSelector';
import { ParticleText } from '@/components/particle-text';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

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
    const visualizePanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useOnClickOutside([visualizePanelRef], () => {
        if (isVisualModelSelectorOpen) {
            onVisualModelSelectorToggle?.();
        }
    });

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
                    <div ref={visualizePanelRef} className="relative">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onVisualModelSelectorToggle}
                            className={cn(
                                "group rounded-lg h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white",
                                isMobile ? "w-auto px-3" : "w-auto px-4"
                            )}
                            aria-label="Select model"
                        >
                            <div className="flex items-center truncate max-w-full">
                                {/* Visual Name Shader - Hidden on mobile, replaced by static text */}
                                {!isMobile ? (
                                    <div className="flex items-center">
                                        <div
                                            className="h-14 flex items-center justify-center relative"
                                            style={{ width: `${Math.max(visualDisplayName.length * 22, 150)}px` }}
                                        >
                                            <ParticleText
                                                key={visualDisplayName}
                                                text={visualDisplayName}
                                                canvasHeight={56}
                                                className="pointer-events-auto"
                                            />
                                        </div>
                                        <ChevronDown className="w-6 h-6 flex-shrink-0 text-pink-500 opacity-100 ml-1" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                         <span className="text-sm font-semibold truncate max-w-[120px]">{visualDisplayName}</span>
                                         <ChevronDown className="w-5 h-5 flex-shrink-0 text-pink-500 opacity-100" />
                                    </div>
                                )}
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
