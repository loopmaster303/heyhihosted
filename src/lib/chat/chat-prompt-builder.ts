import { CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';

interface BuildChatSystemPromptInput {
  baseStylePrompt: string;
  selectedModelId: string;
  language: string;
  userDisplayName?: string;
  customSystemPrompt?: string;
  isRegeneration?: boolean;
}

interface BuildSystemPromptForRequestInput {
  effectiveSystemPrompt: string;
  isCodeMode: boolean;
  olderSummaryBlock?: string;
}

const RUNTIME_CONTEXT = `
<runtime_context>
    Environment: hey.hi web-interface
</runtime_context>`;

const REGENERATION_INSTRUCTION =
  'Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers. Wiederhole deine vorherige Antwort nicht. Biete eine andere Perspektive oder einen anderen Stil.';

function supportsHiddenReasoning(selectedModelId: string): boolean {
  return (
    selectedModelId.startsWith('claude') ||
    selectedModelId.startsWith('openai') ||
    selectedModelId === 'grok'
  );
}

function buildLanguageHint(language: string): string {
  return language === 'de'
    ? 'User interface language: German. Default response language: German.'
    : 'User interface language: English. Default response language: English.';
}

function buildCustomInstructionBlock(customSystemPrompt?: string, userDisplayName?: string): string {
  if (!customSystemPrompt?.trim()) return '';
  const userInstruction = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || 'User');
  return `\n<user_custom_instruction>\n${userInstruction}\n</user_custom_instruction>`;
}

function buildInternalReasoningDirective(selectedModelId: string): string {
  if (!supportsHiddenReasoning(selectedModelId)) return '';

  return `
<internal_protocol>
    - You are equipped with vision capabilities. If the user provides an image, analyze it accurately.
    - Before responding, perform a brief internal analysis of the user's intent.
    - You MAY use hidden reasoning, but do not output any <thought> or <analysis> tags to the user.
    - Final output must be clean and follow the selected persona's style.
</internal_protocol>`;
}

export function buildChatSystemPrompt(input: BuildChatSystemPromptInput): string {
  let prompt = input.baseStylePrompt.replace(
    /\{\{USERNAME\}\}/g,
    input.userDisplayName && input.userDisplayName !== 'User' ? input.userDisplayName : '',
  );

  prompt = `${prompt}\n${RUNTIME_CONTEXT}\n<language_preference>${buildLanguageHint(input.language)}</language_preference>${buildCustomInstructionBlock(
    input.customSystemPrompt,
    input.userDisplayName,
  )}\n${buildInternalReasoningDirective(input.selectedModelId)}`;

  if (input.isRegeneration) {
    prompt = `${REGENERATION_INSTRUCTION}\n\n${prompt}`;
  }

  return prompt;
}

export function buildSystemPromptForRequest(input: BuildSystemPromptForRequestInput): string {
  // This preserves the current code-mode behavior exactly, including dropping non-code enrichments.
  let prompt = input.isCodeMode ? CODE_REASONING_SYSTEM_PROMPT : input.effectiveSystemPrompt;

  if (input.olderSummaryBlock) {
    prompt = `${input.olderSummaryBlock}\n${prompt}`;
  }

  return prompt;
}
