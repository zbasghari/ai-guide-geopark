/* Main orchestration — wires components to the backend APIs */

const state = {
  all: [],
  cats: [],
  active: { category: "", difficulty: "", duration: "" },
};

async function loadAll() {
  try {
    const [k, c] = await Promise.all([API.knowledgeList(), API.categories()]);
    state.all = k.items || [];
    state.cats = c.categories || [];
  } catch (err) {
    console.error("loadAll failed:", err);
    document.getElementById("catalog").innerHTML =
      `<div class="catalog-empty">بارگذاری پایگاه دانش ناموفق بود: ${esc(err.message)}<br>از دسترس بودن سرور پسوند (port 8000) مطمئن شوید.</div>`;
  }
}

function filteredItems() {
  return state.all.filter((item) => {
    if (state.active.category && item.category !== state.active.category) return false;
    if (state.active.difficulty) {
      const specsText = Object.values(item.specs || {}).join(" ");
      const tags = (item.tags || []).join(" ");
      if (!specsText.includes(state.active.difficulty) && !tags.includes(state.active.difficulty)) return false;
    }
    if (state.active.duration) {
      const m = Object.values(item.specs || {}).join(" ").match(/[\d۰-۹]+(?:[.,۰-۹][\d۰-۹])?/);
      if (m) {
        const fa = "۰۱۲۳۴۵۶۷۸۹", digits = "0123456789";
        const num = parseFloat(m[0].split("").map((ch) => digits[fa.indexOf(ch)] ?? ch).join("").replace(/[.,]/g, "."));
        const ok =
          (state.active.duration === "short" && num <= 1.5) ||
          (state.active.duration === "medium" && num > 1.5 && num <= 4) ||
          (state.active.duration === "long" && num > 4);
        if (!ok) return false;
      }
    }
    return true;
  });
}

function renderCatalog() {
  const host = document.getElementById("catalog");
  host.replaceChildren();
  const items = filteredItems();
  if (!items.length) {
    host.innerHTML = `<div class="catalog-empty">مطابق فیلترهای فعلی موردی یافت نشد.</div>`;
    return;
  }
  const groupOrder = ["geosites", "attractions", "routes", "facilities", "rules", "faq"];
  for (const cat of groupOrder) {
    const catItems = items.filter((i) => i.category === cat);
    if (!catItems.length) continue;
    const label = state.cats.find((c) => c.key === cat);
    if (catItems.length > 1 || cat !== "geosites" || items.length > catItems.length) {
      // show a group heading when the catalog is grouped (i.e. no active filter narrows to one)
    }
    if (items.length !== state.all.length || state.active.category) {
      const h = document.createElement("div");
      h.style.cssText = "grid-column:1/-1;margin-top:8px;font-size:15px;color:var(--ink-soft);";
      h.textContent = label ? label.label_fa : cat;
      host.appendChild(h);
    }
    for (const item of catItems) {
      host.appendChild(catalogCard(item));
    }
  }
}

function renderStats() {
  const host = document.getElementById("hero-stats");
  host.replaceChildren();
  if (state.cats.length) {
    for (const c of state.cats) {
      const chip = document.createElement("span");
      chip.className = "stat-chip";
      chip.textContent = c.label_fa;
      host.appendChild(chip);
    }
  }
}

/* ---------- filters + recommendation wiring ---------- */
async function applyFilters() {
  renderCatalog();
  renderRecommendations(recPanel, {
    interest: state.active.interest || "",
    difficulty: state.active.difficulty,
    duration: state.active.duration,
  });
}

async function boot() {
  await loadAll();
  renderStats();
  renderCatalog();

  // filters
  const filtersHost = document.getElementById("filters");
  filtersHost.replaceChildren(
    filterPanel(state.cats, state.active, applyFilters)
  );

  // recommendation panel
  const recHost = document.getElementById("recommend-panel");
  recPanel = recommendPanel({ interest: state.active.interest }, () => applyFilters());
  recHost.replaceChildren(recPanel);
  await renderRecommendations(recPanel, state.active);

  // map
  try {
    const mapItems = state.all.filter((i) => ["geosites", "attractions", "routes", "facilities"].includes(i.category));
    document.getElementById("map-card").replaceChildren(mapCard(mapItems));
  } catch (err) {
    document.getElementById("map-card").innerHTML = `<div class="catalog-empty">${esc(err.message)}</div>`;
  }

  // timeline
  try {
    const t = await API.timeline();
    document.getElementById("timeline").replaceChildren(timelineEl(t.events || []));
  } catch (err) {
    document.getElementById("timeline").innerHTML = `<div class="catalog-empty">${esc(err.message)}</div>`;
  }

  // FAQ
  try {
    const f = await API.faq();
    document.getElementById("faq").replaceChildren(faqList(f.items || []));
  } catch (err) {
    document.getElementById("faq").innerHTML = `<div class="catalog-empty">${esc(err.message)}</div>`;
  }

  // search + chat
  const searchHost = document.getElementById("site-search");
  searchHost.className = "search";
  searchHost.replaceChildren(searchWidget((r) => openDetail(r.id)));

  chatComponent();

  document.getElementById("chat-fab").addEventListener("click", () => {
    document.getElementById("chat-section").scrollIntoView({ behavior: "smooth" });
  });

  // health check surfaced quietly
  API.health().catch((err) => console.warn("backend not reachable:", err.message));
}

let recPanel = null;

boot().catch((err) => console.error("boot failed:", err));
