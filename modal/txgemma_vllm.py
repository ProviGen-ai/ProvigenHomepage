"""Modal app: serve TxGemma-27B-Chat via vLLM in OpenAI-compatible mode.

Based on Modal's official vLLM example:
https://modal.com/docs/examples/vllm_inference

Deploy:
    modal deploy modal/txgemma_vllm.py

The endpoint URL will be printed after deploy, e.g.:
    https://YOUR_WORKSPACE--txgemma-vllm-serve.modal.run

Set it in your backend env:
    export TXGEMMA_BASE_URL="https://YOUR_WORKSPACE--txgemma-vllm-serve.modal.run/v1"
"""

import modal

MODEL_NAME = "google/txgemma-27b-chat"
GPU_CONFIG = modal.gpu.A100(count=1, size="80GB")

# Build the container image with vLLM and download model weights at build time
# so they're baked into the image layer and don't re-download on each cold start.
vllm_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "vllm>=0.8.0",
        "torch>=2.5.0",
        "transformers>=4.48.0",
        "huggingface_hub>=0.27.0",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_commands(
        f"python -c \"from huggingface_hub import snapshot_download; snapshot_download('{MODEL_NAME}')\"",
    )
)

app = modal.App("txgemma-vllm", image=vllm_image)

# If you need a HuggingFace token for gated models, create a Modal secret:
#   modal secret create huggingface HF_TOKEN=hf_...
# Then add: secrets=[modal.Secret.from_name("huggingface")]  to @app.function()


@app.function(
    gpu=GPU_CONFIG,
    timeout=600,
    # Container stays warm for 5 min after last request to avoid cold starts
    container_idle_timeout=300,
    # Allow up to 100 concurrent requests per container (vLLM handles batching)
    allow_concurrent_inputs=100,
)
@modal.asgi_app()
def serve():
    """Return a FastAPI app that proxies to vLLM's OpenAI-compatible server."""
    import fastapi
    import vllm.entrypoints.openai.api_server as api_server
    from vllm.engine.arg_utils import AsyncEngineArgs
    from vllm.engine.async_llm_engine import AsyncLLMEngine

    app = fastapi.FastAPI()

    engine_args = AsyncEngineArgs(
        model=MODEL_NAME,
        max_model_len=4096,
        dtype="auto",
        trust_remote_code=True,
        gpu_memory_utilization=0.90,
    )
    engine = AsyncLLMEngine.from_engine_args(engine_args)

    # Wire up vLLM's built-in OpenAI-compatible routes
    api_server.engine = engine

    # Health check
    @app.get("/health")
    async def health():
        return {"status": "ok"}

    # Chat completions — the main endpoint the adapter calls
    @app.post("/v1/chat/completions")
    async def chat(request: fastapi.Request):
        """Forward to vLLM's chat completion handler."""
        from vllm.entrypoints.openai.protocol import ChatCompletionRequest
        from vllm.entrypoints.openai.serving_chat import OpenAIServingChat
        from vllm.entrypoints.openai.serving_engine import BaseModelPath

        # Lazy-init the serving layer (runs once per container)
        if not hasattr(app.state, "chat_serving"):
            model_config = await engine.get_model_config()
            app.state.chat_serving = OpenAIServingChat(
                engine_client=engine,
                model_config=model_config,
                base_model_paths=[BaseModelPath(name=MODEL_NAME, model_path=MODEL_NAME)],
                response_role="assistant",
            )

        body = await request.json()
        chat_request = ChatCompletionRequest(**body)
        response = await app.state.chat_serving.create_chat_completion(chat_request)
        return response

    # Models list — lets the OpenAI client discover available models
    @app.get("/v1/models")
    async def models():
        return {
            "object": "list",
            "data": [
                {
                    "id": MODEL_NAME,
                    "object": "model",
                    "owned_by": "google",
                }
            ],
        }

    return app
