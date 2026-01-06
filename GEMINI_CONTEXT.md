# Gemini Context: hey.hi

## Critical Technical Constraints

### 1. API Usage (The "Pollen" Standard)
- **Image Generation**: Use the `/api/generate` endpoint which proxies to `gen.pollinations.ai`.
- **Parameters**: Always send `nologo=true` and `private=true` (if `POLLEN_API_KEY` is present). 
- **Quality Boost**: `z-image-turbo` requires specific quality tags ("8k uhd, hyperrealistic") and `enhance=true` at the API level.
- **Vision**: Chat models require public URLs. Use the `/api/upload/temp` proxy before sending messages with images.

### 2. Storage Architecture ("Safe Mode")
- **Never store Blobs in localStorage**. It causes `QuotaExceededError`.
- **Local Vault**: All images must be stored in **IndexedDB** using `idb-keyval`.
- **Hydration**: The `useImageHistory` hook is the source of truth. It maps persistent IDs to temporary `blob:` URLs during session load.
- **Zombie Cleanup**: Automatic filtering of history items that have no corresponding binary data in IndexedDB.

### 3. UI & Identity
- **Header**: The `TypewriterHeader` is the core identity element. It reflects current system state in a CRT/Terminal style.
- **Layout**: The "Matrix" header is exclusive to the `chat` state.
- **Consistency**: Use `font-mono` for technical data and `Inter` for standard UI elements. Maintain the "Soft Pink/Purple" glassmorphism theme.

### 4. Logic & Ethics
- **Identity Protocol**: Always identify as a computer program. Transparency is absolute.
- **Mistral Fallback**: Manual only. No automatic fallback to avoid 422 errors during Pollinations outages.
- **Vision Logic**: If images are present, fallback to `kontext` (Pollinations) or a vision-capable LLM (Claude/GPT).

## Recent Meilensteine
- [X] Implementation of IndexedDB Image Vault.
- [X] Anonymous Image Relay for Vision Support.
- [X] Dynamic CRT Terminal Header.
- [X] Model Selector moved to Input Bar (Compact Mode).
- [X] Removal of Vercel Blob dependency.
