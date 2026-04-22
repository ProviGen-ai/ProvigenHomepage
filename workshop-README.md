# Biomedical Reasoning Workshop

A guided workshop demo for comparing biomedical reasoning models. Participants click curated example tasks and see outputs from GPT-5.4, TxGemma-27B-Chat, and Biomni side by side, then vote on the best answers.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────┐
│  Next.js Frontend   │────▶│   FastAPI Backend (:8000)│
│  /workshop (hidden) │     │                         │
└─────────────────────┘     │  ┌─ openai_adapter ────▶ OpenAI API (GPT-5.4)
                            │  ├─ txgemma_adapter ───▶ Modal vLLM endpoint
                            │  ├─ biomni_adapter ────▶ Biomni local service
                            │  └─ bioreason_adapter ─▶ BioReason-Pro (optional)
                            │                         │
                            │  SQLite (db/app.db)     │
                            └─────────────────────────┘
```

## Project Structure

```
backend/
  main.py                 # FastAPI app
  requirements.txt        # Python deps
  .env.example            # Env var template
  adapters/
    openai_adapter.py     # GPT-5.4 via OpenAI API
    txgemma_adapter.py    # TxGemma via Modal vLLM
    biomni_adapter.py     # Biomni via local service
    bioreason_adapter.py  # BioReason-Pro (optional)
  services/
    storage.py            # SQLite persistence
    ranking.py            # Leaderboard
    task_templates.py     # Predefined tasks & examples
    prompt_normalization.py
  db/
    schema.sql            # SQLite schema
    app.db                # Created at startup

modal/
  txgemma_vllm.py         # Modal app for TxGemma vLLM serving
  README_modal.md         # Modal deployment guide

app/workshop/page.tsx     # Hidden workshop page (Next.js route)
components/Workshop/      # React components

scripts/
  dev.sh                  # Start both frontend + backend
```

## Local Development Setup

### 1. Python Backend

```bash
conda activate provigenDemo-env

# Install dependencies
pip install -r backend/requirements.txt

# Copy and configure env vars
cp backend/.env.example backend/.env
# Edit backend/.env with your keys
```

### 2. Configure OpenAI API Key

Set `OPENAI_API_KEY` in `backend/.env` or export it:
```bash
export OPENAI_API_KEY=sk-...
```

### 3. Deploy TxGemma-27B-Chat on Modal

```bash
# Install Modal CLI
pip install modal

# Authenticate
modal token new

# Deploy
modal deploy modal/txgemma_vllm.py
```

After deployment, copy the endpoint URL and set:
```bash
export TXGEMMA_BASE_URL="https://YOUR_WORKSPACE--txgemma-vllm-serve.modal.run/v1"
```

See [modal/README_modal.md](modal/README_modal.md) for full details.

### 4. Set Up Biomni

Clone and set up the official Biomni repo:
```bash
git clone https://github.com/snap-stanford/biomni.git
cd biomni
# Follow their setup instructions
# Run as a local service on port 8001
```

If Biomni has dependency conflicts with the main backend, run it in a separate conda env and expose it as a local HTTP service. The adapter expects a POST endpoint at `$BIOMNI_SERVICE_URL/predict` that accepts `{"prompt": "..."}` and returns `{"answer": "...", "reasoning": "..."}`.

To disable Biomni temporarily:
```bash
export BIOMNI_ENABLED=false
```

### 5. Enable/Disable BioReason-Pro

BioReason-Pro is disabled by default. To enable:
```bash
export BIOREASON_ENABLED=true
export BIOREASON_SERVICE_URL=http://localhost:8002
```

Set up from the official repo: https://github.com/bowang-lab/BioReason-Pro

### 6. Initialize SQLite

The database is created automatically when the backend starts. No manual setup needed. The schema lives in `backend/db/schema.sql` and is applied on startup.

### 7. Run Everything Locally

**Option A: Dev script**
```bash
bash scripts/dev.sh
```

**Option B: Manual**
```bash
# Terminal 1: Backend
conda activate provigenDemo-env
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

Then visit: **http://localhost:3000/workshop**

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `OPENAI_API_KEY` | — | Yes | OpenAI API key for GPT-5.4 |
| `OPENAI_MODEL` | `gpt-5.4` | No | OpenAI model name |
| `TXGEMMA_BASE_URL` | `http://localhost:8000/v1` | Yes | Modal vLLM endpoint URL |
| `TXGEMMA_MODEL` | `google/txgemma-27b-chat` | No | Model name for vLLM |
| `BIOMNI_ENABLED` | `true` | No | Enable/disable Biomni |
| `BIOMNI_SERVICE_URL` | `http://localhost:8001` | If enabled | Biomni service URL |
| `BIOREASON_ENABLED` | `false` | No | Enable/disable BioReason-Pro |
| `BIOREASON_SERVICE_URL` | `http://localhost:8002` | If enabled | BioReason-Pro service URL |
| `NEXT_PUBLIC_WORKSHOP_API_URL` | `http://localhost:8000` | No | Frontend API base URL |
| `WORKSHOP_API_URL` | `http://localhost:8000` | No | Next.js rewrite target |

## Deployment

For production deployment:

1. Deploy the FastAPI backend (e.g., on a VM, Railway, or Fly.io)
2. Set `WORKSHOP_API_URL` in the Next.js environment to point to the backend
3. Deploy TxGemma on Modal (already done if following dev setup)
4. Deploy Biomni as a service accessible to the backend
5. Deploy the Next.js frontend on Vercel (existing setup)

The workshop page is hidden — it's not linked in navigation. Access via direct URL only.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Feature flags |
| `GET` | `/api/tasks` | Task definitions |
| `POST` | `/api/run-task` | Run prompt across all models |
| `POST` | `/api/vote` | Submit thumbs up/down |
| `POST` | `/api/best-answer` | Select best answer |
| `GET` | `/api/leaderboard` | Aggregate stats |
| `POST` | `/api/bioreason/run-example` | Run BioReason-Pro example |
