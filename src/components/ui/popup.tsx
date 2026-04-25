"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Variant = 'contextual' | 'modal';

interface BasePopupProps {
    children: React.ReactNode;
    className?: string;
    variant?: Variant;
}

function useMotionPopupProps(variant: Variant) {
    const prefersReducedMotion = useReducedMotion();
    if (prefersReducedMotion) {
        return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.12 },
        };
    }
    const fromY = variant === 'modal' ? 8 : 6;
    return {
        initial: { opacity: 0, scale: 0.96, y: fromY },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: fromY / 2 },
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
    };
}

const BasePopupSurface = React.forwardRef<HTMLDivElement, BasePopupProps>(
    ({ children, className, variant = 'contextual' }, ref) => {
        const baseClasses =
            "bg-popover/80 text-popover-foreground border border-glass-border shadow-glass-heavy backdrop-blur-xl";
        const roundedClasses = variant === 'modal' ? "rounded-2xl" : "rounded-xl";
        const motionProps = useMotionPopupProps(variant);

        return (
            <motion.div
                ref={ref}
                className={cn(baseClasses, roundedClasses, className)}
                {...motionProps}
            >
                {children}
            </motion.div>
        );
    }
);
BasePopupSurface.displayName = 'BasePopupSurface';

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
        if (triggerRef?.current) {
            const updatePosition = () => {
                const rect = triggerRef.current!.getBoundingClientRect();
                const gap = 8;
                const maxWidth = window.innerWidth - gap * 2;
                const maxHeight = window.innerHeight - gap * 2;

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

                let left = rect.left;
                if (position === 'top-right' || position === 'bottom-right') {
                    left = rect.right - popupWidth;
                } else if (position === 'top-center' || position === 'bottom-center') {
                    left = rect.left + (rect.width / 2) - (popupWidth / 2);
                }

                const shouldPreferTop = position.startsWith('top');
                let top = shouldPreferTop
                    ? rect.top - popupHeight - gap
                    : rect.bottom + gap;

                if (top < gap) {
                    top = rect.bottom + gap;
                } else if (top + popupHeight > window.innerHeight - gap) {
                    top = rect.top - popupHeight - gap;
                }

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
                <BasePopupSurface variant="contextual" className={cn("p-4", className)}>
                    {children}
                </BasePopupSurface>
            </div>,
            document.body
        );
    }

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
            <BasePopupSurface variant="contextual" className={cn("p-4", className)}>
                {children}
            </BasePopupSurface>
        </div>
    );
};

interface ModalPopupProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    onClose?: () => void;
    closeOnBackdrop?: boolean;
    /**
     * When provided, ModalPopup controls its own mount via AnimatePresence so the
     * exit animation can play. Consumers pass `open={isOpen}` and always render
     * the component. If omitted, the popup mounts immediately (legacy behavior).
     */
    open?: boolean;
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
    children,
    className,
    maxWidth = 'lg',
    onClose,
    closeOnBackdrop = true,
    open,
}) => {
    const [mounted, setMounted] = React.useState(false);
    const prefersReducedMotion = useReducedMotion();

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

    const isVisible = open === undefined ? true : open;

    const content = (
        <motion.div
            key="modal-popup"
            className="fixed inset-0 z-[100]"
            onClick={closeOnBackdrop ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.08 : 0.16, ease: 'easeOut' }}
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    onClick={(event) => event.stopPropagation()}
                    className="relative w-full flex justify-center"
                >
                    <BasePopupSurface
                        variant="modal"
                        className={cn("p-6 w-full shadow-2xl", maxWidthClasses[maxWidth], className)}
                    >
                        {children}
                    </BasePopupSurface>
                </div>
            </div>
        </motion.div>
    );

    return createPortal(
        <AnimatePresence>{isVisible ? content : null}</AnimatePresence>,
        document.body
    );
};

export default BasePopupSurface;
