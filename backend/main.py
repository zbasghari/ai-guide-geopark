from contextlib import asynccontextmanager
from pathlib import Path
import re
import os
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from config import settings
from knowledge_base import init_knowledge_base, get_knowledge_base, KnowledgeBase, KnowledgeItem
from ai_service import init_ai_service, get_ai_service, AIService, ChatResponse


def _build_id() -> str:
    """Stable short hash of the source files, used to detect stale deployments.

    If the running container's /health build_id differs from the value
    produced at the latest commit, the process is an older build and the
    service must be redeployed to the newest commit.
    """
    h = hashlib.sha256()
    base = Path(__file__).resolve().parent
    for name in ("main.py", "config.py", "ai_service.py", "knowledge_base.py"):
        p = base / name
        if p.exists():
            h.update(p.read_bytes())
    # Include the knowledge + frontend trees so content changes bump the id.
    for sub in ("knowledge", "frontend"):
        d = base / sub
        if d.exists():
            for f in sorted(d.rglob("*")):
                if f.is_file():
                    h.update(str(f.relative_to(base)).encode())
                    h.update(f.read_bytes())
    return h.hexdigest()[:12]


BUILD_ID = _build_id()


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponseModel(BaseModel):
    answer: str
    sources: List[dict]


class HealthResponse(BaseModel):
    status: str
    knowledge_base_items: int
    ai_provider: str
    build_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers (data strictly derived from knowledge base content, no invented data)
# ---------------------------------------------------------------------------

_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

CATEGORY_LABELS_FA = {
    "geosites": "ژئوسایت‌ها",
    "attractions": "جاذبه‌های گردشگری",
    "routes": "مسیرهای بازدید",
    "facilities": "امکانات",
    "rules": "قوانین",
    "faq": "سوالات متداول",
}


def _parse_sections(content: str) -> dict:
    """Split markdown body into ## sections. The first line '#' (title) is skipped."""
    sections = {}
    current = "intro"
    buf = []
    for line in content.splitlines():
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            text = "\n".join(buf).strip()
            if text:
                sections[current] = text
            buf = []
            current = line[3:].strip()
            continue
        buf.append(line)
    text = "\n".join(buf).strip()
    if text:
        sections[current] = text
    return sections


def _extract_spec_pairs(section_text: str) -> dict:
    """Parse bullet lines of the form '- **طول**: ۲.۵ کیلومتر' into key/value pairs."""
    pairs = {}
    for m in re.finditer(r"[-*]\s*\*\*(.+?)\*\*\s*[:：]\s*(.+)", section_text):
        pairs[m.group(1).strip()] = m.group(2).strip().translate(_FA_DIGITS)
    return pairs


def _extract_numbered_list(section_text: str) -> List[str]:
    return [m.group(1).strip() for m in re.finditer(r"^\s*\d+\.\s*(.+)$", section_text, re.M)]


def _extract_bullets(section_text: str) -> List[str]:
    out = []
    for m in re.finditer(r"^\s*[-*]\s+(.+)$", section_text, re.M):
        out.append(m.group(1).strip())
    return out


def _first_line(text: str) -> str:
    line = next((l.strip() for l in text.splitlines() if l.strip()), "")
    return _clean_inline(line)


