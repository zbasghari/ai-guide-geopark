# PROJECT_HANDOFF — راهنمای هوشمند ژئوپارک ارس (Jolfa)

> این فایل **checkpoint** است. یک agent تازه این را بخواند و از همین‌جا ادامه دهد.
> آخرین بهروزرسانی: 2026-10-02 (state verified on disk + browser قبل از commit).
> مسیر پروژه: `C:\Users\violet\ai-guide-geopark`
> GitHub: `zbasghari/ai-guide-geopark` (branch `main`)

---

## ۰) وضعیت لحظه‌ای (verified 2026-10-02)

| مورد | وضعیت |
|---|---|
| سرور لوکال | ✅ `http://127.0.0.1:8000` — `/health` → **27 items**, provider `ollama` |
| پایگاه دانش | ✅ ۲۷ آیتم (3 geosite, 18 attraction, 2 route, 2 facility, 1 rule, 1 faq) — همه با متن کوتاه‌شده + نگارشی‌شده |
| تصاویر | ✅ ۱۹۳ فایل (full ~2000px + thumbnail 800px) در `backend/frontend/images/attractions/`؛ همه ۲۷ آیتم تصویردارند |
| آیکون‌ها | ✅ سیستم SVG معناگون (`js/icons.js`) + آیکون اختصاصی مکان (`itemIconName`)؛ چیپ‌های دسته با آیکون |
| نقشه | ✅ `MAP_LAYOUT` جدول‌محور (pخش پین‌ها روی کل بوم + خط رود ارس) + پین‌های قابلفوکوس با کیبورد |
| مودال | ✅ دکمه بستن sticky/شناور (`.modal-bar` position:sticky) |
| Design System | ✅ `design-system/geopark-aras/MASTER.md` (persisted via ui-ux-pro-max) — Source of Truth |
| commit / push | ⏳ در حال انجام — این commit تغییرات کامل این session را ثبت می‌کند |

---

## ۱) تغییرات این session (روی دیسک)

### Backend
- `backend/config.py` — `openai_base_url` (OpenAI-compatible؛ DeepSeek/Groq/vLLM/LMStudio قابل اتصال)؛ `ai_provider` پیش‌فرض `ollama`.
- `backend/ai_service.py` — `_call_openai` از `openai_base_url` استفاده می‌کند؛ fallback قطعی از KB وقتی provider در دسترس نیست.
- `backend/main.py` — `_item_summary` فیلدهای تصویر را (image, image_thumb, image_source, image_license, gallery, gallery_thumbs, attraction_category_fa) به payload می‌دهد؛ `/health` شامل `build_id`.

### Frontend (vanilla HTML/CSS/JS, RTL)
- `js/icons.js` — مجموعهٔ SVG (geology/crystal, camera, route, building, shield, speech, pin, leaf, spark, compass, clock, magnifier, sliders) + آیکون اختصاصی مکان (waterfall, church, bridge, dam, tower, fortress, hammam, village, meadow, forest, river, trona, caravanserai, panorama, info, familyRoute, hikeRoute, parking, restroom). `itemIconName()` روی title+tags resolve می‌شود.
- `js/cards.js` — `MAP_LAYOUT` table-driven (pخش جغرافیایی پین‌ها بر اساس متن KB) + خط رود ارس + پین‌های کلاوید-فوکوس (tabindex/role/aria-label + Enter/Space + tip on focus). کارت/مودال/نقشه از آیکون اختصاصی مکان استفاده می‌کنند.
- `js/components.js` — مودال جزئیات با hero-media + گالری + lightbox + **دکمه بستن شناور** (sticky `.modal-bar`).
- `js/main.js` — چیپ‌های دسته با آیکون (`.chip-ic`) + `aria-pressed` هنگام باز شدن تب؛ `closeCategoryTab` press را reset می‌کند.
- `css/style.css` — پالت شاد طبیعت‌گرا (sky `#4fa6d8` / meadow `#4caf6d` / sun `#e8862e`) روی پس‌زمینهٔ `#f5faf3`؛ `:root` روشن، strata gradient روشن؛ `.icon-badge`, `.card-media` (16:9), `.modal-media` (21:9), `.media-gallery`, lightbox, motion, `prefers-reduced-motion`.

