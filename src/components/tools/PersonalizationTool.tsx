
"use client";

import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, UserCog, Database, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PersonalizationToolProps {
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  onSave: () => void; // Callback to trigger saving to localStorage from page.tsx
}

const PersonalizationTool: React.FC<PersonalizationToolProps> = ({
  userDisplayName,
  setUserDisplayName,
  customSystemPrompt,
  setCustomSystemPrompt,
  onSave
}) => {
  const { toast } = useToast();

  const handleSaveSettings = () => {
    onSave(); // This will trigger the useEffect in page.tsx to save to localStorage
    toast({
      title: "Settings Saved",
      description: "Your personalization settings have been updated.",
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex items-center space-x-3 mb-4">
        <SlidersHorizontal className="h-7 w-7 text-foreground/80" />
        <h1 className="text-3xl font-code font-semibold text-foreground">Personalization</h1>
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
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveSettings} className="font-code text-base px-6 py-3">
          <Save className="mr-2 h-5 w-5" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default PersonalizationTool;
