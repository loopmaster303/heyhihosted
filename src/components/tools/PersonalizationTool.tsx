
"use client";

import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, UserCog, Database, KeyRound, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import useUsageToken from '@/hooks/useUsageToken';

interface PersonalizationToolProps {
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
}

const PersonalizationTool: React.FC<PersonalizationToolProps> = ({
  userDisplayName,
  setUserDisplayName,
  customSystemPrompt,
  setCustomSystemPrompt,
}) => {
  const { 
    token, 
    setToken, 
    isValid, 
    remainingUses, 
    isLoading, 
    error,
    validateToken 
  } = useUsageToken();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex items-center space-x-3 mb-4">
        <SlidersHorizontal className="h-7 w-7 text-foreground/80" />
        <h1 className="text-3xl font-code font-semibold text-foreground">Personalization</h1>
      </div>
      
      <div className="space-y-3 bg-card p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="usageToken" className="text-lg font-code text-foreground/90">
            Premium Usage Token
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            id="usageToken"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter token provided by developer"
            className="bg-input border-border focus-visible:ring-primary text-base font-code"
          />
          <Button onClick={validateToken} disabled={isLoading || !token}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground font-code h-4 mt-2">
          {isLoading && <p className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Validating...</p>}
          {error && !isLoading && <p className="flex items-center gap-1.5 text-destructive"><AlertTriangle className="h-3 w-3" />{error}</p>}
          {!isLoading && !error && token && isValid && <p className="flex items-center gap-1.5 text-green-400"><CheckCircle className="h-3 w-3" />Token valid. Remaining premium uses: {remainingUses}</p>}
          {!isLoading && !error && !token && <p>A token is required to use the 'premium imagination' tool.</p>}
        </div>
      </div>

      <div className="space-y-3 bg-card p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <UserCog className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="displayName" className="text-lg font-code text-foreground/90">
            Display Name
          </Label>
        </div>
        <Input
          id="displayName"
          type="text"
          value={userDisplayName}
          onChange={(e) => setUserDisplayName(e.target.value)}
          placeholder="E.g., Captain Jack"
          className="bg-input border-border focus-visible:ring-primary text-base font-code"
        />
        <p className="text-xs text-muted-foreground font-code">
          This name can be used by the AI if you reference it in your custom prompt (e.g., "Call me {userDisplayName}").
        </p>
      </div>

      <div className="space-y-3 bg-card p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="customSystemPrompt" className="text-lg font-code text-foreground/90">
            Custom System Prompt
          </Label>
        </div>
        <Textarea
          id="customSystemPrompt"
          value={customSystemPrompt}
          onChange={(e) => setCustomSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant that calls the user 'Captain'..."
          className="bg-input border-border focus-visible:ring-primary min-h-[250px] text-sm font-code leading-relaxed"
        />
        <div className="font-code text-xs text-muted-foreground space-y-1 mt-2">
          <p>This section is a customization area to define the AI's behavior and persona for "long language loops".</p>
          <p>You can also include your preferences for how the AI should respond.</p>
          <p className="mt-2 font-medium text-foreground/70">Examples:</p>
          <ul className="list-disc list-inside pl-2">
            <li>You are a pirate with a blunt and witty personality.</li>
            <li>You always respond casually, like talking to a close friend.</li>
            <li>Call me {userDisplayName || 'User'} and always ask for my quest.</li>
            <li>And so on...</li>
          </ul>
          <p className="mt-2">Supports Markdown and JSON format (for structured output if model supports it).</p>
           <p className="mt-1">If left empty, the selected 'Response Style' will be used.</p>
        </div>
      </div>
      
    </div>
  );
};

export default PersonalizationTool;
