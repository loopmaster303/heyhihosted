'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, Music2, Globe, Code, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export type VisualCornerMode = 'visualize' | 'compose' | 'research' | 'code' | 'standard';

interface VisualCornerProps {
    mode: VisualCornerMode;
    className?: string;
}

const modeConfig: Record<VisualCornerMode, { labelKey?: string; icon: React.ReactNode; colorVar: string }> = {
    visualize: {
        labelKey: 'tools.visualize',
        icon: <ImageIcon className="w-4 h-4" />,
        colorVar: 'var(--mode-visualize)',
    },
    compose: {
        labelKey: 'tools.compose',
        icon: <Music2 className="w-4 h-4" />,
        colorVar: 'var(--mode-compose)',
    },
    research: {
        labelKey: 'tools.deepResearch',
        icon: <Globe className="w-4 h-4" />,
        colorVar: 'var(--mode-research)',
    },
    code: {
        labelKey: 'tools.code',
        icon: <Code className="w-4 h-4" />,
        colorVar: 'var(--mode-code)',
    },
    standard: {
        icon: <MessageSquare className="w-4 h-4" />,
        colorVar: 'transparent',
    },
};

export const VisualCorner: React.FC<VisualCornerProps> = ({ mode, className }) => {
    const { t } = useLanguage();
    if (mode === 'standard') return null;

    const config = modeConfig[mode];

    return (
        <div
            className={cn(
                'absolute pointer-events-none select-none',
                'bottom-0 left-0',
                // Desktop: prominent corner
                'w-[45%] h-[55%] max-w-[180px] max-h-[120px]',
                // Mobile: much smaller, purely decorative
                'max-sm:w-[28%] max-sm:h-[32%] max-sm:max-w-[100px] max-sm:max-h-[70px]',
                'opacity-[0.12]',
                className
            )}
            style={{
                background: `linear-gradient(135deg, hsl(${config.colorVar} / 0.9) 0%, transparent 70%)`,
                borderTopRightRadius: '28px',
                borderBottomLeftRadius: '28px',
            }}
            aria-hidden="true"
        >
            <div className="absolute bottom-3 left-3 max-sm:bottom-2 max-sm:left-2 flex items-center gap-1.5 max-sm:gap-1 text-foreground/70">
                {config.icon}
                <span className="text-[10px] max-sm:text-[8px] font-bold tracking-[0.15em] uppercase">
                    {config.labelKey ? t(config.labelKey) : ''}
                </span>
            </div>
        </div>
    );
};
