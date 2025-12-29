"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface BasePopupProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'contextual' | 'modal';
}

const BasePopup: React.FC<BasePopupProps> = ({
    children,
    className,
    variant = 'contextual'
}) => {
    const baseClasses = "bg-popover text-popover-foreground border border-border shadow-xl";
    const roundedClasses = variant === 'modal' ? "rounded-2xl" : "rounded-xl";
    const animationClasses = "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-200 ease-out";

    return (
        <div className={cn(baseClasses, roundedClasses, animationClasses, className)}>
            {children}
        </div>
    );
};

interface ContextualPopupProps {
    children: React.ReactNode;
    className?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    triggerRef?: React.RefObject<HTMLElement>;
}

export const ContextualPopup: React.FC<ContextualPopupProps> = ({
    children,
    className,
    position = 'bottom-left',
    triggerRef
}) => {
    const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});

    React.useEffect(() => {
        // Position popup relative to trigger (like other dropdowns)
        if (triggerRef?.current) {
            const updatePosition = () => {
                const rect = triggerRef.current!.getBoundingClientRect();
                const popupWidth = 340; // min-w-[340px] from Quick Settings
                const popupHeight = 350; // approximate height
                const gap = 8; // spacing from trigger
                const transformOrigin = {
                    'top-left': 'left bottom',
                    'top-right': 'right bottom',
                    'top-center': 'center bottom',
                    'bottom-left': 'left top',
                    'bottom-right': 'right top',
                    'bottom-center': 'center top'
                }[position];

                // Calculate position above the trigger
                let top = rect.top - popupHeight - gap;
                let left = rect.left;

                // For "top-center" position, center horizontally relative to trigger
                if (position === 'top-center') {
                    left = rect.left + (rect.width / 2) - (popupWidth / 2);
                }

                // Adjust if popup would go off-screen horizontally
                if (left < gap) {
                    left = gap;
                } else if (left + popupWidth > window.innerWidth - gap) {
                    left = window.innerWidth - popupWidth - gap;
                }

                // Adjust if popup would go off-screen vertically
                if (top < gap) {
                    // If not enough space above, position below
                    top = rect.bottom + gap;
                }

                setPopupStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${left}px`,
                    transformOrigin,
                    zIndex: 50,
                });
            };

            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [triggerRef, position]);

    if (triggerRef?.current) {
        return createPortal(
            <div style={popupStyle}>
                <BasePopup variant="contextual" className={cn("p-4", className)}>
                    {children}
                </BasePopup>
            </div>,
            document.body
        );
    }

    // Fallback für alte Implementierung ohne triggerRef
    const positionClasses = {
        'top-left': 'bottom-full left-0 mb-2',
        'top-right': 'bottom-full right-0 mb-2',
        'bottom-left': 'top-full left-0 mt-2',
        'bottom-right': 'top-full right-0 mt-2',
        'top-center': 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        'bottom-center': 'top-full left-1/2 transform -translate-x-1/2 mt-2'
    };

    return (
        <div className={cn("absolute z-[99]", positionClasses[position])}>
            <BasePopup variant="contextual" className={cn("p-4", className)}>
                {children}
            </BasePopup>
        </div>
    );
};

interface ModalPopupProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
    children,
    className,
    maxWidth = 'lg'
}) => {
    const maxWidthClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <BasePopup variant="modal" className={cn("p-6 w-full", maxWidthClasses[maxWidth], className)}>
                    {children}
                </BasePopup>
            </div>
        </div>
    );
};

export default BasePopup;
