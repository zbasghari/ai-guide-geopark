# PROJECT_HANDOFF — Aras Geopark AI Guide (Jolfa)

> This file is a **checkpoint**. A fresh agent should read it and resume from here.
> Last updated: 2026-10-02 (state verified on disk + Chrome CDP + git sync).

## 1) What exists (verified 2026-10-02)

- **Backend** (`backend/`): FastAPI, 27-item KB (~605 content lines), API endpoints
  (knowledge / categories / recommend / timeline / faq / chat), static mount.
- **Frontend** (`backend/frontend/`): vanilla JS (5 files, ~80KB) + CSS (~40KB) + HTML
  (6.8KB). RTL, B Nazanin / Vazirmatn fonts.
- **Images**: 154 WebP files (77 full @ ≤1600px + 77 thumbs @ 800px) = **24.1MB**,
  all in `backend/frontend/images/attractions/<slug>/`. Every one of the 27 KB items
  references an image (verified 0 missing, 0 orphaned, 0 unused paths).
  `markaz/` (Visitor Center) added 2026-10-02.
- **Design System**: `design-system/geopark-aras/MASTER.md` = source of truth.
- **AI**: `ai_service.py` — Ollama first, OpenAI fallback (no Ollama on user's
  machine; grounded fallback chat works).

## 2) What the user has asked for (all DONE + committed)

1. **Tourism portal rework** — 27 items, 16 new attractions, image fields on all,
   real per-item icons, schematic map with hand-tuned layout (MAP_LAYOUT table),
   enriched section icons, animated CTA/chips/pills (moss→sky gradient), floating
   modal close (`.modal-bar`), chip icons with `aria-pressed`, U+200C "منظرهگاه"
   fix. ✅
2. **7 new image sets** (manzaragah + masire_asane + masire_koohnavardi + parking_asli
   + service_behdashti + ghavanine_bazdid + soalate_motadavel + markaz) copied,
   enhanced, wired into KB frontmatter. ✅
3. **Design System** persisted to `design-system/geopark-aras/MASTER.md`. ✅
4. **Performance pass** (2026-10-02): JPEG→WebP (all 152 pre-existing + 2 new),
   2000px→1600px, GZip middleware, smart cache-control (images long-cache, HTML/API
   no-cache, JS/CSS versioned query), `defer` on all 5 scripts, removed unused
   `doodle-icons/` (563KB) and `__manifest.json` (10KB).
   **Result: initial page load transfer 51MB+ → ~0.85MB** (verified via CDP
   ResourceTiming: 34 requests, 853KB total, all 26 card images + modal hero +
   gallery load as .webp). ✅

## 3) Git state (verified 2026-10-02)

- Repo: `https://github.com/zbasghari/ai-guide-geopark` branch `main`
- **Committed + pushed**: `ad404cf` "Tourism portal v2 + performance pass:
  WebP images, GZip, smart cache" (404 files). Local == remote (0/0 ahead).
- `http.postBuffer=524288000` is set locally; the earlier 51MB commit (82067b5) was
  un-pushed and squashed away via `reset --soft`, so the pushed history contains
  only the 24.1MB WebP tree (not the 49MB JPEG tree).
- `.gitignore` updated: scratch `_*` files excluded.

## 4) To resume

- Local server: `cd backend && uvicorn main:app --host 127.0.0.1 --port 8000`
  (Python 3.13 at `C:/Users/violet/AppData/Local/Programs/Python/Python313`).
- CDP Chrome: `"/c/Program Files/Google/Chrome/Application/chrome.exe"
  --remote-debugging-port=9333 --user-data-dir=<fresh tmp dir>
  --no-first-run --no-default-browser-check --remote-allow-origins=*
  http://127.0.0.1:8000/`
- **Railway** deploy: `arascostums-production.up.railway.app` is the customs agent;
  this geopark project deploys the same way (root Dockerfile, `COPY backend/ ./`).
  After pushing a new commit, trigger a Railway redeploy and confirm the new
  `build_id` at `/health`.
- Remaining open items from MASTER.md next-steps (if user requests):
  React+Vite+Tailwind+daisyUI port (user-mandated stack), focus-ring token +
  contrast audit, reduced-motion audit, Lighthouse run.
- Any new image the user drops in `C:/Users/violet/Desktop/images`: convert to
  WebP full (≤1600px, q84) + thumb (≤800px, q80) into `images/attractions/<slug>/`,
  wire `image` / `image_thumb` / `gallery` into the matching KB frontmatter.

## 5) Guardrails (user-mandated — do not break)

- React+Vite+Tailwind+daisyUI+Originkit is the user's stack for future web UI;
  current site is vanilla (rewrite only if user authorizes).
- Persian B Nazanin + English Times New Roman; light theme #eef2f7; formal,
  no-emoji tone; never "روی لپتاپ شما".
- U+200C half-space on "منظرهگاه" (7 occurrences fixed; keep it).
- "دره آفریده" does not exist — do not add.
- No numbers on stat chips/buttons.
- `openai_api_key` / `anthropic_api_key` are env vars (config.py defaults None);
  **never commit a `.env`** (verified none staged).
