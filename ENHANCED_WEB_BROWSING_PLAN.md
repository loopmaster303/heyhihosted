# Enhanced WebBrowsing Architecture Plan

## Current Problem Analysis

### Issues with Existing Implementation

1. **Hardcoded Model Override** (`src/app/api/chat/completion/route.ts:27`):
   ```typescript
   const effectiveModelId = webBrowsingEnabled ? "gemini-search" : modelId;
   ```
   - User's model choice is completely ignored when WebBrowsing is enabled
   - Always forces `gemini-search` regardless of user selection

2. **Limited Model Support**: Only `gemini-search` and `perplexity-reasoning` have `webBrowsing: true`

3. **No Real Search Integration**: WebBrowsing doesn't actually search the web first

## Proposed Enhanced Architecture

### User Experience Flow
```
User selects Claude Sonnet 4.5 → Enables WebBrowsing → Sends prompt "What are the latest AI developments?"
↓
1. Perplexity Search: Finds current AI news/articles
2. Enhanced Prompt: Original prompt + search results
3. User's Model (Claude Sonnet 4.5): Processes enhanced prompt
4. Response: Current, accurate answer using user's preferred model
```

### Technical Implementation Plan

#### Phase 1: Create Search Service
```typescript
// src/lib/services/search-service.ts
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export class SearchService {
  static async webSearch(query: string): Promise<SearchResult[]> {
    // Use Perplexity API for web search
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'perplexity-online',
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000
      })
    });
    
    return response.json();
  }
}
```

#### Phase 2: Enhanced Chat API Route
```typescript
// src/app/api/chat/completion/route.ts (enhanced)
export async function POST(request: Request) {
  const { messages, modelId, systemPrompt, webBrowsingEnabled } = validateRequest(ChatCompletionSchema, body);
  
  let enhancedMessages = messages;
  let searchResults: SearchResult[] = [];
  
  // NEW: Two-step WebBrowsing process
  if (webBrowsingEnabled) {
    // Step 1: Extract search query from last user message
    const lastMessage = messages[messages.length - 1];
    const searchQuery = extractSearchQuery(lastMessage.content);
    
    if (searchQuery) {
      // Step 2: Perform web search using Perplexity
      searchResults = await SearchService.webSearch(searchQuery);
      
      // Step 3: Enhance user message with search results
      const enhancedContent = `
User Query: ${lastMessage.content}

Recent Web Search Results:
${searchResults.map(result => `- ${result.title}: ${result.snippet} (${result.url})`).join('\n')}

Please provide a comprehensive answer using the web search results above. Cite relevant sources.
      `.trim();
      
      enhancedMessages = [
        ...messages.slice(0, -1),
        { ...lastMessage, content: enhancedContent }
      ];
    }
  }
  
  // Step 4: Send to USER'S CHOSEN model (not hardcoded)
  const response = await callLLM({
    modelId, // Keep user's choice!
    messages: enhancedMessages,
    systemPrompt,
    stream
  });
  
  return response;
}
```

#### Phase 3: Update Model Configuration
```typescript
// src/config/chat-options.ts (enhanced)
export const AVAILABLE_POLLINATIONS_MODELS: PollinationsModel[] = [
  // ALL models can now use WebBrowsing!
  { 
    id: "claude", 
    name: "Claude Sonnet 4.5", 
    description: "Most Capable & Balanced Model with Vision", 
    vision: true,
    webBrowsingCapable: true, // NEW: All models can browse
    category: "Premium"
  },
  { 
    id: "openai-large", 
    name: "OpenAI GPT-5.2", 
    description: "Most Powerful & Intelligent Model with Vision", 
    vision: true,
    webBrowsingCapable: true,
    category: "Premium"
  },
  // ... all other models with webBrowsingCapable: true
];
```

#### Phase 4: UI Improvements
```typescript
// src/components/chat/ChatInput.tsx (enhanced)
// Show WebBrowsing status with more context
<button
  onClick={onToggleWebBrowsing}
  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition text-left"
>
  <Globe className="w-4 h-4" />
  <span className="flex-1">
    {webBrowsingEnabled 
      ? `Web-Suche An (${selectedModelId})` 
      : `Web-Suche Aus`
    }
  </span>
  {webBrowsingEnabled && (
    <div className="flex items-center gap-1">
      <span className="text-xs text-green-500">●</span>
      <span className="text-xs text-muted-foreground">+ Perplexity</span>
    </div>
  )}
</button>
```

## Benefits of Enhanced Architecture

### For Users
1. **Model Choice Respected**: Use Claude Sonnet 4.5, GPT-5.2, or any preferred model WITH WebBrowsing
2. **Current Information**: Real-time web search via Perplexity
3. **Better Answers**: Combines search results with user's preferred LLM capabilities
4. **Transparency**: See that WebBrowsing uses "Your Model + Perplexity Search"

### For Development
1. **Flexible Architecture**: Any model can use WebBrowsing
2. **Separation of Concerns**: Search service independent of LLM service
3. **Maintainable**: Easy to update search provider or add new features
4. **Scalable**: Can add multiple search providers (Google, Bing, etc.)

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Create SearchService with Perplexity integration
2. ✅ Enhance chat completion route with two-step process
3. ✅ Update model configuration to support WebBrowsing for all models
4. ✅ Test with Claude Sonnet 4.5 + WebBrowsing

### Medium Priority (UX Improvements)
1. ✅ Update UI to show "Model + Perplexity Search" when enabled
2. ✅ Add search result citations in responses
3. ✅ Implement search query extraction logic
4. ✅ Add error handling for search failures

### Low Priority (Advanced Features)
1. ✅ Multiple search provider support (Perplexity, Google, Bing)
2. ✅ Search result caching
3. ✅ Advanced search query optimization
4. ✅ Search result relevance scoring

## Migration Strategy

### Phase 1: Core Implementation (Week 1)
- Create SearchService
- Update API route
- Test with existing models

### Phase 2: UI Updates (Week 2)
- Update ChatInput component
- Add search indicators
- Improve user feedback

### Phase 3: Advanced Features (Week 3-4)
- Multiple search providers
- Search result citations
- Performance optimizations

## Technical Considerations

### Performance
- Search requests add ~1-2 seconds latency
- Implement search result caching
- Consider search query debouncing

### Cost Management
- Perplexity API costs per search
- Implement search usage tracking
- Add search rate limiting

### Error Handling
- Graceful fallback when search fails
- Clear error messages for users
- Retry logic for failed searches

### Security
- Validate search queries
- Sanitize search results
- Rate limiting per user

## Success Metrics

### User Experience
- ✅ Users can use ANY model with WebBrowsing
- ✅ Search results are current and relevant
- ✅ Response quality improves with WebBrowsing
- ✅ Clear indication when WebBrowsing is used

### Technical
- ✅ API response time < 5 seconds (including search)
- ✅ 99.9% search success rate
- ✅ Zero model override issues
- ✅ Clean separation of search and LLM services

## Conclusion

This enhanced architecture transforms WebBrowsing from a limited, hardcoded feature into a flexible, powerful capability that:

1. **Respects User Choice**: Any model can use WebBrowsing
2. **Provides Current Information**: Real-time search via Perplexity
3. **Maintains Model Strengths**: Uses user's preferred LLM for processing
4. **Scales for Future**: Easy to add new search providers or models

The implementation prioritizes user experience while maintaining technical excellence and scalability.