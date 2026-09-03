# ACE-Step 1.5 on Modal

Self-hosted music generation endpoint for HeyHi `/sound`, running the official
ACE-Step 1.5 API server inside a Modal container.

## Setup (one-time)

```bash
# 1. Authenticate Modal (opens browser)
modal token new

# 2. Create the API key secret (generate a random string)
modal secret create acestep-api-key ACESTEP_API_KEY=$(openssl rand -hex 32)

# 3. Pre-download model weights into the Volume (~14 GB, one-time, ~5-10 min)
modal run main.py::download_weights

# 4. Deploy
modal deploy main.py
```

Modal prints the HTTPS URL, e.g. `https://<workspace>--acestep-sound-server.modal.run`.
Save it — it becomes `MODAL_ACESTEP_URL` in HeyHi's `.env.local`.

## Test

```bash
curl -X POST https://<workspace>--acestep-sound-server.modal.run/release_task \
  -H "Authorization: Bearer $ACESTEP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "raw minimal acid house 123 bpm", "audio_duration": 30, "thinking": false}'
# → {"data": {"task_id": "...", "status": "queued"}}

curl -X POST https://<workspace>--acestep-sound-server.modal.run/query_result \
  -H "Authorization: Bearer $ACESTEP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"task_id_list": ["<task_id>"]}'
# → status 1 = done, contains /v1/audio?path=... URL
```

## Cost note

- A10G on Modal ≈ $1.10/h, billed per second while container is warm.
- `scaledown_window=600` keeps it warm 10 min after last request.
- Concurrency is capped at 1 container / 4 queued requests to avoid GPU burst.
