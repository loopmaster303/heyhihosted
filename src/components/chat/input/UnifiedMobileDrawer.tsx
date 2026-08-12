'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Paperclip, Settings2, Layers, Music2, ImageIcon, Globe, Code, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export type DrawerSection = 'mode' | 'attachments' | 'model' | 'parameters';

interface UnifiedMobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialSection?: DrawerSection;
    
    // Mode section
    modeContent?: React.ReactNode;
    currentMode?: 'visualize' | 'compose' | 'research' | 'code' | 'standard';
    
    // Attachments section
    attachmentContent?: React.ReactNode;
    
    // Model section
    modelContent?: React.ReactNode;
    currentModelName?: string;
    
    // Parameters section
    parametersContent?: React.ReactNode;
}

const sectionIcons: Record<DrawerSection, React.ReactNode> = {
    mode: <Layers className="w-4 h-4" />,
    attachments: <Paperclip className="w-4 h-4" />,
    model: <Layers className="w-4 h-4" />,
    parameters: <Settings2 className="w-4 h-4" />,
};

const modeIcons = {
    visualize: <ImageIcon className="w-4 h-4" />,
    compose: <Music2 className="w-4 h-4" />,
    research: <Globe className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    standard: <MessageSquare className="w-4 h-4" />,
};

const modeColorMap: Record<string, string> = {
    visualize: 'var(--mode-visualize)',
    compose: 'var(--mode-compose)',
    research: 'var(--mode-research)',
    code: 'var(--mode-code)',
    standard: 'transparent',
};

type SectionDefinition = { id: DrawerSection; label: string; content?: React.ReactNode };

const DrawerSections: React.FC<{
    initialSection: DrawerSection;
    sections: SectionDefinition[];
    modeColor: string;
    noOptionsLabel: string;
}> = ({ initialSection, sections, modeColor, noOptionsLabel }) => {
    const [activeSection, setActiveSection] = useState<DrawerSection>(initialSection);

    return (
        <>
            <div className="flex border-b border-border/20 overflow-x-auto no-scrollbar">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                            'flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                            activeSection === section.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                        )}
                    >
                        {sectionIcons[section.id]}
                        <span>{section.label}</span>
                        {activeSection === section.id && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full" style={{ backgroundColor: modeColor !== 'transparent' ? modeColor : 'var(--primary)' }} />
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
                {sections.find(section => section.id === activeSection)?.content || (
                    <div className="text-sm text-muted-foreground text-center py-8">{noOptionsLabel}</div>
                )}
            </div>
        </>
    );
};

export const UnifiedMobileDrawer: React.FC<UnifiedMobileDrawerProps> = ({
    isOpen,
    onClose,
    initialSection = 'mode',
    modeContent,
    currentMode = 'standard',
    attachmentContent,
    modelContent,
    currentModelName,
    parametersContent,
}) => {
    const { t } = useLanguage();
    const drawerRef = useRef<HTMLDivElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        drawerRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            openerRef.current?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const allSections: Record<DrawerSection, { label: string; content?: React.ReactNode }> = {
        mode: { label: t('menu.section.mode'), content: modeContent },
        attachments: { label: t('menu.section.upload'), content: attachmentContent },
        model: { label: currentModelName || t('menu.section.model'), content: modelContent },
        parameters: { label: t('menu.section.parameters'), content: parametersContent },
    };
    const sections = (Object.keys(allSections) as DrawerSection[])
        .filter(id => allSections[id].content != null)
        .map(id => ({ id, ...allSections[id] }));

    const modeColor = modeColorMap[currentMode];
    const modeLabel = currentMode === 'standard'
        ? t('menu.options')
        : currentMode === 'research'
            ? t('tools.deepResearch')
            : t(`tools.${currentMode}`);
    const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Tab') return;
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeElement = document.activeElement;
        if (event.shiftKey && (activeElement === drawerRef.current || activeElement === first)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (activeElement === drawerRef.current || activeElement === last)) {
            event.preventDefault();
            first.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <button
                type="button"
                aria-label={t('action.close')}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label={modeLabel}
                tabIndex={-1}
                onKeyDown={trapFocus}
                className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-x border-border/30 bg-background/95 backdrop-blur-xl max-h-[75vh] overflow-hidden flex flex-col"
                style={{
                    boxShadow: modeColor !== 'transparent' ? `0 -4px 32px -8px hsl(${modeColor} / 0.15)` : '0 -4px 32px -8px rgba(0,0,0,0.3)',
                }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/20">
                    <div className="flex items-center gap-2">
                        {modeIcons[currentMode]}
                        <span className="text-sm font-medium">
                            {modeLabel}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                        aria-label={t('action.close')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <DrawerSections
                    initialSection={initialSection}
                    sections={sections}
                    modeColor={modeColor}
                    noOptionsLabel={t('menu.noOptions')}
                />
            </div>
        </div>
    );
};
