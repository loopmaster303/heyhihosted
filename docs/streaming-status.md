# Streaming Status & Current Architecture

## Current Implementation (March 2026)

**Status**: No true SSE streaming from backend.  
**Route**: `src/app/api/chat/completion/route.ts`

The backend calls Pollinations via `httpsPost(...)` and returns a single JSON response:

```json
{
  "choices": [
    {
      "message": {
        "content": "...",
        "role": "assistant"
      }
    }
  ]
}
```

On the frontend, `ChatService.sendChatCompletion(...)` accepts an `onStream` callback for UI compatibility, but currently emits one final chunk once the full response arrives.

## Why this is still non-streaming

1. The route uses a deterministic request/response flow (single `httpsPost` call).
2. Frontend rendering model is optimized around whole-response JSON.
3. This is currently the most stable path with BYOP auth and router/web-context injection.

## Related behavior

- **Smart Router** decides effective search model routing server-side.
- **Web Context** is injected before completion when query intent requires it.
- **Deep Research** uses a dedicated routed model (`nomnom`) and deep context mode.

## Future streaming plan (optional)

If true token streaming is needed, implement all three together:

1. Backend SSE/data-stream response in `src/app/api/chat/completion/route.ts`
2. Frontend stream reader parsing in `src/lib/services/chat-service.ts`
3. Mid-stream error + cancellation UX handling in chat state/UI

Until then, current behavior is intentionally stable non-streaming with simulated incremental UI support.
