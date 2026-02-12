import ClaudeIcon from '../assets/icons-models/claude-color.png';
import DeepSeekIcon from '../assets/icons-models/deepseek-color.png';
import GeminiIcon from '../assets/icons-models/gemini-color.png';
import GrokIcon from '../assets/icons-models/grokfarbe.png';
import KimiIcon from '../assets/icons-models/kimifarbe.png';
import MistralIcon from '../assets/icons-models/mistral-color.png';

import OpenAIIcon from '../assets/icons-models/openfarbe.png';
import PerplexityIcon from '../assets/icons-models/perplexity-color.png';
import QwenIcon from '../assets/icons-models/qwen-color.png';
// Image Model specific icons
import GoogleIcon from '../assets/icons-models/google-color.png';
import ByteDanceIcon from '../assets/icons-models/bytedance-color.png';
import FluxFarbeIcon from '../assets/icons-models/fluxfarbe.png';
import WANIcon from '../assets/icons-models/wan.png';
import ZAIFarbeIcon from '../assets/icons-models/zaifarbe.png';
import LTXLogo from '../assets/icons-models/ltxlogo.png';

// Model Icon Mapping (LLM)
export const modelIcons: Record<string, any> = {
    'claude': ClaudeIcon,
    'claude-fast': ClaudeIcon,
    'claude-large': ClaudeIcon,
    'deepseek': DeepSeekIcon,
    'gemini-large': GeminiIcon,
    'gemini': GeminiIcon,
    'gemini-fast': GeminiIcon,
    'gemini-search': GeminiIcon,
    'glm': ZAIFarbeIcon,
    'mistral': MistralIcon,
    'openai': OpenAIIcon,
    'openai-large': OpenAIIcon,
    'openai-fast': OpenAIIcon,
    'openai-reasoning': OpenAIIcon,
    'grok': GrokIcon,
    'kimi-k2-thinking': KimiIcon,
    'perplexity-reasoning': PerplexityIcon,
    'perplexity-fast': PerplexityIcon,
    'qwen-coder': QwenIcon,
};

export const modelDisplayMap: Record<string, string> = {
    'claude': 'Claude 4.5',
    'claude-fast': 'Claude Haiku',
    'claude-large': 'Claude Opus',
    'gemini-large': 'Gemini 3 Pro',
    'gemini': 'Gemini Flash',
    'gemini-fast': 'Gemini Flash Fast',
    'gemini-search': 'Gemini Search',
    'glm': 'Z.ai GLM-4.7',
    'mistral': 'Mistral',
    'openai': 'GPT 5',
    'openai-large': 'GPT 5.2',
    'openai-fast': 'GPT 5 Nano',
    'deepseek': 'Deepseek V 3.2',
    'grok': 'Grok 4',
    'kimi-k2-thinking': 'Kimi K2',
    'perplexity-reasoning': 'Sonar Reason',
    'perplexity-fast': 'Sonar',
    'qwen-coder': 'Qwen Coder',
};

// NEW FEATURED LIST - STANDARD MODELS
export const featuredModels = [
    { id: 'claude-fast', emoji: '⚡', highlight: 'Fast' },
    { id: 'gemini-search', emoji: '🌐', highlight: 'Web' },
    { id: 'openai-fast', emoji: '🚀', highlight: 'Nano' },
    { id: 'mistral', emoji: '✨', highlight: 'Fast' },
    { id: 'deepseek', emoji: '🧠', highlight: 'Reason' },
    { id: 'glm', emoji: '🔷', highlight: 'Pro' }
];

// Image Model Icon Mapping
export const imageModelIcons: Record<string, any> = {
    'gpt-image': OpenAIIcon,
    'gptimage-large': OpenAIIcon,
    'seedream': ByteDanceIcon,
    'seedream-pro': ByteDanceIcon,
    'seedance': ByteDanceIcon,
    'seedance-fast': ByteDanceIcon,
    'seedance-pro': ByteDanceIcon,
    'nanobanana': '🍌',
    'nanobanana-pro': '🍌',
    'flux': FluxFarbeIcon,
    'flux-2-dev': FluxFarbeIcon,
    'klein-large': FluxFarbeIcon,
    'flux-2-pro': FluxFarbeIcon,
    'flux-kontext-pro': FluxFarbeIcon,
    'kontext': FluxFarbeIcon,
    'wan': WANIcon,
    'wan-2.5-t2v': WANIcon,
    'wan-video': WANIcon,
    'z-image-turbo': WANIcon,
    'zimage': WANIcon,
    'qwen-image-edit-plus': QwenIcon,
    'grok-video': GrokIcon,
    'ltx-video': LTXLogo,
    // NEW Replicate models
    'flux-2-max': FluxFarbeIcon,
    'flux-2-klein-9b': FluxFarbeIcon,
    'grok-imagine-video': GrokIcon,
};