def _clean_inline(text: str) -> str:
    """Strip markdown decoration (bold markers, bullet/number prefixes) for display."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"^[-*]\s+", "", text)
    m = re.match(r"^\d+\.\s*", text)
    if m:
        text = text[m.end():]
    return text.strip()


def _clean_excerpt(text: str, limit: int = 300) -> str:
    """Flatten a markdown section to a readable excerpt.

    Strips headers/asterisks, collapses whitespace, and truncates at a sentence
    boundary (never mid-word) so text is never left dangling/«ناقص».
    """
    body = re.sub(r"^#{1,6}\s+", "", text, flags=re.M)
    body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
    body = re.sub(r"^\s*[-*]\s+", "", body, flags=re.M)
    body = " ".join(body.split())

    if len(body) <= limit:
        return body
    cut = body[:limit]
    # Prefer a sentence boundary within the last ~40 chars for a clean stop.
    last_break = max(cut.rfind("."), cut.rfind("،"), cut.rfind("،"), cut.rfind("؛"))
    if last_break > limit * 0.6:
        cut = cut[: last_break + 1]
    else:
        cut = cut.rstrip()
    return cut + "…"


def _section_named(sections: dict, *names) -> str:
    for name in names:
        for key, body in sections.items():
            if name in key:
                return body
    return ""


def _item_summary(item: KnowledgeItem) -> dict:
    sections = _parse_sections(item.content)
    specs: dict = {}
    for body in sections.values():
        specs.update(_extract_spec_pairs(body))

    waypoints = []
    amenities = []
    for key, body in sections.items():
        if "نقاط عبور" in key:
            waypoints = _extract_numbered_list(body) or _extract_bullets(body)
        if "امکانات" in key:
            amenities.extend(_extract_bullets(body))

    location = _first_line(_section_named(sections, "موقعیت"))

    excerpt_body = sections.get("intro", "")
    if not excerpt_body.strip():
        # fall back to first named section (e.g. توضیحات)
        for key, body in sections.items():
            if key not in ("امکانات", "نقاط عبور", "موقعیت جغرافیایی", "موقعیت", "مشخصات فنی", "ویژگیها", "نکات ایمنی", "بهترین زمان بازدید", "بهترین زمان"):
                excerpt_body = body
                break
    excerpt = _clean_excerpt(excerpt_body, 100000)

    return {
        "id": item.id,
        "title": item.title,
        "category": item.category,
        "category_fa": CATEGORY_LABELS_FA.get(item.category, item.category),
        "tags": item.tags,
        "file_path": item.file_path,
        "excerpt": excerpt,
        "location": location,
        "specs": specs,
        "waypoints": waypoints,
        "amenities": amenities[:8],
        "best_time": _first_line(_section_named(sections, "بهترین زمان")),
        "safety_notes": _extract_bullets(_section_named(sections, "نکات ایمنی"))[:8],
    }


def _item_detail(item: KnowledgeItem) -> dict:
    payload = _item_summary(item)
    payload["content"] = item.content
    payload["sections"] = _parse_sections(item.content)
    return payload


def _to_fa_num(value) -> str:
    """Convert a number/string to Persian digits for display labels."""
    if isinstance(value, (int, float)):
        v = int(value) if float(value).is_integer() else value
        s = f"{v:.1f}" if isinstance(v, float) else str(v)
        return s.translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹"))
    return str(value)


def _find_age_in_line(line: str) -> Optional[tuple]:
    """Return (age_in_millions_years, raw_label) if the line mentions a geological age."""
    m = re.search(r"([\d۰-۹]+(?:[.,،][\d۰-۹]+)?)\s*میلیون\s*سال(?:\s*پیش)?", line)
    if m:
        num = m.group(1).translate(_FA_DIGITS).replace("،", ".").replace(",", ".")
        return float(num), m.group(0).translate(_FA_DIGITS)
    return None


def _build_timeline() -> List[dict]:
    """Build an information timeline from dated statements found in knowledge items."""
    kb = get_knowledge_base()
    events: List[dict] = []
    seen = set()
    for item in kb.get_all():
        if item.category not in ("geosites", "attractions", "routes"):
            continue
        # Dated events (millions of years)
        for raw_line in item.content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            found = _find_age_in_line(line)
            if found:
                age_m, raw_label = found
                desc = _first_line(line)[:160]
                key = (item.id, desc)
                if key in seen:
                    continue
                seen.add(key)
                events.append({
                    "age": age_m,
                    "age_label": f"حدود {_to_fa_num(age_m)} میلیون سال پیش",
                    "title": item.title,
                    "description": desc,
                    "kind": "geological_age",
                    "source": {"id": item.id, "title": item.title, "category": item.category, "category_fa": CATEGORY_LABELS_FA.get(item.category, item.category)},
                })
        # Formation-process events (undated, derived from 'فرآیند تشکیل' spec pairs)
        sections = _parse_sections(item.content)
        specs = {}
        for body in sections.values():
            specs.update(_extract_spec_pairs(body))
        process = specs.get("فرآیند تشکیل")
        if process:
            key = (item.id, "process", process)
            if key not in seen:
                seen.add(key)
                events.append({
                    "age": None,
                    "age_label": "رویداد سازنده",
                    "title": item.title,
                    "description": process,
                    "kind": "formation_process",
                    "source": {"id": item.id, "title": item.title, "category": item.category, "category_fa": CATEGORY_LABELS_FA.get(item.category, item.category)},
                })
    # Dated events oldest-first (geologically), undated formation events last
    events.sort(key=lambda e: (e["age"] is None, -(e["age"] or 0)))
    return events


# Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    kb = init_knowledge_base(settings.knowledge_base_path)
    count = len(kb.get_all())
    print(f"Knowledge base path: {kb.base_path} (exists: {kb.base_path.exists()})")
    print(f"Knowledge base loaded: {count} items")
    if count == 0:
        import os as _os
        _root = Path(kb.base_path).parent
        print(f"WARNING: knowledge base is EMPTY. Contents of '{_root}':")
        try:
            for _name in sorted(_os.listdir(_root)):
                print(f"  - {_name}")
        except Exception:
            pass
        print("If 'knowledge/' is missing here, it was not included in the deploy — make sure the backend/ folder (with knowledge/ and frontend/ inside it) is part of the uploaded files and re-deploy.")
    ai = init_ai_service(kb)
    print(f"AI provider: {settings.ai_provider}")
    print(f"Frontend dir: {settings.frontend_dir} (exists: {Path(settings.frontend_dir).exists()})")
    print(f"Build id: {BUILD_ID}  (if /health returns a different build_id than this, the live process is a stale build)")
    yield
    # Shutdown
    await ai.close()


# FastAPI app
app = FastAPI(
    title="AI Guide Geopark API",
    description="Backend API for the AI Guide Geopark MVP",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Always serve the frontend fresh — a stale cached JS build disables every
# button (this was the "buttons don't work" report). No-cache forces the
# browser to revalidate on each load.
@app.middleware("http")
async def disable_client_caching(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Cache-Control", "no-cache, must-revalidate, max-age=0")
    response.headers.setdefault("Pragma", "no-cache")
    response.headers.setdefault("Expires", "0")
    return response


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint.

    `build_id` is a hash of the running source files — if it differs from
    the value printed in the server log at startup, the live process is
    running an older build and the service should be redeployed.
    """
    kb = get_knowledge_base()
    return HealthResponse(
        status="ok",
        knowledge_base_items=len(kb.get_all()),
        ai_provider=settings.ai_provider,
        build_id=BUILD_ID,
    )


