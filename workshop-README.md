# Biomedical Reasoning Workshop

A guided workshop demo for comparing biomedical reasoning models. Participants click curated example tasks and see outputs from GPT-5.4, TxGemma-27B-Chat, and Biomni side by side, then vote on the best answers.

## Architecture

### Local development
```
┌─────────────────────┐     ┌─────────────────────────┐
│  Next.js Frontend   │────▶│   FastAPI Backend (:8000)│
│  /workshop (hidden) │     │                         │
│  localhost:3000      │     │  ┌─ GPT-5.4 ──────────▶ OpenAI API
                            │  ├─ TxGemma ───────────▶ (disabled locally)
                            │  └─ Biomni ────────────▶ (disabled locally)
                            │                         │
                            │  SQLite (db/app.db)     │
                            └─────────────────────────┘
```

### Production (Vercel + Modal)
```
┌─────────────────────┐     ┌──────────────────────────────────────┐
│  Vercel (Next.js)   │     │  Modal App ("biomedical-workshop")   │
│  provigen.ai        │     │                                      │
│                     │     │  backend()  ←── CPU web endpoint     │
│  /workshop ─────────┼────▶│    ├─ GPT-5.4 ──────▶ OpenAI API    │
│  /workshop-results  │     │    ├─ TxGemma ──────▶ internal call  │
│                     │     │    └─ Biomni ───────▶ internal call   │
│  proxy.ts injects   │     │                                      │
│  X-Workshop-Secret  │     │  TxGemmaModel() ←── A100 80GB GPU   │
│  header             │     │  biomni_predict() ←── CPU (stub)     │
└─────────────────────┘     │                                      │
                            │  Modal Volume: SQLite persistence    │
                            └──────────────────────────────────────┘
```

## Project Structure

```
backend/
  main.py                 # FastAPI app (local dev entry point)
  requirements.txt        # Python deps
  .env.example            # Env var template
  adapters/
    openai_adapter.py     # GPT-5.4 via OpenAI API
    txgemma_adapter.py    # TxGemma via Modal vLLM (local dev)
    biomni_adapter.py     # Biomni via local service (local dev)
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
  app.py                  # Unified Modal app (backend + TxGemma + Biomni)

app/workshop/page.tsx     # Hidden workshop page (Next.js route)
app/workshop-results/     # Admin results page
components/Workshop/      # React components
proxy.ts                  # Next.js proxy (injects auth header)

scripts/
  dev.sh                  # Start both frontend + backend locally
```

## Local Development Setup

### 1. Python Backend

```bash
conda activate provigenDemo-env

# Install dependencies
pip install -r backend/requirements.txt

# Copy and configure env vars
cp backend/.env.example .env
# Edit .env with your OpenAI API key
```

### 2. Run Locally

**Option A: Dev script**
```bash
bash scripts/dev.sh
```

**Option B: Manual**
```bash
# Terminal 1: Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

Visit: **http://localhost:3000/workshop**

Locally, only GPT-5.4 will return real answers. TxGemma and Biomni will show disabled/error states unless you configure their endpoints.

## Production Deployment (Vercel + Modal)

The production setup runs the frontend on Vercel and the entire backend (API + models) on Modal.

### 1. Install Modal CLI

```bash
pip install modal
modal setup
```

`modal setup` opens your browser to authenticate the CLI with your Modal account.

### 2. Create Modal Secrets

Store your API keys as a Modal secret (one-time):

```bash
source .env && modal secret create workshop-secrets \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    WORKSHOP_SECRET=$WORKSHOP_SECRET \
    WORKSHOP_ADMIN_PASSWORD=$WORKSHOP_ADMIN_PASSWORD
```

### 3. Deploy to Modal

```bash
modal deploy modal/app.py
```

This deploys three components in one Modal app:
- **`backend()`** — FastAPI web endpoint (CPU)
- **`TxGemmaModel`** — vLLM on A100 80GB (auto-scales, 5min idle timeout)
- **`biomni_predict()`** — Biomni stub (CPU)

The first deploy takes longer as it downloads TxGemma weights (~50GB) and bakes them into the image. Subsequent deploys reuse the cached image.

After deployment, Modal prints the endpoint URL:
```
https://YOUR_WORKSPACE--biomedical-workshop-backend.modal.run
```

### 4. Configure Vercel

In your Vercel project settings, add these environment variables:

| Variable | Value |
|----------|-------|
| `WORKSHOP_API_URL` | `https://YOUR_WORKSPACE--biomedical-workshop-backend.modal.run` |
| `WORKSHOP_SECRET` | Same value you used in Modal secrets |

**How the request flow works:**
1. User visits `provigen.ai/workshop` and submits a prompt
2. Next.js frontend calls `/workshop-api/run-task`
3. `next.config.js` rewrites `/workshop-api/*` to `$WORKSHOP_API_URL/api/*`
4. `proxy.ts` intercepts the request and injects the `X-Workshop-Secret` header
5. Modal backend receives the request, calls GPT-5.4 (OpenAI API), TxGemma (internal GPU function), and Biomni (internal function) in parallel
6. Results are stored in SQLite on a Modal Volume and returned to the frontend

