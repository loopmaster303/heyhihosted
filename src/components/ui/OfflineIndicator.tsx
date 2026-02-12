"use client";

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

export function OfflineIndicator() {
    const { t } = useLanguage();
    const [isOnline, setIsOnline] = useState(
        () => (typeof navigator !== 'undefined' ? navigator.onLine : true)
    );
    const [showIndicator, setShowIndicator] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Show "back online" briefly
            setShowIndicator(true);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            hideTimeoutRef.current = setTimeout(() => {
                setShowIndicator(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowIndicator(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    // Don't render if online and indicator not showing
    if (isOnline && !showIndicator) return null;

    return (
        <div
            className={cn(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "text-sm font-medium shadow-lg transition-all duration-300",
                isOnline
                    ? "bg-green-500/90 text-white"
                    : "bg-red-500/90 text-white animate-pulse"
            )}
        >
            {isOnline ? (
                <>
                    <Wifi className="w-4 h-4" />
                    <span>{t('status.onlineAgain')}</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>{t('status.offlineLimited')}</span>
                </>
            )}
        </div>
    );
}

export default OfflineIndicator;
