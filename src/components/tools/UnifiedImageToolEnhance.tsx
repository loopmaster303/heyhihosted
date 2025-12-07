"use client";

/* eslint-disable react-hooks/exhaustive-deps */

/**
 * Enhance Prompt functionality for UnifiedImageTool
 * Extracted to separate file due to size constraints
 */

import React, { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from 'lucide-react';

interface EnhancePromptProps {
  prompt: string;
  selectedModelId: string;
  onPromptEnhanced: (enhancedPrompt: string) => void;
  disabled?: boolean;
  className?: string;
}

const EnhancePrompt: React.FC<EnhancePromptProps> = ({
  prompt,
  selectedModelId,
  onPromptEnhanced,
  disabled = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || !selectedModelId || isEnhancing || disabled) {
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          modelId: selectedModelId,
          language: 'de', // Kann später vom LanguageProvider kommen
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Enhancement API error:', errorData);
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const result = await response.json();
      
      if (result.enhancedPrompt) {
        onPromptEnhanced(result.enhancedPrompt);
        toast({
          title: "Prompt Enhanced",
          description: "Your prompt has been improved using AI.",
        });
      } else {
        throw new Error('No enhanced prompt returned');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Could not enhance prompt.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  }, [prompt, selectedModelId, onPromptEnhanced, disabled, toast]);

  return (
    <button
      type="button"
      onClick={handleEnhancePrompt}
      disabled={!prompt.trim() || disabled || isEnhancing}
      className={`h-11 px-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 text-foreground disabled:opacity-40 ${className}`}
      title="Enhance prompt with AI"
    >
      {isEnhancing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Enhance prompt
    </button>
  );
};

export default EnhancePrompt;
