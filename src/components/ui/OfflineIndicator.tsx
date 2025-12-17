"use client";

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            // Show "back online" briefly
            setShowIndicator(true);
            setTimeout(() => setShowIndicator(false), 3000);
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
                    <span>Wieder online</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline – einige Funktionen eingeschränkt</span>
                </>
            )}
        </div>
    );
}

export default OfflineIndicator;