### Knowledge
- `attraction-3..18.md` — ۱۶ فایل جدید جاذبه (برج دوزال، کلیساهای تاریخی، پل ضیاءالملک، پل آهنی، آبشار ماهاران، پارک ملی کنتال، مراکان، سد ارس، دشت گردیان، کلیسای چوپان، رود ارس، کاروانسرای خواجهنظر، کردشت/حمام/قلعه، اشتبین، منظرهگاه سراسرنمای قله).
- همه فایل‌ها: متن **کوتاه** + **نگارشی‌شده** (نیم‌فاصلهٔ U+200C، حذف `هٔ` چسبیده، ترکیب‌های چسبیده مثل حاشیهرود/حفاظتشده/حیاتوحش/زمینشناسی/هشتضلعی/جنوبشرقی اصلاح شده).
- ۶ آیتم قبلاً بی‌تصویر حالا تصویر + gallری دارند: route-1/2, facility-1/2, rule-1, faq-1.

---

## ۲) Source of Truth

**`design-system/geopark-aras/MASTER.md`** — Design System کامل (رنگ، typo, spacing, card/surface, iconography, category interaction, motion, responsive, a11y, image/media direction, anti-patterns, next-phase work items). هر session بعدی اول این را بخواند.

---

## ۳) Deploy
- GitHub `zbasghari/ai-guide-geopark` + Railway، از طریق **Dockerfile** (ریشهٔ ریپو؛ `COPY backend/ ./backend/`، self-contained layout که knowledge/ و frontend/ داخل backend/ هستند).
- `/health` → `build_id` برای تشخیص container قدیمی.
- AI: برای چت زنده، `AI_PROVIDER=openai` + `OPENAI_API_KEY` + (اختیاری) `OPENAI_BASE_URL` (مثلاً DeepSeek) در env Railway؛ وگرنه fallback قطعی از KB.

---

## ۴) کارهای باز (مرحله‌های بعدی، از MASTER.md)
1. مهاجرت کامل آیکون‌های سربرگ‌های شش‌گانه + badgeهای مکان به `.icon-badge` (تکمیل)؛ تأیید اینکه جایی فقط `catIcon` نمانده.
2. چیپ‌های دسته → تعامل تبی واقعی (aria-pressed / active gradient / بدون layout-shift) — انجام‌شده، نیاز به QA بصری.
3. گسترش Media Direction روی سطوحی که هنوز `<img>` خام بدون aspect-ratio دارند.
4. پین‌های نقشه: tip هنگام focus (باربرابر با hover) — انجام‌شده، نیاز به QA.
5. توکن‌های focus-ring سراسری + ممیزی contrast جفت‌رنگ‌های جدید.
6. ممیزی `prefers-reduced-motion` + fallback بدون IntersectionObserver.
7. (اگر تأیید شود) ریفکتور به React + Vite + Tailwind + daisyUI + Originkit — MASTER.md همان Source of Truth؛ توکن‌ها ۱:۱ به theme Tailwind map می‌شوند.

---

## ۵) Scratch (ignore شده، در deploy نیست)
`_cdp_check.py`, `_enhance_imgs.py`, `_gen_kb.py`, `_shorten_kb.py`, `_verify_imgs.py`, `_icon_sheet.png`, `_server.log` — همه با `.gitignore` از ریپو حذف شدند.

## ۶) `.agents/`
پوشهٔ skill‌های محلی (`ui-ux-pro-max`, `brand`, `design`, `ui-styling`, `design-system`, `banner-design`, `slides`) — ۴٫۷MB، در ریپو نگه داشته شده تا Design System و process قابل تکرار باشد.
