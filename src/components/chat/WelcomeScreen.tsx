
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
    onSuggestionClick: (text: string) => void;
    onModeChange: (mode: 'chat' | 'visualize') => void;
    userDisplayName?: string;
    activeMode?: 'chat' | 'visualize';
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuggestionClick, onModeChange, userDisplayName = 'John', activeMode = 'chat' }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'chat' | 'visualize'>(activeMode);
    const [inputValue, setInputValue] = useState('');

    // Sync internal state if prop changes (optional but good for consistency)
    useEffect(() => {
        setActiveTab(activeMode);
    }, [activeMode]);

    const handleTabChange = (tab: 'chat' | 'visualize') => {
        setActiveTab(tab);
        onModeChange(tab);
    };

    const handleSubmit = () => {
        if (inputValue.trim()) {
            // The parent component will handle the actual navigation/mode change based on onModeChange
            // and the current activeMode. This component just passes the input.
            onSuggestionClick(inputValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const suggestions = [
        "Erkläre mir, wie 'Large Language Models' eigentlich funktionieren.",
        "Zeig mir ein einfaches Python-Skript für meinen ersten Discord-Bot.",
        "Was sind 'Prompt Injection' Angriffe und wie schütze ich mich?",
        "Visualiziere die Architektur eines neuronalen Netzes."
    ];

    const imageSuggestions = [
        "Eine futuristische Stadt im Neon-Cyberpunk Stil, Regen, Nacht",
        "Ein Portrait einer Katze als Astronaut im Weltraum, digital art",
        "Abstrakte 3D-Formen aus Glas und Licht, 8k render"
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 animate-in fade-in-50 zoom-in-95 duration-500">

            {/* Dynamic Spacer for vertical centering */}
            <div className="flex-1" />

            {/* Hero Content */}
            <div className="w-full max-w-3xl flex flex-col items-center gap-8 md:gap-10 mb-10">

                {/* Neon Branding */}
                <h1 className="font-code text-4xl md:text-6xl font-bold tracking-tight text-center">
                    <span className="text-muted-foreground opacity-50">(</span>
                    <span className="text-pink-500 shadow-pink-500/50 drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]">!hey.hi</span>
                    <span className="text-muted-foreground opacity-50 mx-3">=</span>
                    <span className="text-purple-500 shadow-purple-500/50 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                        {`'${userDisplayName?.toLowerCase() || 'john'}'`}
                    </span>
                    <span className="text-muted-foreground opacity-50">)</span>
                </h1>

                <p className="text-center text-muted-foreground max-w-lg mx-auto -mt-4 text-sm md:text-base">
                    Zugang zu Wissen und Werkzeugen für alle. <br />
                    Experimentiere, lerne und erschaffe Neues – ohne Barrieren.
                </p>

                {/* Mode Toggle */}
                <div className="bg-muted/30 p-1 rounded-full flex items-center gap-1 border border-border/40">
                    <button
                        onClick={() => handleTabChange('chat')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === 'chat'
                                ? "bg-muted/80 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        Gespräch
                    </button>
                    <button
                        onClick={() => handleTabChange('visualize')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            activeTab === 'visualize'
                                ? "bg-muted/80 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        Visualisieren
                    </button>
                </div>

                {/* Central Input Box */}
                <div className="w-full relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-[2rem] blur opacity-30 group-hover:opacity-75 transition duration-500" />
                    <div className="relative bg-muted/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-2 pl-4 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeTab === 'chat' ? "Worüber möchtest du sprechen?" : "Was möchtest du erschaffen? Beschreibe dein Bild..."}
                            className="w-full bg-transparent border-none shadow-none resize-none placeholder:text-muted-foreground focus-visible:ring-0 p-2 min-h-[50px] max-h-[220px]"
                            style={{ lineHeight: '1.5rem', fontSize: '16px' }}
                        />

                        {/* Suggestion Chips (inside or directly below input for quick access) */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(activeTab === 'chat' ? suggestions : imageSuggestions).map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInputValue(s);
                                        // Optional: auto-submit on chip click? user might want to edit.
                                        // Let's just set value for now.
                                    }}
                                    className="bg-muted/40 hover:bg-muted/70 text-xs md:text-sm px-3 py-1.5 rounded-lg text-muted-foreground transition-colors text-left"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={!inputValue.trim()}
                                className={cn(
                                    "rounded-xl px-6 transition-all duration-300",
                                    inputValue.trim() ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                                )}
                            >
                                Los geht&apos;s
                            </Button>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex-1" />
        </div>
    );
};

export default WelcomeScreen;
