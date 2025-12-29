import ClaudeIcon from '../../icons models/claude-color.png';
import DeepSeekIcon from '../../icons models/deepseek-color.png';
import GeminiIcon from '../../icons models/gemini-color.png';
import GrokIcon from '../../icons models/grokfarbe.png';
import KimiIcon from '../../icons models/kimifarbe.png';

import OpenAIIcon from '../../icons models/openfarbe.png';
import PerplexityIcon from '../../icons models/perplexity-color.png';
import QwenIcon from '../../icons models/qwen-color.png';
// Image Model specific icons
import GoogleIcon from '../../icons models/google-color.png';
import ByteDanceIcon from '../../icons models/bytedance-color.png';
import FluxFarbeIcon from '../../icons models/fluxfarbe.png';
import BFLIcon from '../../icons models/bfl.png';
import WANIcon from '../../icons models/wan.png';

// Model Icon Mapping (LLM)
export const modelIcons: Record<string, any> = {
    'claude': ClaudeIcon,
    'claude-fast': ClaudeIcon,
    'claude-large': ClaudeIcon,
    'deepseek': DeepSeekIcon,
    'gemini-large': GeminiIcon,
    'gemini': GeminiIcon,
    'gemini-search': GeminiIcon,
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
    'gemini-search': 'Gemini Search',
    'openai-large': 'GPT 5.2',
    'openai-fast': 'GPT 5 Nano',
    'deepseek': 'DeepSeek V3',
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
    { id: 'grok', emoji: '🧠', highlight: 'Realtime' }
];

// Image Model Icon Mapping
export const imageModelIcons: Record<string, any> = {
    'gpt-image': OpenAIIcon,
    'gptimage-large': OpenAIIcon,
    'seedream': ByteDanceIcon,
    'seedream-pro': ByteDanceIcon,
    'seedance': ByteDanceIcon,
    'seedance-pro': ByteDanceIcon,
    'nanobanana': '🍌',
    'nanobanana-pro': '🍌',
    'flux': BFLIcon,
    'flux-2-pro': FluxFarbeIcon,
    'flux-kontext-pro': FluxFarbeIcon,
    'kontext': FluxFarbeIcon,
    'veo': GoogleIcon,
    'veo-3.1-fast': GoogleIcon,
    'wan-2.5-t2v': WANIcon,
    'wan-video': WANIcon,
    'z-image-turbo': WANIcon,
    'zimage': WANIcon,
    'qwen-image-edit-plus': QwenIcon,
};
