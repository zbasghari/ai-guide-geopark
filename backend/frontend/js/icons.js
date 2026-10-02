/* Geopark icon system — professional, meaning-mapped, distinct per topic.
   Stroke-based line icons (24x24, currentColor) harmonized with the geological
   palette. Each icon encodes the semantics of its section, and no icon is reused
   across two different topics. Rendered via iconSVG() / iconBadge().

   Mapping (topic -> symbol):
     geosites   -> mountain + strata   (the geological site)
     attractions-> camera/sightseeing  (tourism/photography)
     routes     -> winding path+flag   (route of travel)
     facilities -> building/columns    (services/structures)
     rules      -> shield + check      (protection/rules)
     faq        -> speech + question   (dialogue/answer)
     map        -> location pin        (where)
     nature     -> leaf                (living landscape)
     geology    -> crystal facets      (rock/mineral material)
     ai         -> four-point spark    (intelligence)
     timeline   -> clock               (sequence of events)
     explore    -> compass             (discovery)
     filters    -> sliders             (refinement)
     search     -> magnifier           (lookup)
*/

const GEO_ICONS = {
  geosites:
    '<path d="M3 18 L9 7.5 L13 14 L16.2 9.6 L21 18 Z"/>' +
    '<circle cx="17.8" cy="5.2" r="1.5"/>' +
    '<path d="M4.2 14.6 H10.6 M13.8 15 H18.6"/>' +
    '<path d="M3 21 H21"/>',
  attractions:
    '<rect x="3" y="8" width="18" height="12" rx="2.2"/>' +
    '<path d="M8.5 8 L10 5.4 H14 L15.5 8"/>' +
    '<circle cx="12" cy="14" r="3.1"/>' +
    '<circle cx="17.4" cy="10.8" r="0.7" fill="currentColor" stroke="none"/>' +
    '<path d="M5.5 11 L4.8 10.2 M5.5 11 L6.4 10.4"/>',
  routes:
    '<circle cx="5" cy="19" r="1.8"/>' +
    '<path d="M6.6 18.2 C12 18 11 13 15 13 C18 13 17.5 9 17.5 6" stroke-dasharray="2.4 2.4"/>' +
    '<path d="M17.5 5 L17.5 9.5 M17.5 5.5 L21 6.8 L17.5 8.2"/>' +
    '<circle cx="21" cy="5" r="0.7" fill="currentColor" stroke="none"/>',
  facilities:
    '<path d="M4 20.5 H20"/>' +
    '<path d="M5.5 20.5 V10 L12 4.5 L18.5 10 V20.5"/>' +
    '<path d="M8.5 20.5 V12.5 M12 20.5 V12.5 M15.5 20.5 V12.5"/>' +
    '<path d="M15.5 8 H18 V10"/>',
  rules:
    '<path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z"/>' +
    '<path d="M9 11.5 L11.4 14 L15 9.6"/>' +
    '<path d="M12 3 V1 M15.5 4.2 L16.8 2.8"/>',
  faq:
    '<rect x="4" y="4.5" width="16" height="12" rx="2.5"/>' +
    '<path d="M8 16.5 V20 L12 16.5"/>' +
    '<path d="M10 9.2 a2.3 2.3 0 1 1 3 2.2 c-.9.4 -1.3.9 -1.3 1.7"/>' +
    '<circle cx="11.7" cy="14.3" r="0.7" fill="currentColor" stroke="none"/>',
  map:
    '<path d="M12 21 C12 21 5.4 14.6 5.4 9.6 A6.6 6.6 0 0 1 18.6 9.6 C18.6 14.6 12 21 12 21 Z"/>' +
    '<circle cx="12" cy="9.6" r="2.5"/>',
  nature:
    '<path d="M5 19.5 C5 11 11 5.5 19.5 5 C19.5 13.5 13.5 19.5 5 19.5 Z"/>' +
    '<path d="M9 15.5 C12 12.5 15.5 9.5 18 7.8"/>',
  geology:
    '<path d="M7 4 H17 L21 9 L12 20 L3 9 Z"/>' +
    '<path d="M3 9 H21"/>' +
    '<path d="M12 4 L9.5 9 L12 20 M12 4 L14.5 9 L12 20"/>',
  ai:
    '<path d="M12 3.5 L13.7 10.3 L20.5 12 L13.7 13.7 L12 20.5 L10.3 13.7 L3.5 12 L10.3 10.3 Z"/>' +
    '<path d="M18 4 L18.7 6.3 L21 7 L18.7 7.7 L18 10 L17.3 7.7 L15 7 L17.3 6.3 Z"/>',
  timeline:
    '<circle cx="12" cy="12" r="8"/>' +
    '<path d="M12 7.5 V12 L15.2 14.2"/>',
  explore:
    '<circle cx="12" cy="12" r="8.5"/>' +
    '<path d="M15.8 8.2 L13 13 L8.2 15.8 L11 11 Z"/>' +
    '<circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
  filters:
    '<path d="M4 8 H20 M4 12 H20 M4 16 H20"/>' +
    '<circle cx="9" cy="8" r="1.9" fill="var(--paper)"/>' +
    '<circle cx="15" cy="16" r="1.9" fill="var(--paper)"/>',
  search:
    '<circle cx="10.5" cy="10.5" r="5.5"/>' +
    '<path d="M14.5 14.5 L19 19"/>',
};

