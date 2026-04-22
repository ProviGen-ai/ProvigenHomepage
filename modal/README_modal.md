# Modal Deployment: TxGemma-27B-Chat

## Prerequisites

1. A Modal account connected to your GitHub: https://modal.com
2. Modal CLI installed and authenticated

## Setup

```bash
# Install Modal CLI (in your conda env)
conda activate provigenDemo-env
pip install modal

# Authenticate
modal token new
```

## Deploy TxGemma-27B-Chat

```bash
# From the project root
modal deploy modal/txgemma_vllm.py
```

After deployment, Modal will print the endpoint URL. It will look like:
```
https://<your-workspace>--txgemma-vllm-serve.modal.run
```

Set this as your backend environment variable:
```bash
export TXGEMMA_BASE_URL="https://<your-workspace>--txgemma-vllm-serve.modal.run/v1"
```

## Test the deployment

```bash
curl -X POST "$TXGEMMA_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/txgemma-27b-chat",
    "messages": [{"role": "user", "content": "What is aspirin?"}],
    "max_tokens": 256
  }'
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_NAME` | `google/txgemma-27b-chat` | HuggingFace model ID |
| `GPU_CONFIG` | A100 80GB x1 | GPU type and count |
| `container_idle_timeout` | 300s | Time before idle container shuts down |

## Cost Notes

- The A100 80GB is needed for the 27B parameter model
- Container idle timeout is set to 5 minutes to balance cost vs. cold start time
- Model weights are cached in a Modal Volume for faster subsequent cold starts

## Swapping Models

To serve a different model, change `MODEL_NAME` in `txgemma_vllm.py` and redeploy.
The adapter in the backend will work with any OpenAI-compatible endpoint.
