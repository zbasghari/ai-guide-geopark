/* Reusable Geopark components.
   Each component is a pure function: (data) -> HTMLElement.
   They are framework-free and share the glass/strata design tokens in style.css. */

// Persian-digit helper (shared by counts shown on buttons/filters)
function faNum(n) { return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]); }

// The professional icon system (SVG, meaning-mapped, distinct per topic)
// lives in icons.js: iconSVG / iconBadge / catIcon / catIconName.
// (No emoji icons, no duplicate CAT_ICON const here.)

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------- primitive: glass card shell ---------- */
function cardShell(category, innerHTML) {
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.cat = category || "generic";
  el.innerHTML = `<div class="card-band"></div><div class="card-body">${innerHTML}</div>`;
  return el;
}

/* ---------- card media (cover image) ----------
   Present when the item carries image frontmatter; absent otherwise, so
   text-only items (rules, faq, facilities, …) keep their current look. */
function insertCardMedia(card, item) {
  const src = item.image_thumb || item.image;
  if (!src) return;
  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");
  img.src = src;
  img.alt = item.title || "";
  img.loading = "lazy";
  img.decoding = "async";
  media.appendChild(img);
  if (item.attraction_category_fa) {
    const badge = document.createElement("span");
    badge.className = "media-badge";
    badge.textContent = item.attraction_category_fa;
    media.appendChild(badge);
  }
  card.insertBefore(media, card.querySelector(".card-body"));
}

/* ---------- Location Card (base for all place cards) ---------- */
function locationCard(item, { onOpen = null } = {}) {
  const card = cardShell(item.category, `
    <span class="card-cat">${itemIcon(item, { size: 15, cls: "cat-ic" })} ${esc(item.category_fa || item.category)}</span>
    <h3 class="card-title">${esc(item.title)}</h3>
    <p class="card-excerpt">${esc(item.excerpt)}</p>
    <div class="card-tags">${(item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    <div class="card-footer"></div>
  `);
  insertCardMedia(card, item);
  const footer = card.querySelector(".card-footer");

  if (item.location) {
    const pin = document.createElement("span");
    pin.className = "loc-hint";
    pin.style.cssText = "font-size:11px;color:var(--ink-soft);flex:1;display:inline-flex;align-items:center;gap:4px;";
    pin.innerHTML = iconInline("map", 13) + `<span>${esc(item.location)}</span>`;
    footer.appendChild(pin);
  }

  const btn = document.createElement("button");
  btn.className = "btn btn-ghost btn-small";
  btn.textContent = "جزئیات";
  btn.addEventListener("click", () => {
    if (onOpen) onOpen(item.id);
    else openDetail(item.id);
  });
  footer.appendChild(btn);
  return card;
}

/* ---------- Geological Site Card ---------- */
function geoSiteCard(item, { onOpen = null } = {}) {
  const card = locationCard(item, { onOpen });
  const body = card.querySelector(".card-body");
  const specs = Object.entries(item.specs || {}).slice(0, 5);
  if (specs.length) {
    const rows = document.createElement("div");
    rows.className = "spec-block";
    rows.innerHTML = specs.map(([k, v]) =>
      `<div class="spec-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
    ).join("");
    body.appendChild(rows);
  }
  if (item.best_time) {
    const b = document.createElement("div");
    b.style.cssText = "margin-top:10px;font-size:12px;color:var(--moss-deep);";
    b.textContent = "بهترین زمان: " + item.best_time;
    body.appendChild(b);
  }
  return card;
}

/* ---------- Tourism Card (attractions + facilities) ---------- */
function tourismCard(item, { onOpen = null } = {}) {
  const card = locationCard(item, { onOpen });
  const body = card.querySelector(".card-body");
  if ((item.amenities || []).length) {
    const ul = document.createElement("ul");
    ul.style.cssText = "margin:0 0 4px;padding-inline-start:18px;font-size:12px;color:var(--ink-soft);";
    ul.innerHTML = item.amenities.slice(0, 5).map((a) => `<li>${esc(a)}</li>`).join("");
    body.appendChild(ul);
  }
  const specs = Object.entries(item.specs || {}).slice(0, 4);
  if (specs.length) {
    const rows = document.createElement("div");
    rows.className = "spec-block";
    rows.innerHTML = specs.map(([k, v]) =>
      `<div class="spec-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
    ).join("");
    body.appendChild(rows);
  }
  return card;
}