/* Palette tone per icon — harmonized with the geological CSS variables.
   `g` is a gradient for the badge fill; `bg` a soft glass tint; `fg` icon color. */
const ICON_TONE = {
  geosites:    { g: "linear-gradient(135deg,var(--ochre),var(--amber))",              fg: "#241d12", bg: "rgba(201,138,61,.14)" },
  attractions: { g: "linear-gradient(135deg,var(--moss),var(--moss-deep))",          fg: "#f5f1e8", bg: "rgba(125,143,106,.14)" },
  routes:      { g: "linear-gradient(135deg,#7a6a55,var(--slate-500))",              fg: "#f5f1e8", bg: "rgba(109,97,79,.15)" },
  facilities:  { g: "linear-gradient(135deg,var(--basalt-blue),var(--slate-500))",   fg: "#f5f1e8", bg: "rgba(74,85,104,.15)" },
  rules:       { g: "linear-gradient(135deg,#8a3f3f,#a9614e)",                       fg: "#f5f1e8", bg: "rgba(138,63,63,.12)" },
  faq:         { g: "linear-gradient(135deg,var(--slate-400),var(--slate-500))",     fg: "#f5f1e8", bg: "rgba(140,129,117,.16)" },
  map:         { g: "linear-gradient(135deg,var(--ochre),var(--amber))",             fg: "#241d12", bg: "rgba(201,138,61,.14)" },
  nature:      { g: "linear-gradient(135deg,var(--moss),var(--moss-deep))",          fg: "#f5f1e8", bg: "rgba(125,143,106,.14)" },
  geology:     { g: "linear-gradient(135deg,var(--ochre),#8a5a2b)",                  fg: "#241d12", bg: "rgba(201,138,61,.14)" },
  ai:          { g: "linear-gradient(135deg,var(--amber),var(--ochre))",             fg: "#241d12", bg: "rgba(224,180,92,.20)" },
  timeline:    { g: "linear-gradient(135deg,var(--ochre),var(--moss-deep))",         fg: "#f5f1e8", bg: "rgba(76,93,62,.14)" },
  explore:     { g: "linear-gradient(135deg,var(--moss-deep),var(--slate-500))",     fg: "#f5f1e8", bg: "rgba(76,93,62,.14)" },
  filters:     { g: "linear-gradient(135deg,var(--slate-400),var(--slate-500))",     fg: "#f5f1e8", bg: "rgba(109,97,79,.14)" },
  search:      { g: "linear-gradient(135deg,var(--ochre),var(--amber))",             fg: "#241d12", bg: "rgba(201,138,61,.12)" },
};

/* Fallback: a category key may not have an explicit icon name — map it. */
const CAT_TO_ICON = {
  geosites: "geosites",
  attractions: "attractions",
  routes: "routes",
  facilities: "facilities",
  rules: "rules",
  faq: "faq",
};

function iconSVG(name, size = 22) {
  // Look up both the topic set and the place-specific set; fall back to crystal.
  const body = (typeof ATYPE_ICONS !== "undefined" && ATYPE_ICONS[name]) || GEO_ICONS[name] || GEO_ICONS.geology;
  return (
    '<svg class="geo-icon" width="' + size + '" height="' + size +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>"
  );
}

/* A single icon in a colored, glass, rounded container (subtle).
   Uses CSS custom properties so the gradient/tone is settable + hoverable. */
function iconBadge(name, opts = {}) {
  const { size = 22, tone = name, cls = "" } = opts;
  const t = ICON_TONE[tone] || ICON_TONE.geology;
  return (
    '<span class="icon-badge ' + cls +
    '" data-tone="' + tone +
    '" style="--ib-bg:' + t.bg + ';--ib-g:' + t.g + ';--ib-fg:' + t.fg +
    '" aria-hidden="true">' + iconSVG(name, size) + "</span>"
  );
}

