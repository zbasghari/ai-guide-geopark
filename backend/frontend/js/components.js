/* Detail modal + AI chat component */

/* ---------- Modal (detail view of a knowledge item) ---------- */
const modalEl = () => document.getElementById("modal");

function openDetail(id) {
  const host = modalEl();
  if (!host) return;
  host.hidden = false;
  const card = document.createElement("div");
  card.className = "card modal-card";
  card.innerHTML = `<div class="card-band"></div>
    <div class="modal-bar">
      <span class="modal-bar-label">جزئیات</span>
      <button class="modal-close" aria-label="بستن">✕</button>
    </div>
    <div class="modal-body" style="padding:18px 22px;">در حال بارگذاری…</div>`;
  host.replaceChildren(card);
  card.querySelector(".modal-close").addEventListener("click", () => { host.hidden = true; host.replaceChildren(); });
  host.addEventListener("click", (e) => {
    if (e.target === host) { host.hidden = true; host.replaceChildren(); }
  });

  API.knowledgeDetail(id).then((item) => {
    card.dataset.cat = item.category;
    const body = card.querySelector(".modal-body");
    const sections = item.sections || {};

    // Hero media: full-res cover image (or gallery lead) at the top of the detail view
    let html = "";
    const media = item.image_thumb || item.image;
    if (media) {
      const heroSrc = item.image || media;
      const badge = item.attraction_category_fa ? `<span class="media-badge">${esc(item.attraction_category_fa)}</span>` : "";
      html += `<div class="modal-media">${badge}<img src="${esc(heroSrc)}" alt="${esc(item.title)}" loading="lazy"></div>`;
    }
    html += `
      <span class="card-cat">${itemIcon(item, { size: 15, cls: "cat-ic" })} ${esc(item.category_fa || item.category)}</span>
      <h3 class="card-title" style="margin-top:6px;">${esc(item.title)}</h3>
      <div class="card-tags">${(item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;

    // Gallery (3-6 images) shown for items that have more than one image
    const gallery = item.gallery || [];
    const thumbs = item.gallery_thumbs || gallery;
    if (gallery.length > 1) {
      html += `<h4>گالری تصاویر</h4><div class="media-gallery">` +
        gallery.map((g, i) => {
          const thumb = thumbs[i] || g;
          return `<button class="media-thumb" data-full="${esc(g)}" aria-label="نمایش تصویر ${i + 1}"><img src="${esc(thumb)}" alt="${esc(item.title)} — نما ${i + 1}" loading="lazy"></button>`;
        }).join("") + `</div>`;
    }

    const SPEC_KEYS = ["طول", "مدت زمان", "مدت", "سختی", "پوشش", "مناسب برای", "ارتفاع", "نوع سنگ", "فرآیند تشکیل", "عمق", "عرض", "سن ژئولوژیک", "شکل", "ظرفیت", "تعرفه"];
    const specs = {};
    for (const [k, v] of Object.entries(item.specs || {})) specs[k] = v;
    const specList = Object.entries(specs).slice(0, 10);
    if (specList.length) {
      html += `<h4>مشخصات</h4>` + specList.map(([k, v]) =>
        `<div class="spec-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("");
    }
    if ((item.waypoints || []).length) {
      html += `<h4>نقاط عبور</h4><ol style="font-size:13px;padding-inline-start:20px;color:var(--ink);">` +
        item.waypoints.map((w) => `<li>${esc(w)}</li>`).join("") + `</ol>`;
    }
    if ((item.amenities || []).length) {
      html += `<h4>امکانات</h4><ul style="font-size:13px;padding-inline-start:20px;color:var(--ink);">` +
        item.amenities.map((a) => `<li>${esc(a)}</li>`).join("") + `</ul>`;
    }
    if ((item.safety_notes || []).length) {
      html += `<h4 style="color:#8a3f3f;">نکات ایمنی</h4><ul style="font-size:13px;padding-inline-start:20px;color:var(--ink);">` +
        item.safety_notes.map((n) => `<li>${esc(n)}</li>`).join("") + `</ul>`;
    }
    // Remaining raw sections not already rendered
    const rendered = new Set([...specList.map(([k]) => k), "نقاط عبور", "امکانات", "نکات ایمنی"]);
    for (const [key, text] of Object.entries(sections)) {
      if (key === "intro") continue;
      if ([...rendered].some((r) => key.includes(r) || r.includes(key))) continue;
      if (SPEC_KEYS.some((sk) => key.includes(sk))) continue;
      html += `<h4>${esc(key)}</h4><p style="white-space:pre-line;">${esc(text)}</p>`;
    }
    body.innerHTML = html;

    // Wire the gallery + hero image to a lightweight lightbox.
    const openers = Array.from(body.querySelectorAll("[data-full]"));
    const heroImg = body.querySelector(".modal-media img");
    if (heroImg && heroImg.getAttribute("src")) heroImg.dataset.full = heroImg.getAttribute("src");
    const openersAll = heroImg ? [heroImg, ...openers] : openers;
    openersAll.forEach((el) => {
      el.addEventListener("click", () => openLightbox(el.dataset.full, item.title));
    });
  }).catch((err) => {
    card.querySelector(".modal-body").innerHTML = `<div class="catalog-empty">${esc(err.message)}</div>`;
  });
}

