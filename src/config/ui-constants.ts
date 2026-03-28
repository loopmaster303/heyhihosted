import ClaudeIcon from '../assets/icons-models/claude-color.png';
import DeepSeekIcon from '../assets/icons-models/deepseek-color.png';
import GeminiIcon from '../assets/icons-models/gemini-color.png';
import GrokIcon from '../assets/icons-models/grokfarbe.png';
import KimiIcon from '../assets/icons-models/kimifarbe.png';
import MistralIcon from '../assets/icons-models/mistral-color.png';
import PollinationsIcon from '../assets/icons-models/pollinations.png';

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
import StepAIIcon from '../assets/icons-models/Step AI logo.png';

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
    'openai': OpenAIIcon,
    'openai-fast': OpenAIIcon,
    'mistral': MistralIcon,
    'kimi': KimiIcon,
    'minimax': PollinationsIcon,
    'perplexity-reasoning': PerplexityIcon,
    'perplexity-fast': PerplexityIcon,
    'nomnom': PollinationsIcon,
    'qwen-coder': QwenIcon,
    'nova-fast': AmazonNovaIcon,
    'nova-lite': AmazonNovaIcon,
};

export const modelDisplayMap: Record<string, string> = {
    'claude': 'Claude Sonnet 4.6',
    'claude-fast': 'Anthropic Claude Haiku 4.5',
    'claude-large': 'Claude Opus',
    'gemini-large': 'Gemini 3.1 Pro',
    'gemini': 'Gemini Flash',
    'gemini-fast': 'Google Gemini 2.5 Flash Lite',
    'gemini-search': 'Google Gemini 2.5 Flash Lite + Search',
    'glm': 'Z.ai GLM-5',
    'mistral': 'Mistral Small 3.2 24B',
    'deepseek': 'DeepSeek V3.2',
    'kimi': 'Moonshot Kimi K2.5',
    'minimax': 'MiniMax M2.5',
    'openai': 'OpenAI GPT-5 Mini',
    'openai-fast': 'OpenAI GPT-5 Nano',
    'perplexity-reasoning': 'Perplexity Sonar Reasoning',
    'perplexity-fast': 'Perplexity Sonar',
    'nomnom': 'NomNom (Alpha)',
    'qwen-coder': 'Qwen3 Coder 30B',
};

// NEW FEATURED LIST - STANDARD MODELS
export const featuredModels = [
    { id: 'claude-fast', emoji: '⚡', highlight: 'Haiku 4.5' },
    { id: 'gemini-fast', emoji: '⚡', highlight: 'Lite' },
    { id: 'nova-fast', emoji: '🌟', highlight: 'Micro' },
    { id: 'deepseek', emoji: '🔍', highlight: 'V3.2' },
];

// Image Model Icon Mapping
export const imageModelIcons: Record<string, any> = {
    'gpt-image': OpenAIIcon,
    'gptimage-large': OpenAIIcon,
    'dirtberry': PollinationsIcon,
    'imagen-4': GoogleIcon,
    'seedream': ByteDanceIcon,
    'seedream5': ByteDanceIcon,
    'seedance': ByteDanceIcon,
    'nanobanana': '🍌',
    'nanobanana-pro': '🍌',
    'nanobanana-2': '🍌',
    'qwen-image': QwenIcon,
    'grok-imagine-pro': GrokIcon,
    'flux': FluxFarbeIcon,
    'flux-2-dev': FluxFarbeIcon,
    'klein': FluxFarbeIcon,
    'klein-large': FluxFarbeIcon,
    'kontext': FluxFarbeIcon,
    'wan': WANIcon,
    'wan-fast': WANIcon,
    'zimage': WANIcon,
    'ltx-2': LTXLogo,
    'grok-image': GrokIcon,
    'grok-video': GrokIcon,
    'p-image': PollinationsIcon,
    'p-image-edit': PollinationsIcon,
    'p-video': PollinationsIcon,
};
