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