/* ---------- Route Card ---------- */
function routeCard(item, { onOpen = null } = {}) {
  const card = locationCard(item, { onOpen });
  const body = card.querySelector(".card-body");
  const specs = Object.entries(item.specs || {}).slice(0, 6);
  if (specs.length) {
    const rows = document.createElement("div");
    rows.className = "spec-block";
    rows.innerHTML = specs.map(([k, v]) =>
      `<div class="spec-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
    ).join("");
    body.appendChild(rows);
  }
  if ((item.waypoints || []).length) {
    const ol = document.createElement("div");
    ol.className = "waypoints";
    ol.style.cssText = "margin-top:8px;font-size:12px;color:var(--ink-soft);";
    ol.innerHTML =
      `<span style="color:var(--ink);font-weight:600;">نقاط عبور:</span><ul style="margin:4px 0 0;padding-inline-start:18px;">` +
      item.waypoints.map((w) => `<li>${esc(w)}</li>`).join("") +
      `</ul>`;
    body.appendChild(ol);
  }
  if ((item.safety_notes || []).length) {
    const s = document.createElement("div");
    s.className = "safety";
    s.style.cssText = "margin-top:8px;font-size:12px;color:#8a3f3f;background:rgba(138,63,63,0.08);border:1px solid rgba(138,63,63,0.25);padding:8px 10px;border-radius:10px;";
    s.innerHTML = `<b>نکات ایمنی:</b><ul style="margin:4px 0 0;padding-inline-start:18px;">` +
      item.safety_notes.slice(0, 4).map((n) => `<li>${esc(n)}</li>`).join("") +
      `</ul>`;
    body.appendChild(s);
  }
  return card;
}

/* ---------- card dispatcher (used by the catalog grid) ---------- */
function catalogCard(item, opts) {
  switch (item.category) {
    case "geosites": return geoSiteCard(item, opts);
    case "routes": return routeCard(item, opts);
    case "attractions":
    case "facilities": return tourismCard(item, opts);
    default: return locationCard(item, opts);
  }
}

/* ---------- Information Timeline ---------- */
function timelineEl(events) {
  const wrap = document.createElement("div");
  wrap.className = "timeline";
  if (!events || !events.length) {
    wrap.innerHTML = `<div class="catalog-empty">رویداد زمان‌بندی‌شده‌ای یافت نشد.</div>`;
    return wrap;
  }
  for (const ev of events) {
    const node = document.createElement("div");
    node.className = "tl-event";
    node.dataset.kind = ev.kind;
    node.innerHTML = `
      <div class="tl-node"></div>
      <div class="tl-card">
        <span class="tl-age">${esc(ev.age_label)}</span>
        <div class="tl-title">${esc(ev.title)}</div>
        <div class="tl-desc">${esc(ev.description)}</div>
        <div class="tl-src">منبع: ${esc(ev.source.title)} — ${esc(ev.source.category_fa)}</div>
      </div>`;
    const card = node.querySelector(".tl-card");
    card.style.cursor = "pointer";
    card.addEventListener("click", () => openDetail(ev.source.id));
    wrap.appendChild(node);
  }
  return wrap;
}

/* ---------- Map Card (schematic layout) ----------
   Positions come from the MAP_LAYOUT table below: a hand-tuned schematic
   arrangement derived from the knowledge base's own geography text (e.g. "بر
   رود ارس در دوزال"، "۱۵–۱۷ کیلومتری غرب جلفا"، "حاشیهٔ جنوبشرقی شهر"، "پشت
   سد ارس، ۴۰ کیلومتری"). No invented coordinates — just the relative
   west/center/southeast/northeast layout the texts describe. */
const MAP_LAYOUT = {
  "geosite-1":     { x: 24, y: 30, z: "west"  }, // آبشار آسیاب خرابه — حاشیهرود ارس، غرب
  "geosite-2":     { x: 12, y: 44, z: "west"  }, // کلیسای سنت استپانوس — ۱۵–۱۷ کیلومتری غرب
  "geosite-3":     { x: 72, y: 62, z: "se"    }, // گچی قالاسی — جنوبشرقی، روستای شجاع
  "attraction-1":  { x: 48, y: 50, z: "center" }, // مرکز بازدیدکنندگان — داخل شهر
  "attraction-2":  { x: 60, y: 40, z: "center" }, // منظره‌گاه سراسرنمای قله
  "attraction-3":  { x: 18, y: 56, z: "west"  }, // کلیسای چوپان — درهٔ غرب جلفا
  "attraction-4":  { x: 44, y: 36, z: "center" }, // رودخانه ارس — کرانهٔ شهر
  "attraction-5":  { x: 30, y: 40, z: "west"  }, // کاروانسرای خواجهنظر — جوار پل ضیاءالملک
  "attraction-6":  { x: 40, y: 58, z: "center" }, // مجموعه کردشت — ساحل جنوبی ارس
  "attraction-7":  { x: 44, y: 61, z: "center" }, // حمّام کردشت
  "attraction-8":  { x: 36, y: 64, z: "center" }, // قلعه کردشت — دامنهٔ کنتال
  "attraction-9":  { x: 22, y: 66, z: "west"  }, // روستای اشتبین — طاقاندازی
  "attraction-10": { x: 86, y: 26, z: "ne"    }, // برج دوزال — تپهٔ مشرف بر ارس، شرق دور
  "attraction-11": { x: 52, y: 52, z: "center" }, // کلیساهای تاریخی جلفا — داخل شهر
  "attraction-12": { x: 30, y: 33, z: "west"  }, // پل ضیاءالملک — بر ارس، غرب
  "attraction-13": { x: 26, y: 37, z: "west"  }, // پل آهنی (دمیرکورپو) — غرب
  "attraction-14": { x: 66, y: 14, z: "ne"    }, // آبشار ماهاران — نزدیک هادیشهر/سیهرود
  "attraction-15": { x: 78, y: 20, z: "ne"    }, // پارک ملی کنتال — بخش سیهرود، جوار مرز
  "attraction-16": { x: 88, y: 36, z: "ne"    }, // مراکان — شمالشرقی، مرزی
  "attraction-17": { x: 6,  y: 26, z: "west"  }, // سد ارس — ~۴۰ کیلومتری غرب، بالادست
  "attraction-18": { x: 74, y: 74, z: "se"    }, // دشت گردیان — ~۵ کیلومتر جنوبشرقی
  "route-1":       { x: 55, y: 54, z: "center" }, // مسیر آسان خانواده — از داخل شهر، ۲.۵ کیلومتر
  "route-2":       { x: 64, y: 56, z: "se"    }, // مسیر کوهنوردی گچی قالاسی — از حاشیهٔ جنوبشرقی شهر
  "facility-1":    { x: 45, y: 54, z: "center" }, // پارکینگ اصلی — شهر
  "facility-2":    { x: 50, y: 57, z: "center" }, // سرویسهای بهداشتی — شهر
};
const MAP_ZONE_STYLE = {
  west:   { label: "بخش غربی",       box: [3, 40, 34, 36] },
  center: { label: "شهر و کرانهٔ ارس", box: [32, 44, 32, 28] },
  se:     { label: "بخش جنوبشرقی",   box: [58, 52, 34, 36] },
  ne:     { label: "بخش شمالشرقی",   box: [62, 4, 34, 36] },
};

function mapCard(items, { onOpen = null } = {}) {
  const root = cardShell(null, `<div class="map-inner"><div class="map-layer"></div></div>`);
  const inner = root.querySelector(".map-inner");

  // river + border backdrop (schematic: the Aras flows east-west, town on the south bank)
  const river = document.createElement("div");
  river.className = "map-river";
  river.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-2 30 C 12 34, 26 31, 40 35 S 70 29, 84 34 S 98 33, 104 30"
            fill="none" stroke="rgba(63,127,191,0.55)" stroke-width="4" stroke-linecap="round"/>
      <path d="M-2 34 C 12 38, 26 35, 40 39 S 70 33, 84 38 S 98 37, 104 34"
            fill="none" stroke="rgba(79,166,216,0.35)" stroke-width="2" stroke-linecap="round"/>
      <path d="M-2 12 H102" stroke="rgba(109,97,79,0.5)" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>
    </svg>
    <span class="map-river-label">رود ارس (مرز)</span>`;
  inner.appendChild(river);

  // zone outlines
  for (const [z, spec] of Object.entries(MAP_ZONE_STYLE)) {
    const div = document.createElement("div");
    div.className = "map-zone";
    div.style.cssText = `left:${spec.box[0]}%;top:${spec.box[1]}%;width:${spec.box[2]}%;height:${spec.box[3]}%;`;
    div.innerHTML = `<span class="zone-label">${esc(spec.label)}</span>`;
    inner.appendChild(div);
  }

  // pins — table-driven, so the whole canvas is used
  items.forEach((item) => {
    const pos = MAP_LAYOUT[item.id];
    if (!pos) return;
    const color =
      item.category === "geosites" ? "var(--ochre)" :
      item.category === "routes" ? "var(--slate-500)" :
      item.category === "facilities" ? "var(--basalt-blue)" : "var(--moss-deep)";
    const pinIcon = itemIconName(item);

    const pin = document.createElement("div");
    pin.className = "map-pin";
    pin.setAttribute("tabindex", "0");
    pin.setAttribute("role", "button");
    pin.setAttribute("aria-label", item.title + " — " + (item.category_fa || ""));
    pin.style.left = pos.x + "%";
    pin.style.top = pos.y + "%";
    pin.innerHTML = `
      <div class="dot" style="background:${color};">${iconSVG(pinIcon, 15)}</div>
      <div class="pin-label">${esc(item.title)}</div>
      <div class="tip">
        <b>${esc(item.title)}</b>
        <div style="margin-bottom:4px;color:var(--ink-soft);">${esc(item.category_fa)}</div>
        ${item.excerpt ? `<div style="font-size:11px;margin-top:4px;">${esc(item.excerpt.slice(0, 90))}...</div>` : ""}
        <div style="margin-top:6px;"><a class="link-open" href="#" data-id="${esc(item.id)}">مشاهده جزئیات</a></div>
      </div>`;
    inner.appendChild(pin);

    pin.querySelector(".tip a").addEventListener("click", (e) => {
      e.preventDefault();
      if (onOpen) onOpen(item.id); else openDetail(item.id);
    });
    pin.querySelector(".dot").addEventListener("click", () => {
      if (onOpen) onOpen(item.id); else openDetail(item.id);
    });
    // keyboard: Enter/Space opens details (parity with the click behaviour)
    pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onOpen) onOpen(item.id); else openDetail(item.id);
      }
    });
    // reveal the tip when the pin is keyboard-focused (visible focus, no scroll)
    pin.addEventListener("focus", () => pin.classList.add("tip-open"));
    pin.addEventListener("blur", () => pin.classList.remove("tip-open"));
  });

  // legend
  const legend = document.createElement("div");
  legend.className = "map-legend";
  legend.innerHTML = `
    <span class="lg"><span class="sw" style="background:var(--ochre)"></span>ژئوسایت</span>
    <span class="lg"><span class="sw" style="background:var(--moss-deep)"></span>جاذبه گردشگری</span>
    <span class="lg"><span class="sw" style="background:var(--slate-500)"></span>مسیر بازدید</span>
    <span class="lg"><span class="sw" style="background:var(--basalt-blue)"></span>امکانات</span>
    <span class="lg-river"><span style="display:inline-block;width:18px;height:3px;border-radius:3px;background:var(--basalt-blue);"></span>رود ارس</span>
    <span style="margin-inline-start:auto;font-size:11px;opacity:.75;">چیدمان شماتیک بر اساس توصیفات جغرافیایی پایگاه دانش</span>`;
  root.appendChild(legend);
  return root;
}