/* Category-aware icon: resolves a category key to its icon + tone badge. */
function catIcon(category, opts = {}) {
  const name = CAT_TO_ICON[category] || (GEO_ICONS[category] ? category : "geosites");
  const tone = CAT_TO_ICON[category] || category;
  return iconBadge(name, { ...opts, tone });
}

/* ---------- Attraction-type icons ----------
   Specific, subject-mapped icons so the small badge next to a title reflects the
   ACTUAL place (waterfall, church, bridge, dam...) instead of a repeated
   category badge. Stroke style matches GEO_ICONS; tones use the bright palette. */
const ATYPE_ICONS = {
  waterfall:
    '<path d="M3 19 H13"/>' +
    '<path d="M15 4 H21 V11 H15"/>' +
    '<path d="M16.5 11 V17 M18.5 11 V18 M20.5 11 V16"/>' +
    '<path d="M3 15 H7 M6 21 H11"/>',
  church:
    '<path d="M4 20 H20"/>' +
    '<path d="M6 20 V10 L12 6 L18 10 V20"/>' +
    '<path d="M12 3 V6 M10.5 4.5 H13.5"/>' +
    '<path d="M10 20 V15 a2 2 0 0 1 4 0 V20"/>',
  bridge:
    '<path d="M3 9 H21"/>' +
    '<path d="M4 9 a3.5 3.5 0 0 0 7 0 M13 9 a3.5 3.5 0 0 0 7 0"/>' +
    '<path d="M4 16 c1.5 -1.4 3.5 -1.4 5 0 s3.5 1.4 5 0 3.5 -1.4 5 0"/>',
  dam:
    '<path d="M4 8 H18 L15 20 H7 Z"/>' +
    '<path d="M15 15 c1.5 -1 3 -1 4.5 0 M15 18 c1.5 -1 3 -1 4.5 0"/>' +
    '<path d="M20 4 c1.5 -1 3 -1 4 0 M3 8 H1 M21 8 H20"/>',
  tower:
    '<path d="M8 4 H16 L18 7 V18 L16 21 H8 L6 18 V7 Z"/>' +
    '<path d="M12 8 V12 M9.5 15 H11 M13 15 H14.5"/>',
  fortress:
    '<path d="M4 20 V10 H6 V8 H8 V10 H10 V8 H12 V10 H14 V8 H16 V10 H18 V8 H20 V20"/>' +
    '<path d="M10.5 20 V15.5 a1.5 1.5 0 0 1 3 0 V20"/>',
  hammam:
    '<path d="M5.5 13 C5.5 7 18.5 7 18.5 13"/>' +
    '<path d="M4 13 H20 M4.5 13 V20 M19.5 13 V20 M4 20 H20"/>' +
    '<path d="M12 7 V4.5 M10.5 5.5 H13.5"/>' +
    '<path d="M10 20 V15.5 a2 2 0 0 1 4 0 V20"/>',
  village:
    '<path d="M3 20 L21 10"/>' +
    '<path d="M5 19 V16 L8 13 L11 16 V19 Z"/>' +
    '<path d="M13 15.5 V12.5 L16 9.5 L19 12.5 V15.5 Z"/>' +
    '<circle cx="8" cy="17.5" r="0.7" fill="currentColor" stroke="none"/>' +
    '<circle cx="16" cy="14" r="0.7" fill="currentColor" stroke="none"/>',
  meadow:
    '<path d="M3 19 C6 14.5 9 14.5 12 17.8 C15 14.5 18 14.5 21 19"/>' +
    '<circle cx="17.5" cy="6.5" r="2.4"/>' +
    '<path d="M17.5 2.5 V4 M21.5 3.5 L20.5 4.5 M22 7.5 H20.5"/>' +
    '<path d="M7 15 c0.8 -1.6 1.6 -1.6 2.4 0 M14 13.5 c0.8 -1.6 1.6 -1.6 2.4 0"/>',
  forest:
    '<path d="M5 17 L10 5 L15 17 M7 13 L10 8 L13 13 M10 17 V20"/>' +
    '<path d="M14 17 L18 8 L22 17 M15.5 14 L18 9.5 L20.5 14 M18 17 V20"/>' +
    '<path d="M3 20 H21"/>',
  river:
    '<path d="M4 20 C8 15 11 11 20 4"/>' +
    '<path d="M9 21 C13 16 16 12 21 8"/>' +
    '<path d="M7 16 c1.2 -0.9 2.4 -0.9 3.6 0 M12 11 c1.2 -0.9 2.4 -0.9 3.6 0"/>',
  info:
    '<path d="M4 20 H20 M6 20 V9 L12 5 L18 9 V20"/>' +
    '<circle cx="12" cy="11" r="0.9" fill="currentColor" stroke="none"/>' +
    '<path d="M12 13 V16.5"/>',
  panorama:
    '<circle cx="7.5" cy="14" r="3.5"/>' +
    '<circle cx="16.5" cy="14" r="3.5"/>' +
    '<path d="M11 14 H13 M7.5 10.5 V6.5 M16.5 10.5 V6.5"/>' +
    '<path d="M9.5 6.5 Q12 4.5 14.5 6.5"/>',
  trona:
    '<path d="M4 20 L11 5 L18 20 Z"/>' +
    '<path d="M11 5 L8 20 M11 5 L14 20"/>' +
    '<path d="M19 15 c-1.3 1.8 -1.3 3.2 0 4 c1.3 -0.8 1.3 -2.2 0 -4 Z"/>',
  caravanserai:
    '<path d="M3 20 V13 a3 3 0 0 1 6 0 V20 M9 20 V13 a3 3 0 0 1 6 0 V20 M15 20 V13 a3 3 0 0 1 6 0 V20"/>' +
    '<path d="M2 11 H22"/>',
  familyRoute:
    '<circle cx="9" cy="14" r="5"/>' +
    '<circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/>' +
    '<path d="M9 9 V14 M4.5 14 H9 M9 14 L12 17"/>' +
    '<path d="M14 14 C17 14 17.5 11 21 9.5" stroke-dasharray="2.2 2.2"/>' +
    '<circle cx="17.5" cy="5" r="1.6"/>' +
    '<path d="M17.5 2.5 V3.4 M17.5 6.6 V7.5 M15 5 H15.9 M20.1 5 H21"/>',
  hikeRoute:
    '<path d="M3 19 L9 8 L13 14 L17 8.5 L21 19 Z"/>' +
    '<path d="M9 19 L11 15.5 L13 17 L15 13"/>' +
    '<path d="M17 8.5 V4.5 M17 4.5 L19.5 5.5 L17 6.5"/>' +
    '<circle cx="5" cy="5" r="1.5"/>',
  parking:
    '<rect x="4" y="4" width="16" height="16" rx="4"/>' +
    '<path d="M10 16.5 V7.5 H13.5 a3 3 0 0 1 0 6 H10"/>',
  restroom:
    '<circle cx="8" cy="5.8" r="1.7"/>' +
    '<path d="M8 7.5 V12 M5.8 9.5 H10.2 M8 12 L5.8 17 M8 12 L10.2 17"/>' +
    '<circle cx="16" cy="5.8" r="1.7"/>' +
    '<path d="M16 7.5 V12 M14 9.5 H18 M16 12 L13.6 17.5 H18.4 Z"/>',
};

