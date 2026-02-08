"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { useComposeMusicState } from '@/hooks/useComposeMusicState';
// import ComposeInputContainer from './compose/ComposeInputContainer';
import { AudioMessage } from '@/components/chat/AudioMessage';
import { Button } from '@/components/ui/button';
import { Music2 } from 'lucide-react';

interface ComposeToolProps {
  onClose?: () => void;
}

interface GeneratedAudio {
  audioUrl: string;
  prompt: string;
  duration: number;
  instrumental: boolean;
  timestamp: string;
}

const ComposeTool: React.FC<ComposeToolProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    duration,
    instrumental,
    isGenerating,
    setDuration,
    setInstrumental,
    generateMusic,
  } = useComposeMusicState();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prompt.trim()) {
      toast({ title: "Prompt Required", variant: "destructive" });
      return;
    }

    toast({ title: "Generating Music...", description: `Creating ${duration}s ${instrumental ? 'instrumental' : 'music'}...` });

    const audioUrl = await generateMusic(prompt);

    if (audioUrl) {
      setGeneratedAudio({
        audioUrl,
        prompt,
        duration,
        instrumental,
        timestamp: new Date().toISOString(),
      });
      toast({ title: "Success!", description: "Your music is ready." });
    } else {
      setError("Music generation failed. Please try again.");
      toast({ title: "Failed", description: "Music generation failed.", variant: "destructive" });
    }
  }, [prompt, duration, instrumental, generateMusic, toast]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="flex-grow flex flex-col border-0 shadow-none">
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex flex-col relative">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 animate-in fade-in">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                  <Music2 className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium animate-pulse text-muted-foreground">
                    🎵 Creating your music...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take 1-3 minutes for longer tracks
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="p-4 rounded-full bg-destructive/10">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Generation Failed</h3>
                  <p className="text-sm opacity-80 max-w-md">{error}</p>
                </div>
                <Button variant="outline" onClick={() => setError(null)} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : generatedAudio ? (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-xl">
                  <AudioMessage
                    audioUrl={generatedAudio.audioUrl}
                    prompt={generatedAudio.prompt}
                    duration={generatedAudio.duration}
                  />
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedAudio(null)}
                      className="text-sm"
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                <Music2 className="w-16 h-16" />
                <p className="text-sm">Describe your music to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* <footer className="px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 pt-2 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto relative">
          <ComposeInputContainer
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            duration={duration}
            instrumental={instrumental}
            onDurationChange={setDuration}
            onInstrumentalChange={setInstrumental}
            loading={isGenerating}
          />
        </div>
      </footer> */}
    </div>
  );
};

export default ComposeTool;
