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
    const baseClasses = "bg-popover/80 text-popover-foreground border border-glass-border shadow-glass-heavy backdrop-blur-xl";
    const roundedClasses = variant === 'modal' ? "rounded-2xl" : "rounded-xl";
    const animationClasses = "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-300 ease-out";

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
    const popupRef = React.useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});

    React.useEffect(() => {
        // Position popup relative to trigger (like other dropdowns)
        if (triggerRef?.current) {
            const updatePosition = () => {
                const rect = triggerRef.current!.getBoundingClientRect();
                const gap = 8; // spacing from trigger
                const maxWidth = window.innerWidth - gap * 2;
                const maxHeight = window.innerHeight - gap * 2;

                // Use real measured size once available; fallback to safe estimates.
                const measured = popupRef.current?.getBoundingClientRect();
                const popupWidth = Math.min(measured?.width ?? 340, maxWidth);
                const popupHeight = Math.min(measured?.height ?? 350, maxHeight);
                const transformOrigin = {
                    'top-left': 'left bottom',
                    'top-right': 'right bottom',
                    'top-center': 'center bottom',
                    'bottom-left': 'left top',
                    'bottom-right': 'right top',
                    'bottom-center': 'center top'
                }[position];

                // Horizontal base
                let left = rect.left;
                if (position === 'top-right' || position === 'bottom-right') {
                    left = rect.right - popupWidth;
                } else if (position === 'top-center' || position === 'bottom-center') {
                    left = rect.left + (rect.width / 2) - (popupWidth / 2);
                }

                // Vertical base
                const shouldPreferTop = position.startsWith('top');
                let top = shouldPreferTop
                    ? rect.top - popupHeight - gap
                    : rect.bottom + gap;

                // If preferred side doesn't fit, flip.
                if (top < gap) {
                    top = rect.bottom + gap;
                } else if (top + popupHeight > window.innerHeight - gap) {
                    top = rect.top - popupHeight - gap;
                }

                // Clamp to viewport as last safety.
                left = Math.max(gap, Math.min(left, window.innerWidth - popupWidth - gap));
                top = Math.max(gap, Math.min(top, window.innerHeight - popupHeight - gap));

                setPopupStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: `${popupWidth}px`,
                    maxHeight: `${Math.max(200, maxHeight)}px`,
                    transformOrigin,
                    zIndex: 50,
                });
            };

            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            const frame = window.requestAnimationFrame(updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
                window.cancelAnimationFrame(frame);
            };
        }
    }, [triggerRef, position]);

    if (triggerRef) {
        return createPortal(
            <div ref={popupRef} style={popupStyle}>
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
    onClose?: () => void;
    closeOnBackdrop?: boolean;
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
    children,
    className,
    maxWidth = 'lg',
    onClose,
    closeOnBackdrop = true
}) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const maxWidthClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    };

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100]"
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div onClick={(event) => event.stopPropagation()} className="relative w-full flex justify-center">
                    <BasePopup variant="modal" className={cn("p-6 w-full shadow-2xl", maxWidthClasses[maxWidth], className)}>
                        {children}
                    </BasePopup>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BasePopup;
