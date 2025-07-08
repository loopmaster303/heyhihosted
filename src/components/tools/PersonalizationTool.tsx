
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCog, Database, KeyRound } from 'lucide-react';

interface PersonalizationToolProps {
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  replicateToolPassword?: string;
  setReplicateToolPassword?: (password: string) => void;
}

const PersonalizationTool: React.FC<PersonalizationToolProps> = ({
  userDisplayName,
  setUserDisplayName,
  customSystemPrompt,
  setCustomSystemPrompt,
  replicateToolPassword,
  setReplicateToolPassword,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-6 md:space-y-8">
      
      <div className="space-y-2 mb-4">
        <h1 className="text-2xl font-code font-semibold text-foreground">Conversational Personalization</h1>
        <p className="text-sm text-muted-foreground font-code">
          Here you can personalize your conversational experience. Like how the ai has to call you.
        </p>
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
          This name can be used by the AI if you reference it in your custom prompt (e.g., "Call me {'{userDisplayName}'}").
        </p>
      </div>

      <div className="space-y-3 bg-card p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="customSystemPrompt" className="text-lg font-code text-foreground/90">
            Default Response Style (System prompt)
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
            <p>
                Here you can define exactly how the AI should talk to you. This will override the 'Response Style' you selected in the chat.
            </p>
            <p>
                You can write your own rules, or paste in an existing one (like the 'Basic' style prompt) and modify it.
            </p>
            <p>
                If left empty, the selected 'Response Style' will be used. You can use variables like {'{userDisplayName}'}.
            </p>
        </div>
      </div>

      {setReplicateToolPassword && (
         <div className="space-y-3 bg-card p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="replicatePassword" className="text-lg font-code text-foreground/90">
              Premium Tool Password
            </Label>
          </div>
          <Input
            id="replicatePassword"
            type="password"
            value={replicateToolPassword || ''}
            onChange={(e) => setReplicateToolPassword(e.target.value)}
            placeholder="Enter password for premium tools"
            className="bg-input border-border focus-visible:ring-primary text-base font-code"
          />
          <p className="text-xs text-muted-foreground font-code">
            A password may be required to use the 'premium imagination' tool. Provided by the developer.
          </p>
        </div>
      )}
      
    </div>
  );
};

export default PersonalizationTool;