/* ---------- Filters component ---------- */
function filterPanel(categories, active, onApply) {
  const panel = document.createElement("div");
  panel.className = "filters";
  panel.innerHTML = `
    <h3>فیلترها</h3>
    <div class="filter-group">
      <label>دسته‌بندی</label>
      <div class="filter-pills" data-name="category"></div>
    </div>
    <div class="filter-group">
      <label>سختی مسیر</label>
      <div class="filter-pills" data-name="difficulty"></div>
    </div>
    <div class="filter-group">
      <label>مدت زمان</label>
      <div class="filter-pills" data-name="duration"></div>
    </div>
  `;

  const pills = (name, options) => {
    const host = panel.querySelector(`.filter-pills[data-name="${name}"]`);
    options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "pill" + (active[name] === opt.value ? " active" : "");
      b.dataset.value = opt.value;
      if (opt.count != null) {
        b.title = `${opt.label}: ${opt.count} مورد در پایگاه دانش`;
      }
      b.textContent = esc(opt.label);
      b.addEventListener("click", () => {
        active[name] = active[name] === opt.value ? "" : opt.value;
        host.querySelectorAll(".pill").forEach((p) =>
          p.classList.toggle("active", p.dataset.value === active[name]));
        onApply();
      });
      host.appendChild(b);
    });
  };

  const catOptions = [
    { label: "همه", value: "" },
    ...categories.map((c) => ({ label: c.label_fa, value: c.key, count: c.count })),
  ];
  pills("category", catOptions);
  pills("difficulty", [
    { label: "همه", value: "" },
    { label: "آسان", value: "آسان" },
    { label: "متوسط", value: "متوسط" },
    { label: "سخت", value: "سخت" },
  ]);
  pills("duration", [
    { label: "همه", value: "" },
    { label: "کوتاه (زیر ۱.۵ ساعت)", value: "short" },
    { label: "متوسط", value: "medium" },
    { label: "طولانی", value: "long" },
  ]);
  return panel;
}

