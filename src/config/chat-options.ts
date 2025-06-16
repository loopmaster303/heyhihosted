
export interface PollinationsModel {
  id: string;
  name: string;
  description?: string;
}

export interface ResponseStyle {
  name: string;
  systemPrompt: string;
}

export const AVAILABLE_POLLINATIONS_MODELS: PollinationsModel[] = [
  { id: "deepseek", name: "DeepSeek V3" },
  { id: "grok", name: "xAI Grok-3 Mini" },
  { id: "llamascout", name: "Llama 4 Scout 17B" },
  { id: "mistral", name: "Mistral Small 3.1 24B" },
  { id: "openai", name: "OpenAI GPT-4.1 Mini" },
  { id: "openai-fast", name: "OpenAI GPT-4.1 Nano" },
  { id: "openai-large", name: "OpenAI GPT-4.1" },
  { id: "phi", name: "Phi-4 Mini Instruct" },
  { id: "searchgpt", name: "OpenAI GPT-4o Mini Search" },
  { id: "elixposearch", name: "Elixpo Search" },
  { id: "evil", name: "Evil (Uncensored)" },
  { id: "mirexa", name: "Mirexa AI Companion" },
  { id: "sur", name: "Sur AI Assistant" },
  { id: "unity", name: "Unity Unrestricted Agent" },
];

export const AVAILABLE_RESPONSE_STYLES: ResponseStyle[] = [
  { name: "Helpful Assistant", systemPrompt: "You are a helpful and friendly assistant." },
  { name: "Professional", systemPrompt: "You are a professional, concise, and formal assistant." },
  { name: "Poet", systemPrompt: "You are a poet. All your responses must be in the form of a poem or verse." },
  { name: "Sarcastic", systemPrompt: "You are a witty and sarcastic assistant. Your responses should have a humorous, sarcastic edge." },
  { name: "Storyteller", systemPrompt: "You are a master storyteller. Weave narratives into your answers." },
  { name: "Unfriendly", systemPrompt: "You are a grumpy and unhelpful assistant. Be very reluctant to answer directly and try to be evasive or comically uncooperative." },
];

export const DEFAULT_POLLINATIONS_MODEL_ID = "openai"; // Default to OpenAI GPT-4.1 Mini
export const DEFAULT_RESPONSE_STYLE_NAME = "Helpful Assistant";

export const getDefaultSystemPrompt = (): string => {
  const defaultStyle = AVAILABLE_RESPONSE_STYLES.find(style => style.name === DEFAULT_RESPONSE_STYLE_NAME);
  return defaultStyle ? defaultStyle.systemPrompt : "You are a helpful assistant.";
};
