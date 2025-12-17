import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { modelIcons, modelDisplayMap, featuredModels } from '@/config/ui-constants';

interface ModelSelectorProps {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    isMobile?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModelId,
    onModelChange,
    isMobile = false
}) => {
    const [expanded, setExpanded] = useState(false);

    // Filter featured models
    const featuredList = featuredModels.map(f => AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === f.id)).filter(Boolean);
    // Filter other models
    const otherModels = AVAILABLE_POLLINATIONS_MODELS.filter(m => !featuredModels.some(f => f.id === m.id));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={`group rounded-lg h-14 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white ${isMobile ? 'w-12 px-0' : 'w-auto px-3 min-w-[100px] max-w-[180px] md:max-w-[200px]'
                        }`}
                    aria-label="Select model"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        {/* Model Icon */}
                        <div className="w-5 h-5 flex-shrink-0">
                            {modelIcons[selectedModelId] ? (
                                <Image
                                    src={modelIcons[selectedModelId]}
                                    alt={selectedModelId}
                                    width={20}
                                    height={20}
                                    className="rounded-md"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">
                                        {selectedModelId?.charAt(0)?.toUpperCase() || 'A'}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Model Name - Hidden on mobile */}
                        {!isMobile && (
                            <>
                                <span className="text-xs md:text-sm font-medium truncate">
                                    {modelDisplayMap[selectedModelId] || 'Claude'}
                                </span>
                                <ChevronUp className="w-3 h-3 flex-shrink-0 opacity-60" />
                            </>
                        )}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={cn(
                    "p-0 overflow-y-auto transition-all duration-300 ease-in-out",
                    expanded
                        ? "w-[95vw] md:w-[850px] max-h-[80vh]"
                        : "w-[90vw] sm:w-[340px] max-h-[500px]"
                )}
                align="end"
                side="top"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border/50 sticky top-0 bg-popover z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gradient-to-br" style={{ backgroundImage: 'linear-gradient(to bottom right, hsl(330 65% 62%), rgb(59, 130, 246))' }} />
                            <span className="text-sm font-semibold">KI-Modell wählen</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Wähle das passende Modell für deine Aufgabe</p>
                    </div>
                    {/* Optional: Close Expand Button could go here */}
                </div>

                {/* Content */}
                <div className="p-2">
                    {/* Featured List (Always visible, simpler view) */}
                    <div className={cn(
                        "space-y-1",
                        expanded ? "grid grid-cols-2 gap-2 space-y-0 pb-2 border-b border-border/50 mb-2" : ""
                    )}>
                        {featuredList.map((model) => {
                            if (!model) return null;
                            const config = featuredModels.find(f => f.id === model.id);
                            return (
                                <div
                                    key={model.id}
                                    onClick={() => onModelChange(model.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                                        selectedModelId === model.id
                                            ? "bg-accent border-primary/50 shadow-sm"
                                            : "hover:bg-muted/50 border-transparent hover:border-border/50"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0">
                                        {modelIcons[model.id] ? (
                                            <Image
                                                src={modelIcons[model.id]}
                                                alt={model.name}
                                                width={24}
                                                height={24}
                                                className="rounded-md"
                                            />
                                        ) : (
                                            <span className="text-lg">{config?.emoji}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm truncate">{model.name}</span>
                                            {config?.highlight && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                    {config.highlight}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate opacity-80">
                                            {model.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>


                    {/* Divider / Expand Toggle (Only when NOT expanded) */}
                    {!expanded && otherModels.length > 0 && (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpanded(true);
                            }}
                            className="flex items-center justify-center py-2 cursor-pointer hover:bg-muted/50 rounded-lg mt-1 group gap-2"
                        >
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Alle Modelle anzeigen ({otherModels.length})</span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    )}

                    {/* Other Models (Expanded - TABLE LAYOUT) */}
                    {expanded && (
                        <>
                            <div className="px-2 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1">
                                Erweiterte Modellauswahl
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {otherModels.map((model) => (
                                    <div
                                        key={model.id}
                                        onClick={() => {
                                            onModelChange(model.id);
                                            // Optional: Close expanded view on selection? User might want to browse. 
                                            // Let's keep it open or just let Dropdown close. Dropdown closes automatically on click usually.
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border",
                                            selectedModelId === model.id
                                                ? "bg-accent border-primary/50 shadow-sm"
                                                : "hover:bg-muted/50 border-transparent hover:border-border/50"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0">
                                            {modelIcons[model.id] ? (
                                                <Image
                                                    src={modelIcons[model.id]}
                                                    alt={model.name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-md"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold opacity-50">{model.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm truncate">{model.name}</span>
                                                {model.category === 'Specialized' && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                                        Code
                                                    </span>
                                                )}
                                                {model.reasoning && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                                                        Think
                                                    </span>
                                                )}
                                            </div>
                                            {model.description && (
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground opacity-90 leading-tight">
                                                    {model.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpanded(false);
                                }}
                                className="flex items-center justify-center py-2 cursor-pointer hover:bg-muted/50 rounded-lg mt-3 group gap-2 border-t border-border/30"
                            >
                                <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Weniger anzeigen</span>
                            </div>
                        </>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
