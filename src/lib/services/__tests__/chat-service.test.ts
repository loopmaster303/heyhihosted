/**
 * ChatService Unit Tests
 * Tests for the chat service API abstraction layer
 */

import { ChatService, SendMessageOptions, GenerateImageOptions } from '../chat-service';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ChatService', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('sendChatCompletion', () => {
        const defaultOptions: SendMessageOptions = {
            messages: [{ role: 'user', content: 'Hello' }],
            modelId: 'openai',
        };

        it('should send a chat completion request and return the response', async () => {
            const mockResponse = {
                choices: [{ message: { content: 'Hello there!' } }],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => mockResponse,
            });

            const result = await ChatService.sendChatCompletion(defaultOptions);

            expect(result).toBe('Hello there!');
            expect(mockFetch).toHaveBeenCalledWith('/api/chat/completion', expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    messages: defaultOptions.messages,
                    modelId: defaultOptions.modelId,
                    systemPrompt: undefined,
                    webBrowsingEnabled: undefined,
                    stream: false,
                }),
            }));
        });

        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ error: 'Rate limit exceeded' }),
            });

            await expect(ChatService.sendChatCompletion(defaultOptions))
                .rejects.toThrow('API error: Rate limit exceeded');
        });

        it('should pass system prompt when provided', async () => {
            const optionsWithSystem: SendMessageOptions = {
                ...defaultOptions,
                systemPrompt: 'You are a helpful assistant.',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    choices: [{ message: { content: 'I am ready to help!' } }],
                }),
            });

            await ChatService.sendChatCompletion(optionsWithSystem);

            expect(mockFetch).toHaveBeenCalledWith('/api/chat/completion', expect.objectContaining({
                body: expect.stringContaining('You are a helpful assistant'),
            }));
        });

        it('should handle empty response gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    choices: [{ message: { content: '' } }],
                }),
            });

            const result = await ChatService.sendChatCompletion(defaultOptions);
            expect(result).toBe('');
        });


    });

    describe('generateTitle', () => {
        it('should generate a title from messages', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ title: 'Chat about AI' }),
            });

            const result = await ChatService.generateTitle([
                { role: 'user', content: 'Tell me about AI' },
            ]);

            expect(result).toBe('Chat about AI');
        });

        it('should generate a title from a single string', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ title: 'Weather Discussion' }),
            });

            const result = await ChatService.generateTitle('What is the weather?');

            expect(result).toBe('Weather Discussion');
            expect(mockFetch).toHaveBeenCalledWith('/api/chat/title', expect.objectContaining({
                body: expect.stringContaining('What is the weather'),
            }));
        });

        it('should return default title on empty response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ title: '' }),
            });

            const result = await ChatService.generateTitle('Test');
            expect(result).toBe('Chat');
        });

        it('should throw on API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Service unavailable' }),
            });

            await expect(ChatService.generateTitle('Test'))
                .rejects.toThrow('Service unavailable');
        });
    });

    describe('generateImage', () => {
        const defaultImageOptions: GenerateImageOptions = {
            prompt: 'A beautiful sunset',
            modelId: 'flux-schnell',
            width: 1024,
            height: 1024,
        };

        it('should generate an image with Pollinations', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ imageUrl: 'https://example.com/image.png' }),
            });

            const result = await ChatService.generateImage(defaultImageOptions);

            expect(result).toBe('https://example.com/image.png');
            expect(mockFetch).toHaveBeenCalledWith('/api/generate', expect.any(Object));
        });

        it('should handle API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Image generation failed' }),
            });

            await expect(ChatService.generateImage(defaultImageOptions))
                .rejects.toThrow('Image generation failed');
        });

        it('should include negative prompt when provided', async () => {
            const options: GenerateImageOptions = {
                ...defaultImageOptions,
                negative_prompt: 'blurry, low quality',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ imageUrl: 'https://example.com/image.png' }),
            });

            await ChatService.generateImage(options);

            expect(mockFetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
                body: expect.stringContaining('blurry, low quality'),
            }));
        });

        it('should pass reference image for Pollinations video generation', async () => {
            const options: GenerateImageOptions = {
                prompt: 'Animate this image',
                modelId: 'seedance',
                image: 'https://example.com/reference.png',
                aspect_ratio: '16:9',
                duration: 5,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ output: 'https://example.com/video.mp4' }),
            });

            const result = await ChatService.generateImage(options);

            expect(result).toBe('https://example.com/video.mp4');
            expect(mockFetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }));

            const fetchArgs = mockFetch.mock.calls[0]?.[1];
            const parsedBody = JSON.parse(fetchArgs.body);
            expect(parsedBody.model).toBe('seedance');
            expect(parsedBody.image).toBe('https://example.com/reference.png');
            expect(parsedBody.aspectRatio).toBe('16:9');
        });
    });
});
