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
import LTXFarbeIcon from '../assets/icons-models/ltxfarbe.png';
import PrunaIcon from '../assets/icons-models/prunafarbe.png';
import IdeogramIcon from '../assets/icons-models/ideogramfarbe.png';
import MiniMaxIcon from '../assets/icons-models/minimaxfarbe.png';

import ElevenLabsIcon from '../assets/icons-models/elevenlabsfarbe.png';
import AceStepIcon from '../assets/icons-models/acestepfarbe.png';
import StabilityIcon from '../assets/icons-models/stabilityfarbe.png';

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
    'minimax': MiniMaxIcon,
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
    'glm': 'z.ai GLM-5.2',
    'mistral': 'Mistral Small 3.2 24B',
    'deepseek': 'DeepSeek V4 Flash Lite',
    'kimi': 'Moonshot Kimi K2.6',
    'minimax': 'Minimax M3',
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
    'nanobanana-2-lite': '🍌',
    'qwen-image': QwenIcon,
    'qwen-image-edit-plus': QwenIcon,
    'grok-imagine-pro': GrokIcon,
    'flux': FluxFarbeIcon,
    'flux-2-dev': FluxFarbeIcon,
    'klein': FluxFarbeIcon,
    'klein-large': FluxFarbeIcon,
    'kontext': FluxFarbeIcon,
    'wan': WANIcon,
    'wan-fast': WANIcon,
    'wan-image': WANIcon,
    'wan-image-pro': WANIcon,
    'wan-image-small': WANIcon,
    'wan-t2v': WANIcon,
    'wan-i2v': WANIcon,
    'zimage': WANIcon,
    'ltx-2': LTXFarbeIcon,
    'grok-imagine': GrokIcon,
    'grok-image': GrokIcon,
    'grok-video': GrokIcon,
    'grok-video-pro': GrokIcon,
    'p-image': PrunaIcon,
    'p-image-edit': PrunaIcon,
    'p-video': PrunaIcon,
    'p-image-try-on': PrunaIcon,
    'p-image-upscale': PrunaIcon,
    'p-video-avatar': PrunaIcon,
    'p-video-animate': PrunaIcon,
    'p-video-replace': PrunaIcon,
    'vace': WANIcon,
    'ideogram-v4-turbo': IdeogramIcon,
    'ideogram': IdeogramIcon,
    'acestep': AceStepIcon,
    'ace-step': AceStepIcon,
    'stable-audio-3-medium': StabilityIcon,
    'elevenmusic': ElevenLabsIcon,
};
