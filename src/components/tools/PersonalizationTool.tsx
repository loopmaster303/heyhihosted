"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalizationToolProps {
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  replicateToolPassword?: string;
  setReplicateToolPassword?: (password: string) => void;
  pollinationsApiToken?: string;
  setPollinationsApiToken?: (token: string) => void;
}

const PersonalizationTool: React.FC<PersonalizationToolProps> = ({
  userDisplayName,
  setUserDisplayName,
  customSystemPrompt,
  setCustomSystemPrompt,
  replicateToolPassword,
  setReplicateToolPassword,
  pollinationsApiToken,
  setPollinationsApiToken,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-8 no-scrollbar">
      
      <div className="space-y-1">
        <h1 className="text-xl font-code text-foreground">Conversational Personalization</h1>
        <p className="text-xs text-muted-foreground font-code">
          Here you can personalize your conversational experience. Like how the ai has to call you.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-code text-muted-foreground">
          Display Name
        </Label>
        <Input
          id="displayName"
          type="text"
          value={userDisplayName}
          onChange={(e) => setUserDisplayName(e.target.value)}
          placeholder="E.g., Captain Jack"
          className="border-border focus-visible:ring-primary text-base font-code bg-tool-input-bg"
        />
        <p className="text-xs text-muted-foreground font-code pt-1">
          This name can be used by the AI if you reference it in your custom prompt (e.g., "Call me {'{userDisplayName}'}").
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customSystemPrompt" className="text-sm font-code text-muted-foreground">
          Default Response Style (System prompt)
        </Label>
        <Textarea
          id="customSystemPrompt"
          value={customSystemPrompt}
          onChange={(e) => setCustomSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant that calls the user 'Captain'..."
          className="border-border focus-visible:ring-primary min-h-[200px] text-sm font-code leading-relaxed bg-tool-input-bg"
        />
        <div className="font-code text-xs text-muted-foreground space-y-1 pt-1">
            <p>
              Here you can define how the AI should talk to you. This overrides the 'Response Style' in chat.
            </p>
            <p>
              If left empty, the selected 'Response Style' will be used. You can use variables like {'{userDisplayName}'}.
            </p>
        </div>
      </div>
      
      <div className="space-y-1">
        <h1 className="text-xl font-code text-foreground">Tool Access Keys</h1>
        <p className="text-xs text-muted-foreground font-code">
          Enter keys to access certain AI models. These are provided by the developer.
        </p>
      </div>
      
      {setPollinationsApiToken && (
        <div className="space-y-2">
           <Label htmlFor="pollinationsToken" className="text-sm font-code text-muted-foreground">
              Pollinations API Token
            </Label>
          <Input
            id="pollinationsToken"
            type="password"
            value={pollinationsApiToken || ''}
            onChange={(e) => setPollinationsApiToken(e.target.value)}
            placeholder="Enter Pollinations API Token..."
            className="border-border focus-visible:ring-primary text-base font-code bg-tool-input-bg"
          />
           <p className="text-xs text-muted-foreground font-code pt-1">
             Used for all Pollinations-based text and image models.
           </p>
        </div>
      )}
      
      {setReplicateToolPassword && (
        <div className="space-y-2">
            <Label htmlFor="replicatePassword" className="text-sm font-code text-muted-foreground">
              Replicate Tool Password
            </Label>
            <Input
              id="replicatePassword"
              type="password"
              value={replicateToolPassword || ''}
              onChange={(e) => setReplicateToolPassword(e.target.value)}
              placeholder="Enter access key for image-gen/raw..."
              className="border-border focus-visible:ring-primary text-base font-code bg-tool-input-bg"
            />
            <p className="text-xs text-muted-foreground font-code pt-1">
              Used for the `image-gen/raw` tool.
            </p>
        </div>
      )}
      
    </div>
  );
};

export default PersonalizationTool;
