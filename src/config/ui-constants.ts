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

import AmazonNovaIcon from '../assets/icons-models/Amazon Nova.png';

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
    'kimi': KimiIcon,
    'perplexity-reasoning': PerplexityIcon,
    'perplexity-fast': PerplexityIcon,
    'qwen-coder': QwenIcon,
    'qwen-character': QwenIcon,
    'nova-fast': AmazonNovaIcon,
    'nova-lite': AmazonNovaIcon,
};

export const modelDisplayMap: Record<string, string> = {
    'claude': 'Claude 4.5',
    'claude-fast': 'Claude Haiku',
    'claude-large': 'Claude Opus',
    'gemini-large': 'Gemini 3 Pro',
    'gemini': 'Gemini Flash',
    'gemini-fast': 'Google Gemini 2.5 Flash Lite',
    'gemini-search': 'Gemini Search',
    'glm': 'Z.ai GLM-5',
    'mistral': 'Mistral',
    'deepseek': 'Deepseek V3.2',
    'kimi': 'Kimi K2.5',
    'perplexity-reasoning': 'Sonar Reason',
    'perplexity-fast': 'Sonar',
    'qwen-coder': 'Qwen Coder',
    'qwen-character': 'Qwen Character',
};

// NEW FEATURED LIST - STANDARD MODELS
export const featuredModels = [
    { id: 'gemini-fast', emoji: '⚡', highlight: 'Lite' },
    { id: 'nova-fast', emoji: '🌟', highlight: 'Micro' },
    { id: 'claude-fast', emoji: '⚡', highlight: 'Haiku' },
    { id: 'deepseek', emoji: '🔍', highlight: 'V3' },
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
    'flux': FluxFarbeIcon,
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
    'grok-imagine': GrokIcon,
    'grok-video': GrokIcon,
    'ltx-2': LTXLogo,
    // NEW Replicate models
    'flux-2-max': FluxFarbeIcon,
    'flux-2-klein-9b': FluxFarbeIcon,
    'grok-imagine-video': GrokIcon,
};
