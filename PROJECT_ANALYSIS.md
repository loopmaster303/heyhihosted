# HeyHi Project Analysis

## Project Overview

**HeyHi** is a modern, multi-modal AI application built with Next.js 15 that provides users with free and premium access to various AI models for text generation, image creation, and video generation. The application follows a "democratize AI" philosophy, offering both free Pollinations models and premium Replicate models.

## Core Architecture

### Technology Stack
- **Frontend**: Next.js 15 with React 18, TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Context (ChatProvider) with localStorage persistence
- **API Routes**: Next.js API routes for backend functionality
- **External APIs**: Pollinations (free tier) and Replicate (premium tier)
- **Storage**: Vercel Blob for file uploads
- **Audio**: Web Speech API for STT/TTS functionality

### Application Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for external integrations
│   ├── chat/              # Chat interface page
│   ├── visualizepro/      # Image/video generation interface
│   └── settings/          # User settings page
├── components/
│   ├── chat/              # Chat-related components
│   ├── layout/            # Layout components (AppLayout, AppSidebar)
│   ├── page/              # Page-level components
│   ├── tools/             # AI tool components (UnifiedImageTool)
│   └── ui/                # Reusable UI components
├── config/                # Configuration files for models and options
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
└── types/                 # TypeScript type definitions
```

## Key Features

### 1. Multi-Modal Chat Interface
- **Text Chat**: Integration with multiple language models via Pollinations
- **Image Generation**: Support for various image generation models
- **Video Generation**: Support for video creation models
- **File Upload**: Image upload for visual context in conversations
- **Voice Features**: Speech-to-text and text-to-speech capabilities
- **Conversation Management**: History, title generation, and organization

### 2. Unified Image Generation Tool
- **Model Selection**: Support for both Pollinations (free) and Replicate (premium) models
- **Reference Images**: Ability to upload reference images for generation
- **Aspect Ratio Control**: Multiple aspect ratio options
- **Output Configuration**: Resolution, format, and quality settings
- **History Management**: Local storage of generation history
- **Prompt Enhancement**: AI-powered prompt improvement

### 3. User Experience Features
- **Multi-language Support**: German and English language options
- **Theme System**: Light/dark mode toggle
- **Responsive Design**: Mobile-friendly interface
- **Personalization**: User display name and preferences
- **Welcome Experience**: Onboarding with quick prompts

## Technical Implementation

### State Management
The application uses a centralized `ChatProvider` that manages:
- Active conversation state
- Chat history and persistence
- Model selection and configuration
- UI state (panels, modals, loading states)
- Audio recording and playback

### API Integration
- **Pollinations API**: Free tier models for text and image generation
- **Replicate API**: Premium models with password protection
- **Unified Interface**: Abstracted service layer for different providers
- **Error Handling**: Comprehensive error handling and user feedback

### File Handling
- **Upload System**: Vercel Blob integration for file storage
- **Image Processing**: Client-side image preview and validation
- **History Storage**: LocalStorage for conversation and image history

## Configuration System

### Model Registry
The application maintains a unified model registry (`unified-image-models.ts`) that:
- Defines available models from different providers
- Specifies model capabilities (image/video, reference support)
- Handles provider-specific parameter mapping
- Manages free vs premium model access

### User Preferences
- **Model Selection**: Persistent model preferences per conversation
- **Response Styles**: Different AI response styles
- **Voice Settings**: TTS voice selection
- **Language/Theme**: User interface preferences

## Security and Access Control

### Premium Model Access
- **Password Protection**: Environment variable-based password for Replicate models
- **API Key Management**: Server-side API token storage
- **Request Validation**: Input sanitization and validation

### Data Privacy
- **No Persistent User Data**: Conversations stored locally
- **Temporary File Storage**: Uploaded files have limited lifespan
- **No Tracking**: No analytics or user tracking implemented

## Development Considerations

### Code Organization
- **Modular Architecture**: Clear separation of concerns
- **Type Safety**: Comprehensive TypeScript usage
- **Component Reusability**: Shared UI components
- **Custom Hooks**: Extracted logic for reusability

### Performance Optimizations
- **Lazy Loading**: Components loaded as needed
- **Image Optimization**: Next.js Image component usage
- **Streaming Responses**: Real-time chat response streaming
- **Local Storage**: Client-side caching for better UX

## Current Limitations

1. **Scalability**: LocalStorage-based conversation history limits
2. **User Management**: No authentication or user accounts
3. **Collaboration**: No sharing or collaboration features
4. **Mobile App**: No native mobile application
5. **Advanced Features**: Limited advanced AI capabilities (e.g., fine-tuning)

## Deployment and Infrastructure

- **Hosting**: Vercel deployment with App Hosting configuration
- **Environment**: Environment-based configuration
- **Blob Storage**: Vercel Blob for file uploads
- **CDN**: Vercel's edge network for static assets