/* ---------- Lightbox (full-res viewer for gallery / hero images) ---------- */
function openLightbox(src, caption = "") {
  if (!src) return;
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.className = "lightbox";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="بستن">✕</button>
      <img alt="">
      <div class="lightbox-cap"></div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    lb.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  }
  lb.querySelector("img").src = src;
  lb.querySelector("img").alt = caption;
  lb.querySelector(".lightbox-cap").textContent = caption;
  lb.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.hidden = true;
  document.body.style.overflow = "";
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("lightbox")?.hidden) closeLightbox();
});

/* ---------- AI Chat component ---------- */
function chatComponent() {
  const host = document.getElementById("chat");
  const messages = host.querySelector(".chat-messages") || (() => {
    const d = document.createElement("div");
    d.className = "chat-messages";
    host.appendChild(d);
    return d;
  })();

  const SUGGESTIONS = [
    "بهترین زمان برای بازدید از ژئوپارک چه موقع است؟",
    "مسیر مناسب برای کودکان کدام است؟",
    "درباره آبشار آسیاب خرابه چه می‌دانید؟",
  ];

  // suggestion row
  const sugg = document.createElement("div");
  sugg.className = "chat-suggestions";
  for (const s of SUGGESTIONS) {
    const b = document.createElement("button");
    b.className = "pill";
    b.textContent = s;
    b.addEventListener("click", () => {
      input.value = s;
      send();
    });
    sugg.appendChild(b);
  }
  host.appendChild(sugg);

  // input row
  const row = document.createElement("div");
  row.className = "chat-input-row";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "سؤال خود را بنویسید…";
  const sendBtn = document.createElement("button");
  sendBtn.className = "btn btn-primary btn-small";
  sendBtn.textContent = "ارسال";
  row.append(input, sendBtn);
  host.appendChild(row);

  function addMsg(text, who) {
    const m = document.createElement("div");
    m.className = `msg ${who}`;
    m.textContent = text;
    messages.appendChild(m);
    messages.scrollTop = messages.scrollHeight;
    return m;
  }

  function addSourceChips(msg, sources) {
    if (!sources || !sources.length) return;
    const wrap = document.createElement("div");
    wrap.className = "sources";
    wrap.appendChild(Object.assign(document.createElement("span"), { textContent: "منابع: " }));
    for (const s of sources) {
      const chip = document.createElement("button");
      chip.className = "pill";
      chip.style.cssText = "margin-inline-start:4px;";
      chip.textContent = s.title;
      chip.addEventListener("click", () => openDetail(s.id));
      wrap.appendChild(chip);
    }
    msg.appendChild(wrap);
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    sendBtn.disabled = true;
    const thinking = addMsg("", "ai");
    thinking.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
    messages.scrollTop = messages.scrollHeight;
    try {
      const data = await API.chat(text);
      thinking.textContent = data.answer || "(پاسخی دریافت نشد)";
      addSourceChips(thinking, data.sources);
    } catch (err) {
      thinking.textContent =
        "متأسفانه در ارتباط با راهنمای هوشمند خطایی رخ داد.\n" +
        "اگر سرویس هوش مصنوعی (مانند Ollama) راه‌اندازی نشده باشد، پاسخ‌های زنده در دسترس نیست.\n" +
        "جزئیات: " + err.message;
    } finally {
      sendBtn.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });

  // welcome message
  addMsg("به دستیار هوشمند ژئوپارک خوش آمدید. از من درباره ژئوسایت‌ها، مسیرها، امکانات و قوانین بپرسید؛ پاسخ‌ها با ارجاع به پایگاه دانش رسمی ارائه می‌شود.", "ai");
}