/* ---------- AI Recommendation Panel ---------- */
function recommendPanel(profile, onApply) {
  const panel = document.createElement("div");
  panel.className = "rec-panel";
  panel.innerHTML = `
    <h3>${iconBadge("ai", { size: 18, cls: "head-ic" })} <span>توصیه‌های هوشمند</span></h3>
    <p class="rec-note">بر اساس سلیقه، سختی و زمانبندی شما از پایگاه دانش ژئوپارک پیشنهاد میدهیم.</p>
    <div class="filter-group">
      <label>موضوع مورد علاقه</label>
      <div class="filter-pills" data-name="interest"></div>
    </div>
    <div class="rec-list"></div>`;

  const INTERESTS = ["آبشار", "دره", "آتشفشانی", "طبیعت", "خانواده", "کوهنوردی", "عکاسی"];
  const host = panel.querySelector('.filter-pills[data-name="interest"]');
  INTERESTS.forEach((label) => {
    const b = document.createElement("button");
    b.className = "pill" + (profile.interest === label ? " active" : "");
    b.textContent = label;
    b.addEventListener("click", () => {
      profile.interest = profile.interest === label ? "" : label;
      host.querySelectorAll(".pill").forEach((p) =>
        p.classList.toggle("active", p.textContent === profile.interest));
      onApply();
    });
    host.appendChild(b);
  });

  panel.querySelector(".rec-list").dataset.role = "rec-list";
  return panel;
}