### 5. Updating the Deployment

Any change to backend code, adapters, prompts, or Modal config requires a redeploy:

```bash
modal deploy modal/app.py
```

This is fast for code-only changes — Modal reuses the cached container images and only re-uploads the mounted backend code. Image rebuilds (e.g., adding new pip packages) take longer.

Frontend changes deploy automatically via Vercel on `git push`.

**What triggers an image rebuild vs. a fast redeploy:**

| Change | Rebuild? | Notes |
|--------|----------|-------|
| Backend Python code (`backend/`) | No — fast, uses mount | Just re-uploads files |
| `modal/app.py` config changes | No — fast | Unless image definition changes |
| New pip dependency | Yes — slow | Rebuilds `backend_image` |
| TxGemma model change | Yes — very slow | Re-downloads model weights |

### 6. Integrating Biomni

Biomni is currently a stub. To integrate the real model:

1. **Create a Biomni image** in `modal/app.py` with its dependencies:
   ```python
   biomni_image = (
       modal.Image.debian_slim(python_version="3.11")
       .pip_install("biomni", "torch", ...)  # actual deps from biomni repo
       .run_commands("python -c 'import biomni; ...'")  # download weights
   )
   ```

2. **Replace the `biomni_predict` stub** with real inference:
   ```python
   @app.function(image=biomni_image, gpu=modal.gpu.A100(...), timeout=180)
   def biomni_predict(prompt: str) -> dict:
       # actual biomni inference
       ...
   ```

3. **Set `BIOMNI_ENABLED=true`** in your Modal secret:
   ```bash
   modal secret create workshop-secrets \
       OPENAI_API_KEY=$OPENAI_API_KEY \
       WORKSHOP_SECRET=$WORKSHOP_SECRET \
       WORKSHOP_ADMIN_PASSWORD=$WORKSHOP_ADMIN_PASSWORD \
       BIOMNI_ENABLED=true
   ```

4. **Redeploy:**
   ```bash
   modal deploy modal/app.py
   ```

No frontend changes needed — the backend calls Biomni internally via `biomni_predict.remote()`, and the frontend already handles Biomni responses.

### 7. Stopping the Deployment

```bash
# Stop all containers (app auto-restarts on next request)
modal app stop biomedical-workshop

# Fully remove the app (requires modal deploy to bring back)
modal app delete biomedical-workshop
```

Containers also auto-stop after 30 minutes of inactivity. No cost while idle.

## Environment Variables

### Local development (`.env`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `OPENAI_API_KEY` | — | Yes | OpenAI API key |
| `OPENAI_MODEL` | `gpt-5.4` | No | OpenAI model name |
| `TXGEMMA_BASE_URL` | — | No | Modal vLLM endpoint (local dev only) |
| `BIOMNI_ENABLED` | `false` | No | Enable/disable Biomni |
| `BIOREASON_ENABLED` | `false` | No | Enable/disable BioReason-Pro |
| `WORKSHOP_SECRET` | `dev-secret` | No | Shared secret for backend auth |
| `WORKSHOP_ADMIN_PASSWORD` | `admin` | No | Admin page password |

### Vercel

| Variable | Description |
|----------|-------------|
| `WORKSHOP_API_URL` | Modal backend URL |
| `WORKSHOP_SECRET` | Must match Modal secret |

### Modal (via `workshop-secrets`)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `WORKSHOP_SECRET` | Shared secret for backend auth |
| `WORKSHOP_ADMIN_PASSWORD` | Admin page password |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Feature flags |
| `GET` | `/api/tasks` | Task definitions |
| `POST` | `/api/run-task` | Run prompt across all models |
| `POST` | `/api/vote` | Submit thumbs up/down |
| `POST` | `/api/best-answer` | Select best answer |
| `POST` | `/api/summarize` | 3-word chat summary (GPT-4.1-mini) |
| `GET` | `/api/leaderboard` | Aggregate stats |
| `GET` | `/api/conversation/{id}` | Load conversation history |
| `POST` | `/api/conversation` | Create new conversation |
| `POST` | `/api/admin/verify` | Verify admin password |
| `POST` | `/api/admin/stats` | Detailed statistics |
| `POST` | `/api/admin/history` | Full question history |
| `POST` | `/api/admin/clear-statistics` | Reset statistics |
| `POST` | `/api/admin/clear-conversations` | Delete all data |
| `POST` | `/api/bioreason/run-example` | Run BioReason-Pro example |

## Notes

- The workshop page is hidden — not linked in navigation, access via direct URL only
- SQLite on Modal uses a persistent Volume (`workshop-db`); data survives container restarts
- TxGemma containers auto-scale to zero after 5 minutes of inactivity to save costs
- The admin page at `/workshop-results` is also hidden and password-protected