/* Bright nature tones per attraction type (harmonized with the light palette). */
const ATYPE_TONE = {
  waterfall:    { g: "linear-gradient(135deg,var(--sky),var(--basalt-blue))",          fg: "#ffffff", bg: "rgba(79,166,216,.16)" },
  church:       { g: "linear-gradient(135deg,var(--amber),var(--ochre))",              fg: "#3a2a12", bg: "rgba(242,193,78,.20)" },
  bridge:       { g: "linear-gradient(135deg,var(--ochre),var(--amber))",              fg: "#3a2a12", bg: "rgba(232,134,46,.14)" },
  dam:          { g: "linear-gradient(135deg,var(--basalt-blue),var(--sky))",          fg: "#ffffff", bg: "rgba(63,127,191,.16)" },
  tower:        { g: "linear-gradient(135deg,var(--amber),var(--ochre))",              fg: "#3a2a12", bg: "rgba(242,193,78,.18)" },
  fortress:     { g: "linear-gradient(135deg,var(--moss-deep),var(--basalt-blue))",    fg: "#ffffff", bg: "rgba(47,125,79,.16)" },
  hammam:       { g: "linear-gradient(135deg,var(--moss),var(--moss-deep))",            fg: "#ffffff", bg: "rgba(76,175,109,.16)" },
  village:      { g: "linear-gradient(135deg,var(--ochre),var(--amber))",              fg: "#3a2a12", bg: "rgba(232,134,46,.16)" },
  meadow:       { g: "linear-gradient(135deg,var(--moss),var(--sky))",                 fg: "#1f3028", bg: "rgba(76,175,109,.18)" },
  forest:       { g: "linear-gradient(135deg,var(--moss-deep),var(--moss))",           fg: "#ffffff", bg: "rgba(47,125,79,.18)" },
  river:        { g: "linear-gradient(135deg,var(--sky),var(--basalt-blue))",          fg: "#ffffff", bg: "rgba(79,166,216,.18)" },
  info:         { g: "linear-gradient(135deg,var(--amber),var(--moss))",               fg: "#1f3028", bg: "rgba(242,193,78,.18)" },
  panorama:     { g: "linear-gradient(135deg,var(--moss-deep),var(--basalt-blue))",    fg: "#ffffff", bg: "rgba(47,125,79,.16)" },
  trona:        { g: "linear-gradient(135deg,var(--ochre),#b06a24)",                   fg: "#3a2a12", bg: "rgba(232,134,46,.16)" },
  caravanserai: { g: "linear-gradient(135deg,var(--ochre),var(--amber))",              fg: "#3a2a12", bg: "rgba(232,134,46,.14)" },
  familyRoute:  { g: "linear-gradient(135deg,var(--moss),var(--sky))",                 fg: "#1f3028", bg: "rgba(76,175,109,.18)" },
  hikeRoute:    { g: "linear-gradient(135deg,var(--basalt-blue),var(--moss-deep))",   fg: "#ffffff", bg: "rgba(63,127,191,.16)" },
  parking:      { g: "linear-gradient(135deg,var(--basalt-blue),var(--slate-500))",    fg: "#ffffff", bg: "rgba(63,127,191,.16)" },
  restroom:     { g: "linear-gradient(135deg,var(--sky),var(--basalt-blue))",         fg: "#ffffff", bg: "rgba(79,166,216,.16)" },
};
Object.assign(ICON_TONE, ATYPE_TONE);