async function renderRecommendations(panel, profile) {
  const list = panel.querySelector('[data-role="rec-list"]');
  list.innerHTML = `<div style="font-size:12px;color:var(--ink-soft);padding:8px 2px;">در حال دریافت توصیه‌ها…</div>`;
  try {
    const data = await API.recommend({
      interest: profile.interest,
      difficulty: profile.difficulty,
      duration: profile.duration,
    });
    const recs = data.recommendations || [];
    list.innerHTML = "";
    if (!recs.length) {
      list.innerHTML = `<div class="search-empty">توصیه‌ای مطابق شرایط فعلی یافت نشد.</div>`;
      return;
    }
    for (const r of recs) {
      const place = itemIconName(r.item);                 // specific place icon (آبشار، کلیسا، تراورتن، مرکز ...)
      const t = ICON_TONE[place] || ICON_TONE.geology;
      const row = document.createElement("div");
      row.className = "rec-item";
      row.innerHTML = `
        <div class="rec-icon"
             style="color:${t.fg};background:${t.bg};${t.g ? "background-image:" + t.g + ";" : ""}">${iconSVG(place, 22)}</div>
        <div class="rec-meta">
          <div class="t">${esc(r.item.title)}</div>
          <div class="why">${esc((r.reasons || [])[0] || "")}</div>
        </div>
        <a class="link-open" href="#" data-id="${esc(r.item.id)}">جزئیات</a>`;
      row.querySelector(".link-open").addEventListener("click", (e) => {
        e.preventDefault();
        openDetail(r.item.id);
      });
      row.querySelector(".rec-icon").style.cursor = "pointer";
      row.querySelector(".rec-icon").addEventListener("click", () => openDetail(r.item.id));
      list.appendChild(row);
    }
  } catch (err) {
    list.innerHTML = `<div class="search-empty">${esc(err.message)}</div>`;
  }
}