@app.post("/api/chat", response_model=ChatResponseModel)
async def chat(request: ChatRequest):
    """Chat endpoint for the AI Guide."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    ai = get_ai_service()
    response = await ai.chat(request.message, request.session_id)

    return ChatResponseModel(
        answer=response.answer,
        sources=response.sources,
    )


@app.get("/api/knowledge/stats")
async def knowledge_stats():
    """Get knowledge base statistics."""
    kb = get_knowledge_base()
    items = kb.get_all()

    categories = {}
    for item in items:
        categories[item.category] = categories.get(item.category, 0) + 1

    return {
        "total_items": len(items),
        "categories": categories,
    }


@app.get("/api/knowledge/search")
async def knowledge_search(q: str, limit: int = 10):
    """Search knowledge base directly."""
    kb = get_knowledge_base()
    items = kb.search(q, top_k=limit)

    return {
        "query": q,
        "results": [
            {
                "id": item.id,
                "title": item.title,
                "category": item.category,
                "tags": item.tags,
            }
            for item in items
        ],
    }


def _parse_faq_pairs(item: KnowledgeItem) -> List[dict]:
    """Split an FAQ markdown item into question/answer pairs.

    Structure: '## س: <question>' followed by '**ج:** <answer>' lines.
    Falls back to whole-section pairs if that pattern is absent.
    """
    pairs: List[dict] = []
    current_q: Optional[str] = None
    cur_lines: List[str] = []

    def flush():
        nonlocal current_q, cur_lines
        if current_q is not None:
            ans = "\n".join(cur_lines).strip()
            if ans:
                pairs.append({"question": current_q, "answer": ans})
        current_q = None
        cur_lines = []

    for line in item.content.splitlines():
        s = line.strip()
        if s.startswith("# "):
            continue
        if s.startswith("## س:") or s.startswith("## س:"):
            flush()
            current_q = s.replace("## س:", "").strip()
            continue
        if s.startswith("**ج:**"):
            cur_lines.append(s.replace("**ج:**", "").strip())
            continue
        if s.startswith("## "):
            flush()
            current_q = _clean_inline(s[3:])
            continue
        if current_q is not None and s:
            cur_lines.append(s)
    flush()

    if not pairs:
        sections = _parse_sections(item.content)
        for key, body in sections.items():
            if key == "intro" or not key:
                continue
            first_q = ""
            rest = []
            for line in body.splitlines():
                ls = line.strip()
                if ls.startswith("## س:"):
                    first_q = ls[4:].strip()
                elif ls.startswith("**ج:**"):
                    rest.append(ls.replace("**ج:**", "").strip())
                else:
                    rest.append(ls)
            pairs.append({"question": first_q or key, "answer": "\n".join(l for l in rest if l).strip()})
    return pairs


@app.get("/api/faq")
async def faq():
    """Question/answer pairs from the FAQ knowledge item(s)."""
    kb = get_knowledge_base()
    pairs: List[dict] = []
    source_ids: List[str] = []
    for item in kb.get_by_category("faq"):
        got = _parse_faq_pairs(item)
        if got:
            pairs.extend(got)
            source_ids.append(item.id)
    return {"items": pairs, "total": len(pairs), "sources": source_ids}


# ---------------------------------------------------------------------------
# New endpoints for the frontend experience
# ---------------------------------------------------------------------------

@app.get("/api/knowledge")
async def knowledge_list(category: Optional[str] = None):
    """List all knowledge items (summary payloads), optionally filtered by category."""
    kb = get_knowledge_base()
    items = kb.get_all() if category is None else kb.get_by_category(category)
    return {
        "items": [_item_summary(item) for item in items],
        "total": len(items),
    }


@app.get("/api/knowledge/{item_id}")
async def knowledge_detail(item_id: str):
    """Get a full knowledge item including raw markdown content."""
    kb = get_knowledge_base()
    item = kb.get_by_id(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return _item_detail(item)


@app.get("/api/categories")
async def categories():
    """Category overview for filters: counts and Persian labels."""
    kb = get_knowledge_base()
    counts = {}
    for item in kb.get_all():
        counts[item.category] = counts.get(item.category, 0) + 1
    return {
        "categories": [
            {
                "key": key,
                "label_fa": CATEGORY_LABELS_FA.get(key, key),
                "count": count,
            }
            for key, count in counts.items()
        ]
    }


@app.get("/api/recommend")
async def recommend(
    interest: Optional[str] = None,
    difficulty: Optional[str] = None,   # "آسان" | "متوسط" | "سخت"
    duration: Optional[str] = None,     # "short" | "medium" | "long"
    limit: int = 6,
):
    """
    Deterministic recommendation engine over the knowledge base.
    Scores routes/geosites/attractions against the requested profile;
    every result carries human-readable reasons. No invented data.
    """
    kb = get_knowledge_base()
    items = [i for i in kb.get_all() if i.category in ("routes", "geosites", "attractions", "facilities")]

    interest_hits: dict = {}
    if interest and interest.strip():
        for rank, item in enumerate(kb.search(interest.strip(), top_k=20)):
            interest_hits[item.id] = max(interest_hits.get(item.id, 0), 3 - rank * 0.5)

    def _duration_hours(item: KnowledgeItem) -> Optional[float]:
        sections = _parse_sections(item.content)
        specs = {}
        for body in sections.values():
            specs.update(_extract_spec_pairs(body))
        text = specs.get("مدت زمان") or specs.get("مدت") or ""
        nums = re.findall(r"[\d]+(?:[.,][\d]+)?", text)
        vals = [float(n.replace("،", ".")) for n in nums if n]
        if not vals:
            return None
        return max(vals)

    results = []
    for item in items:
        payload = _item_summary(item)
        reasons: List[str] = []
        score = 0.0
        base = {"routes": 2.0, "geosites": 3.0, "attractions": 2.5, "facilities": 1.5}
        score += base.get(item.category, 1.0)

        if item.id in interest_hits:
            score += interest_hits[item.id]
            reasons.append(f"مرتبط با موضوعِ «{interest.strip()}»")

        if difficulty:
            sections = _parse_sections(item.content)
            specs = {}
            for body in sections.values():
                specs.update(_extract_spec_pairs(body))
            difficulty_text = (specs.get("سختی", "") + " " + specs.get("دسترسی", "")).translate(_FA_DIGITS)
            if difficulty in difficulty_text:
                score += 2.0
                reasons.append(f"سختی مورد نظر: {difficulty}")
            if difficulty == "آسان" and "سخت" in difficulty_text:
                score -= 2.0

        if duration:
            hours = _duration_hours(item)
            if hours is not None:
                ok = (
                    (duration == "short" and hours <= 1.5)
                    or (duration == "medium" and 1.5 < hours <= 4)
                    or (duration == "long" and hours > 4)
                )
                if ok:
                    score += 2.0
                    reasons.append(f"مدت تقریبی {_to_fa_num(hours)} ساعت — با زمان‌بندی شما هم‌خوان است")
                else:
                    score -= 1.0

        if not reasons:
            reasons.append(CATEGORY_LABELS_FA.get(item.category, item.category))
        results.append({
            "score": round(score, 2),
            "reasons": reasons,
            "item": payload,
        })

    results.sort(key=lambda r: -r["score"])
    return {
        "profile": {"interest": interest, "difficulty": difficulty, "duration": duration},
        "recommendations": results[:limit],
    }


@app.get("/api/timeline")
async def timeline():
    """Information timeline: dated geological statements mined from the knowledge base."""
    return {"events": _build_timeline()}


# Serve the frontend (must be mounted after API routes so API wins)
_FRONTEND_DIR = Path(settings.frontend_dir)
if _FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(_FRONTEND_DIR), html=True), name="frontend")
    print(f"Frontend mounted from: {_FRONTEND_DIR}")
else:
    print(f"WARNING: frontend directory not found at {_FRONTEND_DIR} — it was not included in the deploy.")

    @app.get("/{path:path}", include_in_schema=False)
    async def missing_frontend_fallback(path: str):
        """Serve a diagnostic page when the frontend assets are absent, so '/'
        is never a silent 404."""
        from fastapi import Response
        import os as _os
        base = str(_FRONTEND_DIR.parent)
        listing = []
        try:
            listing = [n for n in sorted(_os.listdir(base))]
        except Exception:
            pass
        html = f"""<html dir="rtl" lang="fa"><head><meta charset="utf-8">