/* Resolve the icon that depicts the ITEM's actual subject (title+tags match),
   falling back to the category icon when no specific match exists.
   Rule order matters: e.g. الحممام must win before the کردشت complex. */
const ATYPE_RULES = [
  [/چرخدار|خانواده|آسان|family/i, "familyRoute"],
  [/کوهنوردی|hik/i, "hikeRoute"],
  [/پارکینگ|parking/i, "parking"],
  [/سرویس|بهداشتی|restroom/i, "restroom"],
  [/آبشار|ماهاران|آسیاب|asiab|mahe/i, "waterfall"],
  [/حمّام|حمام|hammam/i, "hammam"],
  [/تراورتن|گچی|کلسیم|چشمه|travertine|giji/i, "trona"],
  [/کاروانسرا|caravan/i, "caravanserai"],
  [/کلیسا|چوپان|سورپ|قزل|ونک|stefanos|chupan|vanak/i, "church"],
  [/پل|bridge|ضیاء|دمیر|iron/i, "bridge"],
  [/سد|دریاچه|dam/i, "dam"],
  [/برج|دوزال|dozal|tower/i, "tower"],
  [/قلعه|امارت|کردشت|citadel|kardasht/i, "fortress"],
  [/روستا|اصطبل|اشتبین|ashtabin/i, "village"],
  [/دشت|گردیان|gardian/i, "meadow"],
  [/پارک|کنتال|حفاظت|مراکان|کنتال|kantal|marakan|park/i, "forest"],
  [/رود|ارس|آراز|aras|river/i, "river"],
  [/مرکز|بازدیدکنندگان|info/i, "info"],
  [/منظره‌گاه|سراسرنما|قله|panorama/i, "panorama"],
];

function itemIconName(item) {
  if (!item) return "geosites";
  const hay = [item.title || "", item.attraction_category_fa || "", ...(item.tags || [])].join(" ");
  for (const [re, name] of ATYPE_RULES) if (re.test(hay)) return name;
  return catIconName(item.category);
}

/* The subject-specific badge for a knowledge item (card header / list row / map pin). */
function itemIcon(item, opts = {}) {
  const name = itemIconName(item);
  return iconBadge(name, { ...opts, tone: name });
}

/* Small inline icon for use inside text (e.g. a location hint). */
function iconInline(name, size = 15) {
  return iconSVG(name, size);
}

/* Resolve a category key to the icon name that encodes its semantics. */
function catIconName(category) {
  return CAT_TO_ICON[category] || (GEO_ICONS[category] ? category : "geosites");
}

/* Keep the legacy name referenced by older code, but now backed by SVG names
   so downstream `esc(CAT_ICON[cat])` calls still resolve to something stable. */
const CAT_ICON = {
  geosites: "geosites",
  attractions: "attractions",
  routes: "routes",
  facilities: "facilities",
  rules: "rules",
  faq: "faq",
};
