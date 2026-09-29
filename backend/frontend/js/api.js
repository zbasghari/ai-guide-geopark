/* API layer — talks to the existing FastAPI backend */
const API = {
  base: "", // same-origin (FastAPI serves the frontend); overridable for external hosting

  async _fetch(path, opts = {}) {
    const res = await fetch(this.base + path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail || JSON.stringify(body);
      } catch (_) {}
      throw new Error(`API ${path} → ${res.status}: ${detail}`);
    }
    return res.json();
  },

  health() { return this._fetch("/health"); },
  knowledgeStats() { return this._fetch("/api/knowledge/stats"); },
  knowledgeList(category) {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    return this._fetch(`/api/knowledge${q}`);
  },
  knowledgeDetail(id) { return this._fetch(`/api/knowledge/${encodeURIComponent(id)}`); },
  categories() { return this._fetch("/api/categories"); },
  search(q, limit = 8) { return this._fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}&limit=${limit}`); },
  chat(message, session_id = "default") {
    return this._fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, session_id }),
    });
  },
  recommend({ interest = "", difficulty = "", duration = "", limit = 6 } = {}) {
    const params = new URLSearchParams();
    if (interest) params.set("interest", interest);
    if (difficulty) params.set("difficulty", difficulty);
    if (duration) params.set("duration", duration);
    params.set("limit", String(limit));
    return this._fetch(`/api/recommend?${params.toString()}`);
  },
  timeline() { return this._fetch("/api/timeline"); },
  faq() { return this._fetch("/api/faq"); },
};
