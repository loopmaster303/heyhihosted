# Streaming Status

**Checked against the code on 2026-10-01.** An earlier version of this page said the chat
did not stream. That was stale: the SSE path has existed end to end for a while.

## How a chat answer travels

1. `ChatService.sendChatCompletion(options, onStream)` sends `stream: !!onStream`. The chat
   flow (`runTextChatCompletionFlow`) always passes a callback, so chat requests stream.
2. `/api/chat/completion` forwards `stream: true` to Pollinations through
   `httpsPostStream` ([src/lib/https-post.ts](../src/lib/https-post.ts)) and returns the
   upstream body unchanged as `text/event-stream`.
3. The client reads it with `processSseStream` and publishes the accumulated text on every
   delta.

Since 2026-10-01 `httpsPostStream` is plain `fetch` (before: a child process piping
stdout). Its timeout covers the wait for response headers only; after that the body flows
for as long as the function lives (`maxDuration` 300 s in `vercel.json`).

## What the stream never shows

`[IMAGE_GEN: …]` markers are cut from every streamed update, including a marker that has
only begun to arrive (`stripMarkersForDisplay` in
[chat-media-intent.ts](../src/lib/chat/chat-media-intent.ts)). Once the answer is complete,
the image part appears as `pending` and resolves on its own.

## Non-streaming paths

- A caller without `onStream` gets one JSON response (`choices[0].message.content`) via
  `httpsPost` — memory extraction (`memory-service.ts`), for example.
- If the runtime had no `httpsPostStream`, the route falls back to a buffered response with
  the SSE content type. With the fetch implementation this branch is unreachable.
- Create generation is request/response; long runs answer 202 and the browser polls
  (`request-generation.ts`).
