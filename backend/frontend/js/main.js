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

/* Category chips in the hero are real navigation.
   Each chip opens its OWN dedicated tab view (a separate overlay with its own
   header + close button), so no two chips lead to the same place:
   - geosites / attractions / routes / facilities / rules -> a catalog view
     showing only that category's items
   - faq -> the FAQ list
   No page reload; the view opens on top and closes with ✕ / Esc. */
function renderStats() {
 const host = document.getElementById("hero-stats");
 host.replaceChildren();
 if (state.cats.length) {
   for (const c of state.cats) {
     const chip = document.createElement("button");
     chip.type = "button";
     chip.className = "stat-chip";
     chip.dataset.category = c.key;
     // Subject-mapped icon inside the chip (per-category tone via CSS [data-category]).
     chip.innerHTML =
       `<span class="chip-ic" aria-hidden="true">${iconSVG(catIconName(c.key), 17)}</span>` +
       `<span>${esc(c.label_fa)}</span>`;
     chip.addEventListener("click", () => openCategoryTab(c.key));
     host.appendChild(chip);
   }
 }
}

 function openCategoryTab(key) {
  const label = state.cats.find((c) => c.key === key);
  const title = label ? label.label_fa : key;
  // sync the pressed state of the category chips so the active styling is live
  document.querySelectorAll(".stat-chip").forEach((chip) =>
    chip.setAttribute("aria-pressed", chip.dataset.category === key ? "true" : "false"));
  const host = document.getElementById("tab-view");
  host.replaceChildren();

  const head = document.createElement("header");
  head.className = "tab-view-head";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "tab-view-close";
  closeBtn.setAttribute("aria-label", "بستن نمای " + title);
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeCategoryTab);

  const h2 = document.createElement("h2");
  h2.textContent = title;
  head.appendChild(h2);
  head.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "tab-view-body";

  if (key === "faq") {
    body.innerHTML = `<div class="catalog-empty">در حال بارگذاری پرسش‌های متداول…</div>`;
    API.faq().then((f) => {
      body.replaceChildren(faqList(f.items || []));
    }).catch((err) => {
      body.innerHTML = `<div class="catalog-empty">${esc(err.message)}</div>`;
    });
  } else {
    const items = state.all.filter((i) => i.category === key);
    const grid = document.createElement("div");
    grid.className = "catalog";
    if (items.length) {
      for (const item of items) grid.appendChild(catalogCard(item));
    } else {
      grid.innerHTML = `<div class="catalog-empty">موردی در این بخش از پایگاه دانش موجود نیست.</div>`;
    }
    body.appendChild(grid);
  }

  host.appendChild(head);
  host.appendChild(body);
  host.hidden = false;
  document.body.style.overflow = "hidden";
  host.scrollTop = 0;
}

function closeCategoryTab() {
  const host = document.getElementById("tab-view");
  host.hidden = true;
  document.body.style.overflow = "";
  document.querySelectorAll(".stat-chip[aria-pressed]").forEach((c) =>
    c.removeAttribute("aria-pressed"));
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("tab-view").hidden) {
    closeCategoryTab();
  }
});

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

  // Decorate section headers + hero with the professional SVG icon system
  decorateIconHeaders();

  // Init the motion / scroll-reveal system (respects prefers-reduced-motion)
  initMotion();

  document.getElementById("chat-fab").addEventListener("click", () => {
    document.getElementById("chat-section").scrollIntoView({ behavior: "smooth" });
  });

  // health check surfaced quietly
  API.health().catch((err) => console.warn("backend not reachable:", err.message));
}

/* ---------- Professional SVG icon decoration on section headers ----------
   Adds a meaning-mapped icon badge to each <h2 data-icon> section header,
   using the shared icon system in icons.js so one set is used everywhere. */
function decorateIconHeaders() {
  const MAP = [
    ["#explore h2", "explore"],
    ["#map-section h2", "map"],
    ["#timeline-section h2", "timeline"],
    ["#faq-section h2", "faq"],
    ["#chat-section h2", "ai"],
  ];
  for (const [sel, icon] of MAP) {
    const h = document.querySelector(sel);
    if (!h || h.querySelector(".icon-badge")) continue;
    const wrap = document.createElement("span");
    wrap.className = "h-icon";
    wrap.innerHTML = iconBadge(icon, { size: 24, cls: "head-badge" });
    h.insertBefore(wrap, h.firstChild); // RTL: leading side of the title
  }
}

/* ---------- Motion / scroll-reveal system ----------
   Fade + slide cards/sections in as they enter the viewport; gentle float on
   the hero brand mark; smooth is performance-friendly (transform/opacity only)
   and fully disabled under prefers-reduced-motion. */
function initMotion() {
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    // Mark so CSS can neutralize animations, but still make content visible.
    document.documentElement.classList.add("reduce-motion");
    return;
  }

  // Make the hero brand mark gently float (subtle, premium).
  document.querySelectorAll(".brand-mark").forEach((el) => {
    el.classList.add("float");
  });

  // Reveal elements as they scroll into view.
  const revealSel =
    ".card, .section-head, .map-card, .timeline, .faq-list, .rec-item";

  // Only hide-then-reveal when we can actually reveal them. On browsers
  // without IntersectionObserver, leave everything visible (no .reveal).
  if (!("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(revealSel);
  targets.forEach((el) => el.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

let recPanel = null;

boot().catch((err) => console.error("boot failed:", err));
