"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
        />
    );
}

export function MessageSkeleton() {
    return (
        <div className="flex gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
}

export function ChatLoadingSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <MessageSkeleton />
            <MessageSkeleton />
            <div className="flex gap-3 p-4 justify-end">
                <div className="flex-1 space-y-2 max-w-[60%]">
                    <Skeleton className="h-4 w-full ml-auto" />
                    <Skeleton className="h-4 w-2/3 ml-auto" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
            <MessageSkeleton />
        </div>
    );
}

export default Skeleton;