<title>ژئوپارک — خطای استقرار</title>
<style>body{{font-family:Tahoma,sans-serif;background:#16130f;color:#efe9df;max-width:760px;margin:60px auto;padding:24px;line-height:2}}
code{{background:#2e2820;padding:2px 8px;border-radius:6px;font-size:13px}}h2{{color:#c98a3d}}</style></head>
<body><h2>فایلهای فرانتاند یافت نشد</h2>
<p>API کار میکند اما پوشهٔ <code>frontend/</code> در کنار <code>backend/</code> وجود ندارد.</p>
<p>محتویات <code>{base}</code>: <code>{', '.join(listing) if listing else '(خالی)'}</code></p>
<p>پروژه در ساختار خودمختار <code>backend/frontend</code> و <code>backend/knowledge</code> نگهداری میشود. مطمئن شوید پوشهٔ کامل <code>backend/</code> (شامل <code>knowledge/</code> و <code>frontend/</code> در دل آن) در فایل‌های آپلودشدهٔ Railway وجود دارد، سپس deploy را دوباره اجرا کنید.</p>
<p>API: <a style="color:#7d8f6a" href="/health">/health</a> · <a style="color:#7d8f6a" href="/api/knowledge">/api/knowledge</a> · <a style="color:#7d8f6a" href="/openapi.json">openapi</a></p>
</body></html>"""
        return Response(content=html, media_type="text/html")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
