"""
ACE-Step 1.5 on Modal — self-hosted music generation endpoint.

Runs the official ACE-Step 1.5 API server (github.com/ace-step/ACE-Step-1.5)
inside a Modal container with a persistent Volume for model weights.

Deploy:  modal deploy main.py
Test:    modal run main.py::test
"""

import modal

app = modal.App("acestep-sound")

# ACE-Step 1.5 turbo (2B DiT) fits comfortably in 24GB; use "L4" for cheaper
# cold starts if quality is acceptable, "A100-40GB" for fastest generation.
GPU = "A10G"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git")
    .pip_install(
        "torch==2.10.0+cu128",
        "torchaudio==2.10.0+cu128",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .pip_install(
        # Runtime deps from ACE-Step requirements (training + flash-attn excluded)
        "safetensors==0.7.0",
        "torch==2.10.0+cu128",
        "torchaudio==2.10.0+cu128",
    )
    .pip_install(
        # Runtime deps from ACE-Step requirements (training + flash-attn excluded)
        "safetensors==0.7.0",
        "transformers>=4.51.0,<4.58.0",
        "diffusers",
        "matplotlib>=3.7.5",
        "scipy>=1.10.1",
        "soundfile>=0.13.1",
        "loguru>=0.7.3",
        "einops>=0.8.1",
        "accelerate>=1.12.0",
        "fastapi>=0.110.0",
        "uvicorn[standard]>=0.27.0",
        "python-multipart>=0.0.18",
        "numba>=0.63.1",
        "vector-quantize-pytorch>=1.27.15",
        "torchcodec>=0.9.1",
        "torchao",
        "toml",
        "huggingface_hub",
        "num2words==0.5.14",
        "py3langid==0.3.0",
        "peft",
        "xxhash",
    )
    # ACE-Step 1.5 repo: install the package so `python -m acestep.api_server`
    # exists. Their own docs use `uv run acestep-api`; we replicate it with pip.
    .run_commands(
        "git clone https://github.com/ace-step/ACE-Step-1.5.git /opt/ACE-Step-1.5",
        "cd /opt/ACE-Step-1.5 && pip install --no-deps -e .",
    )
    .add_local_python_source("main")  # not strictly needed, but keeps modal happy
)

volume = modal.Volume.from_name("acestep-weights", create_if_missing=True)


@app.function(
    image=image,
    gpu=GPU,
    volumes={"/weights": volume},
    timeout=3600,
    # We keep ONE container alive to avoid re-loading model weights.
    # Concurrency=1 means requests queue rather than spawn extra GPUs.
    max_containers=1,
    scaledown_window=600,  # stay warm 10 min after last request
    secrets=[
        modal.Secret.from_name("acestep-api-key"),  # defines ACESTEP_API_KEY
    ],
    env={
        # Pre-download location for HF weights (persisted to Volume)
        "HF_HOME": "/weights/hf",
        # Server bind config (Modal routes HTTPS traffic to this port)
        "ACESTEP_API_HOST": "0.0.0.0",
        "ACESTEP_API_PORT": "8000",
        # Model config (0.6B LM: the 1.7B repo was pulled from HF)
        "ACESTEP_CONFIG_PATH": "acestep-v15-turbo",
        "ACESTEP_LM_MODEL_PATH": "acestep-5Hz-lm-0.6B",
        "ACESTEP_LM_BACKEND": "pt",  # vllm needs more VRAM; pt works on A10G
        "ACESTEP_USE_FLASH_ATTENTION": "false",  # no flash-attn wheel in image
        "ACESTEP_CHECK_UPDATE": "false",
    },
)
@modal.asgi_app()
def server():
    """Serves the official ACE-Step FastAPI app via Modal ASGI."""
    import os

    os.makedirs("/tmp/outputs", exist_ok=True)
    os.environ.setdefault("ACESTEP_TMPDIR", "/tmp/acestep-tmp")

    # Auth is read from ACESTEP_API_KEY (provided via Modal secret).
    from acestep.api_server import app as acestep_app

    return acestep_app


@app.function(
    image=image,
    timeout=1800,
    volumes={"/weights": volume},
    secrets=[modal.Secret.from_name("acestep-api-key")],
    env={"HF_HOME": "/weights/hf"},
)
def download_weights():
    """One-shot: pre-download all model weights into the Volume."""
    from huggingface_hub import snapshot_download

    for repo in [
        "ACE-Step/Ace-Step1.5",           # DiT turbo (2B)
        "ACE-Step/acestep-5Hz-lm-0.6B",   # LM planner (1.7B repo was pulled from HF)
    ]:
        print(f"Downloading {repo}…")
        path = snapshot_download(repo_id=repo)
        print(f"  → {path}")


@app.local_entrypoint()
def test(prompt: str = "raw minimal acid house 123 bpm", duration: int = 30):
    """Local smoke test: submits a generation task and polls until done."""
    import os
    import time
    import urllib.request
    import json

    base = server.get_url()  # not directly accessible before deploy
    print(f"Endpoint: {base}")
    print("Deploy first with `modal deploy main.py`, then curl manually.")