/* ---------- Search (header) component ---------- */
function searchWidget(onPick) {
  const host = document.createElement("div");
  host.innerHTML = `
    <span class="search-icon">
      <svg viewBox="0 0 20 20" width="15" height="15"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13 13 L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </span>
    <input type="search" placeholder="جستجو در پایگاه دانش…" aria-label="جستجو">
  `;
  const input = host.querySelector("input");
  let box = null;
  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { if (box) { box.remove(); box = null; } return; }
    timer = setTimeout(async () => {
      try {
        const data = await API.search(q);
        if (!box) {
          box = document.createElement("div");
          box.className = "search-results";
          host.appendChild(box);
        }
        box.innerHTML = "";
        const results = data.results || [];
        if (!results.length) {
          box.innerHTML = `<div class="search-empty">نتیجه‌ای یافت نشد.</div>`;
          return;
        }
        for (const r of results) {
          const a = document.createElement("a");
          a.className = "search-result-item";
          a.href = "#";
          a.innerHTML = `${esc(r.title)}<span class="cat">${esc(r.category)}</span>`;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            if (box) { box.remove(); box = null; }
            input.value = "";
            if (onPick) onPick(r); else openDetail(r.id);
          });
          box.appendChild(a);
        }
      } catch (err) {
        if (!box) { box = document.createElement("div"); box.className = "search-results"; host.appendChild(box); }
        box.innerHTML = `<div class="search-empty">${esc(err.message)}</div>`;
      }
    }, 250);
  });

  document.addEventListener("click", (e) => {
    if (box && !host.contains(e.target) && e.target !== input) {
      box.remove(); box = null;
    }
  });
  return host;
}

/* ---------- FAQ component ---------- */
function faqList(pairs) {
  const wrap = document.createElement("div");
  wrap.className = "faq-list";
  if (!pairs || !pairs.length) {
    wrap.innerHTML = `<div class="catalog-empty">موردی یافت نشد.</div>`;
    return wrap;
  }
  for (const p of pairs) {
    const item = document.createElement("div");
    item.className = "faq-item glass";
    item.innerHTML = `
      <button class="faq-q" aria-expanded="false">
        <span class="faq-marker">؟</span>
        <span class="faq-question">${esc(p.question)}</span>
        <span class="faq-toggle">+</span>
      </button>
      <div class="faq-a" role="region"><p></p></div>`;
    const btn = item.querySelector(".faq-q");
    const ans = item.querySelector(".faq-a p");
    ans.innerHTML = p.answer.replace(/\n/g, "<br>");
    ans.style.whiteSpace = "pre-line";
    ans.style.display = "none";
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      ans.style.display = open ? "" : "none";
      item.querySelector(".faq-toggle").textContent = open ? "−" : "+";
    });
    wrap.appendChild(item);
  }
  return wrap;
}
