
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const REASONING_MODELS = [
  { "name": "qwen-coder", "description": "Qwen 2.5 Coder 32B" },
  { "name": "deepseek-reasoning", "description": "DeepSeek R1 0528 (Vertex AI)" },
  { "name": "glm", "description": "GLM-4 9B Chat (Intelligence.io)" },
  { "name": "mistral", "description": "Mistral Small 3.1 24B" },
  { "name": "mistral-roblox", "description": "Mistral Small 3.1 24B (Roblox)" },
  { "name": "openai", "description": "OpenAI GPT-4.1 Nano" },
  { "name": "openai-fast", "description": "OpenAI GPT-4.1 Nano (Fast)" },
  { "name": "openai-large", "description": "OpenAI GPT-4.1" },
  { "name": "openai-roblox", "description": "OpenAI GPT-4.1 Nano (Roblox)" }
];

const DEFAULT_MODEL = "qwen-coder";

const ReasoningTool: React.FC = () => {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim()) {
            toast({ title: "Prompt is empty", description: "Please enter a prompt to continue.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const apiResponse = await fetch('/api/chat/completion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    modelId: selectedModel,
                    systemPrompt: "You are a world-class software engineer and reasoning expert. Provide clear, concise, and accurate explanations and code. Format your response using Markdown.",
                }),
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`);
            }

            const result = await apiResponse.json();
            const responseText = result.choices?.[0]?.message?.content;

            if (!responseText) {
                throw new Error("Received an empty response from the API.");
            }

            setResponse(responseText);

        } catch (err: any) {
            console.error("Reasoning tool error:", err);
            const errorMessage = err.message || "An unknown error occurred.";
            setError(errorMessage);
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }

    }, [prompt, selectedModel, toast]);

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-background text-foreground">
            {/* --- Input Panel --- */}
            <div className="w-full md:w-1/2 flex flex-col p-4 border-r border-border">
                <h2 className="text-lg font-semibold mb-2 font-code">Input Prompt</h2>
                <p className="text-sm text-muted-foreground mb-4 font-code">
                    Describe your problem, ask for a code snippet, or request an explanation.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Explain the difference between `let`, `const`, and `var` in JavaScript and provide a code example for each."
                        className="flex-grow w-full text-base rounded-lg bg-tool-input-bg border-border focus-visible:ring-primary resize-none"
                        disabled={isLoading}
                    />
                    <div className="flex items-center justify-between mt-4">
                        <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                            <SelectTrigger className="w-auto bg-tool-input-bg h-11">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {REASONING_MODELS.map((model) => (
                                    <SelectItem key={model.name} value={model.name}>
                                        {model.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" disabled={isLoading || !prompt.trim()} size="lg">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-5 w-5" />
                            )}
                            Execute
                        </Button>
                    </div>
                </form>
            </div>

            {/* --- Output Panel --- */}
            <div className="w-full md:w-1/2 flex flex-col p-4">
                 <h2 className="text-lg font-semibold mb-2 font-code">AI Response</h2>
                 <p className="text-sm text-muted-foreground mb-4 font-code">
                    The generated explanation or code will appear here.
                </p>
                <ScrollArea className="flex-grow w-full h-0 rounded-lg bg-secondary/30">
                    <div className="p-4">
                        {isLoading && !response && (
                             <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                             </div>
                        )}
                        {error && (
                             <div className="flex flex-col items-center justify-center h-full text-destructive text-center">
                                <AlertCircle className="h-8 w-8 mb-2" />
                                <p className="font-semibold">An Error Occurred</p>
                                <p className="text-sm">{error}</p>
                             </div>
                        )}
                        {!isLoading && !error && !response && (
                             <div className="flex items-center justify-center h-full text-muted-foreground font-code">
                                <p>&lt;/output&gt;</p>
                             </div>
                        )}
                        {response && <MarkdownRenderer content={response} />}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default ReasoningTool;
