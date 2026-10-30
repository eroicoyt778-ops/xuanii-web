/* =========================================================
   1. CONSTANTES, ETIQUETAS Y UTILIDADES GENERALES
   ========================================================= */
const STORAGE_KEYS = {
  WAITLIST: "xuanii_waitlist",
  SUBMISSIONS: "xuanii_submissions"
};

// Cuenta oficial única del Creador de Xuanii (reconocida por ID interno e inmutable)
const CREATOR_UIDS = new Set([
  "KVtoDRTJ7FUxZJelcicoSISSazA3"
]);

const CREATOR_INTERNAL_IDS = new Set([
  "XN-7808897A"
]);

const CATEGORY_LABELS = {
  video: "Edición de Video y Postproducción",
  photo: "Edición de Foto y Retoque Digital",
  design: "Diseño Gráfico, Branding y UI/UX",
  dev: "Desarrollo Web, Software y Apps",
  motion3d: "Motion Graphics, Animación y 3D",
  audio: "Producción de Audio y Sonido",
  marketing: "Contenido Digital y Redes",
  client: "Contratación / Proyectos"
};

const SITUATION_LABELS = {
  seeking_job: "Buscando empleo / encargos",
  freelance_ready: "Disponible para proyectos",
  employed_open: "Con trabajo · Abierto a colaborar",
  hiring: "Contratando especialistas"
};

const POST_KIND_LABELS = {
  question: "DUDA / PREGUNTA",
  knowledge: "CONOCIMIENTO / TIP",
  video: "VIDEO & MOTION",
  code_snippet: "CÓDIGO & DEV",
  photo: "FOTO & VISUAL",
  post: "PUBLICACIÓN",
  portfolio: "FOTO & VISUAL",
  job: "OPORTUNIDAD",
  available: "COMUNIDAD"
};

/**
 * Efecto de onda de agua líquida al hacer clic (Liquid Water Ripple)
 */
function applyLiquidWaterRipple(e, element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const circle = document.createElement("span");
  const diameter = Math.max(rect.width, rect.height) * 2;
  const radius = diameter / 2;

  const clientX = e && typeof e.clientX === "number" ? e.clientX : (rect.left + rect.width / 2);
  const clientY = e && typeof e.clientY === "number" ? e.clientY : (rect.top + rect.height / 2);

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${clientX - rect.left - radius}px`;
  circle.style.top = `${clientY - rect.top - radius}px`;
  circle.className = "water-ripple-wave";

  const prevRipple = element.querySelector(".water-ripple-wave");
  if (prevRipple) prevRipple.remove();

  element.appendChild(circle);
  circle.addEventListener("animationend", () => circle.remove());
}

/**
 * Microinteracción elástica con física de gota de agua (Liquid Spring Pop)
 */
function triggerFluidPop(element) {
  if (!element) return;
  element.classList.remove("fluid-water-pop");
  void element.offsetWidth; // Forzar reflujo para reiniciar animación
  element.classList.add("fluid-water-pop");
  setTimeout(() => element.classList.remove("fluid-water-pop"), 550);
}

const POST_KIND_CLASSES = {
  question: "kind-badge-question",
  knowledge: "kind-badge-knowledge",
  video: "kind-badge-video",
  code_snippet: "kind-badge-code",
  photo: "kind-badge-photo",
  post: "kind-badge-post",
  portfolio: "kind-badge-photo",
  job: "kind-badge-question",
  available: "kind-badge-post"
};

const BUILTIN_COMMUNITIES = [
  {
    id: "oportunidades",
    slug: "#oportunidades",
    title: "Empleo y Encargos",
    description: "Ofertas de trabajo, búsqueda de especialistas y colaboraciones remuneradas."
  },
  {
    id: "video-motion",
    slug: "#video-motion",
    title: "Editores de Video y Motion",
    description: "Montaje audiovisual, YouTube, Reels, documental, colorimetría y VFX."
  },
  {
    id: "foto-retoque",
    slug: "#foto-retoque",
    title: "Fotografía y Retoque",
    description: "Edición RAW, iluminación, corrección óptica y comunidad PhotoStun."
  },
  {
    id: "diseno-ui",
    slug: "#diseno-ui",
    title: "Diseño Gráfico, UI/UX y 3D",
    description: "Identidad visual, interfaces web/móvil, miniaturas, ilustración y 3D."
  },
  {
    id: "desarrollo",
    slug: "#desarrollo",
    title: "Desarrollo Web y Código",
    description: "Frontend, backend, aplicaciones interactivas y automatización."
  }
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignorar errores de cuota
  }
};

const formatDateEs = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return "";
  }
};

const formatBytes = (bytes) => {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};

const sanitizeHandle = (raw, fallbackSeed = "usuario") => {
  const cleaned = String(raw || "")
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 28);
  if (cleaned.length >= 2) return cleaned;
  return (
    String(fallbackSeed)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "usuario"
  );
};

const parseSkillsList = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .map((s) => String(s || "").trim().slice(0, 28))
      .filter(Boolean)
      .slice(0, 10);
  }
  return String(raw || "")
    .split(",")
    .map((s) => s.trim().slice(0, 28))
    .filter(Boolean)
    .slice(0, 10);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Generador determinista e inmutable de ID Interno Anti-Estafas (XN-XXXXXXXX) a partir del UID
const deriveInternalId = (uid) => {
  const str = String(uid || "xuanii");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const partA = (h1 >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 4);
  const partB = (h2 >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 4);
  return `XN-${partA}${partB}`;
};

// Verificador determinista de cuenta oficial del Creador (cuenta única XN-7808897A)
const isCreatorAccount = (internalId = "", uid = "") => {
  if (uid && CREATOR_UIDS.has(uid)) return true;
  const code = String(internalId || (uid ? deriveInternalId(uid) : ""))
    .trim()
    .toUpperCase();
  return CREATOR_INTERNAL_IDS.has(code);
};

const isAdminUser = (user) => {
  if (!user) return false;
  const uid = user.uid || user.id || "";
  const internalId = user.internalId || (uid ? deriveInternalId(uid) : "");
  return Boolean((uid && CREATOR_UIDS.has(uid)) || isCreatorAccount(internalId, uid));
};

// Generador del chulito azul de verificación oficial
const createVerifiedBadgeEl = (small = false) => {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const size = small ? 14 : 17;
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("class", "verified-check-icon");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Cuenta verificada");
  svg.setAttribute("title", "Cuenta verificada");

  // Roseta exterior azul oficial (estilo verificado premium)
  const bgPath = document.createElementNS(svgNS, "path");
  bgPath.setAttribute(
    "d",
    "M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
  );
  bgPath.setAttribute("fill", "#1d9bf0");

  // Chulito / checkmark blanco nítido
  const checkPath = document.createElementNS(svgNS, "path");
  checkPath.setAttribute(
    "d",
    "M10.54 16.2L6.8 12.46l1.41-1.42 2.33 2.33 5.23-5.23 1.42 1.42-6.65 6.64z"
  );
  checkPath.setAttribute("fill", "#ffffff");

  svg.appendChild(bgPath);
  svg.appendChild(checkPath);
  return svg;
};

// Generador de la llave de tuerca mecánica reservada exclusivamente al Creador (con gradiente animado blanco y negro)
const createCreatorWrenchEl = (small = false) => {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const size = small ? 14 : 16.5;
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("class", "creator-wrench-icon");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Creador oficial de EndHa");
  svg.setAttribute("title", "Creador oficial de EndHa");

  // Definición de degradado líquido blanco y negro en movimiento continuo
  const defs = document.createElementNS(svgNS, "defs");
  const grad = document.createElementNS(svgNS, "linearGradient");
  const gradId = `creatorWrenchGrad_${Math.random().toString(36).slice(2, 8)}`;
  grad.setAttribute("id", gradId);
  grad.setAttribute("x1", "0%");
  grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%");
  grad.setAttribute("y2", "100%");

  // Parada 1: Blanco -> Negro -> Gris claro -> Blanco
  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#ffffff");
  const anim1 = document.createElementNS(svgNS, "animate");
  anim1.setAttribute("attributeName", "stop-color");
  anim1.setAttribute("values", "#ffffff;#09090b;#d4d4d8;#ffffff");
  anim1.setAttribute("dur", "3.6s");
  anim1.setAttribute("repeatCount", "indefinite");
  stop1.appendChild(anim1);

  // Parada 2: Negro -> Blanco -> Negro -> Negro
  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "50%");
  stop2.setAttribute("stop-color", "#18181b");
  const anim2 = document.createElementNS(svgNS, "animate");
  anim2.setAttribute("attributeName", "stop-color");
  anim2.setAttribute("values", "#18181b;#ffffff;#18181b;#18181b");
  anim2.setAttribute("dur", "3.6s");
  anim2.setAttribute("repeatCount", "indefinite");
  stop2.appendChild(anim2);

  // Parada 3: Blanco -> Negro -> Blanco -> Blanco
  const stop3 = document.createElementNS(svgNS, "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", "#ffffff");
  const anim3 = document.createElementNS(svgNS, "animate");
  anim3.setAttribute("attributeName", "stop-color");
  anim3.setAttribute("values", "#ffffff;#18181b;#ffffff;#ffffff");
  anim3.setAttribute("dur", "3.6s");
  anim3.setAttribute("repeatCount", "indefinite");
  stop3.appendChild(anim3);

  grad.appendChild(stop1);
  grad.appendChild(stop2);
  grad.appendChild(stop3);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
  );
  path.setAttribute("fill", `url(#${gradId})`);
  path.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
  path.setAttribute("stroke-width", "0.7");
  svg.appendChild(path);
  return svg;
};

// Constructor DOM del distintivo del Creador: Llave de tuerca PRIMERO + Chulito azul DESPUÉS
const createCreatorBadgeEl = (small = false) => {
  const badge = document.createElement("span");
  badge.className = small ? "creator-badge creator-badge-sm" : "creator-badge";
  badge.title = "Creador oficial · Cuenta verificada";

  // 1. Llave de tuerca de Creador PRIMERO
  badge.appendChild(createCreatorWrenchEl(small));

  // 2. Chulito azul de verificación DESPUÉS
  badge.appendChild(createVerifiedBadgeEl(small));

  return badge;
};

// Generador universal de insignias vectoriales jerárquicas (CREADOR, PRO, PLUS)
const renderMembershipBadge = (tier = "standard", small = false) => {
  if (tier === "creator") {
    return createCreatorBadgeEl(small);
  }

  const badge = document.createElement("span");
  const sizeClass = small ? "badge-sm" : "";

  if (tier === "pro") {
    badge.className = `badge-core badge-pro ${sizeClass}`.trim();
    badge.title = "Membresía PRO · Especialista Verificado";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M8 1.5L14 8L8 14.5L2 8L8 1.5Z");
    svg.appendChild(path);

    const txt = document.createElement("span");
    txt.textContent = "PRO";

    badge.appendChild(svg);
    badge.appendChild(txt);
    return badge;
  }

  if (tier === "plus") {
    badge.className = `badge-core badge-plus ${sizeClass}`.trim();
    badge.title = "Membresía PLUS · Miembro Destacado";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");
    const l1 = document.createElementNS(svgNS, "line");
    l1.setAttribute("x1", "8");
    l1.setAttribute("y1", "3");
    l1.setAttribute("x2", "8");
    l1.setAttribute("y2", "13");
    const l2 = document.createElementNS(svgNS, "line");
    l2.setAttribute("x1", "3");
    l2.setAttribute("y1", "8");
    l2.setAttribute("x2", "13");
    l2.setAttribute("y2", "8");
    svg.appendChild(l1);
    svg.appendChild(l2);

    const txt = document.createElement("span");
    txt.textContent = "PLUS";

    badge.appendChild(svg);
    badge.appendChild(txt);
    return badge;
  }

  const empty = document.createElement("span");
  empty.className = "tier-standard-empty";
  return empty;
};

const mountCreatorBadgeSlot = (slotEl, isCreator, smallOrTier = false, tier = "standard") => {
  if (!slotEl) return;
  const small = typeof smallOrTier === "boolean" ? smallOrTier : false;
  const effectiveTier = typeof smallOrTier === "string" ? smallOrTier : tier;
  slotEl.textContent = "";
  if (isCreator) {
    slotEl.appendChild(createCreatorBadgeEl(small));
  } else if (effectiveTier === "pro" || effectiveTier === "plus") {
    slotEl.appendChild(renderMembershipBadge(effectiveTier, small));
  }
};

/* =========================================================
   2. MOTOR DE AFINIDAD COMUNITARIA PARA 'PARA TI'
   ========================================================= */
const AFFINITY_WEIGHTS = {
  LIKE: 0.25,
  COMMENT: 0.40,
  VIEW_DEEP: 0.15,
  PROFILE_INSPECT: 0.20
};

const getUserAffinityVector = (userUid) => {
  const defaultVector = { dev: 0.25, video: 0.25, photo: 0.25, design: 0.25, motion3d: 0.1 };
  if (!userUid) return defaultVector;
  return readJson(`xuanii_affinity_${userUid}`, defaultVector);
};

const trackUserInteraction = (category, weightType, userUid) => {
  if (!userUid || !category) return;
  const current = getUserAffinityVector(userUid);
  const inc = AFFINITY_WEIGHTS[weightType] || 0.1;
  current[category] = Math.min(2.5, (current[category] || 0) + inc);
  const sum = Object.values(current).reduce((acc, v) => acc + v, 0);
  if (sum > 5.0) {
    Object.keys(current).forEach((k) => {
      current[k] = current[k] / (sum / 2.5);
    });
  }
  writeJson(`xuanii_affinity_${userUid}`, current);
};

let myFollowingSet = new Set();
let mySavedPostsSet = new Set();

const SEVERE_TOXIC_REGEX = /\b(muérete|te voy a matar|matate|nazi|violador|pedófilo|pedofilo|terrorista|sicario|narco|estafador de mierda|puta madre|hijo de perra|malparido|gonorrea|maricón|maricon)\b/i;

const AMBIGUOUS_PHRASES_REGEX = /\b(tu madre|tu mama|tu mamá|estúpido|estupido|idiota|imbécil|imbecil|pendejo|tarado|asqueroso|inútil|inutil|manco|bobalicón|basura|porquería|porqueria)\b/i;

const evaluateCommentContent = (text) => {
  const clean = String(text || "").trim();
  if (SEVERE_TOXIC_REGEX.test(clean)) {
    return { verdict: "blocked", reason: "Lenguaje tóxico o violatorio directo" };
  }
  if (AMBIGUOUS_PHRASES_REGEX.test(clean)) {
    return { verdict: "review", reason: "Expresión ambigua / en duda detectada" };
  }
  return { verdict: "clean", reason: null };
};

const getConductLabel = (score) => {
  const s = Number(score) || 10;
  if (s >= 10) return "Impecable";
  if (s >= 8) return "Buena";
  if (s >= 5) return "Advertencia";
  if (s >= 2) return "En riesgo crítico";
  return "Pésima (Suspendido)";
};

const renderCaptionWithHashtags = (captionText) => {
  const frag = document.createDocumentFragment();
  const parts = String(captionText || "").split(/(#[\w\u00C0-\u017F]+)/g);
  parts.forEach((part) => {
    if (part.startsWith("#")) {
      const a = document.createElement("a");
      a.className = "hashtag-link";
      a.href = "#";
      a.textContent = part;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const fySearch = document.getElementById("forYouSearchInput");
        if (fySearch) {
          fySearch.value = part;
          fySearch.dispatchEvent(new Event("input", { bubbles: true }));
          document.getElementById("forYouStreamContainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      frag.appendChild(a);
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  });
  return frag;
};

const calculatePostScore = (post, userVector, nowMs) => {
  const cat = post.authorCategory || "video";
  const affinityVal = userVector[cat] || 0.2;

  const ageHours = Math.max(0, (nowMs - (post.createdAtMs || nowMs)) / (1000 * 60 * 60));
  const timeDecay = Math.exp(-ageHours / 48);

  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const dislikesCount = Array.isArray(post.dislikes) ? post.dislikes.length : 0;
  const commentsCount = Number(post.commentCount) || 0;

  // Calidad social orgánica: Me gusta (+3), No me gusta (-2), Comentarios (+4)
  const rawEngagement = Math.max(0, likesCount * 3 - dislikesCount * 2 + commentsCount * 4);
  const socialScore = Math.min(1.0, Math.log1p(rawEngagement) / Math.log1p(35));

  // Prioridad orgánica para creadores que el usuario sigue (+40 pts)
  const isFollowed = myFollowingSet.has(post.authorUid);
  const followScore = isFollowed ? 40.0 : 0.0;

  // CERO "pagar para ganar" para PRO. La visibilidad es 100% meritocrática y basada en afinidad comunitaria.
  return (
    followScore +
    affinityVal * 25 +
    socialScore * 25 +
    timeDecay * 10
  );
};

const rankFeedPostsByAffinity = (posts, userUid) => {
  const nowMs = Date.now();
  const vector = getUserAffinityVector(userUid);
  return [...posts]
    .map((post) => ({
      ...post,
      _algScore: calculatePostScore(post, vector, nowMs)
    }))
    .sort((a, b) => b._algScore - a._algScore);
};

/* =========================================================
   3. PARSER Y RENDERIZADOR MULTIMEDIA (VIDEO Y CÓDIGO)
   ========================================================= */
const parseVideoUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();

  // YouTube Shorts / Watch / youtu.be
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/
  );
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      provider: "vimeo",
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&color=ffffff&title=0&byline=0`
    };
  }

  // Direct video file (mp4, webm, mov, data:video, blob)
  if (url.startsWith("data:video/") || url.startsWith("blob:") || /\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return {
      provider: "direct",
      videoUrl: url
    };
  }

  return null;
};

const renderMediaContainer = (post, onPhotoClick) => {
  const container = document.createElement("div");
  container.className = "post-media-container";

  // 1. Video Embed o Directo
  const vData = post.videoData || parseVideoUrl(post.videoUrl);
  if (post.mediaType === "video" || post.videoUrl || vData) {
    if (vData?.provider === "youtube") {
      const frame = document.createElement("div");
      frame.className = "video-responsive-frame";

      const facade = document.createElement("div");
      facade.className = "youtube-facade-dark";
      facade.style.backgroundImage = `url("${vData.thumbnailUrl}")`;

      const playBtn = document.createElement("button");
      playBtn.className = "video-play-trigger-btn";
      playBtn.setAttribute("aria-label", "Reproducir video");
      playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;

      facade.appendChild(playBtn);
      frame.appendChild(facade);

      facade.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = vData.embedUrl;
        iframe.title = post.caption || "Video de Xuanii";
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
        iframe.setAttribute("allowfullscreen", "true");
        iframe.className = "embedded-iframe";
        frame.textContent = "";
        frame.appendChild(iframe);
      });

      container.appendChild(frame);
      return container;
    }

    if (vData?.provider === "direct") {
      const vid = document.createElement("video");
      vid.className = "xuanii-dark-video";
      vid.src = vData.videoUrl;
      vid.controls = true;
      vid.preload = "metadata";
      vid.playsInline = true;
      container.appendChild(vid);
      return container;
    }
  }

  // 2. Fragmento de Código Fuente
  if (post.codeSnippet && post.codeSnippet.code) {
    container.appendChild(renderCodeSnippetBlock(post.codeSnippet));
    return container;
  }

  // 3. Fotografía con Zoom Lightbox
  if (post.photoUrl) {
    const frame = document.createElement("div");
    frame.className = "post-photo-frame zoomable";
    frame.title = "Clic para ampliar fotografía";
    const img = document.createElement("img");
    img.src = post.photoUrl;
    img.alt = post.caption || "Fotografía de portafolio";
    img.loading = "lazy";
    frame.addEventListener("click", () => onPhotoClick?.(post));
    frame.appendChild(img);
    container.appendChild(frame);
    return container;
  }

  return null;
};

const renderCodeSnippetBlock = ({ code, language = "javascript", title = "Snippet de Código" }) => {
  const wrapper = document.createElement("div");
  wrapper.className = "xuanii-code-window";

  const bar = document.createElement("div");
  bar.className = "code-window-bar";

  const dots = document.createElement("div");
  dots.className = "code-window-dots";
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("span");
    d.className = "dot";
    dots.appendChild(d);
  }
  const tit = document.createElement("span");
  tit.className = "code-title mono";
  tit.textContent = title;
  dots.appendChild(tit);

  const acts = document.createElement("div");
  acts.className = "code-actions";
  const lang = document.createElement("span");
  lang.className = "lang-tag mono";
  lang.textContent = (language || "CODE").toUpperCase();

  const cBtn = document.createElement("button");
  cBtn.type = "button";
  cBtn.className = "copy-code-btn mono";
  cBtn.textContent = "Copiar";
  cBtn.addEventListener("click", () => copyTextWithFeedback(code, cBtn));

  acts.appendChild(lang);
  acts.appendChild(cBtn);
  bar.appendChild(dots);
  bar.appendChild(acts);

  const pre = document.createElement("pre");
  pre.className = "code-pre mono";
  const codeEl = document.createElement("code");
  codeEl.textContent = code;
  pre.appendChild(codeEl);

  wrapper.appendChild(bar);
  wrapper.appendChild(pre);
  return wrapper;
};

/* =========================================================
   4. CONEXIÓN GITHUB Y REPUTACIÓN PROFESIONAL
   ========================================================= */
const fetchGitHubDeveloperStats = async (username) => {
  const cleanUser = String(username || "").trim().replace(/^@+/, "");
  if (!cleanUser) throw new Error("Nombre de usuario de GitHub no válido.");

  const cacheKey = `xuanii_gh_${cleanUser.toLowerCase()}`;
  const cached = readJson(cacheKey, null);
  if (cached && Date.now() - cached.fetchedAtMs < 6 * 3600 * 1000) {
    return cached.data;
  }

  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`);
  if (!userRes.ok) throw new Error("Usuario de GitHub no encontrado.");
  const uData = await userRes.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&sort=pushed`
  ).catch(() => null);
  const repos = reposRes && reposRes.ok ? await reposRes.json() : [];

  let totalStars = 0;
  const langCount = {};
  repos.forEach((r) => {
    totalStars += Number(r.stargazers_count) || 0;
    if (r.language) {
      langCount[r.language] = (langCount[r.language] || 0) + 1;
    }
  });

  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([l, cnt]) => ({ lang: l, count: cnt }));

  const result = {
    username: uData.login,
    htmlUrl: uData.html_url,
    avatarUrl: uData.avatar_url,
    publicRepos: uData.public_repos || 0,
    totalStars,
    topLanguages,
    accountAgeYears: Math.max(
      0,
      ((Date.now() - new Date(uData.created_at).getTime()) / (1000 * 3600 * 24 * 365)).toFixed(1)
    )
  };

  writeJson(cacheKey, { fetchedAtMs: Date.now(), data: result });
  return result;
};

const computeDeveloperReputation = ({
  reviewsStats,
  githubData,
  portfolioPostsCount,
  isVerified,
  membershipTier
}) => {
  let score = 0;

  // 1. Reseñas y Estrellas (Máximo 35 pts)
  if (reviewsStats && reviewsStats.count > 0) {
    const starRatio = Math.max(0, Math.min(1, (reviewsStats.avg - 1) / 4));
    const confidence = Math.min(1, reviewsStats.count / 4);
    score += starRatio * 35 * confidence;
  } else {
    score += 15; // Puntos base iniciales
  }

  // 2. Conexión Válida de GitHub (Máximo 25 pts)
  if (githubData?.username) {
    score += 8;
    score += Math.min(7, (githubData.totalStars || 0) / 4);
    score += Math.min(5, (githubData.publicRepos || 0) / 3);
    score += Math.min(5, Number(githubData.accountAgeYears || 0) * 1.5);
  }

  // 3. Muestras de Portafolio (Máximo 25 pts)
  const pCount = Number(portfolioPostsCount) || 0;
  score += Math.min(25, pCount * 5);

  // 4. Membresía y Verificación (Máximo 15 pts)
  if (isVerified) score += 3;
  if (membershipTier === "creator") score += 12;
  else if (membershipTier === "pro") score += 10;
  else if (membershipTier === "plus") score += 6;

  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  let badgeLabel = "Especialista Activo";
  if (finalScore >= 85) badgeLabel = "Élite Xuanii · Verificado";
  else if (finalScore >= 70) badgeLabel = "Senior Destacado";
  else if (finalScore >= 50) badgeLabel = "Especialista Certificado";

  return {
    score: finalScore,
    badgeLabel,
    hasGitHub: Boolean(githubData?.username),
    starsAvg: reviewsStats?.avg || 0,
    reviewsCount: reviewsStats?.count || 0
  };
};

/* =========================================================
   4B. MÓDULO INTELIGENTE DE EMPLEO Y RECLUTAMIENTO ESPEJO
   ========================================================= */
const renderDeveloperReputationStudio = (stageEl, userProfile) => {
  if (!stageEl) return;
  const uid = userProfile?.uid || activeAuthUser?.uid || "";
  const stats = getRatingStats(uid);
  const myPostsCount = allPostsList.filter((p) => p.authorUid === uid).length;
  const ghData = userProfile?.developerProfile?.github;
  const isCr = isCreatorAccount(userProfile?.internalId, uid);
  const rep = computeDeveloperReputation({
    reviewsStats: stats,
    githubData: ghData,
    portfolioPostsCount: myPostsCount,
    isVerified: Boolean(userProfile?.internalId),
    membershipTier: isCr ? "creator" : (userProfile?.membershipTier || "standard")
  });

  const card = document.createElement("div");
  card.className = "arch-col";
  card.style.background = "#07080c";
  card.style.border = "1px solid var(--line-dark)";
  card.style.borderRadius = "14px";
  card.style.padding = "24px 22px";
  card.style.marginBottom = "24px";

  const ghConnectedHtml = ghData?.username
    ? `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div>
          <a href="${ghData.htmlUrl}" target="_blank" rel="noopener" class="gh-verified-tag mono">
            @${ghData.username} verificado ✓ (${ghData.totalStars}★ · ${ghData.publicRepos} repos)
          </a>
          <span class="open-row-sub" style="margin-top: 4px; display: block;">Lenguajes: ${(ghData.topLanguages || []).map((l) => l.lang).join(", ") || "Código"}</span>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="devDisconnectGhBtn">Cambiar usuario GitHub</button>
      </div>
    `
    : `
      <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 12px;">
        Conecta tu usuario de GitHub para certificar tus repositorios públicos, estrellas y lenguajes en tu reputación.
      </p>
      <div style="display: flex; gap: 10px; max-width: 440px;">
        <input type="text" id="devQuickGhInput" class="line-input mono" placeholder="usuario-github" />
        <button type="button" class="btn btn-white btn-sm" id="devQuickGhBtn">Conectar</button>
      </div>
      <span id="devQuickGhFeedback" class="mono" style="font-size: 0.72rem; color: var(--silver); margin-top: 6px; display: block;"></span>
    `;

  card.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
      <div>
        <span class="mono" style="font-size: 0.72rem; color: var(--silver); letter-spacing: 0.08em;">TU ESTUDIO DE REPUTACIÓN PROFESIONAL</span>
        <h3 style="font-size: 1.35rem; margin-top: 4px;">Construye tu valor en el ecosistema</h3>
      </div>
      <div style="display: flex; align-items: baseline; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); padding: 8px 16px; border-radius: 10px;">
        <span style="font-size: 2.2rem; font-weight: 800; color: var(--white);">${rep.score}</span>
        <span class="mono" style="font-size: 0.8rem; color: var(--muted);">/ 100 PTS</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
      <span class="rep-badge-tag mono">${rep.badgeLabel}</span>
      <span class="mono" style="font-size: 0.78rem; color: var(--silver);">${stats.count > 0 ? `★ ${stats.avg.toFixed(1)} (${stats.count} reseñas)` : "Sin reseñas aún"}</span>
      <span class="mono" style="font-size: 0.78rem; color: var(--silver);">${myPostsCount} entregables en portafolio</span>
    </div>

    <!-- CONEXIÓN GITHUB -->
    <div class="gh-connect-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
      <span class="mono" style="font-size: 0.72rem; color: var(--silver); display: block; margin-bottom: 6px;">CONEXIÓN TÉCNICA · GITHUB API</span>
      ${ghConnectedHtml}
    </div>

    <!-- ACCIONES DE PROMOCIÓN -->
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button type="button" class="btn btn-white btn-sm" id="devGoToPublishBtn">
        + Publicar Muestra o Código
      </button>
      <button type="button" class="btn btn-ghost btn-sm" id="devOpenPlansBtn">
        Subir de Nivel (Membresías PRO / PLUS)
      </button>
      <button type="button" class="text-action-btn" id="devPreviewProfileBtn">
        Ver cómo te ven los clientes →
      </button>
    </div>
  `;

  stageEl.appendChild(card);

  card.querySelector("#devGoToPublishBtn")?.addEventListener("click", () => {
    switchWorkspaceTab("feed");
    const cap = document.getElementById("feedPostCaption");
    if (cap) {
      cap.focus();
      cap.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  card.querySelector("#devOpenPlansBtn")?.addEventListener("click", () => {
    openMembershipModal(currentOwnProfile, cloudHooks.updateMembershipTier);
  });

  card.querySelector("#devPreviewProfileBtn")?.addEventListener("click", () => {
    if (uid) renderInspectorContent(uid);
  });

  card.querySelector("#devDisconnectGhBtn")?.addEventListener("click", () => {
    switchWorkspaceTab("profile");
    document.getElementById("profileGitHubUser")?.focus();
  });

  const ghBtn = card.querySelector("#devQuickGhBtn");
  const ghInp = card.querySelector("#devQuickGhInput");
  const ghFb = card.querySelector("#devQuickGhFeedback");
  ghBtn?.addEventListener("click", async () => {
    const u = (ghInp?.value || "").trim();
    if (!u) return;
    ghBtn.disabled = true;
    if (ghFb) ghFb.textContent = "Validando con GitHub...";
    try {
      const gStats = await fetchGitHubDeveloperStats(u);
      if (currentOwnProfile) {
        currentOwnProfile.developerProfile = { github: gStats };
      }
      await cloudHooks.saveProfile?.({
        developerProfile: { github: gStats }
      });
      if (ghFb) ghFb.textContent = `GitHub conectado con éxito ✓`;
      setTimeout(() => {
        renderDeveloperReputationStudio(stageEl, currentOwnProfile);
      }, 900);
    } catch (err) {
      if (ghFb) ghFb.textContent = err?.message || "No se pudo validar el usuario de GitHub.";
    } finally {
      ghBtn.disabled = false;
    }
  });
};

const renderRecruiterMirrorDirectory = (targetContainer, currentAuthUser) => {
  if (!targetContainer) return;
  targetContainer.innerHTML = `
    <div class="recruiter-mirror-panel">
      <div class="recruiter-header-filter">
        <div>
          <span class="open-eyebrow mono" style="margin-bottom: 4px;">PANEL RECLUTADOR · CONTRATACIÓN DIRECTA</span>
          <h3 style="font-size: 1.35rem;">Explora talento por stack y reputación</h3>
        </div>
        <div class="recruiter-search-bar">
          <input type="search" id="recruiterTechSearch" class="line-input" placeholder="Filtrar por tecnología: React, Rust, Python, DaVinci, Figma..." />
        </div>
      </div>

      <div class="topic-tabs" id="recruiterTechPills" style="border-bottom: none; padding-bottom: 0;">
        <button type="button" class="topic-tab active" data-tech="all">Todos los oficios</button>
        <button type="button" class="topic-tab" data-tech="dev">Desarrollo Web / Software</button>
        <button type="button" class="topic-tab" data-tech="video">Edición de Video</button>
        <button type="button" class="topic-tab" data-tech="photo">Fotografía y Retoque</button>
        <button type="button" class="topic-tab" data-tech="design">Diseño UI/UX & 3D</button>
      </div>

      <div id="recruiterCandidatesGrid" class="candidates-card-grid"></div>
    </div>
  `;

  const gridEl = targetContainer.querySelector("#recruiterCandidatesGrid");
  const searchInput = targetContainer.querySelector("#recruiterTechSearch");
  let activeTech = "all";

  targetContainer.querySelectorAll("#recruiterTechPills .topic-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      targetContainer.querySelectorAll("#recruiterTechPills .topic-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTech = tab.dataset.tech || "all";
      filterAndPaint();
    });
  });

  const filterAndPaint = () => {
    if (!gridEl) return;
    const q = (searchInput?.value || "").toLowerCase().trim();
    gridEl.textContent = "";

    const candidates = allProfilesList
      .filter((p) => p.isPublic !== false && !bannedUsersMap.has(p.uid))
      .map((prof) => {
        const stats = getRatingStats(prof.uid);
        const pCount = allPostsList.filter((post) => post.authorUid === prof.uid).length;
        const isCr = isCreatorAccount(prof.internalId, prof.uid);
        const rep = computeDeveloperReputation({
          reviewsStats: stats,
          githubData: prof.developerProfile?.github,
          portfolioPostsCount: pCount,
          isVerified: Boolean(prof.internalId),
          membershipTier: isCr ? "creator" : (prof.membershipTier || "standard")
        });
        return { ...prof, _rep: rep, _isCreator: isCr };
      })
      .sort((a, b) => {
        const aBoost = a._isCreator ? 400 : (a.membershipTier === "pro" ? 250 : (a.membershipTier === "plus" ? 120 : 0));
        const bBoost = b._isCreator ? 400 : (b.membershipTier === "pro" ? 250 : (b.membershipTier === "plus" ? 120 : 0));
        if (aBoost !== bBoost) return bBoost - aBoost;
        return b._rep.score - a._rep.score;
      });

    let renderedCount = 0;
    candidates.forEach((cand) => {
      if (activeTech !== "all") {
        const ok = cand.category === activeTech || (activeTech === "video" && cand.category === "motion3d");
        if (!ok) return;
      }

      const skillsStr = (Array.isArray(cand.skills) ? cand.skills.join(" ") : (cand.skills || "")).toLowerCase();
      const match =
        !q ||
        (cand.displayName || "").toLowerCase().includes(q) ||
        skillsStr.includes(q) ||
        (cand.role || "").toLowerCase().includes(q) ||
        (cand.internalId || deriveInternalId(cand.uid)).toLowerCase().includes(q);

      if (!match) return;
      renderedCount++;

      const card = document.createElement("article");
      card.className = "candidate-mirror-card";

      const top = document.createElement("div");
      top.className = "candidate-card-top";

      const av = document.createElement("img");
      let ring = "";
      if (cand._isCreator) ring = "creator-avatar-ring";
      else if (cand.membershipTier === "pro") ring = "pro-avatar-ring";
      else if (cand.membershipTier === "plus") ring = "plus-avatar-ring";
      av.className = `candidate-avatar ${ring}`.trim();
      av.src = cand.photoURL || "favicon.svg";
      av.alt = "";
      av.onerror = () => { av.src = "favicon.svg"; };

      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "0";

      const nameLine = document.createElement("div");
      nameLine.style.display = "flex";
      nameLine.style.alignItems = "center";
      nameLine.style.gap = "6px";
      nameLine.style.flexWrap = "wrap";

      const strong = document.createElement("strong");
      strong.style.fontSize = "1rem";
      strong.textContent = cand.displayName || "Especialista";
      nameLine.appendChild(strong);

      if (cand._isCreator) {
        nameLine.appendChild(createCreatorBadgeEl(true));
      } else if (cand.membershipTier === "pro") {
        nameLine.appendChild(renderMembershipBadge("pro", true));
      } else if (cand.membershipTier === "plus") {
        nameLine.appendChild(renderMembershipBadge("plus", true));
      }

      const roleSpan = document.createElement("span");
      roleSpan.className = "candidate-role";
      roleSpan.textContent = cand.role || CATEGORY_LABELS[cand.category] || "Especialista digital";

      info.appendChild(nameLine);
      info.appendChild(roleSpan);
      if (isAdminUser(activeAuthUser)) {
        const idSpan = document.createElement("span");
        idSpan.className = "mono candidate-id";
        idSpan.textContent = `ID: ${cand.internalId || deriveInternalId(cand.uid)}`;
        info.appendChild(idSpan);
      }

      const scoreBox = document.createElement("div");
      scoreBox.className = "candidate-score-box mono";
      scoreBox.innerHTML = `
        <span class="score-num">${cand._rep.score}</span>
        <span class="score-lbl">REPUTACIÓN</span>
      `;

      top.appendChild(av);
      top.appendChild(info);
      top.appendChild(scoreBox);
      card.appendChild(top);

      const meta = document.createElement("div");
      meta.className = "candidate-card-meta";
      meta.innerHTML = `
        <span class="mono rep-badge-tag">${cand._rep.badgeLabel}</span>
        ${
          cand.developerProfile?.github?.username
            ? `<a href="${cand.developerProfile.github.htmlUrl}" target="_blank" rel="noopener" class="gh-verified-tag mono">GitHub Verificado (${cand.developerProfile.github.totalStars}★)</a>`
            : ""
        }
      `;
      card.appendChild(meta);

      if (Array.isArray(cand.skills) && cand.skills.length > 0) {
        const skillsWrap = document.createElement("div");
        skillsWrap.className = "candidate-skills-wrap mono";
        cand.skills.slice(0, 4).forEach((sk) => {
          const sTag = document.createElement("span");
          sTag.className = "skill-tag";
          sTag.textContent = sk;
          skillsWrap.appendChild(sTag);
        });
        card.appendChild(skillsWrap);
      }

      const actions = document.createElement("div");
      actions.className = "candidate-card-actions";

      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "btn btn-ghost btn-sm";
      viewBtn.textContent = "Ver portafolio y ★";
      viewBtn.addEventListener("click", () => renderInspectorContent(cand.uid));

      const contactBtn = document.createElement("button");
      contactBtn.type = "button";
      contactBtn.className = "btn btn-white btn-sm";
      contactBtn.textContent = "Contactar cifrado →";
      contactBtn.addEventListener("click", () => {
        if (!currentAuthUser) {
          signInAndEnterWorkspace(`cuenta.html?chat=${encodeURIComponent(cand.uid)}`);
          return;
        }
        if (window.location.pathname.endsWith("cuenta.html")) {
          switchWorkspaceTab("messages");
          cloudHooks.openChatWithPeer?.(cand.uid);
        } else {
          window.location.href = `cuenta.html?chat=${encodeURIComponent(cand.uid)}`;
        }
      });

      actions.appendChild(viewBtn);
      actions.appendChild(contactBtn);
      card.appendChild(actions);

      gridEl.appendChild(card);
    });

    if (renderedCount === 0) {
      const empty = document.createElement("p");
      empty.style.color = "var(--muted)";
      empty.style.fontSize = "0.9rem";
      empty.style.padding = "24px 0";
      empty.textContent = "No se encontraron especialistas para esa tecnología o búsqueda.";
      gridEl.appendChild(empty);
    }
  };

  searchInput?.addEventListener("input", filterAndPaint);
  filterAndPaint();
};

const mountEmploymentSmartModule = (containerEl, userProfile) => {
  if (!containerEl) return;
  containerEl.textContent = "";

  const isRecruiter = userProfile?.workSituation === "hiring";

  const switcher = document.createElement("div");
  switcher.className = "employment-mode-switch";
  switcher.innerHTML = `
    <button type="button" class="emp-tab-btn ${!isRecruiter ? "active" : ""}" data-mode="dev">
      Vista Especialista · Construir Reputación
    </button>
    <button type="button" class="emp-tab-btn ${isRecruiter ? "active" : ""}" data-mode="recruiter">
      Panel Espejo · Reclutamiento de Talento
    </button>
  `;
  containerEl.appendChild(switcher);

  const stage = document.createElement("div");
  stage.id = "employmentStageArea";
  containerEl.appendChild(stage);

  const renderView = (mode) => {
    stage.textContent = "";
    if (mode === "dev") {
      renderDeveloperReputationStudio(stage, userProfile);
    } else {
      renderRecruiterMirrorDirectory(stage, activeAuthUser);
    }
  };

  switcher.querySelectorAll(".emp-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switcher.querySelectorAll(".emp-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderView(btn.dataset.mode);
    });
  });

  renderView(isRecruiter ? "recruiter" : "dev");
};

const openMembershipModal = (currentProfile, onTierSelect) => {
  const modal = document.getElementById("xuaniiMembershipModal");
  if (!modal) return;
  modal.hidden = false;

  const activeTier = currentProfile?.membershipTier || "standard";
  const cardPlus = document.getElementById("tierCardPlus");
  const cardPro = document.getElementById("tierCardPro");
  const btnPlus = document.getElementById("activateTierPlusBtn");
  const btnPro = document.getElementById("activateTierProBtn");
  const feedback = document.getElementById("tierFeedback");

  if (cardPlus) cardPlus.classList.toggle("current-tier", activeTier === "plus");
  if (cardPro) cardPro.classList.toggle("current-tier", activeTier === "pro");

  if (btnPlus) {
    btnPlus.textContent = activeTier === "plus" ? "Membresía PLUS activa ✓" : "Activar Membresía PLUS";
    btnPlus.onclick = async () => {
      btnPlus.disabled = true;
      try {
        await onTierSelect?.("plus");
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = "Membresía PLUS activada correctamente en tu perfil ✓";
        }
        setTimeout(() => { modal.hidden = true; }, 1400);
      } catch (err) {
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = err?.message || "Error al actualizar membresía.";
        }
      } finally {
        btnPlus.disabled = false;
      }
    };
  }

  if (btnPro) {
    btnPro.textContent = activeTier === "pro" ? "Membresía PRO activa ✓" : "Activar Membresía PRO";
    btnPro.onclick = async () => {
      btnPro.disabled = true;
      try {
        await onTierSelect?.("pro");
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = "Membresía PRO dorada activada correctamente en tu perfil ✓";
        }
        setTimeout(() => { modal.hidden = true; }, 1400);
      } catch (err) {
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = err?.message || "Error al actualizar membresía.";
        }
      } finally {
        btnPro.disabled = false;
      }
    };
  }

  const closeBtn = document.getElementById("closeMembershipModalBtn");
  if (closeBtn) {
    closeBtn.onclick = () => { modal.hidden = true; };
  }
  modal.onclick = (e) => {
    if (e.target === modal) modal.hidden = true;
  };
};

const initAppDockAndNavigation = () => {
  const toggleBtn = document.getElementById("dockToggleBtn");
  const closeBtn = document.getElementById("dockCloseBtn");
  const backdrop = document.getElementById("appDockBackdrop");
  const openPlansBtn = document.getElementById("dockOpenPlansBtn");
  const createCommBtn = document.getElementById("dockCreateCommBtn");
  const nav = document.getElementById("dockNav") || document.querySelector(".dock-nav");
  let indicator = document.getElementById("dockIndicatorBar");

  const positionIndicatorAt = (el, smooth = true) => {
    if (!el || !nav) return;
    if (!indicator) {
      indicator = document.getElementById("dockIndicatorBar");
      if (!indicator) return;
    }
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (navRect.height === 0 || elRect.height === 0) return;

    const barHeight = Math.min(24, Math.max(16, elRect.height * 0.46));
    const top = elRect.top - navRect.top + (elRect.height - barHeight) / 2;

    indicator.style.transition = smooth
      ? "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease"
      : "none";

    indicator.style.height = `${barHeight}px`;
    indicator.style.transform = `translateY(${top}px)`;
    indicator.style.opacity = "1";
  };

  const syncDockIndicator = (smooth = true) => {
    if (!nav) return;
    const active = nav.querySelector(".dock-nav-item.active");
    if (active) {
      positionIndicatorAt(active, smooth);
    } else if (indicator) {
      indicator.style.opacity = "0";
    }
  };

  if (nav) {
    nav.classList.add("dock-has-js");
    const items = nav.querySelectorAll(".dock-nav-item");

    items.forEach((item) => {
      item.addEventListener("mouseenter", () => positionIndicatorAt(item, true));
      item.addEventListener("focus", () => positionIndicatorAt(item, true));
    });

    nav.addEventListener("mouseleave", () => syncDockIndicator(true));
    window.addEventListener("resize", () => syncDockIndicator(false));
  }

  window.__xuaniiSyncDockIndicator = syncDockIndicator;

  const openDock = () => {
    if (!backdrop) return;
    backdrop.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      syncDockIndicator(false);
    });
  };

  const closeDock = () => {
    if (!backdrop) return;
    backdrop.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  };

  toggleBtn?.addEventListener("click", () => {
    if (backdrop?.hidden) openDock();
    else closeDock();
  });

  closeBtn?.addEventListener("click", closeDock);
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) closeDock();
  });

  openPlansBtn?.addEventListener("click", () => {
    closeDock();
    openMembershipModal(currentOwnProfile, cloudHooks.updateMembershipTier);
  });

  createCommBtn?.addEventListener("click", () => {
    closeDock();
    if (window.location.pathname.endsWith("cuenta.html")) {
      switchWorkspaceTab("communities");
      const cForm = document.getElementById("createCommunityForm");
      if (cForm) {
        cForm.hidden = false;
        document.getElementById("newCommTitle")?.focus();
      }
    } else {
      window.location.href = "cuenta.html?tab=communities";
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDock();
      const memModal = document.getElementById("xuaniiMembershipModal");
      if (memModal) memModal.hidden = true;
    }
  });
};

const copyTextWithFeedback = async (text, el) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (el) {
      const prev = el.textContent;
      el.textContent = `Copiado: ${text} ✓`;
      setTimeout(() => {
        el.textContent = prev;
      }, 1500);
    }
  } catch {
    // Sin acceso a portapapeles
  }
};

// Compresión fotográfica mediante Canvas (rápida y compatible con capa gratuita de Cloud Firestore)
const compressImageDataUrl = (sourceFile, maxDim = 1280, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const c = canvas.getContext("2d");
      c.drawImage(img, 0, 0, width, height);

      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) {
        out = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("Imagen inválida"));

    const reader = new FileReader();
    reader.onload = () => {
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Error leyendo imagen"));
    reader.readAsDataURL(sourceFile);
  });

/* =========================================================
   2. MOTOR CRIPTOGRÁFICO WEBCRYPTO (ECDH P-256 + AES-256-GCM)
   ========================================================= */
const bytesToB64 = (bytes) => {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
};

const b64ToBytes = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const keyCache = new Map();

const deriveFallbackConvAesKey = async (convId) => {
  const cacheKey = `conv:${convId}`;
  if (keyCache.has(cacheKey)) return keyCache.get(cacheKey);
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(`xuanii-e2ee-v1::${convId}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`salt::${convId}`),
      iterations: 60000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  keyCache.set(cacheKey, aesKey);
  return aesKey;
};

const deriveEcdhAesKey = async (convId, myPrivateJwk, peerPublicJwk) => {
  const cacheKey = `ecdh:${convId}:${peerPublicJwk.x || ""}`;
  if (keyCache.has(cacheKey)) return keyCache.get(cacheKey);

  const privKey = await crypto.subtle.importKey(
    "jwk",
    myPrivateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );
  const pubKey = await crypto.subtle.importKey(
    "jwk",
    peerPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: pubKey },
    privKey,
    256
  );
  const hkdfBase = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const enc = new TextEncoder();
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(convId),
      info: enc.encode("xuanii-aes-256-gcm-v1")
    },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  keyCache.set(cacheKey, aesKey);
  return aesKey;
};

const encryptChatText = async (plaintext, convId, myPrivateJwk, peerPublicJwk) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  let aesKey;
  let encMode = "conv";

  if (myPrivateJwk && peerPublicJwk && peerPublicJwk.kty === "EC") {
    try {
      aesKey = await deriveEcdhAesKey(convId, myPrivateJwk, peerPublicJwk);
      encMode = "ecdh";
    } catch {
      aesKey = await deriveFallbackConvAesKey(convId);
    }
  } else {
    aesKey = await deriveFallbackConvAesKey(convId);
  }

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(plaintext)
  );
  return {
    ciphertext: bytesToB64(cipherBuf),
    iv: bytesToB64(iv),
    encMode
  };
};

const decryptChatPayload = async (msgObj, convId, myPrivateJwk, peerPublicJwk) => {
  if (!msgObj) return "";
  if (!msgObj.ciphertext || !msgObj.iv) {
    return msgObj.text || "";
  }
  try {
    let aesKey;
    if (msgObj.encMode === "ecdh" && myPrivateJwk && peerPublicJwk && peerPublicJwk.kty === "EC") {
      aesKey = await deriveEcdhAesKey(convId, myPrivateJwk, peerPublicJwk);
    } else {
      aesKey = await deriveFallbackConvAesKey(convId);
    }
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(msgObj.iv) },
      aesKey,
      b64ToBytes(msgObj.ciphertext)
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return "[Mensaje cifrado protegido]";
  }
};

/* =========================================================
   3. ANIMACIONES FLUIDAS APPLE (REVEAL & CANVAS DE SEDA)
   ========================================================= */
const setupAppleScrollReveals = () => {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (!revealNodes.length) return;

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );

  revealNodes.forEach((node) => observer.observe(node));
};
setupAppleScrollReveals();

// Fondo de seda monocromática fluida en Negro Obsidiana (Hero e Interiores)
const heroBgCanvas = document.getElementById("monochromeCanvas");
if (heroBgCanvas) {
  const ctx = heroBgCanvas.getContext("2d");
  let w = 0;
  let h = 0;
  let t = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = heroBgCanvas.clientWidth || window.innerWidth;
    h = heroBgCanvas.clientHeight || 620;
    heroBgCanvas.width = Math.floor(w * dpr);
    heroBgCanvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", resize);
  resize();

  const drawRibbon = (offsetY, amp, freq, speed, alphaTop, alphaBot) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 18) {
      const y =
        offsetY +
        Math.sin(x * freq + t * speed) * amp +
        Math.cos(x * freq * 0.55 - t * speed * 0.7) * (amp * 0.6);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, offsetY - amp * 2, w, offsetY + amp * 2.5);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alphaTop})`);
    grad.addColorStop(0.5, `rgba(180, 180, 192, ${(alphaTop + alphaBot) * 0.48})`);
    grad.addColorStop(1, `rgba(5, 5, 7, ${alphaBot})`);
    ctx.fillStyle = grad;
    ctx.fill();
  };

  const tick = () => {
    t += 0.0095;
    ctx.fillStyle = "#050507";
    ctx.fillRect(0, 0, w, h);

    drawRibbon(h * 0.28, 52, 0.0024, 0.9, 0.15, 0.01);
    drawRibbon(h * 0.44, 64, 0.0031, -0.7, 0.21, 0.02);
    drawRibbon(h * 0.6, 46, 0.0038, 1.15, 0.12, 0.01);

    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const y =
          h * (0.3 + i * 0.11) +
          Math.sin(x * 0.003 + t + i * 1.1) * 44 +
          Math.cos(x * 0.0017 - t * 0.8) * 24;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 - i * 0.026})`;
      ctx.stroke();
    }
    requestAnimationFrame(tick);
  };
  tick();
}

// Esquema interactivo de PhotoStun sobre fondo negro obsidiana (Curva tonal luminosa)
const edCanvas = document.getElementById("editorialPreviewCanvas");
if (edCanvas) {
  const ectx = edCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = 540;
  const ch = 400;
  edCanvas.width = cw * dpr;
  edCanvas.height = ch * dpr;
  ectx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let phase = 0;
  let hoverActive = false;
  let targetNormX = 0.5;
  let smoothNormX = 0.5;
  let targetGain = 1.0;
  let smoothGain = 1.0;

  const updatePointer = (clientX, clientY) => {
    const rect = edCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    targetNormX = Math.min(0.92, Math.max(0.08, relX));
    targetGain = Math.min(1.45, Math.max(0.55, 1.45 - relY * 0.9));
    hoverActive = true;
  };

  edCanvas.addEventListener("pointermove", (e) => updatePointer(e.clientX, e.clientY));
  edCanvas.addEventListener("pointerleave", () => {
    hoverActive = false;
  });

  const renderEditorialGraphic = () => {
    phase += 0.013;
    ectx.clearRect(0, 0, cw, ch);

    if (!hoverActive) {
      targetNormX = Math.sin(phase * 0.55) * 0.32 + 0.5;
      targetGain = 1.0;
    }
    smoothNormX += (targetNormX - smoothNormX) * 0.1;
    smoothGain += (targetGain - smoothGain) * 0.1;

    ectx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ectx.lineWidth = 1;
    for (let x = 40; x <= cw - 40; x += 50) {
      ectx.beginPath();
      ectx.moveTo(x, 30);
      ectx.lineTo(x, ch - 30);
      ectx.stroke();
    }
    for (let y = 40; y <= ch - 40; y += 50) {
      ectx.beginPath();
      ectx.moveTo(30, y);
      ectx.lineTo(cw - 30, y);
      ectx.stroke();
    }

    const drawCornerMark = (cx, cy, sx, sy) => {
      ectx.strokeStyle = "#ffffff";
      ectx.lineWidth = 1.5;
      ectx.beginPath();
      ectx.moveTo(cx, cy + sy * 14);
      ectx.lineTo(cx, cy);
      ectx.lineTo(cx + sx * 14, cy);
      ectx.stroke();
    };
    drawCornerMark(40, 40, 1, 1);
    drawCornerMark(cw - 40, 40, -1, 1);
    drawCornerMark(40, ch - 40, 1, -1);
    drawCornerMark(cw - 40, ch - 40, -1, -1);

    for (let layer = 0; layer < 5; layer++) {
      ectx.beginPath();
      for (let x = 50; x <= cw - 50; x += 6) {
        const norm = (x - 50) / (cw - 100);
        const env = Math.sin(norm * Math.PI);
        const y =
          ch * 0.54 -
          Math.sin(norm * 5.2 + phase + layer * 0.45) * (66 * smoothGain * env) -
          Math.cos(norm * 2.4 - phase * 0.7) * (24 * smoothGain * env);
        if (x === 50) ectx.moveTo(x, y);
        else ectx.lineTo(x, y);
      }
      ectx.strokeStyle = layer === 0 ? "#ffffff" : `rgba(255, 255, 255, ${0.42 - layer * 0.075})`;
      ectx.lineWidth = layer === 0 ? 2 : 1;
      ectx.stroke();
    }

    const fx = 50 + smoothNormX * (cw - 100);
    const fEnv = Math.sin(smoothNormX * Math.PI);
    const fy =
      ch * 0.54 -
      Math.sin(smoothNormX * 5.2 + phase) * (66 * smoothGain * fEnv) -
      Math.cos(smoothNormX * 2.4 - phase * 0.7) * (24 * smoothGain * fEnv);

    ectx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ectx.setLineDash([3, 3]);
    ectx.beginPath();
    ectx.moveTo(fx, 40);
    ectx.lineTo(fx, ch - 40);
    ectx.stroke();
    ectx.setLineDash([]);

    ectx.fillStyle = "#ffffff";
    ectx.beginPath();
    ectx.arc(fx, fy, 4.5, 0, Math.PI * 2);
    ectx.fill();

    ectx.font = "500 11px 'JetBrains Mono', monospace";
    ectx.fillStyle = "#a1a1aa";
    ectx.fillText("PHOTOSTUN // CURVA TONAL", 52, ch - 52);
    ectx.fillText(
      `LUZ ${Math.round(smoothNormX * 100)}% · EV ${(smoothGain - 1 >= 0 ? "+" : "") + (smoothGain - 1).toFixed(2)}`,
      Math.min(cw - 190, Math.max(52, fx + 10)),
      Math.max(58, fy - 10)
    );

    requestAnimationFrame(renderEditorialGraphic);
  };
  renderEditorialGraphic();
}

/* =========================================================
   4. ESTADO COMPARTIDO EN MEMORIA Y FORMULARIOS PÚBLICOS
   ========================================================= */
let activeAuthUser = null;
let currentOwnProfile = null;
let myCryptoKeys = null; // { publicKeyJwk, privateKeyJwk }
let cachedAuthSession = null;
try {
  const cachedJson = localStorage.getItem("xuanii_auth_session");
  if (cachedJson) {
    cachedAuthSession = JSON.parse(cachedJson);
  }
} catch (e) {}

let allProfilesList = [];
let profilesByUid = new Map();
let bannedUsersMap = new Map(); // uid -> banRecord
let reviewsByTargetUid = new Map(); // targetUid -> { avg, count, items }
let allPostsList = [];
let myConnectionsMap = new Map(); // otherUid -> { id, status, requesterUid, users }
let currentVaultItems = [];

let cloudHooks = {
  saveSubmission: null,
  saveWaitlist: null,
  saveProfile: null,
  saveSituationQuick: null,
  publishPost: null,
  toggleLikePost: null,
  toggleDislikePost: null,
  toggleSavePost: null,
  toggleFollowCreator: null,
  deletePost: null,
  addPostComment: null,
  deletePostComment: null,
  subscribePostComments: null,
  subscribeAdminPendingComments: null,
  adminApproveComment: null,
  adminRejectAndSanctionComment: null,
  adminBanFromComment: null,
  adminUpdateUserConduct: null,
  submitStarReview: null,
  requestConnection: null,
  acceptConnection: null,
  removeConnection: null,
  openChatWithPeer: null,
  acceptPendingChat: null,
  blockChat: null,
  sendReportById: null,
  adminBanUser: null,
  adminUnbanUser: null,
  createCommunity: null,
  createVaultItem: null,
  deleteVaultItem: null
};

let buildRichSocialPostEl = null;

const prefillKnownUserFields = () => {
  const waitlist = readJson(STORAGE_KEYS.WAITLIST, null);
  const submissions = readJson(STORAGE_KEYS.SUBMISSIONS, []);
  const lastSub = submissions[0] || null;

  const knownName = activeAuthUser?.displayName || lastSub?.name || "";
  const knownEmail = activeAuthUser?.email || waitlist?.email || lastSub?.email || "";

  const contactName = document.getElementById("contactName");
  const contactEmail = document.getElementById("contactEmail");
  const waitlistEmail = document.getElementById("waitlistEmail");
  const waitlistPriority = document.getElementById("waitlistPriority");

  if (contactName && !contactName.value && knownName) contactName.value = knownName;
  if (contactEmail && !contactEmail.value && knownEmail) contactEmail.value = knownEmail;
  if (waitlistEmail && !waitlistEmail.value && knownEmail) waitlistEmail.value = knownEmail;
  if (waitlistPriority && waitlist?.priority) waitlistPriority.value = waitlist.priority;
};

// Lista de acceso anticipado a PhotoStun (productos.html)
const waitlistForm = document.getElementById("photostunWaitlistForm");
if (waitlistForm) {
  const emailInput = document.getElementById("waitlistEmail");
  const prioritySelect = document.getElementById("waitlistPriority");
  const submitBtn = document.getElementById("waitlistSubmitBtn");
  const feedbackEl = document.getElementById("waitlistFeedback");

  waitlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailInput?.value || "").trim();
    const priority = prioritySelect?.value || "Curvas tonales y control de iluminación";

    if (!isValidEmail(email)) {
      if (feedbackEl) {
        feedbackEl.hidden = false;
        feedbackEl.textContent = "Introduce un correo electrónico válido.";
      }
      emailInput?.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    const record = {
      email,
      priority,
      uid: activeAuthUser?.uid || null,
      createdAtIso: new Date().toISOString()
    };
    writeJson(STORAGE_KEYS.WAITLIST, record);
    if (cloudHooks.saveWaitlist) {
      await cloudHooks.saveWaitlist(record).catch(() => {});
    }
    if (submitBtn) submitBtn.disabled = false;
    if (feedbackEl) {
      feedbackEl.hidden = false;
      feedbackEl.textContent = `Acceso prioritario registrado para ${email}.`;
    }
  });
}

// Formulario de contacto (contacto.html)
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  const topicTabs = contactForm.querySelectorAll(".topic-tab");
  const categoryInput = document.getElementById("contactCategory");
  const nameInput = document.getElementById("contactName");
  const emailInput = document.getElementById("contactEmail");
  const subjectInput = document.getElementById("contactSubject");
  const messageInput = document.getElementById("contactMessage");
  const submitBtn = document.getElementById("contactSubmitBtn");
  const feedbackEl = document.getElementById("contactFeedback");

  topicTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      topicTabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      if (categoryInput) categoryInput.value = tab.dataset.topic || "Propuesta de herramienta";
    });
  });

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = (categoryInput?.value || "Propuesta de herramienta").trim();
    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const subject = (subjectInput?.value || "").trim();
    const message = (messageInput?.value || "").trim();

    if (!name || !isValidEmail(email) || !subject || !message) {
      if (feedbackEl) {
        feedbackEl.hidden = false;
        feedbackEl.textContent = !isValidEmail(email)
          ? "Escribe un correo electrónico válido para poder responderte."
          : "Completa tu nombre, asunto y mensaje antes de enviar.";
      }
      return;
    }

    const originalLabel = submitBtn?.innerHTML || "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }

    const entry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category,
      name,
      email,
      subject,
      message,
      uid: activeAuthUser?.uid || null,
      createdAtIso: new Date().toISOString()
    };

    const targetInbox = (window.XUANII_CONTACT_EMAIL || "").trim();
    if (targetInbox && isValidEmail(targetInbox)) {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetInbox)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `[Xuanii · ${category}] ${subject}`,
          categoria: category,
          nombre: name,
          email,
          asunto: subject,
          mensaje: message
        })
      }).catch(() => {});
    }

    if (cloudHooks.saveSubmission) {
      await cloudHooks.saveSubmission(entry).catch(() => {});
    }

    const existing = readJson(STORAGE_KEYS.SUBMISSIONS, []);
    writeJson(STORAGE_KEYS.SUBMISSIONS, [entry, ...existing].slice(0, 50));

    if (subjectInput) subjectInput.value = "";
    if (messageInput) messageInput.value = "";
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
    if (feedbackEl) {
      feedbackEl.hidden = false;
      feedbackEl.textContent = "Mensaje enviado y respaldado correctamente.";
    }
  });
}

/* =========================================================
   5. NAVEGACIÓN DEL ESPACIO DE TRABAJO (CUENTA.HTML)
   ========================================================= */
const ALL_WS_TABS = ["feed", "employment", "network", "messages", "communities", "profile", "plans", "files", "settings"];
const wsNavButtons = document.querySelectorAll("[data-ws-tab]");

const switchWorkspaceTab = (tabName) => {
  if (tabName === "plans") {
    openMembershipModal(currentOwnProfile, cloudHooks.updateMembershipTier);
    return;
  }
  if (!ALL_WS_TABS.includes(tabName)) return;
  wsNavButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.wsTab === tabName);
  });
  ALL_WS_TABS.forEach((key) => {
    const panel = document.getElementById(`wsPanel-${key}`);
    if (panel) panel.hidden = key !== tabName;
  });
  if (tabName === "employment") {
    mountEmploymentSmartModule(document.getElementById("employmentSmartContainer"), currentOwnProfile);
  }

  // Sincronizar item activo en el Dock lateral y mover su indicador
  const dockMap = {
    feed: "dockNavParaTi",
    messages: "dockNavMessages",
    communities: "dockNavCommunities",
    employment: "dockNavEmployment",
    profile: "dockNavProfile"
  };
  const dockNav = document.getElementById("dockNav") || document.querySelector(".dock-nav");
  if (dockNav) {
    dockNav.querySelectorAll(".dock-nav-item").forEach((el) => el.classList.remove("active"));
    const activeDockId = dockMap[tabName];
    if (activeDockId) {
      document.getElementById(activeDockId)?.classList.add("active");
    }
    window.__xuaniiSyncDockIndicator?.(true);
  }
};

wsNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchWorkspaceTab(btn.dataset.wsTab);
  });
});

const urlParams = new URLSearchParams(window.location.search);
const requestedTab = urlParams.get("tab");
const requestedChatUid = urlParams.get("chat");
const requestedUserUid = urlParams.get("user") || urlParams.get("profile");
if (requestedChatUid) {
  switchWorkspaceTab("messages");
} else if (requestedTab && ALL_WS_TABS.includes(requestedTab)) {
  switchWorkspaceTab(requestedTab);
}
if (requestedUserUid) {
  setTimeout(() => renderInspectorContent(requestedUserUid), 350);
}

/* =========================================================
   6. COMPONENTES REUTILIZABLES DE ESTRELLAS, TARJETAS E INSPECTOR
   ========================================================= */
const getRatingStats = (uid) => reviewsByTargetUid.get(uid) || { avg: 0, count: 0, items: [] };

const formatStarsText = (avg, count) => {
  if (!count) return "★ Sin valoraciones aún";
  const rounded = Math.round(avg);
  const glyphs = "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
  return `${glyphs} ${avg.toFixed(1)} (${count})`;
};

const renderSkillTagsInto = (container, skillsInputOrArray) => {
  if (!container) return;
  container.textContent = "";
  const tags = parseSkillsList(skillsInputOrArray);
  tags.forEach((skill) => {
    const span = document.createElement("span");
    span.className = "skill-tag-open mono";
    span.textContent = skill;
    container.appendChild(span);
  });
};

// Visor Lightbox a pantalla completa para fotografías de Para ti y portafolios
const photoLightboxModal = document.getElementById("photoLightboxModal");
const closePhotoLightbox = () => {
  if (photoLightboxModal) photoLightboxModal.hidden = true;
};
document.getElementById("lightboxCloseBtn")?.addEventListener("click", closePhotoLightbox);
photoLightboxModal?.addEventListener("click", (e) => {
  if (e.target === photoLightboxModal) closePhotoLightbox();
});

const openPhotoLightbox = (post, signInCallback) => {
  if (!photoLightboxModal || !post?.photoUrl) return;
  const imgEl = document.getElementById("lightboxImage");
  const capEl = document.getElementById("lightboxCaption");
  const authorEl = document.getElementById("lightboxAuthorInfo");
  const actsEl = document.getElementById("lightboxActions");

  if (imgEl) {
    imgEl.src = post.photoUrl;
    imgEl.alt = post.caption || "Fotografía de portafolio";
  }
  if (capEl) {
    capEl.textContent = post.caption || "";
  }

  const authorProf = profilesByUid.get(post.authorUid);
  const authorInternalId =
    post.authorInternalId || authorProf?.internalId || deriveInternalId(post.authorUid);
  const creatorFlag = isCreatorAccount(authorInternalId, post.authorUid);

  if (authorEl) {
    authorEl.textContent = "";
    authorEl.onclick = () => {
      closePhotoLightbox();
      renderInspectorContent(post.authorUid);
    };

    const av = document.createElement("img");
    av.className = creatorFlag
      ? "feed-author-avatar creator-avatar-ring"
      : "feed-author-avatar";
    av.src = post.authorAvatar || authorProf?.photoURL || "favicon.svg";
    av.alt = "";
    av.onerror = () => {
      av.src = "favicon.svg";
    };

    const meta = document.createElement("div");
    const nm = document.createElement("div");
    nm.className = "profile-name-line";
    const strong = document.createElement("strong");
    strong.style.fontSize = "0.95rem";
    strong.textContent = post.authorName || authorProf?.displayName || "Especialista";
    nm.appendChild(strong);
    if (creatorFlag) nm.appendChild(createCreatorBadgeEl(true));

    const hnd = document.createElement("span");
    hnd.className = "profile-handle mono";
    hnd.textContent = `@${post.authorHandle || authorProf?.handle || "usuario"}`;
    nm.appendChild(hnd);

    const sub = document.createElement("span");
    sub.className = "open-row-sub";
    sub.style.marginTop = "0";
    sub.textContent = `${post.authorRole || authorProf?.role || "Especialista"} · ${formatDateEs(post.createdAtMs)}`;

    meta.appendChild(nm);
    meta.appendChild(sub);
    authorEl.appendChild(av);
    authorEl.appendChild(meta);
  }

  if (actsEl) {
    actsEl.textContent = "";
    const likesArr = Array.isArray(post.likes) ? post.likes : [];
    let likedNow = Boolean(activeAuthUser && likesArr.includes(activeAuthUser.uid));
    let countNow = likesArr.length;

    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = likedNow ? "post-like-btn liked" : "post-like-btn";
    const getLightboxHeartHtml = (active, count) => `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span>${count} Me gusta</span>
    `;
    likeBtn.innerHTML = getLightboxHeartHtml(likedNow, countNow);
    likeBtn.addEventListener("click", (e) => {
      applyLiquidWaterRipple(e, likeBtn);
      triggerFluidPop(likeBtn);
      if (!activeAuthUser) {
        if (signInCallback) signInCallback(window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html");
        return;
      }
      cloudHooks.toggleLikePost?.(post.id, likedNow);
      likedNow = !likedNow;
      countNow = Math.max(0, countNow + (likedNow ? 1 : -1));
      likeBtn.className = likedNow ? "post-like-btn liked" : "post-like-btn";
      likeBtn.innerHTML = getLightboxHeartHtml(likedNow, countNow);
    });
    actsEl.appendChild(likeBtn);

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-ghost btn-sm";
    viewBtn.textContent = "Ver perfil profesional";
    viewBtn.addEventListener("click", () => {
      closePhotoLightbox();
      renderInspectorContent(post.authorUid);
    });
    actsEl.appendChild(viewBtn);

    if (!activeAuthUser || post.authorUid !== activeAuthUser.uid) {
      const chatBtn = document.createElement("button");
      chatBtn.type = "button";
      chatBtn.className = "btn btn-white btn-sm";
      chatBtn.textContent = "Contactar / Trabajo →";
      chatBtn.addEventListener("click", () => {
        closePhotoLightbox();
        if (window.location.pathname.endsWith("cuenta.html") && activeAuthUser) {
          switchWorkspaceTab("messages");
          cloudHooks.openChatWithPeer?.(post.authorUid);
        } else if (signInCallback) {
          signInCallback(`cuenta.html?chat=${encodeURIComponent(post.authorUid)}`);
        } else {
          window.location.href = `cuenta.html?chat=${encodeURIComponent(post.authorUid)}`;
        }
      });
      actsEl.appendChild(chatBtn);
    }
  }

  photoLightboxModal.hidden = false;
};

// Inspector lateral de Perfil Completo, Fotos y Calificación con Estrellas
let inspectedProfileUid = null;
let selectedStarValue = 5;

const inspectorBackdrop = document.getElementById("profileInspectorBackdrop");
const closeInspectorBtn = document.getElementById("closeInspectorBtn");
const closeInspector = () => {
  if (inspectorBackdrop) inspectorBackdrop.hidden = true;
  inspectedProfileUid = null;
};
closeInspectorBtn?.addEventListener("click", closeInspector);
inspectorBackdrop?.addEventListener("click", (e) => {
  if (e.target === inspectorBackdrop) closeInspector();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (photoLightboxModal && !photoLightboxModal.hidden) {
      closePhotoLightbox();
    } else if (inspectorBackdrop && !inspectorBackdrop.hidden) {
      closeInspector();
    }
  }
});

const starPickerEl = document.getElementById("inspStarPicker");
if (starPickerEl) {
  const starBtns = starPickerEl.querySelectorAll(".star-pick-btn");
  const paintStars = (n) => {
    starBtns.forEach((b) => {
      b.classList.toggle("lit", Number(b.dataset.star) <= n);
    });
  };
  starBtns.forEach((b) => {
    b.addEventListener("click", () => {
      selectedStarValue = Number(b.dataset.star) || 5;
      paintStars(selectedStarValue);
    });
  });
}

const renderInspectorContent = (targetUid) => {
  if (!inspectorBackdrop || !targetUid) return;
  const prof = profilesByUid.get(targetUid) || (currentOwnProfile?.uid === targetUid ? currentOwnProfile : null);
  if (!prof) return;

  inspectedProfileUid = targetUid;
  const internalId = prof.internalId || deriveInternalId(targetUid);
  const stats = getRatingStats(targetUid);

  // 1. ID Kicker en la cabecera
  const idEl = document.getElementById("inspInternalId");
  if (idEl) {
    const canSeeId = isAdminUser(activeAuthUser);
    idEl.hidden = !canSeeId;
    if (canSeeId) {
      idEl.textContent = `ID: ${internalId}`;
      idEl.onclick = () => copyTextWithFeedback(internalId, idEl);
    }
  }

  // 2. Botón Compartir perfil
  const shareBtn = document.getElementById("inspShareProfileBtn");
  if (shareBtn) {
    shareBtn.onclick = (e) => {
      applyLiquidWaterRipple(e, shareBtn);
      triggerFluidPop(shareBtn);
      const profileUrl = `${window.location.origin}${window.location.pathname}?user=${encodeURIComponent(targetUid)}`;
      navigator.clipboard?.writeText(profileUrl).then(() => {
        const fb = document.getElementById("inspActionFeedback");
        if (fb) {
          fb.hidden = false;
          fb.textContent = "Enlace del perfil copiado al portapapeles ✓";
          setTimeout(() => { fb.hidden = true; }, 2600);
        }
      }).catch(() => {});
    };
  }

  // 3. Avatar e Identidad del Creador
  const avatarEl = document.getElementById("inspAvatar");
  const isTargetCreator = isCreatorAccount(internalId, targetUid);
  if (avatarEl) {
    avatarEl.src = prof.photoURL || "favicon.svg";
    avatarEl.className = isTargetCreator
      ? "profile-tiktok-avatar creator-avatar-ring"
      : "profile-tiktok-avatar";
    avatarEl.onerror = () => {
      avatarEl.src = "favicon.svg";
    };
  }

  const nameEl = document.getElementById("inspName");
  const creatorSlotEl = document.getElementById("inspCreatorSlot");
  const handleEl = document.getElementById("inspHandle");
  const roleEl = document.getElementById("inspRole");
  const sitEl = document.getElementById("inspSituation");
  const starsEl = document.getElementById("inspStarsSummary");
  const bioEl = document.getElementById("inspBio");
  const skillsEl = document.getElementById("inspSkills");
  const actionsEl = document.getElementById("inspActionButtons");
  const feedbackEl = document.getElementById("inspActionFeedback");

  if (feedbackEl) feedbackEl.hidden = true;
  if (nameEl) nameEl.textContent = prof.displayName || "Especialista";
  mountCreatorBadgeSlot(creatorSlotEl, isTargetCreator, false);
  if (handleEl) handleEl.textContent = `@${prof.handle || "usuario"}`;
  if (roleEl) {
    roleEl.textContent = prof.role || CATEGORY_LABELS[prof.category] || "Especialista digital";
  }
  if (sitEl) {
    sitEl.textContent = SITUATION_LABELS[prof.workSituation] || "Disponible para proyectos";
  }
  if (starsEl) {
    starsEl.textContent = formatStarsText(stats.avg, stats.count);
  }
  const conductEl = document.getElementById("inspConductBadge");
  const conductScore = typeof prof.behaviorScore === "number" ? prof.behaviorScore : 10;
  if (conductEl) {
    conductEl.textContent = `Conducta: ${conductScore}/10 · ${getConductLabel(conductScore)}`;
    conductEl.className = `conduct-pill mono score-${conductScore <= 3 ? "bad" : conductScore <= 7 ? "warn" : "good"}`;
  }
  if (bioEl) {
    bioEl.textContent = prof.bio || "Sin descripción detallada aún.";
  }
  renderSkillTagsInto(skillsEl, prof.skills);

  // 4. Publicaciones del creador y Métricas Sociales estilo TikTok
  const userPosts = allPostsList.filter((p) => p.authorUid === targetUid);
  userPosts.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

  const followingCount = Array.isArray(prof.following)
    ? prof.following.length
    : (activeAuthUser && activeAuthUser.uid === targetUid ? myFollowingSet.size : 0);

  let followersCount = allProfilesList.filter(
    (p) => Array.isArray(p.following) && p.following.includes(targetUid)
  ).length;
  if (activeAuthUser && activeAuthUser.uid !== targetUid && myFollowingSet.has(targetUid)) {
    const alreadyCounted = allProfilesList.some(
      (p) => p.uid === activeAuthUser.uid && Array.isArray(p.following) && p.following.includes(targetUid)
    );
    if (!alreadyCounted) followersCount += 1;
  }

  const totalLikes = userPosts.reduce((acc, p) => acc + (Array.isArray(p.likes) ? p.likes.length : 0), 0);
  const formatTiktokNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return String(num || 0);
  };

  const followingEl = document.getElementById("inspFollowingCount");
  const followersEl = document.getElementById("inspFollowersCount");
  const likesEl = document.getElementById("inspLikesCount");
  if (followingEl) followingEl.textContent = formatTiktokNumber(followingCount);
  if (followersEl) followersEl.textContent = formatTiktokNumber(followersCount);
  if (likesEl) likesEl.textContent = formatTiktokNumber(totalLikes);

  // 5. Botones de acción TikTok (Seguir, Mensaje, Conectar, Editar)
  if (actionsEl) {
    actionsEl.textContent = "";
    const isMe = activeAuthUser && activeAuthUser.uid === targetUid;

    if (isMe) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-white btn-sm";
      editBtn.textContent = "Editar mi perfil";
      editBtn.addEventListener("click", () => {
        closeInspector();
        if (window.location.pathname.endsWith("cuenta.html")) {
          switchWorkspaceTab("profile");
        } else {
          window.location.href = "cuenta.html?tab=profile";
        }
      });
      actionsEl.appendChild(editBtn);
    } else {
      // Botón Seguir estilo TikTok
      const followBtn = document.createElement("button");
      followBtn.type = "button";
      const isFollowed = myFollowingSet.has(targetUid);
      followBtn.className = isFollowed ? "btn-tiktok-follow following" : "btn-tiktok-follow";
      followBtn.textContent = isFollowed ? "Siguiendo" : "+ Seguir";
      followBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, followBtn);
        triggerFluidPop(followBtn);
        if (!activeAuthUser) {
          signInAndEnterWorkspace("para-ti.html");
          return;
        }
        followBtn.disabled = true;
        const nextState = await cloudHooks.toggleFollowCreator?.(targetUid);
        followBtn.className = nextState ? "btn-tiktok-follow following" : "btn-tiktok-follow";
        followBtn.textContent = nextState ? "Siguiendo" : "+ Seguir";
        followBtn.disabled = false;
        renderInspectorContent(targetUid);
      });
      actionsEl.appendChild(followBtn);

      // Botón Mensaje directo cifrado
      const msgBtn = document.createElement("button");
      msgBtn.type = "button";
      msgBtn.className = "btn btn-ghost btn-sm";
      msgBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span>Mensaje</span>
      `;
      msgBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, msgBtn);
        closeInspector();
        if (window.location.pathname.endsWith("cuenta.html") && activeAuthUser) {
          switchWorkspaceTab("messages");
          cloudHooks.openChatWithPeer?.(targetUid);
        } else {
          window.location.href = `cuenta.html?chat=${encodeURIComponent(targetUid)}`;
        }
      });
      actionsEl.appendChild(msgBtn);

      if (activeAuthUser) {
        const conn = myConnectionsMap.get(targetUid);
        const connBtn = document.createElement("button");
        connBtn.type = "button";
        connBtn.className = "btn btn-ghost btn-sm";

        if (!conn) {
          connBtn.textContent = "+ Conectar";
          connBtn.addEventListener("click", async () => {
            connBtn.disabled = true;
            await cloudHooks.requestConnection?.(targetUid).catch(() => {});
            renderInspectorContent(targetUid);
          });
          actionsEl.appendChild(connBtn);
        } else if (conn.status === "accepted") {
          connBtn.textContent = "Conectado ✓";
          connBtn.disabled = true;
          actionsEl.appendChild(connBtn);
        } else if (conn.requesterUid !== activeAuthUser.uid) {
          connBtn.textContent = "Aceptar contacto";
          connBtn.addEventListener("click", async () => {
            connBtn.disabled = true;
            await cloudHooks.acceptConnection?.(targetUid).catch(() => {});
            renderInspectorContent(targetUid);
          });
          actionsEl.appendChild(connBtn);
        }

        const repBtn = document.createElement("button");
        repBtn.type = "button";
        repBtn.className = "text-action-btn";
        repBtn.textContent = "Reportar";
        repBtn.addEventListener("click", () => {
          closeInspector();
          if (window.location.pathname.endsWith("cuenta.html")) {
            switchWorkspaceTab("settings");
            const repInput = document.getElementById("reportTargetIdInput");
            if (repInput) {
              repInput.value = internalId;
              document.getElementById("reportReasonInput")?.focus();
            }
          } else {
            window.location.href = `cuenta.html?tab=settings&report=${encodeURIComponent(internalId)}`;
          }
        });
        actionsEl.appendChild(repBtn);
      }
    }
  }

  // 6. Configuración de pestañas tipo TikTok
  const tabPostsBtn = document.getElementById("inspTabPostsBtn");
  const tabPortfolioBtn = document.getElementById("inspTabPortfolioBtn");
  const tabReviewsBtn = document.getElementById("inspTabReviewsBtn");

  const panelPosts = document.getElementById("inspPanelPosts");
  const panelPortfolio = document.getElementById("inspPanelPortfolio");
  const panelReviews = document.getElementById("inspPanelReviews");

  const postsCounterEl = document.getElementById("inspTabPostsCounter");
  const reviewsCounterEl = document.getElementById("inspTabReviewsCounter");

  if (postsCounterEl) postsCounterEl.textContent = userPosts.length;
  if (reviewsCounterEl) reviewsCounterEl.textContent = stats.count;

  const activateTab = (tabName) => {
    if (tabPostsBtn) tabPostsBtn.classList.toggle("active", tabName === "posts");
    if (tabPortfolioBtn) tabPortfolioBtn.classList.toggle("active", tabName === "portfolio");
    if (tabReviewsBtn) tabReviewsBtn.classList.toggle("active", tabName === "reviews");

    if (panelPosts) panelPosts.hidden = tabName !== "posts";
    if (panelPortfolio) panelPortfolio.hidden = tabName !== "portfolio";
    if (panelReviews) panelReviews.hidden = tabName !== "reviews";
  };

  if (tabPostsBtn) {
    tabPostsBtn.onclick = (e) => {
      applyLiquidWaterRipple(e, tabPostsBtn);
      activateTab("posts");
    };
  }
  if (tabReviewsBtn) {
    tabReviewsBtn.onclick = (e) => {
      applyLiquidWaterRipple(e, tabReviewsBtn);
      activateTab("reviews");
    };
  }
  // Pestaña Portafolio desactivada como solicitó el usuario
  if (tabPortfolioBtn) {
    tabPortfolioBtn.onclick = (e) => {
      e.preventDefault();
    };
  }

  // Activar pestaña "posts" por defecto
  activateTab("posts");

  // 7. Renderizado del Feed de Publicaciones en Scroll tipo Facebook con Paginación Anti-Lag
  const streamEl = document.getElementById("inspUserPostsStream");
  const paginationWrap = document.getElementById("inspPostsPaginationWrap");
  const loadMoreBtn = document.getElementById("inspLoadMorePostsBtn");
  const postsCountMeta = document.getElementById("inspPostsCounter");
  const allLoadedEl = document.getElementById("inspPostsAllLoaded");
  const emptyPostsEl = document.getElementById("inspPostsEmpty");

  let currentPage = 1;
  const POSTS_PER_PAGE = 4;

  const renderPostsPage = (page) => {
    if (!streamEl) return;
    if (page === 1) streamEl.textContent = "";

    const visiblePosts = userPosts.slice(0, page * POSTS_PER_PAGE);

    if (userPosts.length === 0) {
      if (emptyPostsEl) emptyPostsEl.hidden = false;
      if (paginationWrap) paginationWrap.hidden = true;
      if (allLoadedEl) allLoadedEl.hidden = true;
      return;
    }

    if (emptyPostsEl) emptyPostsEl.hidden = true;

    // Renderizar solo los posts nuevos del lote actual
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const batch = userPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    batch.forEach((post) => {
      if (typeof buildRichSocialPostEl === "function") {
        const postNode = buildRichSocialPostEl(post, `insp_${targetUid}`);
        streamEl.appendChild(postNode);
      } else {
        // Fallback editorial ligero si Firebase aún inicializa
        const fallbackCard = document.createElement("article");
        fallbackCard.className = "feed-post-open";
        if (post.title) {
          const t = document.createElement("h3");
          t.className = "feed-post-title";
          t.textContent = post.title;
          fallbackCard.appendChild(t);
        }
        if (post.caption) {
          const c = document.createElement("p");
          c.className = "feed-post-caption";
          c.textContent = post.caption;
          fallbackCard.appendChild(c);
        }
        streamEl.appendChild(fallbackCard);
      }
    });

    if (visiblePosts.length < userPosts.length) {
      if (paginationWrap) paginationWrap.hidden = false;
      if (allLoadedEl) allLoadedEl.hidden = true;
      if (postsCountMeta) {
        postsCountMeta.textContent = `Mostrando ${visiblePosts.length} de ${userPosts.length} publicaciones`;
      }
    } else {
      if (paginationWrap) paginationWrap.hidden = true;
      if (allLoadedEl) allLoadedEl.hidden = false;
    }
  };

  if (loadMoreBtn) {
    loadMoreBtn.onclick = (e) => {
      applyLiquidWaterRipple(e, loadMoreBtn);
      triggerFluidPop(loadMoreBtn);
      currentPage++;
      renderPostsPage(currentPage);
    };
  }

  renderPostsPage(1);

  // 8. Reseñas y Calificaciones (panel de estrellas)
  const revForm = document.getElementById("inspReviewForm");
  if (revForm) {
    revForm.hidden = !activeAuthUser || activeAuthUser.uid === targetUid;
    const existingMine = stats.items.find((r) => r.reviewerUid === activeAuthUser?.uid);
    const commentInp = document.getElementById("inspReviewComment");
    if (existingMine) {
      selectedStarValue = existingMine.stars || 5;
      if (commentInp && !commentInp.value) commentInp.value = existingMine.comment || "";
    } else {
      selectedStarValue = 5;
    }
    starPickerEl?.querySelectorAll(".star-pick-btn").forEach((b) => {
      b.classList.toggle("lit", Number(b.dataset.star) <= selectedStarValue);
    });
  }

  const revListEl = document.getElementById("inspReviewsList");
  if (revListEl) {
    revListEl.textContent = "";
    if (stats.items.length === 0) {
      const empty = document.createElement("p");
      empty.style.fontSize = "0.86rem";
      empty.style.color = "var(--muted)";
      empty.textContent = "Todavía no tiene reseñas de trabajos terminados.";
      revListEl.appendChild(empty);
    } else {
      stats.items.forEach((r) => {
        const item = document.createElement("div");
        item.className = "review-open-item";
        const head = document.createElement("div");
        head.className = "mono";
        head.style.fontSize = "0.75rem";
        head.style.color = "var(--silver)";
        head.style.display = "flex";
        head.style.alignItems = "center";
        head.style.flexWrap = "wrap";
        head.style.gap = "8px";
        const starsStr = "★".repeat(r.stars || 5) + "☆".repeat(Math.max(0, 5 - (r.stars || 5)));
        const metaTxt = document.createElement("span");
        metaTxt.textContent = `${starsStr} · ${r.reviewerName || "Usuario"} (@${r.reviewerHandle || "miembro"})`;
        head.appendChild(metaTxt);
        if (isCreatorAccount("", r.reviewerUid)) {
          head.appendChild(createCreatorBadgeEl(true));
        }
        const dateTxt = document.createElement("span");
        dateTxt.textContent = `· ${formatDateEs(r.updatedAtMs)}`;
        head.appendChild(dateTxt);

        const txt = document.createElement("p");
        txt.style.fontSize = "0.9rem";
        txt.style.color = "var(--silver-bright)";
        txt.textContent = r.comment || "";

        item.appendChild(head);
        item.appendChild(txt);
        revListEl.appendChild(item);
      });
    }
  }

  inspectorBackdrop.hidden = false;
};

document.getElementById("inspReviewForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeAuthUser || !inspectedProfileUid || !cloudHooks.submitStarReview) return;
  const commentEl = document.getElementById("inspReviewComment");
  const comment = (commentEl?.value || "").trim();
  if (!comment) {
    commentEl?.focus();
    return;
  }
  const btn = document.getElementById("inspReviewSubmitBtn");
  if (btn) btn.disabled = true;
  await cloudHooks
    .submitStarReview({
      targetUid: inspectedProfileUid,
      stars: selectedStarValue,
      comment
    })
    .catch(() => {});
  if (btn) btn.disabled = false;
  const fb = document.getElementById("inspActionFeedback");
  if (fb) {
    fb.hidden = false;
    fb.textContent = `Valoración de ${selectedStarValue} estrellas guardada en el perfil ✓`;
  }
});

const openOwnProfileInspector = () => {
  if (activeAuthUser) {
    if (typeof closeDock === "function") closeDock();
    renderInspectorContent(activeAuthUser.uid);
  }
};

document.getElementById("previewOwnInspectorBtn")?.addEventListener("click", openOwnProfileInspector);
document.getElementById("sideViewProfileBtn")?.addEventListener("click", openOwnProfileInspector);
document.getElementById("dockViewProfileBtn")?.addEventListener("click", openOwnProfileInspector);
document.getElementById("dockProfileMainBtn")?.addEventListener("click", openOwnProfileInspector);
document.getElementById("studioSideAvatar")?.addEventListener("click", openOwnProfileInspector);
document.getElementById("studioSideName")?.addEventListener("click", openOwnProfileInspector);

// Constructor de fila de especialista para perfiles.html y networkExploreList
const createProfileDirectoryRow = (prof, signInCallback) => {
  const row = document.createElement("article");
  row.className = "profile-open-row";

  const internalId = prof.internalId || deriveInternalId(prof.uid);
  const isProfCreator = isCreatorAccount(internalId, prof.uid);
  const stats = getRatingStats(prof.uid);

  const left = document.createElement("div");
  left.className = "profile-identity";

  const avatar = document.createElement("img");
  avatar.className = isProfCreator
    ? "profile-avatar-lg creator-avatar-ring"
    : "profile-avatar-lg";
  avatar.src = prof.photoURL || "favicon.svg";
  avatar.alt = prof.displayName || "Especialista";
  avatar.onerror = () => {
    avatar.src = "favicon.svg";
  };
  avatar.addEventListener("click", () => renderInspectorContent(prof.uid));

  const meta = document.createElement("div");
  meta.className = "profile-meta-stack";

  const nameLine = document.createElement("div");
  nameLine.className = "profile-name-line";
  const h3 = document.createElement("h3");
  h3.textContent = prof.displayName || "Especialista";
  h3.addEventListener("click", () => renderInspectorContent(prof.uid));

  const handleSpan = document.createElement("span");
  handleSpan.className = "profile-handle mono";
  handleSpan.textContent = `@${prof.handle || "usuario"}`;

  const idSpan = document.createElement("span");
  idSpan.className = "id-tag-mono mono";
  idSpan.textContent = internalId;
  idSpan.title = "Copiar ID interno";
  idSpan.addEventListener("click", () => copyTextWithFeedback(internalId, idSpan));

  nameLine.appendChild(h3);
  if (isProfCreator) {
    nameLine.appendChild(createCreatorBadgeEl(false));
  }
  nameLine.appendChild(handleSpan);
  if (isAdminUser(activeAuthUser)) {
    nameLine.appendChild(idSpan);
  }

  const roleLine = document.createElement("div");
  roleLine.className = "profile-role-line";
  const roleSpan = document.createElement("span");
  roleSpan.className = "profile-role";
  roleSpan.textContent = prof.role || CATEGORY_LABELS[prof.category] || "Especialista digital";

  const sitSpan = document.createElement("span");
  sitSpan.className = "profile-situation-tag mono";
  sitSpan.textContent = SITUATION_LABELS[prof.workSituation] || "Disponible para proyectos";

  roleLine.appendChild(roleSpan);
  roleLine.appendChild(sitSpan);

  const starsLine = document.createElement("div");
  starsLine.className = "stars-inline mono";
  starsLine.textContent = formatStarsText(stats.avg, stats.count);

  meta.appendChild(nameLine);
  meta.appendChild(roleLine);
  meta.appendChild(starsLine);

  const skillsArr = parseSkillsList(prof.skills);
  if (skillsArr.length > 0) {
    const skillsWrap = document.createElement("div");
    skillsWrap.className = "skills-tags-line mono";
    renderSkillTagsInto(skillsWrap, skillsArr);
    meta.appendChild(skillsWrap);
  }

  if (prof.bio) {
    const bioP = document.createElement("p");
    bioP.className = "profile-bio";
    bioP.textContent = prof.bio;
    meta.appendChild(bioP);
  }

  // Miniaturas de fotos subidas por este especialista
  const photoPosts = allPostsList.filter((p) => p.authorUid === prof.uid && p.photoUrl).slice(0, 4);
  if (photoPosts.length > 0) {
    const shotsRow = document.createElement("div");
    shotsRow.className = "profile-mini-shots";
    photoPosts.forEach((p) => {
      const thumb = document.createElement("img");
      thumb.className = "mini-shot-img";
      thumb.src = p.photoUrl;
      thumb.alt = p.caption || "Portafolio";
      thumb.addEventListener("click", () => openPhotoLightbox(p, signInCallback));
      shotsRow.appendChild(thumb);
    });
    meta.appendChild(shotsRow);
  }

  left.appendChild(avatar);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "profile-cta-col";

  const statusTag = document.createElement("span");
  statusTag.className = "work-status-inline mono";
  const dot = document.createElement("span");
  const isAvail = prof.availableForWork !== false && prof.workSituation !== "employed_open";
  dot.className = isAvail ? "work-dot" : "work-dot muted-dot";
  const statusLabel = document.createElement("span");
  statusLabel.textContent =
    prof.workSituation === "seeking_job"
      ? "Buscando empleo"
      : prof.workSituation === "hiring"
        ? "Contratando talento"
        : isAvail
          ? "Disponible ahora"
          : "Miembro activo";
  statusTag.appendChild(dot);
  statusTag.appendChild(statusLabel);
  right.appendChild(statusTag);

  const viewPortBtn = document.createElement("button");
  viewPortBtn.type = "button";
  viewPortBtn.className = "text-action-btn";
  viewPortBtn.textContent = "Ver portafolio y ★ reseñas";
  viewPortBtn.addEventListener("click", () => renderInspectorContent(prof.uid));
  right.appendChild(viewPortBtn);

  const isMe = activeAuthUser && prof.uid === activeAuthUser.uid;
  if (!isMe) {
    const chatBtn = document.createElement("button");
    chatBtn.type = "button";
    chatBtn.className = "btn btn-white btn-sm";
    chatBtn.textContent = "Contactar / Trabajo →";
    chatBtn.addEventListener("click", () => {
      if (window.location.pathname.endsWith("cuenta.html") && activeAuthUser) {
        switchWorkspaceTab("messages");
        cloudHooks.openChatWithPeer?.(prof.uid);
      } else {
        signInCallback(`cuenta.html?chat=${encodeURIComponent(prof.uid)}`);
      }
    });
    right.appendChild(chatBtn);
  }

  row.appendChild(left);
  row.appendChild(right);
  return row;
};

/* =========================================================
   7. CONFIGURACIÓN DE PERFIL, MURO Y NUBE PRIVADA (CUENTA.HTML)
   ========================================================= */
const profileEditForm = document.getElementById("profileEditForm");
const profileDisplayNameEl = document.getElementById("profileDisplayName");
const profileHandleEl = document.getElementById("profileHandle");
const profileCategoryEl = document.getElementById("profileCategory");
const profileWorkSituationEl = document.getElementById("profileWorkSituation");
const profileRoleEl = document.getElementById("profileRole");
const profileSkillsEl = document.getElementById("profileSkills");
const profileBioEl = document.getElementById("profileBio");
const profilePublicBtn = document.getElementById("profilePublicBtn");
const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");
const profilePreviewName = document.getElementById("profilePreviewName");
const profilePreviewHandle = document.getElementById("profilePreviewHandle");
const profilePreviewRole = document.getElementById("profilePreviewRole");
const profilePreviewSituation = document.getElementById("profilePreviewSituation");
const profilePreviewInternalId = document.getElementById("profilePreviewInternalId");
const profilePreviewSkills = document.getElementById("profilePreviewSkills");
const profileSaveFeedback = document.getElementById("profileSaveFeedback");
const studioPresenceSelect = document.getElementById("studioPresenceSelect");

const syncProfilePreview = () => {
  if (profilePreviewName && profileDisplayNameEl) {
    profilePreviewName.textContent = profileDisplayNameEl.value.trim() || "Tu nombre";
  }
  if (profilePreviewHandle && profileHandleEl) {
    profilePreviewHandle.textContent = `@${sanitizeHandle(profileHandleEl.value, activeAuthUser?.displayName)}`;
  }
  if (profilePreviewRole) {
    const customRole = profileRoleEl?.value.trim();
    const cat = profileCategoryEl?.value || "video";
    profilePreviewRole.textContent = customRole || CATEGORY_LABELS[cat] || "Especialista digital";
  }
  if (profilePreviewSituation && profileWorkSituationEl) {
    profilePreviewSituation.textContent =
      SITUATION_LABELS[profileWorkSituationEl.value] || "Disponible para proyectos";
  }
  if (profilePreviewInternalId && activeAuthUser) {
    const idCode = currentOwnProfile?.internalId || deriveInternalId(activeAuthUser.uid);
    const iAmCreator = isCreatorAccount(idCode, activeAuthUser.uid);
    const canSeeId = isAdminUser(activeAuthUser);
    profilePreviewInternalId.hidden = !canSeeId;
    if (canSeeId) {
      profilePreviewInternalId.textContent = `ID: ${idCode}`;
      profilePreviewInternalId.onclick = () => copyTextWithFeedback(idCode, profilePreviewInternalId);
    }
    mountCreatorBadgeSlot(document.getElementById("previewCreatorSlot"), iAmCreator, false);
    if (profilePreviewAvatar) {
      profilePreviewAvatar.classList.toggle("creator-avatar-ring", iAmCreator);
    }
  }
  if (profilePreviewSkills && profileSkillsEl) {
    renderSkillTagsInto(profilePreviewSkills, profileSkillsEl.value);
  }
  if (profilePreviewAvatar && activeAuthUser?.photoURL) {
    profilePreviewAvatar.src = activeAuthUser.photoURL;
    profilePreviewAvatar.onerror = () => {
      profilePreviewAvatar.src = "favicon.svg";
    };
  }
};

const populateProfileForm = (prof) => {
  if (!prof) return;
  if (profileDisplayNameEl) profileDisplayNameEl.value = prof.displayName || "";
  if (profileHandleEl) profileHandleEl.value = prof.handle || "";
  if (profileCategoryEl && prof.category) profileCategoryEl.value = prof.category;
  if (profileWorkSituationEl && prof.workSituation) profileWorkSituationEl.value = prof.workSituation;
  if (profileRoleEl) profileRoleEl.value = prof.role || "";
  if (profileSkillsEl) {
    profileSkillsEl.value = Array.isArray(prof.skills) ? prof.skills.join(", ") : prof.skills || "";
  }
  if (profileBioEl) profileBioEl.value = prof.bio || "";
  const ghInp = document.getElementById("profileGitHubUser");
  if (ghInp) {
    ghInp.value = prof.developerProfile?.gitHubUsername || "";
  }
  if (profilePublicBtn) {
    const pub = prof.isPublic !== false;
    profilePublicBtn.dataset.active = String(pub);
    profilePublicBtn.textContent = pub ? "PÚBLICO" : "PRIVADO";
  }
  if (studioPresenceSelect && prof.workSituation) {
    studioPresenceSelect.value = prof.workSituation;
  }
  syncProfilePreview();
};

[profileDisplayNameEl, profileHandleEl, profileCategoryEl, profileWorkSituationEl, profileRoleEl, profileSkillsEl].forEach(
  (el) => {
    el?.addEventListener("input", syncProfilePreview);
    el?.addEventListener("change", syncProfilePreview);
  }
);

profilePublicBtn?.addEventListener("click", () => {
  const next = profilePublicBtn.dataset.active !== "true";
  profilePublicBtn.dataset.active = String(next);
  profilePublicBtn.textContent = next ? "PÚBLICO" : "PRIVADO";
});

studioPresenceSelect?.addEventListener("change", async () => {
  const sit = studioPresenceSelect.value || "freelance_ready";
  if (profileWorkSituationEl) profileWorkSituationEl.value = sit;
  syncProfilePreview();
  if (cloudHooks.saveSituationQuick) {
    await cloudHooks.saveSituationQuick(sit).catch(() => {});
  }
});

const verifyGitHubBtn = document.getElementById("verifyGitHubBtn");
const profileGitHubFeedback = document.getElementById("profileGitHubFeedback");
const profileGitHubUser = document.getElementById("profileGitHubUser");

verifyGitHubBtn?.addEventListener("click", async () => {
  const ghUser = (profileGitHubUser?.value || "").trim().replace(/^@/, "");
  if (!ghUser) {
    if (profileGitHubFeedback) {
      profileGitHubFeedback.textContent = "Ingresa tu usuario de GitHub para verificar.";
      profileGitHubFeedback.style.color = "var(--silver)";
    }
    return;
  }
  verifyGitHubBtn.disabled = true;
  if (profileGitHubFeedback) {
    profileGitHubFeedback.textContent = "Consultando GitHub API pública...";
    profileGitHubFeedback.style.color = "var(--silver)";
  }
  try {
    const stats = await fetchGitHubDeveloperStats(ghUser);
    if (profileGitHubFeedback) {
      profileGitHubFeedback.textContent = `✓ Conectado: @${stats.username} (${stats.publicRepos} repositorios, ${stats.followers} seguidores).`;
      profileGitHubFeedback.style.color = "var(--gold)";
    }
  } catch (err) {
    if (profileGitHubFeedback) {
      profileGitHubFeedback.textContent = err?.message || "No se pudo validar el usuario de GitHub.";
      profileGitHubFeedback.style.color = "var(--silver)";
    }
  } finally {
    verifyGitHubBtn.disabled = false;
  }
});

profileEditForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeAuthUser || !cloudHooks.saveProfile) return;

  const displayName = (profileDisplayNameEl?.value || "").trim() || activeAuthUser.displayName || "Especialista";
  const handle = sanitizeHandle(profileHandleEl?.value, displayName);
  const category = profileCategoryEl?.value || "video";
  const workSituation = profileWorkSituationEl?.value || "freelance_ready";
  const role = (profileRoleEl?.value || "").trim() || CATEGORY_LABELS[category];
  const skills = parseSkillsList(profileSkillsEl?.value || "");
  const bio = (profileBioEl?.value || "").trim();
  const isPublic = profilePublicBtn?.dataset.active !== "false";
  const availableForWork = workSituation === "seeking_job" || workSituation === "freelance_ready";

  const ghUser = (profileGitHubUser?.value || "").trim().replace(/^@/, "");
  let developerProfile = currentOwnProfile?.developerProfile || null;
  if (ghUser) {
    try {
      const stats = await fetchGitHubDeveloperStats(ghUser);
      developerProfile = {
        gitHubUsername: ghUser,
        verified: true,
        publicRepos: stats.publicRepos,
        followers: stats.followers,
        totalStars: stats.totalStars,
        avatarUrl: stats.avatarUrl,
        topLanguages: stats.topLanguages,
        htmlUrl: stats.htmlUrl,
        lastVerifiedAt: Date.now()
      };
    } catch {
      developerProfile = {
        gitHubUsername: ghUser,
        verified: false,
        lastVerifiedAt: Date.now()
      };
    }
  } else {
    developerProfile = null;
  }

  const saveBtn = document.getElementById("profileSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  await cloudHooks.saveProfile({
    displayName,
    handle,
    category,
    workSituation,
    role,
    skills,
    bio,
    availableForWork,
    isPublic,
    developerProfile,
    onboardingDone: true
  });

  if (profileHandleEl) profileHandleEl.value = handle;
  syncProfilePreview();
  renderAccountWorkspace();
  if (saveBtn) saveBtn.disabled = false;

  if (profileSaveFeedback) {
    profileSaveFeedback.hidden = false;
    profileSaveFeedback.textContent = "Perfil profesional sincronizado en la nube ✓";
  }
});

// Renderizado general del estado de sesión y bloqueo por baneo
const renderAccountWorkspace = () => {
  const authGateEl = document.getElementById("accountAuthGate");
  const bannedGateEl = document.getElementById("bannedAccountGate");
  const workspaceEl = document.getElementById("authenticatedWorkspace");

  const effectiveUser = activeAuthUser || cachedAuthSession;
  const isBanned = Boolean(activeAuthUser && bannedUsersMap.has(activeAuthUser.uid));

  if (authGateEl && workspaceEl) {
    if (!effectiveUser) {
      authGateEl.hidden = false;
      if (bannedGateEl) bannedGateEl.hidden = true;
      workspaceEl.hidden = true;
    } else if (isBanned) {
      authGateEl.hidden = true;
      workspaceEl.hidden = true;
      if (bannedGateEl) {
        bannedGateEl.hidden = false;
        const banInfo = bannedUsersMap.get(activeAuthUser.uid);
        const reasonEl = document.getElementById("bannedAccountReason");
        const badgeEl = document.getElementById("bannedInternalIdBadge");
        const myId = deriveInternalId(activeAuthUser.uid);
        if (badgeEl) badgeEl.textContent = `ID BLOQUEADO: ${myId}`;
        if (reasonEl && banInfo?.reason) {
          reasonEl.textContent = `Cuenta suspendida por seguridad. Motivo registrado: ${banInfo.reason}`;
        }
      }
    } else {
      authGateEl.hidden = true;
      if (bannedGateEl) bannedGateEl.hidden = true;
      workspaceEl.hidden = false;
    }
  }

  if (effectiveUser) {
    const myId = currentOwnProfile?.internalId || effectiveUser.internalId || deriveInternalId(effectiveUser.uid);
    const iAmCreator = isCreatorAccount(myId, effectiveUser.uid);
    const myStats = getRatingStats(effectiveUser.uid);

    const sideAvatar = document.getElementById("studioSideAvatar");
    const sideName = document.getElementById("studioSideName");
    const sideCreatorSlot = document.getElementById("studioCreatorSlot");
    const sideHandle = document.getElementById("studioSideHandle");
    const sideIdBadge = document.getElementById("studioSideIdBadge");
    const sideStars = document.getElementById("studioSideStars");
    const settingsId = document.getElementById("settingsInternalId");
    const userStatusEl = document.getElementById("accountUserStatus");
    const userSubEl = document.getElementById("accountUserSub");

    if (sideAvatar) {
      const srcUrl = currentOwnProfile?.photoURL || effectiveUser.photoURL || "favicon.svg";
      sideAvatar.src = srcUrl;
      sideAvatar.classList.toggle("creator-avatar-ring", iAmCreator);
      sideAvatar.onerror = () => {
        sideAvatar.src = "favicon.svg";
      };
    }
    if (sideName) {
      sideName.textContent = currentOwnProfile?.displayName || effectiveUser.displayName || "Mi cuenta";
    }
    const myTier = isCreatorAccount(myId, effectiveUser.uid) ? "creator" : (currentOwnProfile?.membershipTier || effectiveUser.membershipTier || "standard");
    mountCreatorBadgeSlot(sideCreatorSlot, iAmCreator, myTier);
    if (sideHandle) {
      sideHandle.textContent = `@${currentOwnProfile?.handle || sanitizeHandle(effectiveUser.email?.split("@")[0] || "usuario")}`;
    }
    if (sideIdBadge) {
      sideIdBadge.textContent = `ID: ${myId}`;
      sideIdBadge.onclick = () => copyTextWithFeedback(myId, sideIdBadge);
    }
    if (settingsId) {
      settingsId.textContent = myId;
      settingsId.onclick = () => copyTextWithFeedback(myId, settingsId);
    }
    if (sideStars) {
      sideStars.textContent = myStats.count > 0 ? `★ ${myStats.avg.toFixed(1)} (${myStats.count})` : "★ Nuevo";
    }
    const sideConduct = document.getElementById("studioSideConduct");
    const myConductScore = typeof currentOwnProfile?.behaviorScore === "number" ? currentOwnProfile.behaviorScore : 10;
    if (sideConduct) {
      sideConduct.textContent = `Conducta: ${myConductScore}/10 · ${getConductLabel(myConductScore)}`;
      sideConduct.className = `conduct-pill mono score-${myConductScore <= 3 ? "bad" : myConductScore <= 7 ? "warn" : "good"}`;
    }
    if (userStatusEl) {
      userStatusEl.textContent = effectiveUser.displayName || effectiveUser.email || "Conectado";
    }
    if (userSubEl) {
      userSubEl.textContent = effectiveUser.email || "OAuth 2.0 activo.";
    }

    // Mostrar panel de moderación exclusivamente al creador / propietario
    const adminPanel = document.getElementById("adminModerationPanel");
    if (adminPanel) {
      adminPanel.hidden = !isAdminUser(effectiveUser);
    }
  }

  // Estado de PhotoStun
  const hubStateEl = document.getElementById("hubPhotostunState");
  const hubPriorityBtn = document.getElementById("hubPhotostunPriorityBtn");
  const waitlist = readJson(STORAGE_KEYS.WAITLIST, null);
  if (hubPriorityBtn) {
    if (waitlist?.email || currentOwnProfile?.photostunPriority) {
      if (hubStateEl) hubStateEl.textContent = "Acceso prioritario vinculado";
      hubPriorityBtn.textContent = "Acceso prioritario activo ✓";
      hubPriorityBtn.disabled = true;
    } else {
      if (hubStateEl) hubStateEl.textContent = "Cuenta sincronizada";
      hubPriorityBtn.textContent = "Activar acceso prioritario";
      hubPriorityBtn.disabled = false;
    }
  }
};

document.getElementById("hubPhotostunPriorityBtn")?.addEventListener("click", async () => {
  if (!activeAuthUser) return;
  const record = {
    email: activeAuthUser.email || "",
    priority: "Activado desde perfil profesional",
    uid: activeAuthUser.uid,
    createdAtIso: new Date().toISOString()
  };
  writeJson(STORAGE_KEYS.WAITLIST, record);
  if (cloudHooks.saveWaitlist) {
    await cloudHooks.saveWaitlist(record).catch(() => {});
  }
  renderAccountWorkspace();
});

// Exportar respaldo completo JSON
document.getElementById("exportAccountJsonBtn")?.addEventListener("click", () => {
  const handle = sanitizeHandle(currentOwnProfile?.handle, activeAuthUser?.displayName || "xuanii");
  const myPosts = allPostsList.filter((p) => p.authorUid === activeAuthUser?.uid);
  const payload = {
    exportedAt: new Date().toISOString(),
    internalId: activeAuthUser ? deriveInternalId(activeAuthUser.uid) : null,
    profile: currentOwnProfile || null,
    ratingsReceived: activeAuthUser ? getRatingStats(activeAuthUser.uid) : null,
    portfolioPosts: myPosts.map(({ id, kind, caption, createdAtMs }) => ({ id, kind, caption, createdAtMs })),
    privateVaultItems: currentVaultItems.map(({ id, type, title, content, sizeBytes, createdAtMs }) => ({
      id,
      type,
      title,
      content: content || "",
      sizeBytes,
      createdAtMs
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xuanii-respaldo-${handle}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
});

// Baúl privado de archivos y notas (Nube Privada)
const cloudVaultListEl = document.getElementById("cloudVaultList");
const vaultViewerBox = document.getElementById("vaultViewerBox");
const vaultFeedbackEl = document.getElementById("vaultFeedback");
let activeViewedItemId = null;

const showVaultFeedback = (msg) => {
  if (!vaultFeedbackEl) return;
  vaultFeedbackEl.hidden = false;
  vaultFeedbackEl.textContent = msg;
};

document.getElementById("closeVaultViewerBtn")?.addEventListener("click", () => {
  activeViewedItemId = null;
  if (vaultViewerBox) vaultViewerBox.hidden = true;
});

const renderCloudVaultList = () => {
  const badgeFiles = document.getElementById("badgeFilesCount");
  if (badgeFiles) badgeFiles.textContent = String(currentVaultItems.length);
  if (!cloudVaultListEl) return;
  cloudVaultListEl.textContent = "";

  if (currentVaultItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arch-col";
    const idx = document.createElement("span");
    idx.className = "col-index mono";
    idx.textContent = "NUBE PRIVADA";
    const p = document.createElement("p");
    p.textContent = "Guarda aquí contratos, referencias o imágenes privadas que solo tú podrás abrir.";
    empty.appendChild(idx);
    empty.appendChild(p);
    cloudVaultListEl.appendChild(empty);
    return;
  }

  currentVaultItems.forEach((item) => {
    const row = document.createElement("article");
    row.className = "vault-item-row";

    const main = document.createElement("div");
    main.className = "vault-item-main";
    if (item.type === "image" && item.dataUrl) {
      const thumb = document.createElement("img");
      thumb.className = "vault-thumb";
      thumb.src = item.dataUrl;
      thumb.alt = "";
      main.appendChild(thumb);
    }

    const col = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "vault-type-tag mono";
    tag.textContent = `${(item.type || "nota").toUpperCase()} · ${formatBytes(item.sizeBytes)} · ${formatDateEs(item.createdAtMs)}`;
    const title = document.createElement("h3");
    title.className = "vault-title";
    title.textContent = item.title || "Sin título";
    col.appendChild(tag);
    col.appendChild(title);
    if (item.content) {
      const snip = document.createElement("p");
      snip.className = "vault-snippet";
      snip.textContent = item.content.slice(0, 140);
      col.appendChild(snip);
    }
    main.appendChild(col);

    const actions = document.createElement("div");
    actions.className = "vault-actions";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "text-action-btn";
    viewBtn.textContent = "Ver";
    viewBtn.addEventListener("click", () => {
      if (!vaultViewerBox) return;
      activeViewedItemId = item.id;
      vaultViewerBox.hidden = false;
      const tEl = document.getElementById("vaultViewerTitle");
      const iEl = document.getElementById("vaultViewerImg");
      const pEl = document.getElementById("vaultViewerText");
      if (tEl) tEl.textContent = item.title || "";
      if (item.type === "image" && item.dataUrl) {
        if (iEl) {
          iEl.src = item.dataUrl;
          iEl.hidden = false;
        }
        if (pEl) pEl.textContent = "";
      } else {
        if (iEl) iEl.hidden = true;
        if (pEl) pEl.textContent = item.content || "Archivo privado almacenado.";
      }
    });

    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "text-action-btn";
    dlBtn.textContent = "Descargar";
    dlBtn.addEventListener("click", () => {
      const a = document.createElement("a");
      if (item.dataUrl) {
        a.href = item.dataUrl;
        a.download = item.title || "archivo";
        a.click();
      } else {
        const blob = new Blob([item.content || ""], { type: "text/plain;charset=utf-8" });
        const u = URL.createObjectURL(blob);
        a.href = u;
        a.download = `${(item.title || "nota").replace(/[^a-zA-Z0-9-_ ]/g, "") || "nota"}.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 1200);
      }
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "text-action-btn";
    delBtn.textContent = "Eliminar";
    delBtn.addEventListener("click", async () => {
      if (activeViewedItemId === item.id && vaultViewerBox) vaultViewerBox.hidden = true;
      await cloudHooks.deleteVaultItem?.(item.id).catch(() => {});
    });

    actions.appendChild(viewBtn);
    actions.appendChild(dlBtn);
    actions.appendChild(delBtn);

    row.appendChild(main);
    row.appendChild(actions);
    cloudVaultListEl.appendChild(row);
  });
};

document.getElementById("cloudNoteForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeAuthUser || !cloudHooks.createVaultItem) return;
  const titleEl = document.getElementById("newNoteTitle");
  const bodyEl = document.getElementById("newNoteBody");
  const title = (titleEl?.value || "").trim();
  const content = (bodyEl?.value || "").trim();
  if (!title || !content) return;

  const btn = document.getElementById("saveCloudNoteBtn");
  if (btn) btn.disabled = true;
  await cloudHooks
    .createVaultItem({
      type: "note",
      title,
      content,
      sizeBytes: new Blob([content]).size,
      createdAtMs: Date.now()
    })
    .catch(() => {});
  if (titleEl) titleEl.value = "";
  if (bodyEl) bodyEl.value = "";
  if (btn) btn.disabled = false;
  showVaultFeedback("Nota guardada en tu nube privada ✓");
});

document.getElementById("triggerCloudUploadBtn")?.addEventListener("click", () => {
  document.getElementById("cloudFileUploadInput")?.click();
});

document.getElementById("cloudFileUploadInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file || !activeAuthUser || !cloudHooks.createVaultItem) return;

  try {
    if (file.type.startsWith("image/")) {
      let dataUrl = await compressImageDataUrl(file, 1400, 0.8);
      if (dataUrl.length > 760000) dataUrl = await compressImageDataUrl(file, 1024, 0.68);
      await cloudHooks.createVaultItem({
        type: "image",
        title: file.name,
        dataUrl,
        sizeBytes: Math.round((dataUrl.length * 3) / 4),
        createdAtMs: Date.now()
      });
      showVaultFeedback(`Imagen «${file.name}» respaldada en tu nube ✓`);
    } else {
      if (file.size > 650 * 1024) {
        showVaultFeedback("El límite para documentos que no son imágenes es 650 KB.");
        return;
      }
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || ""));
        r.onerror = () => rej(new Error("Error"));
        r.readAsDataURL(file);
      });
      const textPreview = file.type.startsWith("text/") ? (await file.text().catch(() => "")).slice(0, 2500) : "";
      await cloudHooks.createVaultItem({
        type: "file",
        title: file.name,
        dataUrl,
        content: textPreview,
        sizeBytes: file.size,
        createdAtMs: Date.now()
      });
      showVaultFeedback(`Archivo «${file.name}» guardado en tu nube ✓`);
    }
  } catch {
    showVaultFeedback("No se pudo subir el archivo.");
  }
});

/* =========================================================
   8. FIREBASE AUTH + CLOUD FIRESTORE (RED SOCIAL COMPLETA)
   ========================================================= */
const activeUsersEl = document.getElementById("activeUsersCount");
const homeRegisteredCountEl = document.getElementById("homeRegisteredCount");
const navSignInBtn = document.getElementById("navGoogleSignInBtn");
const heroSignInBtn = document.getElementById("heroGoogleSignInBtn");
const accountSignInBtn = document.getElementById("accountSignInBtn");
const heroAuthBtnLabel = document.getElementById("heroAuthBtnLabel");
const navUserChip = document.getElementById("navUserChip");
const navUserAvatar = document.getElementById("navUserAvatar");
const navUserName = document.getElementById("navUserName");

const authSetupModal = document.getElementById("authSetupModal");
const closeSetupModal = () => {
  if (authSetupModal) authSetupModal.hidden = true;
};
document.getElementById("closeAuthModalBtn")?.addEventListener("click", closeSetupModal);
document.getElementById("closeAuthModalAction")?.addEventListener("click", closeSetupModal);
authSetupModal?.addEventListener("click", (e) => {
  if (e.target === authSetupModal) closeSetupModal();
});

if (cachedAuthSession) {
  if (navSignInBtn) navSignInBtn.hidden = true;
  if (navUserChip) navUserChip.hidden = false;
  if (navUserAvatar) {
    navUserAvatar.src = cachedAuthSession.photoURL || "favicon.svg";
    const isCreator = isCreatorAccount(cachedAuthSession.internalId, cachedAuthSession.uid);
    navUserAvatar.classList.toggle("creator-avatar-ring", isCreator);
    navUserAvatar.classList.toggle("pro-avatar-ring", cachedAuthSession.membershipTier === "pro");
    navUserAvatar.classList.toggle("plus-avatar-ring", cachedAuthSession.membershipTier === "plus");
  }
  if (navUserName) {
    navUserName.textContent = (cachedAuthSession.displayName || "Perfil").split(" ")[0];
  }
  const dockHandleEl = document.getElementById("dockUserHandle");
  if (dockHandleEl) {
    dockHandleEl.textContent = `@${cachedAuthSession.handle || "usuario"}`;
  }
  const dockCreatorSlot = document.getElementById("dockCreatorSlot");
  if (dockCreatorSlot) {
    const isCreator = isCreatorAccount(cachedAuthSession.internalId, cachedAuthSession.uid);
    mountCreatorBadgeSlot(dockCreatorSlot, isCreator, true, cachedAuthSession.membershipTier);
  }
  const dockBadge = document.getElementById("dockInternalIdBadge");
  if (dockBadge && cachedAuthSession.internalId) {
    dockBadge.textContent = `ID: ${cachedAuthSession.internalId}`;
  }

  const fyGuest = document.getElementById("forYouGuestBar");
  const fyComposer = document.getElementById("forYouComposerWrap");
  if (fyGuest) fyGuest.hidden = true;
  if (fyComposer) fyComposer.hidden = false;
}

prefillKnownUserFields();
renderAccountWorkspace();
renderCloudVaultList();
initAppDockAndNavigation();

const fbCfg = window.XUANII_FIREBASE_CONFIG || {};
const isFirebaseConfigured = Boolean(fbCfg.apiKey && fbCfg.projectId);

if (isFirebaseConfigured) {
  (async () => {
    const [
      { initializeApp },
      { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged },
      {
        getFirestore,
        doc,
        getDoc,
        setDoc,
        addDoc,
        updateDoc,
        deleteDoc,
        collection,
        query,
        where,
        orderBy,
        onSnapshot,
        arrayUnion,
        arrayRemove,
        increment,
        serverTimestamp
      }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js")
    ]);

    const app = initializeApp(fbCfg);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    // Hooks hacia Cloud Firestore
    cloudHooks.saveSubmission = (entry) =>
      addDoc(collection(db, "messages"), { ...entry, createdAt: serverTimestamp() });

    cloudHooks.saveWaitlist = async (record) => {
      await addDoc(collection(db, "photostun_waitlist"), { ...record, createdAt: serverTimestamp() });
      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { photostunPriority: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    };

    cloudHooks.createVaultItem = (itemData) => {
      if (!auth.currentUser) return Promise.reject(new Error("Sin sesión"));
      return addDoc(collection(db, "users", auth.currentUser.uid, "projects"), {
        ...itemData,
        createdAt: serverTimestamp()
      });
    };

    cloudHooks.deleteVaultItem = (itemId) => {
      if (!auth.currentUser || !itemId) return Promise.resolve();
      return deleteDoc(doc(db, "users", auth.currentUser.uid, "projects", itemId));
    };

    cloudHooks.saveProfile = async (fields) => {
      const user = auth.currentUser;
      if (!user) return;
      const internalId = deriveInternalId(user.uid);
      const isCreator = isCreatorAccount(internalId, user.uid);
      const payload = {
        uid: user.uid,
        internalId,
        displayName: String(fields.displayName || user.displayName || "Especialista").slice(0, 80),
        handle: sanitizeHandle(fields.handle, user.displayName),
        category: fields.category || "video",
        workSituation: fields.workSituation || "freelance_ready",
        role: String(fields.role || CATEGORY_LABELS[fields.category] || "Especialista digital").slice(0, 80),
        skills: Array.isArray(fields.skills) ? fields.skills : [],
        bio: String(fields.bio || "").slice(0, 700),
        photoURL: user.photoURL || "",
        availableForWork: fields.availableForWork !== false,
        isPublic: fields.isPublic !== false,
        onboardingDone: Boolean(fields.onboardingDone),
        membershipTier: isCreator ? "creator" : (fields.membershipTier || currentOwnProfile?.membershipTier || "standard"),
        ...(fields.developerProfile ? { developerProfile: fields.developerProfile } : {}),
        ...(myCryptoKeys?.publicKeyJwk ? { publicKeyJwk: myCryptoKeys.publicKeyJwk } : {}),
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
      currentOwnProfile = { ...(currentOwnProfile || {}), ...payload };
    };

    cloudHooks.updateMembershipTier = async (targetTier) => {
      const user = auth.currentUser;
      if (!user) return;
      const isCreator = isCreatorAccount("", user.uid);
      const tier = isCreator ? "creator" : (["pro", "plus", "standard"].includes(targetTier) ? targetTier : "standard");
      await setDoc(
        doc(db, "profiles", user.uid),
        { membershipTier: tier, updatedAtMs: Date.now() },
        { merge: true }
      );
      if (currentOwnProfile) currentOwnProfile.membershipTier = tier;
      renderAccountWorkspace();
      renderAllProfileViews();
      renderFeedAndOwnPortfolio();
    };

    cloudHooks.saveSituationQuick = async (sit) => {
      const user = auth.currentUser;
      if (!user) return;
      const availableForWork = sit === "seeking_job" || sit === "freelance_ready";
      const displayName = String(currentOwnProfile?.displayName || user.displayName || "Especialista").slice(0, 80);
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          displayName,
          workSituation: sit,
          availableForWork,
          updatedAtMs: Date.now(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      currentOwnProfile = { ...(currentOwnProfile || {}), workSituation: sit, availableForWork };
    };

    cloudHooks.publishPost = async ({ kind, caption, photoUrl, mediaType = "none", videoUrl = "", codeSnippet = null }) => {
      const user = auth.currentUser;
      if (!user) return;
      const prof = currentOwnProfile || {};
      const internalId = prof.internalId || deriveInternalId(user.uid);
      const isCreator = isCreatorAccount(internalId, user.uid);
      const membershipTier = isCreator ? "creator" : (prof.membershipTier || "standard");

      let resolvedMediaType = mediaType;
      if (photoUrl) resolvedMediaType = "photo";
      else if (videoUrl) resolvedMediaType = "video";
      else if (codeSnippet && codeSnippet.code) resolvedMediaType = "code";

      await addDoc(collection(db, "posts"), {
        authorUid: user.uid,
        authorInternalId: internalId,
        authorName: prof.displayName || user.displayName || "Especialista",
        authorHandle: prof.handle || sanitizeHandle(user.email?.split("@")[0]),
        authorAvatar: prof.photoURL || user.photoURL || "",
        authorRole: prof.role || CATEGORY_LABELS[prof.category] || "Especialista digital",
        authorCategory: prof.category || "video",
        membershipTier,
        kind: kind || "portfolio",
        caption: String(caption || "").slice(0, 2800),
        mediaType: resolvedMediaType,
        photoUrl: photoUrl || "",
        videoUrl: videoUrl || "",
        ...(codeSnippet && codeSnippet.code ? { codeSnippet } : {}),
        likes: [],
        commentCount: 0,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    };

    cloudHooks.toggleLikePost = async (postId, currentlyLiked) => {
      const user = auth.currentUser;
      if (!user || !postId) return;
      const postRef = doc(db, "posts", postId);
      if (currentlyLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        }).catch(() => {});
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          dislikes: arrayRemove(user.uid)
        }).catch(() => {});
      }
    };

    cloudHooks.toggleDislikePost = async (postId, currentlyDisliked) => {
      const user = auth.currentUser;
      if (!user || !postId) return;
      const postRef = doc(db, "posts", postId);
      if (currentlyDisliked) {
        await updateDoc(postRef, {
          dislikes: arrayRemove(user.uid)
        }).catch(() => {});
      } else {
        await updateDoc(postRef, {
          dislikes: arrayUnion(user.uid),
          likes: arrayRemove(user.uid)
        }).catch(() => {});
      }
    };

    cloudHooks.toggleSavePost = async (postId) => {
      const user = auth.currentUser;
      if (!user || !postId) return false;
      const isSaved = mySavedPostsSet.has(postId);
      if (isSaved) {
        mySavedPostsSet.delete(postId);
      } else {
        mySavedPostsSet.add(postId);
      }
      writeJson(`endha_saved_${user.uid}`, Array.from(mySavedPostsSet));
      await updateDoc(doc(db, "profiles", user.uid), {
        savedPosts: isSaved ? arrayRemove(postId) : arrayUnion(postId)
      }).catch(() => {});
      return !isSaved;
    };

    cloudHooks.toggleFollowCreator = async (creatorUid) => {
      const user = auth.currentUser;
      if (!user || !creatorUid || creatorUid === user.uid) return false;
      const isFollowing = myFollowingSet.has(creatorUid);
      if (isFollowing) {
        myFollowingSet.delete(creatorUid);
      } else {
        myFollowingSet.add(creatorUid);
      }
      writeJson(`endha_following_${user.uid}`, Array.from(myFollowingSet));
      await updateDoc(doc(db, "profiles", user.uid), {
        following: isFollowing ? arrayRemove(creatorUid) : arrayUnion(creatorUid)
      }).catch(() => {});
      return !isFollowing;
    };

    cloudHooks.deletePost = async (postId) => {
      if (!auth.currentUser || !postId) return;
      await deleteDoc(doc(db, "posts", postId));
    };

    cloudHooks.addPostComment = async ({ postId, text, currentCount = 0 }) => {
      const user = auth.currentUser;
      if (!user || !postId) return null;
      const clean = String(text || "").trim().slice(0, 1000);
      if (!clean) return null;
      const prof = currentOwnProfile || {};

      // 1. Verificar puntaje de conducta del autor
      const authorScore = typeof prof.behaviorScore === "number" ? prof.behaviorScore : 10;
      if (authorScore <= 1) {
        return { blocked: true, reason: "Conducta crítica (1/10)" };
      }

      // 2. Evaluar toxicidad / expresiones ambiguas
      const evalRes = evaluateCommentContent(clean);
      if (evalRes.verdict === "blocked") {
        return { blocked: true, reason: evalRes.reason };
      }

      const isPending = evalRes.verdict === "review";
      const commentDocRef = await addDoc(collection(db, "posts", postId, "comments"), {
        authorUid: user.uid,
        authorInternalId: prof.internalId || deriveInternalId(user.uid),
        authorName: prof.displayName || user.displayName || "Especialista",
        authorHandle: prof.handle || sanitizeHandle(user.email?.split("@")[0]),
        text: clean,
        flaggedReview: isPending,
        reviewStatus: isPending ? "pending" : "approved",
        flagReason: isPending ? evalRes.reason : null,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });

      if (isPending) {
        // Enviar a la bandeja de moderación del administrador
        await addDoc(collection(db, "adminPendingComments"), {
          commentId: commentDocRef.id,
          postId,
          commentText: clean,
          authorUid: user.uid,
          authorInternalId: prof.internalId || deriveInternalId(user.uid),
          authorName: prof.displayName || user.displayName || "Especialista",
          authorHandle: prof.handle || sanitizeHandle(user.email?.split("@")[0]),
          authorScore,
          flagReason: evalRes.reason,
          status: "pending",
          createdAtMs: Date.now(),
          createdAt: serverTimestamp()
        }).catch(() => {});
        return { pendingReview: true, reason: evalRes.reason };
      }

      await updateDoc(doc(db, "posts", postId), {
        commentCount: Math.max(0, Number(currentCount) || 0) + 1
      }).catch(() => {});
      return { success: true };
    };

    cloudHooks.deletePostComment = async (postId, commentId, nextCount = 0) => {
      if (!auth.currentUser || !postId || !commentId) return;
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), {
        commentCount: Math.max(0, Number(nextCount) || 0)
      }).catch(() => {});
    };

    cloudHooks.subscribePostComments = (postId, callback) => {
      const qComments = query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAtMs", "asc")
      );
      return onSnapshot(qComments, (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
      });
    };

    cloudHooks.subscribeAdminPendingComments = (callback) => {
      const qAdmin = query(
        collection(db, "adminPendingComments"),
        where("status", "==", "pending")
      );
      return onSnapshot(qAdmin, (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
      }, (err) => {
        console.warn("adminPendingComments snapshot:", err);
      });
    };

    cloudHooks.adminApproveComment = async ({ pendingId, postId, commentId }) => {
      if (pendingId) {
        await updateDoc(doc(db, "adminPendingComments", pendingId), {
          status: "approved",
          reviewedAtMs: Date.now()
        }).catch(() => {});
      }
      if (postId && commentId) {
        await updateDoc(doc(db, "posts", postId, "comments", commentId), {
          flaggedReview: false,
          reviewStatus: "approved"
        }).catch(() => {});
        const postSnap = await getDoc(doc(db, "posts", postId)).catch(() => null);
        const curr = Number(postSnap?.data()?.commentCount) || 0;
        await updateDoc(doc(db, "posts", postId), {
          commentCount: curr + 1
        }).catch(() => {});
      }
    };

    cloudHooks.adminRejectAndSanctionComment = async ({ pendingId, postId, commentId, authorUid }) => {
      if (pendingId) {
        await updateDoc(doc(db, "adminPendingComments", pendingId), {
          status: "sanctioned",
          reviewedAtMs: Date.now()
        }).catch(() => {});
      }
      if (postId && commentId) {
        await deleteDoc(doc(db, "posts", postId, "comments", commentId)).catch(() => {});
      }
      if (authorUid) {
        const prof = profilesByUid.get(authorUid);
        const currScore = typeof prof?.behaviorScore === "number" ? prof.behaviorScore : 10;
        const newScore = Math.max(1, currScore - 2);
        await updateDoc(doc(db, "profiles", authorUid), {
          behaviorScore: newScore,
          lastSanctionAtMs: Date.now(),
          lastSanctionReason: "Comentario inapropiado retenido por filtro (-2 pts)"
        }).catch(() => {});
        if (prof) prof.behaviorScore = newScore;
        if (newScore <= 1 && cloudHooks.adminBanUser) {
          await cloudHooks.adminBanUser(authorUid, "Conducta crítica reiterada (1/10)");
        }
      }
    };

    cloudHooks.adminBanFromComment = async ({ pendingId, postId, commentId, authorUid }) => {
      if (pendingId) {
        await updateDoc(doc(db, "adminPendingComments", pendingId), {
          status: "banned",
          reviewedAtMs: Date.now()
        }).catch(() => {});
      }
      if (postId && commentId) {
        await deleteDoc(doc(db, "posts", postId, "comments", commentId)).catch(() => {});
      }
      if (authorUid) {
        await updateDoc(doc(db, "profiles", authorUid), {
          behaviorScore: 1,
          lastSanctionAtMs: Date.now(),
          lastSanctionReason: "Expulsión permanente por moderación (1/10)"
        }).catch(() => {});
        if (cloudHooks.adminBanUser) {
          await cloudHooks.adminBanUser(authorUid, "Expulsión permanente por moderación (1/10)");
        }
      }
    };

    cloudHooks.adminUpdateUserConduct = async (targetIdOrUid, score, note) => {
      let targetUid = targetIdOrUid;
      let targetProf = profilesByUid.get(targetIdOrUid);
      if (!targetProf) {
        for (const [u, p] of profilesByUid.entries()) {
          if (p.internalId === targetIdOrUid || deriveInternalId(u) === targetIdOrUid) {
            targetUid = u;
            targetProf = p;
            break;
          }
        }
      }
      if (!targetUid) throw new Error("No se encontró ningún usuario con ese ID o UID.");
      const numScore = Math.min(10, Math.max(1, Number(score) || 10));
      await updateDoc(doc(db, "profiles", targetUid), {
        behaviorScore: numScore,
        conductNote: String(note || "").slice(0, 200),
        conductUpdatedAtMs: Date.now()
      });
      if (targetProf) targetProf.behaviorScore = numScore;
      if (numScore <= 1 && cloudHooks.adminBanUser) {
        await cloudHooks.adminBanUser(targetUid, note || "Sanción manual de conducta (1/10)");
      } else if (numScore > 1 && bannedUsersMap.has(targetUid) && cloudHooks.adminUnbanUser) {
        await cloudHooks.adminUnbanUser(targetUid);
      }
    };

    cloudHooks.submitStarReview = async ({ targetUid, stars, comment }) => {
      const user = auth.currentUser;
      if (!user || !targetUid || targetUid === user.uid) return;
      const reviewId = `${targetUid}_${user.uid}`;
      const cleanStars = Math.min(5, Math.max(1, Math.round(Number(stars) || 5)));
      await setDoc(doc(db, "reviews", reviewId), {
        targetUid,
        reviewerUid: user.uid,
        reviewerName: currentOwnProfile?.displayName || user.displayName || "Miembro",
        reviewerHandle: currentOwnProfile?.handle || "usuario",
        stars: cleanStars,
        comment: String(comment || "").slice(0, 800),
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp()
      });
    };

    cloudHooks.requestConnection = async (peerUid) => {
      const me = auth.currentUser;
      if (!me || !peerUid || me.uid === peerUid) return;
      const pairId = [me.uid, peerUid].sort().join("_");
      await setDoc(doc(db, "connections", pairId), {
        users: [me.uid, peerUid],
        requesterUid: me.uid,
        status: "pending",
        updatedAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    };

    cloudHooks.acceptConnection = async (peerUid) => {
      const me = auth.currentUser;
      if (!me || !peerUid) return;
      const pairId = [me.uid, peerUid].sort().join("_");
      await setDoc(
        doc(db, "connections", pairId),
        {
          users: [me.uid, peerUid],
          status: "accepted",
          updatedAtMs: Date.now()
        },
        { merge: true }
      );
      // Si había una conversación pendiente con este contacto, desbloquearla también
      const convRef = doc(db, "conversations", pairId);
      const cSnap = await getDoc(convRef).catch(() => null);
      if (cSnap?.exists() && cSnap.data()?.status === "pending") {
        await setDoc(convRef, { status: "accepted", updatedAtMs: Date.now() }, { merge: true }).catch(() => {});
      }
    };

    cloudHooks.sendReportById = async ({ targetIdCode, reason }) => {
      const me = auth.currentUser;
      if (!me) return;
      const cleanCode = String(targetIdCode || "").trim().toUpperCase();
      const matched = allProfilesList.find(
        (p) => (p.internalId || deriveInternalId(p.uid)).toUpperCase() === cleanCode || p.uid === targetIdCode
      );
      await addDoc(collection(db, "reports"), {
        reporterUid: me.uid,
        reporterInternalId: deriveInternalId(me.uid),
        targetInternalId: cleanCode,
        targetUid: matched?.uid || "",
        targetHandle: matched?.handle || "",
        reason: String(reason || "").slice(0, 1000),
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    };

    cloudHooks.adminBanUser = async ({ targetQuery, reason }) => {
      const q = String(targetQuery || "").trim();
      const upper = q.toUpperCase();
      const matched = allProfilesList.find(
        (p) => (p.internalId || deriveInternalId(p.uid)).toUpperCase() === upper || p.uid === q
      );
      const targetUid = matched?.uid || (q.length >= 20 && !upper.startsWith("XN-") ? q : "");
      if (!targetUid) throw new Error("No se encontró ninguna cuenta con ese ID interno.");
      if (matched?.uid === auth.currentUser?.uid || isCreatorAccount(matched?.internalId, targetUid)) {
        throw new Error("Las cuentas oficiales del Creador están protegidas y no pueden suspenderse.");
      }
      const internalId = matched?.internalId || deriveInternalId(targetUid);
      await setDoc(doc(db, "banned_users", targetUid), {
        uid: targetUid,
        internalId,
        handle: matched?.handle || "",
        displayName: matched?.displayName || "",
        reason: reason || "Incumplimiento de normas de seguridad",
        bannedAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
      return internalId;
    };

    cloudHooks.adminUnbanUser = async (targetQuery) => {
      const q = String(targetQuery || "").trim();
      const upper = q.toUpperCase();
      let targetUid = "";
      bannedUsersMap.forEach((val, uid) => {
        if ((val.internalId || deriveInternalId(uid)).toUpperCase() === upper || uid === q) {
          targetUid = uid;
        }
      });
      if (!targetUid) {
        const matched = allProfilesList.find(
          (p) => (p.internalId || deriveInternalId(p.uid)).toUpperCase() === upper || p.uid === q
        );
        targetUid = matched?.uid || "";
      }
      if (!targetUid) throw new Error("No se encontró baneo activo para ese ID.");
      await deleteDoc(doc(db, "banned_users", targetUid));
      return deriveInternalId(targetUid);
    };

    // Presencia global en vivo
    const sessionKey =
      sessionStorage.getItem("xuanii_sid") ||
      (() => {
        const k = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("xuanii_sid", k);
        return k;
      })();

    const presenceRef = doc(db, "presence", sessionKey);
    const sendHeartbeat = () =>
      setDoc(
        presenceRef,
        {
          updatedAtMs: Date.now(),
          page: window.location.pathname || "/",
          uid: auth.currentUser?.uid || null
        },
        { merge: true }
      ).catch(() => {});

    sendHeartbeat();
    setInterval(sendHeartbeat, 25000);
    window.addEventListener("pagehide", () => {
      deleteDoc(presenceRef).catch(() => {});
    });

    onSnapshot(collection(db, "presence"), (snap) => {
      const cutoff = Date.now() - 65000;
      let liveCount = 0;
      snap.forEach((d) => {
        const data = d.data();
        if (data?.updatedAtMs && data.updatedAtMs >= cutoff) liveCount += 1;
      });
      document.querySelectorAll("#activeUsersCount").forEach((el) => {
        el.textContent = String(Math.max(1, liveCount));
      });
    });

    // Generar o restaurar llaves criptográficas ECDH P-256 del usuario en Google Cloud
    const ensureUserCryptoKeys = async (user) => {
      try {
        const uRef = doc(db, "users", user.uid);
        const uSnap = await getDoc(uRef).catch(() => null);
        const existingKeys = uSnap?.exists() ? uSnap.data()?.cryptoKeys : null;

        if (existingKeys?.publicKeyJwk && existingKeys?.privateKeyJwk) {
          myCryptoKeys = existingKeys;
        } else {
          const kp = await crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveBits"]
          );
          const publicKeyJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
          const privateKeyJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
          myCryptoKeys = { publicKeyJwk, privateKeyJwk };
          await setDoc(uRef, { cryptoKeys: myCryptoKeys, updatedAt: serverTimestamp() }, { merge: true });
        }

        const fpEl = document.getElementById("settingsCryptoFingerprint");
        if (fpEl && myCryptoKeys?.publicKeyJwk?.x) {
          const shortFp = myCryptoKeys.publicKeyJwk.x.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
          fpEl.textContent = `ECDH-P256 · AES-256-GCM · #${shortFp}`;
        }
      } catch {
        // Fallback PBKDF2-AES-256-GCM sigue disponible
      }
    };

    // Garantizar perfil inicial con ID interno y abrir registro en 1 paso si es nuevo
    const onboardingModal = document.getElementById("onboardingModal");
    const ensureUserProfileExists = async (user) => {
      const internalId = deriveInternalId(user.uid);
      const profRef = doc(db, "profiles", user.uid);
      const snap = await getDoc(profRef).catch(() => null);

      if (snap && snap.exists()) {
        currentOwnProfile = snap.data();
        const patches = {};
        if (!currentOwnProfile.internalId) patches.internalId = internalId;
        if (user.photoURL && currentOwnProfile.photoURL !== user.photoURL) patches.photoURL = user.photoURL;
        if (myCryptoKeys?.publicKeyJwk && !currentOwnProfile.publicKeyJwk) {
          patches.publicKeyJwk = myCryptoKeys.publicKeyJwk;
        }
        if (Object.keys(patches).length > 0) {
          patches.displayName = String(currentOwnProfile.displayName || user.displayName || "Especialista").slice(0, 80);
          await setDoc(profRef, patches, { merge: true }).catch(() => {});
          currentOwnProfile = { ...currentOwnProfile, ...patches };
        }
      } else {
        const defaultHandle = sanitizeHandle(
          user.email ? user.email.split("@")[0] : user.displayName,
          user.uid.slice(0, 6)
        );
        const initialProfile = {
          uid: user.uid,
          internalId,
          displayName: String(user.displayName || "Especialista").slice(0, 80),
          handle: defaultHandle,
          category: "video",
          workSituation: "freelance_ready",
          role: "Especialista digital",
          skills: [],
          bio: "",
          photoURL: user.photoURL || "",
          availableForWork: true,
          isPublic: true,
          onboardingDone: false,
          ...(myCryptoKeys?.publicKeyJwk ? { publicKeyJwk: myCryptoKeys.publicKeyJwk } : {}),
          updatedAtMs: Date.now(),
          createdAt: serverTimestamp()
        };
        await setDoc(profRef, initialProfile, { merge: true }).catch(() => {});
        currentOwnProfile = initialProfile;
      }

      populateProfileForm(currentOwnProfile);

      // Si está en cuenta.html y aún no eligió su @usuario y especialidad, mostrar modal fluido de 1 paso
      if (
        onboardingModal &&
        !currentOwnProfile.onboardingDone &&
        !bannedUsersMap.has(user.uid)
      ) {
        const idTag = document.getElementById("onboardGeneratedId");
        const hInp = document.getElementById("onboardHandle");
        if (idTag) idTag.textContent = `CUENTA VERIFICADA · ID: ${internalId}`;
        if (hInp) hInp.value = currentOwnProfile.handle || "";
        onboardingModal.hidden = false;
      }
    };

    document.getElementById("onboardingForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeAuthUser || !cloudHooks.saveProfile) return;
      const handle = sanitizeHandle(
        document.getElementById("onboardHandle")?.value,
        activeAuthUser.displayName
      );
      const category = document.getElementById("onboardCategory")?.value || "video";
      const workSituation = document.getElementById("onboardSituation")?.value || "freelance_ready";
      const role =
        (document.getElementById("onboardRole")?.value || "").trim() || CATEGORY_LABELS[category];
      const availableForWork = workSituation === "seeking_job" || workSituation === "freelance_ready";

      const btn = document.getElementById("onboardSubmitBtn");
      if (btn) btn.disabled = true;

      await cloudHooks.saveProfile({
        displayName: currentOwnProfile?.displayName || activeAuthUser.displayName || "Especialista",
        handle,
        category,
        workSituation,
        role,
        skills: currentOwnProfile?.skills || [],
        bio: currentOwnProfile?.bio || role,
        availableForWork,
        isPublic: true,
        onboardingDone: true
      });

      populateProfileForm(currentOwnProfile);
      renderAccountWorkspace();
      if (btn) btn.disabled = false;
      if (onboardingModal) onboardingModal.hidden = true;
    });

    // Inicio y cierre de sesión con Google
    const signInAndEnterWorkspace = async (destinationUrl = "cuenta.html") => {
      if (activeAuthUser) {
        if (!window.location.pathname.endsWith(destinationUrl)) {
          window.location.href = destinationUrl;
        }
        return;
      }
      try {
        const cred = await signInWithPopup(auth, provider);
        if (cred?.user) {
          const alreadyAtDest =
            (destinationUrl === "cuenta.html" && window.location.pathname.endsWith("cuenta.html")) ||
            (destinationUrl === "para-ti.html" && window.location.pathname.endsWith("para-ti.html"));
          if (!alreadyAtDest) {
            window.location.href = destinationUrl;
          }
        }
      } catch (err) {
        const code = err?.code || "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
        if (authSetupModal) authSetupModal.hidden = false;
      }
    };

    navSignInBtn?.addEventListener("click", () => signInAndEnterWorkspace("cuenta.html"));
    heroSignInBtn?.addEventListener("click", () => signInAndEnterWorkspace("cuenta.html"));
    accountSignInBtn?.addEventListener("click", () => signInAndEnterWorkspace("cuenta.html"));
    document.getElementById("forYouGuestSignInBtn")?.addEventListener("click", () =>
      signInAndEnterWorkspace("para-ti.html")
    );

    const handleSignOut = async () => {
      try {
        localStorage.removeItem("xuanii_auth_session");
        document.documentElement.classList.remove("xuanii-auth-cached");
      } catch (e) {}
      cachedAuthSession = null;
      await signOut(auth);
      if (window.location.pathname.endsWith("cuenta.html")) {
        renderAccountWorkspace();
      }
    };
    document.getElementById("navSignOutBtn")?.addEventListener("click", handleSignOut);
    document.getElementById("accountSignOutBtn")?.addEventListener("click", handleSignOut);
    document.getElementById("sidebarSignOutBtn")?.addEventListener("click", handleSignOut);
    document.getElementById("bannedSignOutBtn")?.addEventListener("click", handleSignOut);

    // =========================================================
    // ESCUCHAS GLOBALES: BANEOS, RESEÑAS, PERFILES Y "PARA TI"
    // =========================================================
    let directoryFilter = "all";
    let directoryQuery = "";
    let networkQuery = "";

    // Estado de búsqueda, filtro y modo de vista para "Para ti" (en cuenta.html y en para-ti.html)
    let feedFilter = "all";
    let wsFeedQuery = "";
    let wsFeedViewMode = "stream";

    let forYouFilter = "all";
    let forYouQuery = "";
    let forYouViewMode = "stream";

    const expandedCommentPosts = new Set();
    const commentUnsubsByKey = new Map();

    const profilesListEl = document.getElementById("profilesDirectoryList");
    const networkExploreListEl = document.getElementById("networkExploreList");
    const socialFeedStreamEl = document.getElementById("socialFeedStream");
    const forYouStreamContainerEl = document.getElementById("forYouStreamContainer");
    const homeForYouMosaicEl = document.getElementById("homeForYouMosaic");
    const ownPortfolioGridEl = document.getElementById("ownProfilePortfolioGrid");

    const CATEGORY_KEYWORDS = {
      video: ["video", "edición de video", "reels", "premiere", "davinci", "after effects", "motion", "montaje", "youtube"],
      photo: ["foto", "fotografía", "retoque", "photostun", "lightroom", "photoshop", "raw", "color"],
      design: ["diseño", "ui", "ux", "branding", "figma", "identidad", "miniatura", "3d", "ilustración"],
      dev: ["desarrollo", "web", "código", "software", "programador", "app", "frontend", "backend", "javascript"]
    };

    const filterPostsForDiscovery = (posts, filterKey, rawQuery) => {
      const q = String(rawQuery || "").trim().toLowerCase();
      return posts.filter((post) => {
        const authorProf = profilesByUid.get(post.authorUid);
        const resolvedCat = post.authorCategory || authorProf?.category || "";
        const idCode = (post.authorInternalId || authorProf?.internalId || deriveInternalId(post.authorUid)).toLowerCase();
        const skillsStr = Array.isArray(authorProf?.skills) ? authorProf.skills.join(" ") : "";
        const cap = (post.caption || "").toLowerCase();
        const haystack = `${cap} ${post.authorName || ""} @${post.authorHandle || ""} ${idCode} ${post.authorRole || ""} ${CATEGORY_LABELS[resolvedCat] || ""} ${skillsStr}`.toLowerCase();

        if (filterKey === "dudas") {
          const isDuda =
            post.kind === "question" ||
            cap.includes("#duda") ||
            cap.includes("#pregunta") ||
            cap.includes("?") ||
            cap.includes("¿") ||
            cap.includes("duda") ||
            cap.includes("pregunta") ||
            cap.includes("ayuda");
          if (!isDuda) return false;
        } else if (filterKey === "conocimiento") {
          const isKnow =
            post.kind === "knowledge" ||
            cap.includes("#tip") ||
            cap.includes("#tutorial") ||
            cap.includes("#conocimiento") ||
            cap.includes("tip") ||
            cap.includes("tutorial") ||
            cap.includes("aprende");
          if (!isKnow) return false;
        } else if (filterKey === "video") {
          const isVid =
            Boolean(post.videoUrl) ||
            post.kind === "video" ||
            cap.includes("#video") ||
            cap.includes("youtube") ||
            cap.includes("vimeo");
          if (!isVid) return false;
        } else if (filterKey === "code") {
          const isCode =
            Boolean(post.codeSnippet && post.codeSnippet.code) ||
            post.kind === "code_snippet" ||
            cap.includes("#dev") ||
            cap.includes("#codigo");
          if (!isCode) return false;
        } else if (filterKey === "photos" || filterKey === "portfolio") {
          if (!post.photoUrl && post.kind !== "portfolio" && post.kind !== "photo") return false;
        } else if (filterKey === "job") {
          if (post.kind !== "job" && post.kind !== "available") return false;
        } else if (["photo", "design", "dev"].includes(filterKey)) {
          const catMatch = resolvedCat === filterKey;
          const kwMatch = (CATEGORY_KEYWORDS[filterKey] || []).some((kw) => haystack.includes(kw));
          if (!catMatch && !kwMatch) return false;
        }

        if (!q) return true;
        return haystack.includes(q);
      });
    };

    const filterProfilesForDiscovery = (profiles, filterKey, rawQuery) => {
      const q = String(rawQuery || "").trim().toLowerCase();
      const matched = profiles.filter((p) => {
        if (["video", "photo", "design", "dev"].includes(filterKey)) {
          const ok = p.category === filterKey || (filterKey === "video" && p.category === "motion3d");
          if (!ok && !q) return false;
        }
        if (!q) return true;
        const idCode = (p.internalId || deriveInternalId(p.uid)).toLowerCase();
        const skillsStr = Array.isArray(p.skills) ? p.skills.join(" ") : "";
        const hay = `${p.displayName || ""} @${p.handle || ""} ${idCode} ${p.role || ""} ${CATEGORY_LABELS[p.category] || ""} ${skillsStr} ${p.bio || ""}`.toLowerCase();
        return hay.includes(q);
      });

      // Ordenar priorizando Creadores, perfiles con fotos o estrellas y actividad reciente
      return matched.sort((a, b) => {
        const aCreator = isCreatorAccount(a.internalId, a.uid) ? 1 : 0;
        const bCreator = isCreatorAccount(b.internalId, b.uid) ? 1 : 0;
        if (aCreator !== bCreator) return bCreator - aCreator;
        const aStars = getRatingStats(a.uid).count;
        const bStars = getRatingStats(b.uid).count;
        if (aStars !== bStars) return bStars - aStars;
        return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
      });
    };

    const renderSpecialistsStripInto = (zoneEl, labelEl, gridEl, filterKey, rawQuery, alwaysShow = false) => {
      if (!zoneEl || !gridEl) return;
      const visibleProfiles = allProfilesList.filter(
        (p) => p.isPublic !== false && !bannedUsersMap.has(p.uid)
      );
      const hasActiveSearch = Boolean(String(rawQuery || "").trim()) || ["video", "photo", "design", "dev"].includes(filterKey);

      if (!alwaysShow && !hasActiveSearch) {
        zoneEl.hidden = true;
        return;
      }

      const list = filterProfilesForDiscovery(visibleProfiles, filterKey, rawQuery).slice(0, 4);
      if (list.length === 0) {
        zoneEl.hidden = true;
        return;
      }

      zoneEl.hidden = false;
      if (labelEl) {
        labelEl.textContent = hasActiveSearch
          ? `ESPECIALISTAS QUE COINCIDEN (${list.length})`
          : "PERFILES DESTACADOS PARA TI";
      }

      gridEl.textContent = "";
      list.forEach((prof) => {
        const internalId = prof.internalId || deriveInternalId(prof.uid);
        const creatorFlag = isCreatorAccount(internalId, prof.uid);
        const stats = getRatingStats(prof.uid);

        const rail = document.createElement("article");
        rail.className = "foryou-specialist-rail";

        const top = document.createElement("div");
        top.className = "foryou-specialist-top";
        top.addEventListener("click", () => renderInspectorContent(prof.uid));

        const av = document.createElement("img");
        av.className = creatorFlag
          ? "foryou-specialist-avatar creator-avatar-ring"
          : "foryou-specialist-avatar";
        av.src = prof.photoURL || "favicon.svg";
        av.alt = prof.displayName || "Especialista";
        av.onerror = () => {
          av.src = "favicon.svg";
        };

        const info = document.createElement("div");
        info.style.minWidth = "0";
        const nmRow = document.createElement("div");
        nmRow.className = "profile-name-line";
        nmRow.style.gap = "6px";

        const nm = document.createElement("strong");
        nm.style.fontSize = "0.94rem";
        nm.textContent = prof.displayName || "Especialista";
        nmRow.appendChild(nm);
        if (creatorFlag) nmRow.appendChild(createCreatorBadgeEl(true));

        const hnd = document.createElement("span");
        hnd.className = "profile-handle mono";
        hnd.style.display = "block";
        hnd.textContent = `@${prof.handle || "usuario"}`;

        const role = document.createElement("span");
        role.className = "open-row-sub";
        role.textContent = prof.role || CATEGORY_LABELS[prof.category] || "Especialista digital";

        info.appendChild(nmRow);
        info.appendChild(hnd);
        info.appendChild(role);
        top.appendChild(av);
        top.appendChild(info);

        const foot = document.createElement("div");
        foot.className = "inline-actions";
        foot.style.justifyContent = "space-between";
        foot.style.gap = "10px";

        const starsSpan = document.createElement("span");
        starsSpan.className = "mono";
        starsSpan.style.fontSize = "0.75rem";
        starsSpan.style.color = "var(--silver-bright)";
        starsSpan.textContent = stats.count > 0 ? `★ ${stats.avg.toFixed(1)} (${stats.count})` : "★ Verificado";

        const actWrap = document.createElement("div");
        actWrap.className = "inline-actions";
        actWrap.style.gap = "12px";

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "text-action-btn";
        viewBtn.textContent = "Ver perfil";
        viewBtn.addEventListener("click", () => renderInspectorContent(prof.uid));
        actWrap.appendChild(viewBtn);

        if (!activeAuthUser || prof.uid !== activeAuthUser.uid) {
          const contactBtn = document.createElement("button");
          contactBtn.type = "button";
          contactBtn.className = "text-action-btn";
          contactBtn.style.color = "var(--white)";
          contactBtn.textContent = "Contactar →";
          contactBtn.addEventListener("click", () => {
            if (window.location.pathname.endsWith("cuenta.html") && activeAuthUser) {
              switchWorkspaceTab("messages");
              cloudHooks.openChatWithPeer?.(prof.uid);
            } else {
              signInAndEnterWorkspace(`cuenta.html?chat=${encodeURIComponent(prof.uid)}`);
            }
          });
          actWrap.appendChild(contactBtn);
        }

        foot.appendChild(starsSpan);
        foot.appendChild(actWrap);

        rail.appendChild(top);
        rail.appendChild(foot);
        gridEl.appendChild(rail);
      });
    };

    // Constructor de publicación rica (con Foto Zoom Lightbox, Insignia Creador, Likes y Comentarios en vivo)
    buildRichSocialPostEl = (post, scopePrefix = "fy") => {
      const art = document.createElement("article");
      art.className = "feed-post-open";

      const authorProf = profilesByUid.get(post.authorUid);
      const authorInternalId =
        post.authorInternalId || authorProf?.internalId || deriveInternalId(post.authorUid);
      const isAuthorCreator = isCreatorAccount(authorInternalId, post.authorUid);
      const authorTier = isAuthorCreator ? "creator" : (post.membershipTier || authorProf?.membershipTier || "standard");

      const head = document.createElement("div");
      head.className = "feed-post-head";

      const authorBox = document.createElement("div");
      authorBox.className = "feed-author-info";
      authorBox.addEventListener("click", () => {
        trackUserInteraction(post.authorCategory || authorProf?.category || "video", "PROFILE_INSPECT", activeAuthUser?.uid);
        renderInspectorContent(post.authorUid);
      });

      const av = document.createElement("img");
      let avatarRingClass = "";
      if (isAuthorCreator) avatarRingClass = "creator-avatar-ring";
      else if (authorTier === "pro") avatarRingClass = "pro-avatar-ring";
      else if (authorTier === "plus") avatarRingClass = "plus-avatar-ring";

      av.className = `feed-author-avatar ${avatarRingClass}`.trim();
      av.src = post.authorAvatar || authorProf?.photoURL || "favicon.svg";
      av.alt = "";
      av.onerror = () => {
        av.src = "favicon.svg";
      };

      const meta = document.createElement("div");
      const nm = document.createElement("div");
      nm.className = "profile-name-line";
      const strong = document.createElement("strong");
      strong.style.fontSize = "0.96rem";
      strong.textContent = post.authorName || authorProf?.displayName || "Especialista";
      nm.appendChild(strong);
      if (isAuthorCreator) {
        nm.appendChild(createCreatorBadgeEl(true));
      } else if (authorTier === "pro") {
        nm.appendChild(renderMembershipBadge("pro", true));
      } else if (authorTier === "plus") {
        nm.appendChild(renderMembershipBadge("plus", true));
      }

      const hnd = document.createElement("span");
      hnd.className = "profile-handle mono";
      hnd.textContent = `@${post.authorHandle || authorProf?.handle || "usuario"}`;
      nm.appendChild(hnd);

      const sub = document.createElement("span");
      sub.className = "open-row-sub";
      sub.style.marginTop = "0";
      sub.textContent = `${post.authorRole || authorProf?.role || "Especialista"} · ${formatDateEs(post.createdAtMs)}`;

      meta.appendChild(nm);
      meta.appendChild(sub);
      authorBox.appendChild(av);
      authorBox.appendChild(meta);

      // Bloque derecho de la cabecera: Botón Seguir + Menú de 3 puntos + Tipo
      const headActions = document.createElement("div");
      headActions.className = "feed-header-actions";

      // Botón Seguir / Siguiendo estilo Facebook / Twitter
      if (!activeAuthUser || activeAuthUser.uid !== post.authorUid) {
        const followBtn = document.createElement("button");
        followBtn.type = "button";
        const isFollowed = myFollowingSet.has(post.authorUid);
        followBtn.className = isFollowed ? "btn-feed-follow following" : "btn-feed-follow";
        followBtn.textContent = isFollowed ? "Siguiendo" : "+ Seguir";
        followBtn.title = isFollowed ? "Dejar de seguir a este creador" : "Seguir a este creador en Para ti";
        followBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          applyLiquidWaterRipple(e, followBtn);
          triggerFluidPop(followBtn);
          if (!activeAuthUser) {
            signInAndEnterWorkspace("para-ti.html");
            return;
          }
          followBtn.disabled = true;
          const nextState = await cloudHooks.toggleFollowCreator?.(post.authorUid);
          followBtn.className = nextState ? "btn-feed-follow following" : "btn-feed-follow";
          followBtn.textContent = nextState ? "Siguiendo" : "+ Seguir";
          followBtn.disabled = false;
          renderFeedAndOwnPortfolio();
        });
        headActions.appendChild(followBtn);
      }

      // Menú de 3 puntos (···)
      const optionsWrap = document.createElement("div");
      optionsWrap.className = "feed-post-options-wrap";
      const dotsBtn = document.createElement("button");
      dotsBtn.type = "button";
      dotsBtn.className = "feed-options-btn";
      dotsBtn.setAttribute("aria-label", "Más opciones de publicación");
      dotsBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <circle cx="5" cy="12" r="1.75"/>
          <circle cx="12" cy="12" r="1.75"/>
          <circle cx="19" cy="12" r="1.75"/>
        </svg>
      `;

      const dropdown = document.createElement("div");
      dropdown.className = "feed-options-dropdown";

      const closeDropdown = () => {
        dropdown.classList.remove("is-open");
        dotsBtn.classList.remove("active");
      };

      // 1. Guardar en favoritos / Ver más tarde
      const isPostSaved = mySavedPostsSet.has(post.id);
      const saveOpt = document.createElement("button");
      saveOpt.type = "button";
      saveOpt.className = "feed-option-item";
      const getSaveOptHtml = (saved) => `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${saved ? "Guardado en tu baúl" : "Guardar en favoritos / Ver más tarde"}</span>
      `;
      saveOpt.innerHTML = getSaveOptHtml(isPostSaved);
      saveOpt.addEventListener("click", async (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, saveOpt);
        closeDropdown();
        if (!activeAuthUser) {
          signInAndEnterWorkspace("para-ti.html");
          return;
        }
        const nowSaved = await cloudHooks.toggleSavePost?.(post.id);
        saveOpt.innerHTML = getSaveOptHtml(nowSaved);
        updateSaveBtnState(nowSaved);
      });
      dropdown.appendChild(saveOpt);

      // 2. Copiar enlace
      const copyOpt = document.createElement("button");
      copyOpt.type = "button";
      copyOpt.className = "feed-option-item";
      const copyOptNormalHtml = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span>Copiar enlace de publicación</span>
      `;
      const copyOptSuccessHtml = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Enlace copiado</span>
      `;
      copyOpt.innerHTML = copyOptNormalHtml;
      copyOpt.addEventListener("click", (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, copyOpt);
        closeDropdown();
        const postUrl = `${window.location.origin}/para-ti.html?post=${post.id}`;
        navigator.clipboard?.writeText(postUrl).then(() => {
          copyOpt.innerHTML = copyOptSuccessHtml;
          setTimeout(() => { copyOpt.innerHTML = copyOptNormalHtml; }, 2000);
        }).catch(() => {});
      });
      dropdown.appendChild(copyOpt);

      // 3. Reportar publicación
      const repOpt = document.createElement("button");
      repOpt.type = "button";
      repOpt.className = "feed-option-item danger";
      repOpt.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
        <span>Reportar publicación</span>
      `;
      repOpt.addEventListener("click", (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, repOpt);
        closeDropdown();
        if (window.location.pathname.endsWith("cuenta.html")) {
          switchWorkspaceTab("settings");
          const repInput = document.getElementById("reportTargetIdInput");
          if (repInput) {
            repInput.value = post.authorInternalId || authorInternalId;
            document.getElementById("reportReasonInput")?.focus();
          }
        } else {
          window.location.href = `cuenta.html?tab=settings&report=${encodeURIComponent(post.authorInternalId || authorInternalId)}`;
        }
      });
      dropdown.appendChild(repOpt);

      // 4. Eliminar publicación en el menú de 3 puntos
      const isOwnerOrAdmin = Boolean(
        activeAuthUser && (post.authorUid === activeAuthUser.uid || isAdminUser(activeAuthUser))
      );

      const delDivider = document.createElement("div");
      delDivider.className = "feed-options-divider";
      dropdown.appendChild(delDivider);

      const delOpt = document.createElement("button");
      delOpt.type = "button";
      delOpt.className = "feed-option-item danger";
      delOpt.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        <span>Eliminar publicación</span>
      `;
      delOpt.addEventListener("click", async (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, delOpt);
        closeDropdown();
        if (!activeAuthUser) {
          alert("Inicia sesión con tu cuenta para eliminar publicaciones.");
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          );
          return;
        }
        if (!isOwnerOrAdmin) {
          alert("Solo el autor de la publicación o los administradores de EndHa pueden eliminarla.");
          return;
        }
        if (confirm("¿Estás seguro de que deseas eliminar esta publicación permanentemente?")) {
          await cloudHooks.deletePost?.(post.id);
        }
      });
      dropdown.appendChild(delOpt);

      dotsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyLiquidWaterRipple(e, dotsBtn);
        triggerFluidPop(dotsBtn);
        const willOpen = !dropdown.classList.contains("is-open");
        document.querySelectorAll(".feed-options-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
        document.querySelectorAll(".feed-options-btn.active").forEach((b) => b.classList.remove("active"));
        if (willOpen) {
          dropdown.classList.add("is-open");
          dotsBtn.classList.add("active");
        }
      });

      optionsWrap.appendChild(dotsBtn);
      optionsWrap.appendChild(dropdown);
      headActions.appendChild(optionsWrap);

      head.appendChild(authorBox);
      head.appendChild(headActions);
      art.appendChild(head);

      if (post.title) {
        const tit = document.createElement("h3");
        tit.className = "feed-post-title";
        tit.textContent = post.title;
        art.appendChild(tit);
      }

      if (post.caption) {
        const cap = document.createElement("p");
        cap.className = "feed-post-caption";
        cap.appendChild(renderCaptionWithHashtags(post.caption));
        art.appendChild(cap);
      }

      const mediaNode = renderMediaContainer(post, () => openPhotoLightbox(post, signInAndEnterWorkspace));
      if (mediaNode) {
        art.appendChild(mediaNode);
      }

      const bar = document.createElement("div");
      bar.className = "post-actions-bar";
      bar.style.flexWrap = "wrap";

      const likesArr = Array.isArray(post.likes) ? post.likes : [];
      const dislikesArr = Array.isArray(post.dislikes) ? post.dislikes : [];
      let likedByMe = Boolean(activeAuthUser && likesArr.includes(activeAuthUser.uid));
      let dislikedByMe = Boolean(activeAuthUser && dislikesArr.includes(activeAuthUser.uid));

      // Botón Me gusta (SVG)
      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = likedByMe ? "post-reaction-btn active-like" : "post-reaction-btn";
      const getLikeBtnHtml = (active, count) => `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        <span class="reaction-count">${count > 0 ? count : ""}</span>
        <span>Me gusta</span>
      `;
      likeBtn.innerHTML = getLikeBtnHtml(likedByMe, likesArr.length);
      likeBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, likeBtn);
        triggerFluidPop(likeBtn);
        if (!activeAuthUser) {
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          );
          return;
        }
        trackUserInteraction(post.authorCategory || authorProf?.category || "video", "LIKE", activeAuthUser.uid);
        cloudHooks.toggleLikePost?.(post.id, likedByMe);
      });
      bar.appendChild(likeBtn);

      // Botón No me gusta (SVG)
      const dislikeBtn = document.createElement("button");
      dislikeBtn.type = "button";
      dislikeBtn.className = dislikedByMe ? "post-reaction-btn active-dislike" : "post-reaction-btn";
      const getDislikeBtnHtml = (active, count) => `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
        </svg>
        <span class="reaction-count">${count > 0 ? count : ""}</span>
        <span>No me gusta</span>
      `;
      dislikeBtn.innerHTML = getDislikeBtnHtml(dislikedByMe, dislikesArr.length);
      dislikeBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, dislikeBtn);
        triggerFluidPop(dislikeBtn);
        if (!activeAuthUser) {
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          );
          return;
        }
        cloudHooks.toggleDislikePost?.(post.id, dislikedByMe);
      });
      bar.appendChild(dislikeBtn);

      // Botón Comentarios (SVG)
      const commentCountNum = Number(post.commentCount) || 0;
      const commentBtn = document.createElement("button");
      commentBtn.type = "button";
      commentBtn.className = "post-reaction-btn";
      const getCommentBtnHtml = (count) => `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span class="reaction-count">${count > 0 ? count : ""}</span>
        <span>${count > 0 ? "Comentarios" : "Comentar"}</span>
      `;
      commentBtn.innerHTML = getCommentBtnHtml(commentCountNum);
      bar.appendChild(commentBtn);

      // Botón Guardar (SVG)
      let isSaved = mySavedPostsSet.has(post.id);
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = isSaved ? "post-reaction-btn active-save" : "post-reaction-btn";
      const getSaveBtnHtml = (saved) => `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${saved ? "Guardado" : "Guardar"}</span>
      `;
      saveBtn.innerHTML = getSaveBtnHtml(isSaved);
      function updateSaveBtnState(saved) {
        isSaved = saved;
        saveBtn.className = saved ? "post-reaction-btn active-save" : "post-reaction-btn";
        saveBtn.innerHTML = getSaveBtnHtml(saved);
      }
      saveBtn.addEventListener("click", async (e) => {
        applyLiquidWaterRipple(e, saveBtn);
        triggerFluidPop(saveBtn);
        if (!activeAuthUser) {
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          );
          return;
        }
        const nowSaved = await cloudHooks.toggleSavePost?.(post.id);
        updateSaveBtnState(nowSaved);
        saveOpt.innerHTML = getSaveOptHtml(nowSaved);
      });
      bar.appendChild(saveBtn);

      // Botón Ver perfil
      const inspectBtn = document.createElement("button");
      inspectBtn.type = "button";
      inspectBtn.className = "text-action-btn";
      inspectBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Ver perfil</span>
      `;
      inspectBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, inspectBtn);
        renderInspectorContent(post.authorUid);
      });
      bar.appendChild(inspectBtn);

      if (!activeAuthUser || post.authorUid !== activeAuthUser.uid) {
        const contactBtn = document.createElement("button");
        contactBtn.type = "button";
        contactBtn.className = "text-action-btn";
        contactBtn.style.color = "var(--white)";
        contactBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>Contactar</span>
        `;
        contactBtn.addEventListener("click", (e) => {
          applyLiquidWaterRipple(e, contactBtn);
          if (window.location.pathname.endsWith("cuenta.html") && activeAuthUser) {
            switchWorkspaceTab("messages");
            cloudHooks.openChatWithPeer?.(post.authorUid);
          } else {
            signInAndEnterWorkspace(`cuenta.html?chat=${encodeURIComponent(post.authorUid)}`);
          }
        });
        bar.appendChild(contactBtn);
      }

      art.appendChild(bar);

      // Cajón abierto de comentarios en tiempo real
      const commentsDrawer = document.createElement("div");
      commentsDrawer.className = "post-comments-drawer";
      const subKey = `${scopePrefix}:${post.id}`;
      commentsDrawer.hidden = !expandedCommentPosts.has(post.id);

      const commentsListEl = document.createElement("div");
      commentsListEl.className = "post-comments-list";
      commentsDrawer.appendChild(commentsListEl);

      let latestCommentsCount = commentCountNum;

      const mountCommentsSubscription = () => {
        if (commentUnsubsByKey.has(subKey)) {
          commentUnsubsByKey.get(subKey)();
          commentUnsubsByKey.delete(subKey);
        }
        if (!cloudHooks.subscribePostComments) return;
        const unsub = cloudHooks.subscribePostComments(post.id, (comments) => {
          const cleanComments = comments.filter((c) => {
            if (bannedUsersMap.has(c.authorUid)) return false;
            // Filtrar comentarios en duda (flaggedReview)
            if (c.flaggedReview) {
              if (!activeAuthUser) return false;
              return c.authorUid === activeAuthUser.uid || isAdminUser(activeAuthUser);
            }
            return true;
          });
          latestCommentsCount = cleanComments.length;
          commentBtn.innerHTML = getCommentBtnHtml(latestCommentsCount);

          commentsListEl.textContent = "";
          if (cleanComments.length === 0) {
            const emptyC = document.createElement("span");
            emptyC.className = "mono";
            emptyC.style.fontSize = "0.75rem";
            emptyC.style.color = "var(--muted)";
            emptyC.textContent = "Sé el primero en comentar esta publicación.";
            commentsListEl.appendChild(emptyC);
            return;
          }

          cleanComments.forEach((c) => {
            const cRow = document.createElement("div");
            cRow.className = "post-comment-row";

            const cHead = document.createElement("div");
            cHead.className = "post-comment-head";

            const cAuthor = document.createElement("div");
            cAuthor.className = "post-comment-author";
            cAuthor.addEventListener("click", () => renderInspectorContent(c.authorUid));

            const cCode = c.authorInternalId || deriveInternalId(c.authorUid);
            const cIsCreator = isCreatorAccount(cCode, c.authorUid);

            const cName = document.createElement("strong");
            cName.style.fontSize = "0.83rem";
            cName.textContent = c.authorName || "Miembro";
            cAuthor.appendChild(cName);
            if (cIsCreator) cAuthor.appendChild(createCreatorBadgeEl(true));

            const cMeta = document.createElement("span");
            cMeta.className = "mono";
            cMeta.style.fontSize = "0.72rem";
            cMeta.style.color = "var(--muted)";
            cMeta.textContent = `@${c.authorHandle || "usuario"} · ${formatDateEs(c.createdAtMs)}`;
            cAuthor.appendChild(cMeta);

            if (c.flaggedReview) {
              const pendingFlag = document.createElement("span");
              pendingFlag.className = "mono";
              pendingFlag.style.fontSize = "0.7rem";
              pendingFlag.style.color = "var(--gold)";
              pendingFlag.textContent = " [En revisión por moderación]";
              cAuthor.appendChild(pendingFlag);
            }

            cHead.appendChild(cAuthor);

            if (
              activeAuthUser &&
              (c.authorUid === activeAuthUser.uid || isAdminUser(activeAuthUser))
            ) {
              const delC = document.createElement("button");
              delC.type = "button";
              delC.className = "text-action-btn";
              delC.style.fontSize = "0.74rem";
              delC.textContent = "Borrar";
              delC.addEventListener("click", () => {
                cloudHooks.deletePostComment?.(
                  post.id,
                  c.id,
                  Math.max(0, latestCommentsCount - 1)
                );
              });
              cHead.appendChild(delC);
            }

            const cTxt = document.createElement("p");
            cTxt.className = "post-comment-text";
            cTxt.textContent = c.text || "";

            cRow.appendChild(cHead);
            cRow.appendChild(cTxt);
            commentsListEl.appendChild(cRow);
          });
        });
        commentUnsubsByKey.set(subKey, unsub);
      };

      if (expandedCommentPosts.has(post.id)) {
        mountCommentsSubscription();
      }

      commentBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, commentBtn);
        triggerFluidPop(commentBtn);
        if (expandedCommentPosts.has(post.id)) {
          expandedCommentPosts.delete(post.id);
          commentsDrawer.hidden = true;
          if (commentUnsubsByKey.has(subKey)) {
            commentUnsubsByKey.get(subKey)();
            commentUnsubsByKey.delete(subKey);
          }
        } else {
          expandedCommentPosts.add(post.id);
          commentsDrawer.hidden = false;
          mountCommentsSubscription();
        }
      });

      if (activeAuthUser) {
        const cForm = document.createElement("form");
        cForm.className = "post-comment-form";
        const cInp = document.createElement("input");
        cInp.type = "text";
        cInp.className = "line-input";
        cInp.maxLength = 900;
        cInp.placeholder = "Escribe un comentario o pregunta sobre este trabajo...";
        cInp.required = true;
        const cBtn = document.createElement("button");
        cBtn.type = "submit";
        cBtn.className = "btn btn-white btn-sm";
        cBtn.textContent = "Responder";
        cForm.appendChild(cInp);
        cForm.appendChild(cBtn);

        cForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const val = cInp.value.trim();
          if (!val || !cloudHooks.addPostComment) return;

          // Verificar si el usuario tiene conducta crítica (1/10)
          const myScore = typeof currentOwnProfile?.behaviorScore === "number" ? currentOwnProfile.behaviorScore : 10;
          if (myScore <= 1) {
            alert("Tu cuenta tiene calificación de conducta crítica (1/10) y no puede enviar comentarios.");
            return;
          }

          cBtn.disabled = true;
          const res = await cloudHooks
            .addPostComment({
              postId: post.id,
              text: val,
              currentCount: latestCommentsCount
            })
            .catch(() => null);

          cBtn.disabled = false;
          if (res?.blocked) {
            alert("Tu comentario fue bloqueado automáticamente por infringir las normas de respeto y seguridad de EndHa.");
            return;
          }
          if (res?.pendingReview) {
            alert("Tu comentario incluye una expresión en duda y fue enviado a la bandeja de moderación. Estará visible tras la validación del administrador.");
          }
          cInp.value = "";
        });
        commentsDrawer.appendChild(cForm);
      } else {
        const loginToComment = document.createElement("button");
        loginToComment.type = "button";
        loginToComment.className = "text-action-btn";
        loginToComment.style.justifySelf = "start";
        loginToComment.textContent = "Inicia sesión con Google para comentar →";
        loginToComment.addEventListener("click", () =>
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          )
        );
        commentsDrawer.appendChild(loginToComment);
      }

      art.appendChild(commentsDrawer);
      return art;
    };

    // Constructor de tarjeta visual para el modo "Mosaico visual" en Para ti e Inicio
    const buildMosaicTileEl = (post) => {
      const tile = document.createElement("article");
      tile.className = "mosaic-shot-item";

      const authorProf = profilesByUid.get(post.authorUid);
      const authorInternalId =
        post.authorInternalId || authorProf?.internalId || deriveInternalId(post.authorUid);
      const isAuthorCreator = isCreatorAccount(authorInternalId, post.authorUid);

      if (post.photoUrl) {
        const media = document.createElement("div");
        media.className = "mosaic-shot-media";
        media.title = "Ampliar imagen";
        const img = document.createElement("img");
        img.src = post.photoUrl;
        img.alt = post.caption || "Fotografía publicada";
        img.loading = "lazy";
        media.appendChild(img);
        media.addEventListener("click", () => openPhotoLightbox(post, signInAndEnterWorkspace));
        tile.appendChild(media);
      } else {
        const textBox = document.createElement("div");
        textBox.className = "mosaic-text-showcase";
        textBox.addEventListener("click", () => renderInspectorContent(post.authorUid));

        const kindTag = document.createElement("span");
        const kindClass = POST_KIND_CLASSES[post.kind] || "kind-badge-post";
        kindTag.className = `feed-post-kind mono ${kindClass}`;
        kindTag.textContent = POST_KIND_LABELS[post.kind] || "PUBLICACIÓN";

        const txt = document.createElement("p");
        txt.style.fontSize = "0.96rem";
        txt.style.color = "var(--white)";
        txt.style.lineHeight = "1.55";
        txt.textContent = (post.caption || "").slice(0, 170);

        textBox.appendChild(kindTag);
        textBox.appendChild(txt);
        tile.appendChild(textBox);
      }

      const body = document.createElement("div");
      body.className = "mosaic-shot-body";

      if (post.photoUrl && post.caption) {
        const cap = document.createElement("p");
        cap.className = "mosaic-shot-caption";
        cap.textContent = post.caption;
        body.appendChild(cap);
      }

      const foot = document.createElement("div");
      foot.className = "mosaic-shot-foot";

      const authorWrap = document.createElement("div");
      authorWrap.className = "feed-author-info";
      authorWrap.style.gap = "8px";
      authorWrap.addEventListener("click", () => renderInspectorContent(post.authorUid));

      const av = document.createElement("img");
      av.className = isAuthorCreator
        ? "feed-author-avatar creator-avatar-ring"
        : "feed-author-avatar";
      av.style.width = "28px";
      av.style.height = "28px";
      av.src = post.authorAvatar || authorProf?.photoURL || "favicon.svg";
      av.alt = "";
      av.onerror = () => {
        av.src = "favicon.svg";
      };

      const nameRow = document.createElement("div");
      nameRow.style.display = "flex";
      nameRow.style.alignItems = "center";
      nameRow.style.gap = "6px";
      nameRow.style.flexWrap = "wrap";

      const nm = document.createElement("strong");
      nm.style.fontSize = "0.83rem";
      nm.textContent = post.authorName || authorProf?.displayName || "Especialista";
      nameRow.appendChild(nm);
      if (isAuthorCreator) nameRow.appendChild(createCreatorBadgeEl(true));

      authorWrap.appendChild(av);
      authorWrap.appendChild(nameRow);

      const likesArr = Array.isArray(post.likes) ? post.likes : [];
      const likedByMe = Boolean(activeAuthUser && likesArr.includes(activeAuthUser.uid));
      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = likedByMe ? "post-like-btn liked" : "post-like-btn";
      const getTileHeartHtml = (active, count) => `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="reaction-icon">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>${count}</span>
      `;
      likeBtn.innerHTML = getTileHeartHtml(likedByMe, likesArr.length);
      likeBtn.addEventListener("click", (e) => {
        applyLiquidWaterRipple(e, likeBtn);
        triggerFluidPop(likeBtn);
        if (!activeAuthUser) {
          signInAndEnterWorkspace(
            window.location.pathname.endsWith("para-ti.html") ? "para-ti.html" : "cuenta.html"
          );
          return;
        }
        cloudHooks.toggleLikePost?.(post.id, likedByMe);
      });

      foot.appendChild(authorWrap);
      foot.appendChild(likeBtn);
      body.appendChild(foot);
      tile.appendChild(body);
      return tile;
    };

    const renderAllProfileViews = () => {
      const visibleProfiles = allProfilesList
        .filter((p) => p.isPublic !== false && !bannedUsersMap.has(p.uid))
        .sort((a, b) => {
          const aC = isCreatorAccount(a.internalId, a.uid) ? 1 : 0;
          const bC = isCreatorAccount(b.internalId, b.uid) ? 1 : 0;
          if (aC !== bC) return bC - aC;
          return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
        });

      if (homeRegisteredCountEl) {
        homeRegisteredCountEl.textContent = String(visibleProfiles.length);
      }

      // 1. Directorio público en perfiles.html
      if (profilesListEl) {
        profilesListEl.textContent = "";
        const q = directoryQuery.trim().toLowerCase();
        const filtered = visibleProfiles.filter((p) => {
          if (directoryFilter === "available") {
            const av = p.availableForWork !== false && p.workSituation !== "employed_open";
            if (!av) return false;
          } else if (directoryFilter !== "all" && p.category !== directoryFilter) {
            return false;
          }
          if (!q) return true;
          const idCode = (p.internalId || deriveInternalId(p.uid)).toLowerCase();
          const skillsStr = Array.isArray(p.skills) ? p.skills.join(" ") : "";
          const hay = `${p.displayName || ""} @${p.handle || ""} ${idCode} ${p.role || ""} ${CATEGORY_LABELS[p.category] || ""} ${skillsStr} ${p.bio || ""}`.toLowerCase();
          return hay.includes(q);
        });

        if (filtered.length === 0) {
          const empty = document.createElement("div");
          empty.className = "arch-col";
          const idx = document.createElement("span");
          idx.className = "col-index mono";
          idx.textContent = visibleProfiles.length === 0 ? "RED ABIERTA" : "SIN COINCIDENCIAS";
          const p = document.createElement("p");
          p.textContent =
            visibleProfiles.length === 0
              ? "Inicia sesión con Google para activar el primer perfil verificado del directorio."
              : "No encontramos especialistas con ese filtro o código ID.";
          empty.appendChild(idx);
          empty.appendChild(p);
          profilesListEl.appendChild(empty);
        } else {
          filtered.forEach((prof) => {
            profilesListEl.appendChild(createProfileDirectoryRow(prof, signInAndEnterWorkspace));
          });
        }
      }

      // 2. Explorador interno en cuenta.html -> Contactos y talento
      if (networkExploreListEl) {
        networkExploreListEl.textContent = "";
        const q = networkQuery.trim().toLowerCase();
        const filtered = visibleProfiles.filter((p) => {
          if (!q) return true;
          const idCode = (p.internalId || deriveInternalId(p.uid)).toLowerCase();
          const skillsStr = Array.isArray(p.skills) ? p.skills.join(" ") : "";
          const hay = `${p.displayName || ""} @${p.handle || ""} ${idCode} ${p.role || ""} ${skillsStr}`.toLowerCase();
          return hay.includes(q);
        });
        filtered.forEach((prof) => {
          networkExploreListEl.appendChild(createProfileDirectoryRow(prof, signInAndEnterWorkspace));
        });
      }

      // 3. Franjas de especialistas recomendados en feed de cuenta.html
      renderSpecialistsStripInto(
        document.getElementById("wsFeedSpecialistsZone"),
        document.getElementById("wsFeedSpecialistsLabel"),
        document.getElementById("wsFeedSpecialistsGrid"),
        feedFilter,
        wsFeedQuery,
        false
      );

      if (inspectedProfileUid) {
        renderInspectorContent(inspectedProfileUid);
      }
    };

    const renderDiscoveryStreamInto = (containerEl, posts, viewMode, scopePrefix) => {
      if (!containerEl) return;
      // Limpiar suscripciones activas de comentarios de este contenedor antes de repintar
      commentUnsubsByKey.forEach((unsub, key) => {
        if (key.startsWith(`${scopePrefix}:`)) {
          unsub();
          commentUnsubsByKey.delete(key);
        }
      });

      containerEl.textContent = "";
      if (posts.length === 0) {
        containerEl.className = "feed-stream";
        const empty = document.createElement("div");
        empty.className = "arch-col";
        const idx = document.createElement("span");
        idx.className = "col-index mono";
        idx.textContent = "PARA TI · RED EN VIVO";
        const p = document.createElement("p");
        p.textContent =
          allPostsList.length === 0
            ? "Sé el primero en compartir una publicación, idea o pregunta en Para ti pulsando '+ Añadir'."
            : "No hay publicaciones que coincidan con esa búsqueda. Prueba con otra palabra o #etiqueta.";
        empty.appendChild(idx);
        empty.appendChild(p);
        containerEl.appendChild(empty);
        return;
      }

      const rankedPosts = rankFeedPostsByAffinity(posts, activeAuthUser?.uid);

      if (viewMode === "mosaic") {
        containerEl.className = "foryou-visual-mosaic";
        rankedPosts.forEach((post) => {
          containerEl.appendChild(buildMosaicTileEl(post));
        });
      } else {
        containerEl.className = "feed-stream";
        rankedPosts.forEach((post) => {
          containerEl.appendChild(buildRichSocialPostEl(post, scopePrefix));
        });
      }
    };

    const renderFeedAndOwnPortfolio = () => {
      const cleanPosts = allPostsList.filter((p) => !bannedUsersMap.has(p.authorUid));

      // Sincronizar modal de publicación en para-ti.html si no hay sesión
      const fyModal = document.getElementById("forYouCreateModal");
      if (fyModal && !activeAuthUser) {
        fyModal.hidden = true;
      }

      // 1. "Para ti" dentro de cuenta.html (#socialFeedStream)
      if (socialFeedStreamEl) {
        const wsFiltered = filterPostsForDiscovery(cleanPosts, feedFilter, wsFeedQuery);
        renderDiscoveryStreamInto(socialFeedStreamEl, wsFiltered, wsFeedViewMode, "ws");
        renderSpecialistsStripInto(
          document.getElementById("wsFeedSpecialistsZone"),
          document.getElementById("wsFeedSpecialistsLabel"),
          document.getElementById("wsFeedSpecialistsGrid"),
          feedFilter,
          wsFeedQuery,
          false
        );
      }

      // 2. Página dedicada para-ti.html (#forYouStreamContainer)
      if (forYouStreamContainerEl) {
        const fyFiltered = filterPostsForDiscovery(cleanPosts, forYouFilter, forYouQuery);
        const metaEl = document.getElementById("forYouResultsMeta");
        if (metaEl) {
          metaEl.textContent =
            fyFiltered.length === 1 ? "1 PUBLICACIÓN" : `${fyFiltered.length} PUBLICACIONES`;
        }
        renderDiscoveryStreamInto(forYouStreamContainerEl, fyFiltered, forYouViewMode, "fy");
      }

      // 3. Muestra en vivo de "Para ti" en la portada index.html (#homeForYouMosaic)
      if (homeForYouMosaicEl) {
        homeForYouMosaicEl.textContent = "";
        const featured = [...cleanPosts]
          .sort((a, b) => {
            const aPhoto = a.photoUrl ? 1 : 0;
            const bPhoto = b.photoUrl ? 1 : 0;
            if (aPhoto !== bPhoto) return bPhoto - aPhoto;
            return (b.createdAtMs || 0) - (a.createdAtMs || 0);
          })
          .slice(0, 6);

        if (featured.length === 0) {
          const empty = document.createElement("div");
          empty.className = "arch-col";
          const idx = document.createElement("span");
          idx.className = "col-index mono";
          idx.textContent = "ESTRENA PARA TI";
          const h = document.createElement("h3");
          h.textContent = "Sube tus primeras fotografías de trabajo";
          const p = document.createElement("p");
          p.textContent =
            "Entra con Google y lanza muestras visuales de tus ediciones, diseños o proyectos para aparecer aquí en tiempo real.";
          empty.appendChild(idx);
          empty.appendChild(h);
          empty.appendChild(p);
          homeForYouMosaicEl.appendChild(empty);
        } else {
          featured.forEach((post) => {
            homeForYouMosaicEl.appendChild(buildMosaicTileEl(post));
          });
        }
      }

      // 4. Galería propia en Mi Perfil
      if (ownPortfolioGridEl && activeAuthUser) {
        ownPortfolioGridEl.textContent = "";
        const mine = allPostsList.filter((p) => p.authorUid === activeAuthUser.uid);
        if (mine.length === 0) {
          const p = document.createElement("p");
          p.style.fontSize = "0.86rem";
          p.style.color = "var(--muted)";
          p.textContent = "Aún no has subido fotos a tu registro de portafolio.";
          ownPortfolioGridEl.appendChild(p);
        } else {
          mine.forEach((post) => {
            const card = document.createElement("div");
            card.className = "portfolio-shot";
            if (post.photoUrl) {
              const img = document.createElement("img");
              img.src = post.photoUrl;
              img.alt = "";
              img.style.cursor = "zoom-in";
              img.addEventListener("click", () => openPhotoLightbox(post, signInAndEnterWorkspace));
              card.appendChild(img);
            }
            const foot = document.createElement("div");
            foot.className = "portfolio-shot-foot";
            const cap = document.createElement("span");
            cap.textContent = (post.caption || "Trabajo").slice(0, 48);
            const del = document.createElement("button");
            del.type = "button";
            del.className = "text-action-btn";
            del.textContent = "Borrar";
            del.addEventListener("click", () => cloudHooks.deletePost?.(post.id));
            foot.appendChild(cap);
            foot.appendChild(del);
            card.appendChild(foot);
            ownPortfolioGridEl.appendChild(card);
          });
        }
      }
    };

    // Escuchar lista de cuentas baneadas
    onSnapshot(collection(db, "banned_users"), (snap) => {
      const next = new Map();
      snap.forEach((d) => next.set(d.id, d.data()));
      bannedUsersMap = next;
      renderAccountWorkspace();
      renderAllProfileViews();
      renderFeedAndOwnPortfolio();
    });

    // Escuchar valoraciones por estrellas
    onSnapshot(collection(db, "reviews"), (snap) => {
      const grouped = new Map();
      snap.forEach((d) => {
        const r = d.data();
        if (!r?.targetUid) return;
        if (!grouped.has(r.targetUid)) grouped.set(r.targetUid, []);
        grouped.get(r.targetUid).push(r);
      });
      const statsMap = new Map();
      grouped.forEach((arr, uid) => {
        arr.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
        const sum = arr.reduce((s, x) => s + (Number(x.stars) || 5), 0);
        statsMap.set(uid, { avg: sum / arr.length, count: arr.length, items: arr });
      });
      reviewsByTargetUid = statsMap;
      renderAccountWorkspace();
      renderAllProfileViews();
    });

    // Escuchar perfiles públicos
    onSnapshot(collection(db, "profiles"), (snap) => {
      const items = [];
      const map = new Map();
      snap.forEach((d) => {
        const data = { uid: d.id, ...d.data() };
        items.push(data);
        map.set(d.id, data);
      });
      items.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
      allProfilesList = items;
      profilesByUid = map;
      renderAllProfileViews();
      renderConnectionsSection();
    });

    // Escuchar muro social y fotos de portafolio
    onSnapshot(collection(db, "posts"), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      allPostsList = list;
      renderFeedAndOwnPortfolio();
      renderAllProfileViews();
    });

    // Filtros en perfiles.html, network y muro
    document.querySelectorAll("#profileFilterTabs .topic-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("#profileFilterTabs .topic-tab").forEach((b) => b.classList.remove("active"));
        tab.classList.add("active");
        directoryFilter = tab.dataset.filter || "all";
        renderAllProfileViews();
      });
    });

    document.getElementById("profileSearchInput")?.addEventListener("input", (e) => {
      directoryQuery = e.target.value || "";
      renderAllProfileViews();
    });

    // Selector de modo en perfiles.html (Directorio de Especialistas vs Panel Espejo de Reclutamiento)
    const publicEmpModeSwitch = document.getElementById("publicEmploymentModeSwitch");
    const specialistsZone = document.getElementById("specialistsDirectoryZone");
    const recruiterStage = document.getElementById("publicRecruiterMirrorStage");

    publicEmpModeSwitch?.querySelectorAll(".emp-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        publicEmpModeSwitch.querySelectorAll(".emp-tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.empMode;
        if (mode === "recruiter") {
          if (specialistsZone) specialistsZone.style.display = "none";
          if (recruiterStage) {
            recruiterStage.style.display = "block";
            renderRecruiterMirrorDirectory(recruiterStage, activeAuthUser);
          }
        } else {
          if (specialistsZone) specialistsZone.style.display = "block";
          if (recruiterStage) recruiterStage.style.display = "none";
        }
      });
    });

    document.getElementById("networkSearchInput")?.addEventListener("input", (e) => {
      networkQuery = e.target.value || "";
      renderAllProfileViews();
    });

    document.querySelectorAll("#feedFilterTabs .topic-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("#feedFilterTabs .topic-tab").forEach((b) => b.classList.remove("active"));
        tab.classList.add("active");
        feedFilter = tab.dataset.feedFilter || "all";
        renderFeedAndOwnPortfolio();
      });
    });

    document.getElementById("wsFeedSearchInput")?.addEventListener("input", (e) => {
      wsFeedQuery = e.target.value || "";
      renderFeedAndOwnPortfolio();
    });

    document.querySelectorAll("#wsFeedViewSwitch .view-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#wsFeedViewSwitch .view-mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        wsFeedViewMode = btn.dataset.wsView || "stream";
        renderFeedAndOwnPortfolio();
      });
    });

    // Buscador directo en Para ti (#forYouSearchInput en la barra superior)
    document.getElementById("forYouSearchInput")?.addEventListener("input", (e) => {
      forYouQuery = e.target.value || "";
      renderFeedAndOwnPortfolio();
    });

    // =========================================================
    // ESTUDIO DE CREACIÓN COMPLETO (VIDEO HASTA 5 MIN, FOTOS, CÓDIGO)
    // =========================================================
    const forYouAddPostBtn = document.getElementById("forYouAddPostBtn");
    const forYouCreateModal = document.getElementById("forYouCreateModal");
    const forYouCloseModalBtn = document.getElementById("forYouCloseModalBtn");
    const forYouCancelPostBtn = document.getElementById("forYouCancelPostBtn");

    let stagedStudioVideoFile = null;
    let stagedStudioVideoUrl = "";
    let stagedStudioVideoDuration = 0;
    let stagedStudioPhotoDataUrl = "";

    const checkVideoDuration = (file) => {
      return new Promise((resolve, reject) => {
        const vid = document.createElement("video");
        vid.preload = "metadata";
        const url = URL.createObjectURL(file);
        vid.src = url;
        vid.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(vid.duration || 0);
        };
        vid.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Formato de video no compatible"));
        };
      });
    };

    const formatVideoTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const resetStudioModal = () => {
      stagedStudioVideoFile = null;
      stagedStudioVideoUrl = "";
      stagedStudioVideoDuration = 0;
      stagedStudioPhotoDataUrl = "";

      const titleEl = document.getElementById("forYouPostTitle");
      const capEl = document.getElementById("forYouPostCaption");
      const counterEl = document.getElementById("forYouCharCounter");
      const feedback = document.getElementById("forYouComposerFeedback");
      if (titleEl) titleEl.value = "";
      if (capEl) capEl.value = "";
      if (counterEl) counterEl.textContent = "0 / 2800";
      if (feedback) feedback.textContent = "";

      // Reset Video
      const vSection = document.getElementById("forYouVideoSection");
      const vFileInput = document.getElementById("forYouVideoFileInput");
      const vUrlInput = document.getElementById("forYouVideoUrlInput");
      const vPreview = document.getElementById("forYouVideoPreviewCard");
      const vPlayer = document.getElementById("forYouVideoPlayer");
      const vMsg = document.getElementById("forYouVideoValidationMsg");
      if (vSection) vSection.hidden = true;
      if (vFileInput) vFileInput.value = "";
      if (vUrlInput) vUrlInput.value = "";
      if (vPreview) vPreview.hidden = true;
      if (vPlayer) vPlayer.src = "";
      if (vMsg) { vMsg.hidden = true; vMsg.textContent = ""; }

      // Reset Photo
      const pSection = document.getElementById("forYouPhotoSection");
      const pFileInput = document.getElementById("forYouPhotoInput");
      const pPreview = document.getElementById("forYouPhotoPreviewWrap");
      const pImg = document.getElementById("forYouPhotoPreviewImg");
      if (pSection) pSection.hidden = true;
      if (pFileInput) pFileInput.value = "";
      if (pPreview) pPreview.hidden = true;
      if (pImg) pImg.src = "";

      // Reset Code
      const cSection = document.getElementById("forYouCodeSection");
      const cTitle = document.getElementById("forYouCodeTitleInput");
      const cArea = document.getElementById("forYouCodeSnippetArea");
      if (cSection) cSection.hidden = true;
      if (cTitle) cTitle.value = "";
      if (cArea) cArea.value = "";

      // Reset tool buttons
      document.querySelectorAll(".studio-media-btn").forEach((b) => b.classList.remove("active"));
    };

    const openForYouCreateModal = () => {
      if (!activeAuthUser) {
        signInAndEnterWorkspace("para-ti.html");
        return;
      }
      if (!forYouCreateModal) return;

      const myProf = profilesByUid.get(activeAuthUser.uid);
      const av = document.getElementById("forYouModalAvatar");
      const nm = document.getElementById("forYouModalAuthorName");
      const hnd = document.getElementById("forYouModalAuthorHandle");

      if (av) av.src = activeAuthUser.photoURL || myProf?.photoURL || "favicon.svg";
      if (nm) nm.textContent = activeAuthUser.displayName || myProf?.displayName || "Tú";
      if (hnd) hnd.textContent = `@${myProf?.handle || activeAuthUser.email?.split("@")[0] || "usuario"}`;

      forYouCreateModal.hidden = false;
      forYouCreateModal.setAttribute("aria-hidden", "false");
      setTimeout(() => {
        document.getElementById("forYouPostCaption")?.focus();
      }, 60);
    };

    const closeForYouCreateModal = () => {
      if (!forYouCreateModal) return;
      forYouCreateModal.hidden = true;
      forYouCreateModal.setAttribute("aria-hidden", "true");
      resetStudioModal();
    };

    if (forYouAddPostBtn) forYouAddPostBtn.addEventListener("click", openForYouCreateModal);
    if (forYouCloseModalBtn) forYouCloseModalBtn.addEventListener("click", closeForYouCreateModal);
    if (forYouCancelPostBtn) forYouCancelPostBtn.addEventListener("click", closeForYouCreateModal);

    // Contador de caracteres en tiempo real
    document.getElementById("forYouPostCaption")?.addEventListener("input", (e) => {
      const len = e.target.value.length;
      const counter = document.getElementById("forYouCharCounter");
      if (counter) counter.textContent = `${len} / 2800`;
    });

    // Alternadores de módulos multimedia
    const vSec = document.getElementById("forYouVideoSection");
    const pSec = document.getElementById("forYouPhotoSection");
    const cSec = document.getElementById("forYouCodeSection");

    const vBtn = document.getElementById("forYouMediaVideoBtn");
    const pBtn = document.getElementById("forYouMediaPhotoBtn");
    const cBtn = document.getElementById("forYouMediaCodeBtn");

    vBtn?.addEventListener("click", () => {
      if (!vSec) return;
      vSec.hidden = !vSec.hidden;
      vBtn.classList.toggle("active", !vSec.hidden);
      if (!vSec.hidden) document.getElementById("forYouVideoUrlInput")?.focus();
    });

    pBtn?.addEventListener("click", () => {
      if (!pSec) return;
      pSec.hidden = !pSec.hidden;
      pBtn.classList.toggle("active", !pSec.hidden);
      if (!pSec.hidden) document.getElementById("forYouPhotoInput")?.click();
    });

    cBtn?.addEventListener("click", () => {
      if (!cSec) return;
      cSec.hidden = !cSec.hidden;
      cBtn.classList.toggle("active", !cSec.hidden);
      if (!cSec.hidden) document.getElementById("forYouCodeTitleInput")?.focus();
    });

    document.getElementById("forYouDismissVideoSectionBtn")?.addEventListener("click", () => {
      if (vSec) vSec.hidden = true;
      vBtn?.classList.remove("active");
      stagedStudioVideoFile = null;
      stagedStudioVideoUrl = "";
      stagedStudioVideoDuration = 0;
      const vPlayer = document.getElementById("forYouVideoPlayer");
      if (vPlayer) vPlayer.src = "";
      document.getElementById("forYouVideoPreviewCard")?.setAttribute("hidden", "true");
    });

    document.getElementById("forYouDismissPhotoSectionBtn")?.addEventListener("click", () => {
      if (pSec) pSec.hidden = true;
      pBtn?.classList.remove("active");
      stagedStudioPhotoDataUrl = "";
      document.getElementById("forYouPhotoPreviewWrap")?.setAttribute("hidden", "true");
    });

    document.getElementById("forYouDismissCodeSectionBtn")?.addEventListener("click", () => {
      if (cSec) cSec.hidden = true;
      cBtn?.classList.remove("active");
      const cArea = document.getElementById("forYouCodeSnippetArea");
      if (cArea) cArea.value = "";
    });

    // Control de Video: Selección y VALIDACIÓN ESTRICTA DE DURACIÓN (MÁX. 5 MINUTOS = 300 SEG)
    const vFileInput = document.getElementById("forYouVideoFileInput");
    const vUrlInput = document.getElementById("forYouVideoUrlInput");
    const vPreviewCard = document.getElementById("forYouVideoPreviewCard");
    const vPlayer = document.getElementById("forYouVideoPlayer");
    const vStatus = document.getElementById("forYouVideoDurationStatus");
    const vValMsg = document.getElementById("forYouVideoValidationMsg");

    document.getElementById("forYouSelectVideoFileBtn")?.addEventListener("click", () => {
      vFileInput?.click();
    });

    vFileInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (vValMsg) { vValMsg.hidden = true; vValMsg.textContent = ""; }
      if (vStatus) vStatus.textContent = "Validando duración de video...";

      try {
        const duration = await checkVideoDuration(file);
        // Validar límite estricto de 5 minutos (300 segundos)
        if (duration > 300) {
          e.target.value = "";
          stagedStudioVideoFile = null;
          stagedStudioVideoDuration = 0;
          stagedStudioVideoUrl = "";
          if (vPreviewCard) vPreviewCard.hidden = true;
          if (vPlayer) vPlayer.src = "";
          if (vValMsg) {
            vValMsg.hidden = false;
            vValMsg.textContent = `El video supera el límite de 5 minutos (Duración detectada: ${formatVideoTime(duration)}). Selecciona un video de hasta 5:00 minutos o utiliza un enlace externo.`;
          }
          return;
        }

        // Duración válida (<= 5 minutos)
        stagedStudioVideoFile = file;
        stagedStudioVideoDuration = Math.round(duration);

        // Convertir o crear URL para reproducción en vivo
        const objectUrl = URL.createObjectURL(file);
        stagedStudioVideoUrl = objectUrl;

        // Intentar compresión/dataUrl si es ligero para persistencia
        if (file.size < 950000) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) stagedStudioVideoUrl = evt.target.result;
          };
          reader.readAsDataURL(file);
        }

        if (vPlayer) vPlayer.src = objectUrl;
        if (vStatus) {
          vStatus.textContent = `${formatVideoTime(duration)} / 05:00 · Duración válida ✓`;
        }
        if (vPreviewCard) vPreviewCard.hidden = false;
        if (vValMsg) { vValMsg.hidden = true; }
      } catch (err) {
        if (vValMsg) {
          vValMsg.hidden = false;
          vValMsg.textContent = "No se pudo leer la duración del archivo. Asegúrate de subir un formato de video compatible (MP4, WebM o MOV).";
        }
      }
    });

    document.getElementById("forYouClearVideoPreviewBtn")?.addEventListener("click", () => {
      if (vFileInput) vFileInput.value = "";
      stagedStudioVideoFile = null;
      stagedStudioVideoUrl = "";
      stagedStudioVideoDuration = 0;
      if (vPreviewCard) vPreviewCard.hidden = true;
      if (vPlayer) vPlayer.src = "";
      if (vValMsg) { vValMsg.hidden = true; vValMsg.textContent = ""; }
    });

    vUrlInput?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        stagedStudioVideoUrl = url;
        if (vValMsg) vValMsg.hidden = true;
      }
    });

    // Control de Foto / Portada
    const pFileInput = document.getElementById("forYouPhotoInput");
    const pPreviewWrap = document.getElementById("forYouPhotoPreviewWrap");
    const pPreviewImg = document.getElementById("forYouPhotoPreviewImg");

    document.getElementById("forYouSelectPhotoBtn")?.addEventListener("click", () => {
      pFileInput?.click();
    });

    pFileInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        let dataUrl = await compressImageDataUrl(file, 1280, 0.82);
        if (dataUrl.length > 750000) dataUrl = await compressImageDataUrl(file, 960, 0.7);
        stagedStudioPhotoDataUrl = dataUrl;
        if (pPreviewImg) pPreviewImg.src = dataUrl;
        if (pPreviewWrap) pPreviewWrap.hidden = false;
      } catch {
        // Fallback simple
      }
    });

    document.getElementById("forYouClearPhotoPreviewBtn")?.addEventListener("click", () => {
      stagedStudioPhotoDataUrl = "";
      if (pPreviewWrap) pPreviewWrap.hidden = true;
      if (pPreviewImg) pPreviewImg.src = "";
    });

    // Cerrar al hacer clic en el backdrop oscuro
    forYouCreateModal?.addEventListener("click", (e) => {
      if (e.target === forYouCreateModal) {
        closeForYouCreateModal();
      }
    });

    // Cerrar con la tecla [Escape]
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && forYouCreateModal && !forYouCreateModal.hidden) {
        closeForYouCreateModal();
      }
    });

    // Envío del Estudio de Publicación Completo
    document.getElementById("forYouComposerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeAuthUser || !cloudHooks.publishPost) {
        signInAndEnterWorkspace("para-ti.html");
        return;
      }

      const titleEl = document.getElementById("forYouPostTitle");
      const capEl = document.getElementById("forYouPostCaption");
      const codeArea = document.getElementById("forYouCodeSnippetArea");
      const codeTitle = document.getElementById("forYouCodeTitleInput");
      const codeLang = document.getElementById("forYouCodeLangSelect");

      const postTitle = (titleEl?.value || "").trim();
      const caption = (capEl?.value || "").trim();
      const codeText = (codeArea?.value || "").trim();

      const finalVideoUrl = (stagedStudioVideoUrl || vUrlInput?.value || "").trim();

      let codeSnippet = null;
      if (codeText) {
        codeSnippet = {
          code: codeText,
          title: (codeTitle?.value || "").trim() || "Snippet de código",
          language: codeLang?.value || "javascript"
        };
      }

      if (!caption && !finalVideoUrl && !stagedStudioPhotoDataUrl && !codeSnippet && !postTitle) {
        capEl?.focus();
        return;
      }

      let mediaType = "none";
      if (finalVideoUrl) mediaType = "video";
      else if (stagedStudioPhotoDataUrl) mediaType = "photo";
      else if (codeSnippet) mediaType = "code";

      const finalCaption = caption || postTitle || (mediaType === "video" ? "Muestra de video" : "Publicación");

      const feedback = document.getElementById("forYouComposerFeedback");
      const publishBtn = document.getElementById("forYouPublishBtn");
      if (publishBtn) publishBtn.disabled = true;
      if (feedback) feedback.textContent = "Publicando en Para ti...";

      try {
        await cloudHooks.publishPost({
          title: postTitle,
          caption: finalCaption,
          kind: mediaType === "video" ? "video" : mediaType === "photo" ? "photo" : mediaType === "code" ? "code_snippet" : "post",
          mediaType,
          videoUrl: finalVideoUrl,
          videoDurationSec: stagedStudioVideoDuration || null,
          photoUrl: stagedStudioPhotoDataUrl,
          codeSnippet
        });

        if (feedback) feedback.textContent = "Publicado con éxito ✓";
        setTimeout(() => {
          closeForYouCreateModal();
        }, 550);
      } catch (err) {
        if (feedback) feedback.textContent = "Error al publicar. Inténtalo de nuevo.";
      } finally {
        if (publishBtn) publishBtn.disabled = false;
      }
    });

    // Cerrar menús desplegables de opciones al hacer clic fuera con transición fluida
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".feed-post-options-wrap")) {
        document.querySelectorAll(".feed-options-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
        document.querySelectorAll(".feed-options-btn.active").forEach((b) => b.classList.remove("active"));
      }
    });

    // Publicador del Muro Social con foto adjunta
    let stagedFeedPhotoDataUrl = "";
    const feedPhotoInput = document.getElementById("feedPhotoInput");
    const feedPhotoPreviewWrap = document.getElementById("feedPhotoPreviewWrap");
    const feedPhotoPreviewImg = document.getElementById("feedPhotoPreviewImg");
    const feedComposerFeedback = document.getElementById("feedComposerFeedback");

    // Controles multimedia en Muro Social (Video y Código)
    const feedVideoWrap = document.getElementById("feedVideoInputWrap");
    const feedVideoUrlInput = document.getElementById("feedVideoUrlInput");
    const feedCodeWrap = document.getElementById("feedCodeSnippetWrap");
    const feedCodeTitleInput = document.getElementById("feedCodeTitleInput");
    const feedCodeLangSelect = document.getElementById("feedCodeLangSelect");
    const feedCodeSnippetArea = document.getElementById("feedCodeSnippetArea");
    const feedPostKind = document.getElementById("feedPostKind");

    document.getElementById("feedToggleVideoBtn")?.addEventListener("click", () => {
      if (!feedVideoWrap) return;
      const isHidden = feedVideoWrap.style.display === "none" || !feedVideoWrap.style.display;
      feedVideoWrap.style.display = isHidden ? "block" : "none";
      if (isHidden) feedVideoUrlInput?.focus();
    });

    document.getElementById("feedToggleCodeBtn")?.addEventListener("click", () => {
      if (!feedCodeWrap) return;
      const isHidden = feedCodeWrap.style.display === "none" || !feedCodeWrap.style.display;
      feedCodeWrap.style.display = isHidden ? "flex" : "none";
      if (isHidden) feedCodeSnippetArea?.focus();
    });

    feedPostKind?.addEventListener("change", () => {
      const val = feedPostKind.value;
      if (val === "video" && feedVideoWrap) {
        feedVideoWrap.style.display = "block";
        feedVideoUrlInput?.focus();
      } else if (val === "code_snippet" && feedCodeWrap) {
        feedCodeWrap.style.display = "flex";
        feedCodeSnippetArea?.focus();
      }
    });

    document.getElementById("feedAttachPhotoBtn")?.addEventListener("click", () => {
      feedPhotoInput?.click();
    });

    feedPhotoInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        if (feedComposerFeedback) feedComposerFeedback.textContent = "Optimizando foto...";
        let dataUrl = await compressImageDataUrl(file, 1280, 0.8);
        if (dataUrl.length > 740000) dataUrl = await compressImageDataUrl(file, 960, 0.68);
        stagedFeedPhotoDataUrl = dataUrl;
        if (feedPhotoPreviewImg) feedPhotoPreviewImg.src = dataUrl;
        if (feedPhotoPreviewWrap) feedPhotoPreviewWrap.hidden = false;
        if (feedComposerFeedback) feedComposerFeedback.textContent = "Foto lista para publicar ✓";
      } catch {
        if (feedComposerFeedback) feedComposerFeedback.textContent = "Formato de imagen no compatible.";
      }
    });

    document.getElementById("feedRemovePhotoBtn")?.addEventListener("click", () => {
      stagedFeedPhotoDataUrl = "";
      if (feedPhotoPreviewWrap) feedPhotoPreviewWrap.hidden = true;
      if (feedComposerFeedback) feedComposerFeedback.textContent = "";
    });

    document.getElementById("feedComposerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeAuthUser || !cloudHooks.publishPost) return;
      const capEl = document.getElementById("feedPostCaption");
      const kindEl = document.getElementById("feedPostKind");
      const caption = (capEl?.value || "").trim();

      const videoUrl = (feedVideoUrlInput?.value || "").trim();
      const codeText = (feedCodeSnippetArea?.value || "").trim();
      const codeTitle = (feedCodeTitleInput?.value || "").trim() || "Snippet de código";
      const codeLang = feedCodeLangSelect?.value || "javascript";

      let codeSnippet = null;
      if (codeText) {
        codeSnippet = { code: codeText, title: codeTitle, language: codeLang };
      }

      let mediaType = "none";
      if (stagedFeedPhotoDataUrl) mediaType = "photo";
      else if (videoUrl) mediaType = "video";
      else if (codeSnippet) mediaType = "code";

      if (!caption && !stagedFeedPhotoDataUrl && !videoUrl && !codeSnippet) {
        capEl?.focus();
        return;
      }

      const finalCaption = caption || (mediaType === "video" ? "Muestra de video" : mediaType === "code" ? codeTitle : "Publicación en portafolio");

      const btn = document.getElementById("feedPublishBtn");
      if (btn) btn.disabled = true;
      await cloudHooks
        .publishPost({
          kind: kindEl?.value || (mediaType === "video" ? "video" : mediaType === "code" ? "code_snippet" : "portfolio"),
          caption: finalCaption,
          photoUrl: stagedFeedPhotoDataUrl,
          mediaType,
          videoUrl,
          codeSnippet
        })
        .catch(() => {});

      if (capEl) capEl.value = "";
      stagedFeedPhotoDataUrl = "";
      if (feedPhotoPreviewWrap) feedPhotoPreviewWrap.hidden = true;
      if (feedVideoUrlInput) feedVideoUrlInput.value = "";
      if (feedVideoWrap) feedVideoWrap.style.display = "none";
      if (feedCodeSnippetArea) feedCodeSnippetArea.value = "";
      if (feedCodeTitleInput) feedCodeTitleInput.value = "";
      if (feedCodeWrap) feedCodeWrap.style.display = "none";

      if (feedComposerFeedback) feedComposerFeedback.textContent = "Publicado en el muro y en tu perfil ✓";
      if (btn) btn.disabled = false;
    });

    // Subir foto rápida directamente desde Mi Perfil
    const profileQuickPhotoInput = document.getElementById("profileQuickPhotoInput");
    document.getElementById("profileQuickPhotoBtn")?.addEventListener("click", () => {
      profileQuickPhotoInput?.click();
    });
    profileQuickPhotoInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeAuthUser || !cloudHooks.publishPost) return;
      const capInput = document.getElementById("profileQuickPhotoCaption");
      const caption = (capInput?.value || "").trim() || "Fotografía de portafolio";
      try {
        let dataUrl = await compressImageDataUrl(file, 1280, 0.8);
        if (dataUrl.length > 740000) dataUrl = await compressImageDataUrl(file, 960, 0.68);
        await cloudHooks.publishPost({
          kind: "portfolio",
          caption,
          photoUrl: dataUrl
        });
        if (capInput) capInput.value = "";
      } catch {
        // Ignorar
      }
    });

    // =========================================================
    // CONEXIONES / AMIGOS DE CONFIANZA
    // =========================================================
    let unsubscribeConnections = null;
    const renderConnectionsSection = () => {
      const pendingSec = document.getElementById("pendingConnectionsSection");
      const pendingList = document.getElementById("pendingConnectionsList");
      const friendsList = document.getElementById("acceptedFriendsList");
      const badgeReq = document.getElementById("badgeRequestsCount");

      if (!activeAuthUser) return;

      const incoming = [];
      const accepted = [];
      myConnectionsMap.forEach((conn, otherUid) => {
        if (conn.status === "accepted") {
          accepted.push({ otherUid, conn });
        } else if (conn.status === "pending" && conn.requesterUid !== activeAuthUser.uid) {
          incoming.push({ otherUid, conn });
        }
      });

      if (badgeReq) badgeReq.textContent = String(incoming.length);

      if (pendingSec && pendingList) {
        pendingList.textContent = "";
        pendingSec.hidden = incoming.length === 0;
        incoming.forEach(({ otherUid }) => {
          const prof = profilesByUid.get(otherUid);
          const isCreator = isCreatorAccount(prof?.internalId, otherUid);
          const row = document.createElement("div");
          row.className = "open-row";
          const info = document.createElement("div");
          const t = document.createElement("span");
          t.className = "open-row-title";
          t.style.display = "inline-flex";
          t.style.alignItems = "center";
          t.style.gap = "8px";
          t.style.flexWrap = "wrap";
          const nameTxt = document.createElement("span");
          nameTxt.textContent = `${prof?.displayName || "Usuario"} (@${prof?.handle || "miembro"})`;
          t.appendChild(nameTxt);
          if (isCreator) t.appendChild(createCreatorBadgeEl(true));
          const s = document.createElement("span");
          s.className = "open-row-sub";
          s.textContent = isAdminUser(activeAuthUser)
            ? `${prof?.role || "Quiere conectar contigo"} · ID: ${prof?.internalId || deriveInternalId(otherUid)}`
            : `${prof?.role || "Quiere conectar contigo"}`;
          info.appendChild(t);
          info.appendChild(s);

          const acts = document.createElement("div");
          acts.className = "inline-actions";
          const accBtn = document.createElement("button");
          accBtn.type = "button";
          accBtn.className = "btn btn-white btn-sm";
          accBtn.textContent = "Aceptar contacto";
          accBtn.addEventListener("click", () => cloudHooks.acceptConnection?.(otherUid));
          acts.appendChild(accBtn);

          row.appendChild(info);
          row.appendChild(acts);
          pendingList.appendChild(row);
        });
      }

      if (friendsList) {
        friendsList.textContent = "";
        if (accepted.length === 0) {
          const p = document.createElement("p");
          p.style.fontSize = "0.86rem";
          p.style.color = "var(--muted)";
          p.style.padding = "12px 0";
          p.textContent =
            "Aún no tienes contactos agregados. Agrega especialistas abajo o acepta una solicitud de mensaje.";
          friendsList.appendChild(p);
        } else {
          accepted.forEach(({ otherUid }) => {
            const prof = profilesByUid.get(otherUid);
            const isCreator = isCreatorAccount(prof?.internalId, otherUid);
            const row = document.createElement("div");
            row.className = "open-row";
            const info = document.createElement("div");
            const t = document.createElement("span");
            t.className = "open-row-title";
            t.style.display = "inline-flex";
            t.style.alignItems = "center";
            t.style.gap = "8px";
            t.style.flexWrap = "wrap";
            const nameTxt = document.createElement("span");
            nameTxt.textContent = `${prof?.displayName || "Contacto"} (@${prof?.handle || "usuario"})`;
            t.appendChild(nameTxt);
            if (isCreator) t.appendChild(createCreatorBadgeEl(true));
            const s = document.createElement("span");
            s.className = "open-row-sub";
            s.textContent = isAdminUser(activeAuthUser)
              ? `${prof?.role || "Especialista"} · ${prof?.internalId || deriveInternalId(otherUid)}`
              : `${prof?.role || "Especialista"}`;
            info.appendChild(t);
            info.appendChild(s);

            const acts = document.createElement("div");
            acts.className = "inline-actions";
            const viewBtn = document.createElement("button");
            viewBtn.type = "button";
            viewBtn.className = "text-action-btn";
            viewBtn.textContent = "Ver perfil y ★";
            viewBtn.addEventListener("click", () => renderInspectorContent(otherUid));

            const chatBtn = document.createElement("button");
            chatBtn.type = "button";
            chatBtn.className = "btn btn-white btn-sm";
            chatBtn.textContent = "Chatear →";
            chatBtn.addEventListener("click", () => {
              switchWorkspaceTab("messages");
              cloudHooks.openChatWithPeer?.(otherUid);
            });

            acts.appendChild(viewBtn);
            acts.appendChild(chatBtn);
            row.appendChild(info);
            row.appendChild(acts);
            friendsList.appendChild(row);
          });
        }
      }
    };

    const attachConnectionsListener = (user) => {
      if (unsubscribeConnections) unsubscribeConnections();
      const qConn = query(collection(db, "connections"), where("users", "array-contains", user.uid));
      unsubscribeConnections = onSnapshot(qConn, (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          const data = d.data();
          const other = (data.users || []).find((u) => u !== user.uid);
          if (other) map.set(other, { id: d.id, ...data });
        });
        myConnectionsMap = map;
        renderConnectionsSection();
      });
    };

    // =========================================================
    // MENSAJERÍA CIFRADA AES-256-GCM + REGLA DE 1 MENSAJE (1/1)
    // =========================================================
    let unsubscribeConversations = null;
    let unsubscribeActiveConvDoc = null;
    let unsubscribeActiveMessages = null;
    let selectedConvId = null;
    let selectedPeerUid = null;
    let selectedPeerProfile = null;
    let activeConvData = null;

    const conversationsListEl = document.getElementById("conversationsList");
    const chatEmptyStateEl = document.getElementById("chatEmptyState");
    const chatActiveThreadEl = document.getElementById("chatActiveThread");
    const chatPendingBannerEl = document.getElementById("chatPendingBanner");
    const chatMessagesStreamEl = document.getElementById("chatMessagesStream");
    const chatComposeForm = document.getElementById("chatComposeForm");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const chatSendBtn = document.getElementById("chatSendBtn");

    const syncChatGateBannerAndComposer = () => {
      const me = auth.currentUser;
      if (!me || !activeConvData || !chatPendingBannerEl || !chatMessageInput || !chatSendBtn) return;

      const status = activeConvData.status || "accepted";
      const msgCount = Number(activeConvData.messageCount) || 0;
      const iAmInitiator = activeConvData.initiatorUid === me.uid;

      chatPendingBannerEl.textContent = "";

      if (status === "blocked") {
        chatPendingBannerEl.hidden = false;
        const p = document.createElement("p");
        p.textContent = "Esta conversación fue bloqueada por seguridad. No se pueden enviar mensajes.";
        chatPendingBannerEl.appendChild(p);
        chatMessageInput.disabled = true;
        chatSendBtn.disabled = true;
        chatMessageInput.placeholder = "Conversación bloqueada";
        return;
      }

      if (status === "pending") {
        chatPendingBannerEl.hidden = false;
        if (iAmInitiator) {
          const p = document.createElement("p");
          if (msgCount < 1) {
            p.textContent =
              "No están en contactos: por seguridad puedes enviar 1 único mensaje de presentación hasta que acepte hablar contigo.";
            chatMessageInput.disabled = false;
            chatSendBtn.disabled = false;
            chatMessageInput.placeholder = "Escribe tu único mensaje inicial de presentación...";
          } else {
            p.textContent =
              "Solicitud enviada (1/1 mensaje permitido). Podrás seguir escribiendo en cuanto esta persona acepte tu solicitud.";
            chatMessageInput.disabled = true;
            chatSendBtn.disabled = true;
            chatMessageInput.placeholder = "Esperando aceptación del destinatario...";
          }
          chatPendingBannerEl.appendChild(p);
        } else {
          const p = document.createElement("p");
          p.textContent =
            "Solicitud de conversación de alguien que aún no está en tus contactos. ¿Aceptas hablar y conectar?";
          const acts = document.createElement("div");
          acts.className = "inline-actions";

          const acceptBtn = document.createElement("button");
          acceptBtn.type = "button";
          acceptBtn.className = "btn btn-white btn-sm";
          acceptBtn.textContent = "Aceptar conversación y agregar contacto";
          acceptBtn.addEventListener("click", async () => {
            if (!selectedConvId || !selectedPeerUid) return;
            await setDoc(
              doc(db, "conversations", selectedConvId),
              { status: "accepted", updatedAtMs: Date.now() },
              { merge: true }
            );
            await cloudHooks.acceptConnection?.(selectedPeerUid).catch(() => {});
          });

          const blockBtn = document.createElement("button");
          blockBtn.type = "button";
          blockBtn.className = "btn btn-ghost btn-sm";
          blockBtn.textContent = "Rechazar / Bloquear";
          blockBtn.addEventListener("click", async () => {
            if (!selectedConvId) return;
            await setDoc(
              doc(db, "conversations", selectedConvId),
              { status: "blocked", updatedAtMs: Date.now() },
              { merge: true }
            );
          });

          acts.appendChild(acceptBtn);
          acts.appendChild(blockBtn);
          chatPendingBannerEl.appendChild(p);
          chatPendingBannerEl.appendChild(acts);

          chatMessageInput.disabled = false;
          chatSendBtn.disabled = false;
          chatMessageInput.placeholder = "Responde o pulsa Aceptar arriba para desbloquear el chat...";
        }
        return;
      }

      // Conversación aceptada
      chatPendingBannerEl.hidden = true;
      chatMessageInput.disabled = false;
      chatSendBtn.disabled = false;
      chatMessageInput.placeholder = "Escribe un mensaje cifrado (AES-256-GCM)...";
    };

    const openDirectChatWith = async (peerUid) => {
      const me = auth.currentUser;
      if (!me || !peerUid || peerUid === me.uid || !chatActiveThreadEl) return;

      const convId = [me.uid, peerUid].sort().join("_");
      selectedConvId = convId;
      selectedPeerUid = peerUid;

      const peerSnap = await getDoc(doc(db, "profiles", peerUid)).catch(() => null);
      selectedPeerProfile = peerSnap?.exists()
        ? { uid: peerUid, ...peerSnap.data() }
        : { uid: peerUid, displayName: "Miembro", handle: "usuario", role: "" };

      const peerIdCode = selectedPeerProfile.internalId || deriveInternalId(peerUid);
      const areFriends = myConnectionsMap.get(peerUid)?.status === "accepted";

      const convRef = doc(db, "conversations", convId);
      const convSnap = await getDoc(convRef).catch(() => null);

      const myMeta = {
        displayName: currentOwnProfile?.displayName || me.displayName || "Especialista",
        handle: currentOwnProfile?.handle || "usuario",
        photoURL: me.photoURL || "",
        internalId: deriveInternalId(me.uid)
      };
      const peerMeta = {
        displayName: selectedPeerProfile.displayName || "Miembro",
        handle: selectedPeerProfile.handle || "usuario",
        photoURL: selectedPeerProfile.photoURL || "",
        internalId: peerIdCode
      };

      if (!convSnap || !convSnap.exists()) {
        const initialConv = {
          participants: [me.uid, peerUid],
          participantProfiles: {
            [me.uid]: myMeta,
            [peerUid]: peerMeta
          },
          status: areFriends ? "accepted" : "pending",
          initiatorUid: me.uid,
          messageCount: 0,
          lastCiphertext: "",
          lastIv: "",
          updatedAtMs: Date.now(),
          createdAt: serverTimestamp()
        };
        await setDoc(convRef, initialConv);
        activeConvData = initialConv;
      } else {
        activeConvData = convSnap.data();
        if (areFriends && activeConvData.status === "pending") {
          await setDoc(convRef, { status: "accepted" }, { merge: true }).catch(() => {});
          activeConvData.status = "accepted";
        }
      }

      if (chatEmptyStateEl) chatEmptyStateEl.hidden = true;
      chatActiveThreadEl.hidden = false;

      const avEl = document.getElementById("chatPeerAvatar");
      const nmEl = document.getElementById("chatPeerName");
      const hnEl = document.getElementById("chatPeerHandle");
      const idEl = document.getElementById("chatPeerIdTag");
      const rlEl = document.getElementById("chatPeerRole");
      const peerIsCreator = isCreatorAccount(peerIdCode, peerUid);

      if (avEl) {
        avEl.src = selectedPeerProfile.photoURL || "favicon.svg";
        avEl.classList.toggle("creator-avatar-ring", peerIsCreator);
        avEl.onerror = () => {
          avEl.src = "favicon.svg";
        };
      }
      if (nmEl) nmEl.textContent = selectedPeerProfile.displayName || "Especialista";
      mountCreatorBadgeSlot(document.getElementById("chatPeerCreatorSlot"), peerIsCreator, true);
      if (hnEl) hnEl.textContent = `@${selectedPeerProfile.handle || "usuario"}`;
      if (idEl) {
        idEl.textContent = peerIdCode;
        idEl.onclick = () => copyTextWithFeedback(peerIdCode, idEl);
      }
      if (rlEl) {
        rlEl.textContent = `${selectedPeerProfile.role || "Especialista"} · Cifrado AES-256-GCM`;
      }

      const inspBtn = document.getElementById("chatInspectPeerBtn");
      if (inspBtn) inspBtn.onclick = () => renderInspectorContent(peerUid);

      const repBtn = document.getElementById("chatReportPeerBtn");
      if (repBtn) {
        repBtn.onclick = () => {
          switchWorkspaceTab("settings");
          const inp = document.getElementById("reportTargetIdInput");
          if (inp) {
            inp.value = peerIdCode;
            document.getElementById("reportReasonInput")?.focus();
          }
        };
      }

      document.querySelectorAll(".conv-item-open").forEach((b) => {
        b.classList.toggle("active", b.dataset.convId === convId);
      });

      if (unsubscribeActiveConvDoc) unsubscribeActiveConvDoc();
      unsubscribeActiveConvDoc = onSnapshot(convRef, (dSnap) => {
        if (dSnap.exists()) {
          activeConvData = dSnap.data();
          syncChatGateBannerAndComposer();
        }
      });

      syncChatGateBannerAndComposer();

      if (unsubscribeActiveMessages) unsubscribeActiveMessages();
      const msgsQuery = query(
        collection(db, "conversations", convId, "messages"),
        orderBy("createdAtMs", "asc")
      );

      unsubscribeActiveMessages = onSnapshot(msgsQuery, async (snap) => {
        if (!chatMessagesStreamEl) return;
        const docs = [];
        snap.forEach((mDoc) => docs.push(mDoc.data()));

        const decryptedList = await Promise.all(
          docs.map(async (m) => ({
            ...m,
            plain: await decryptChatPayload(
              m,
              convId,
              myCryptoKeys?.privateKeyJwk,
              selectedPeerProfile?.publicKeyJwk
            )
          }))
        );

        chatMessagesStreamEl.textContent = "";
        if (decryptedList.length === 0) {
          const hint = document.createElement("div");
          hint.className = "chat-msg-rail";
          const p = document.createElement("p");
          p.className = "chat-msg-text";
          p.style.color = "var(--muted)";
          p.textContent =
            "Canal cifrado listo. Escribe abajo para presentar tu propuesta o iniciar conversación.";
          hint.appendChild(p);
          chatMessagesStreamEl.appendChild(hint);
          return;
        }

        decryptedList.forEach((m) => {
          const isOwn = m.senderUid === me.uid;
          const rail = document.createElement("div");
          rail.className = isOwn ? "chat-msg-rail own-msg" : "chat-msg-rail";

          const meta = document.createElement("span");
          meta.className = "chat-msg-meta mono";
          meta.textContent = `${isOwn ? "TÚ" : (m.senderName || selectedPeerProfile?.displayName || "CONTACTO").toUpperCase()} · CIFRADO · ${formatDateEs(m.createdAtMs)}`;

          const txt = document.createElement("p");
          txt.className = "chat-msg-text";
          txt.textContent = m.plain || "";

          rail.appendChild(meta);
          rail.appendChild(txt);
          chatMessagesStreamEl.appendChild(rail);
        });

        chatMessagesStreamEl.scrollTop = chatMessagesStreamEl.scrollHeight;
      });
    };

    cloudHooks.openChatWithPeer = openDirectChatWith;

    chatComposeForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const me = auth.currentUser;
      const text = (chatMessageInput?.value || "").trim();
      if (!me || !selectedConvId || !selectedPeerUid || !text) return;

      // Si el destinatario responde a una solicitud pendiente, aceptarla automáticamente
      if (activeConvData?.status === "pending" && activeConvData.initiatorUid !== me.uid) {
        await setDoc(
          doc(db, "conversations", selectedConvId),
          { status: "accepted", updatedAtMs: Date.now() },
          { merge: true }
        );
        await cloudHooks.acceptConnection?.(selectedPeerUid).catch(() => {});
      } else if (
        activeConvData?.status === "pending" &&
        activeConvData.initiatorUid === me.uid &&
        (Number(activeConvData.messageCount) || 0) >= 1
      ) {
        syncChatGateBannerAndComposer();
        return;
      }

      chatMessageInput.value = "";
      const senderName = currentOwnProfile?.displayName || me.displayName || "Especialista";
      const nowMs = Date.now();

      const encrypted = await encryptChatText(
        text,
        selectedConvId,
        myCryptoKeys?.privateKeyJwk,
        selectedPeerProfile?.publicKeyJwk
      );

      await addDoc(collection(db, "conversations", selectedConvId, "messages"), {
        senderUid: me.uid,
        senderName,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        encMode: encrypted.encMode,
        createdAtMs: nowMs,
        createdAt: serverTimestamp()
      });

      const nextCount = (Number(activeConvData?.messageCount) || 0) + 1;
      await setDoc(
        doc(db, "conversations", selectedConvId),
        {
          messageCount: nextCount,
          lastCiphertext: encrypted.ciphertext,
          lastIv: encrypted.iv,
          lastEncMode: encrypted.encMode,
          lastSenderUid: me.uid,
          updatedAtMs: nowMs,
          [`participantProfiles.${me.uid}`]: {
            displayName: senderName,
            handle: currentOwnProfile?.handle || "usuario",
            photoURL: me.photoURL || "",
            internalId: deriveInternalId(me.uid)
          }
        },
        { merge: true }
      );
    });

    const attachConversationsListener = (user) => {
      if (!conversationsListEl) return;
      if (unsubscribeConversations) unsubscribeConversations();

      const convQ = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
      unsubscribeConversations = onSnapshot(convQ, async (snap) => {
        const convs = [];
        snap.forEach((d) => convs.push({ id: d.id, ...d.data() }));
        convs.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));

        const badgeMsgs = document.getElementById("badgeMsgsCount");
        if (badgeMsgs) badgeMsgs.textContent = String(convs.length);

        conversationsListEl.textContent = "";
        if (convs.length === 0) {
          const emptyP = document.createElement("p");
          emptyP.style.fontSize = "0.84rem";
          emptyP.style.color = "var(--muted)";
          emptyP.textContent = "Aún no tienes conversaciones.";
          conversationsListEl.appendChild(emptyP);
          return;
        }

        for (const c of convs) {
          const otherUid = (c.participants || []).find((id) => id !== user.uid) || "";
          const otherInfo = c.participantProfiles?.[otherUid] || profilesByUid.get(otherUid) || {};
          const peerPub = profilesByUid.get(otherUid)?.publicKeyJwk;

          let previewStr = "Canal cifrado activo";
          if (c.status === "pending" && c.initiatorUid !== user.uid) {
            previewStr = "● Solicitud de mensaje nueva";
          } else if (c.lastCiphertext && c.lastIv) {
            const dec = await decryptChatPayload(
              { ciphertext: c.lastCiphertext, iv: c.lastIv, encMode: c.lastEncMode },
              c.id,
              myCryptoKeys?.privateKeyJwk,
              peerPub
            );
            previewStr = dec.slice(0, 60);
          } else if (c.lastMessage) {
            previewStr = c.lastMessage;
          }

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "conv-item-open";
          btn.dataset.convId = c.id;
          if (c.id === selectedConvId) btn.classList.add("active");

          const peerIsCreator = isCreatorAccount(otherInfo.internalId, otherUid);
          const img = document.createElement("img");
          img.className = peerIsCreator ? "conv-item-avatar creator-avatar-ring" : "conv-item-avatar";
          img.src = otherInfo.photoURL || "favicon.svg";
          img.alt = "";
          img.onerror = () => {
            img.src = "favicon.svg";
          };

          const col = document.createElement("div");
          col.className = "conv-item-text";

          const nm = document.createElement("span");
          nm.className = "conv-item-name";
          nm.style.display = "inline-flex";
          nm.style.alignItems = "center";
          nm.style.gap = "6px";
          nm.style.flexWrap = "wrap";
          const nmTxt = document.createElement("span");
          nmTxt.textContent = otherInfo.displayName || "Conversación";
          nm.appendChild(nmTxt);
          if (peerIsCreator) nm.appendChild(createCreatorBadgeEl(true));

          const prev = document.createElement("span");
          prev.className = "conv-item-preview";
          prev.textContent = previewStr;

          col.appendChild(nm);
          col.appendChild(prev);
          btn.appendChild(img);
          btn.appendChild(col);
          btn.addEventListener("click", () => openDirectChatWith(otherUid));
          conversationsListEl.appendChild(btn);
        }
      });
    };

    // =========================================================
    // COMUNIDADES EN TIEMPO REAL
    // =========================================================
    let customCommunities = [];
    let selectedCommunityId = "oportunidades";
    let unsubscribeCommMessages = null;

    const communitiesRailListEl = document.getElementById("communitiesRailList");
    const communityMessagesStreamEl = document.getElementById("communityMessagesStream");

    const openCommunityChannel = (commObj) => {
      if (!commObj || !communityMessagesStreamEl) return;
      selectedCommunityId = commObj.id;

      const tEl = document.getElementById("activeCommTitle");
      const dEl = document.getElementById("activeCommDesc");
      if (tEl) tEl.textContent = `${commObj.slug} · ${commObj.title}`;
      if (dEl) dEl.textContent = commObj.description || "";

      document.querySelectorAll(".comm-channel-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.commId === commObj.id);
      });

      if (unsubscribeCommMessages) unsubscribeCommMessages();
      const qMsgs = query(
        collection(db, "communities", commObj.id, "messages"),
        orderBy("createdAtMs", "asc")
      );
      unsubscribeCommMessages = onSnapshot(qMsgs, (snap) => {
        communityMessagesStreamEl.textContent = "";
        if (snap.empty) {
          const hint = document.createElement("div");
          hint.className = "chat-msg-rail";
          const p = document.createElement("p");
          p.className = "chat-msg-text";
          p.style.color = "var(--muted)";
          p.textContent = `Sé el primero en publicar en ${commObj.slug}.`;
          hint.appendChild(p);
          communityMessagesStreamEl.appendChild(hint);
          return;
        }

        snap.forEach((d) => {
          const m = d.data();
          if (bannedUsersMap.has(m.senderUid)) return;
          const isOwn = activeAuthUser && m.senderUid === activeAuthUser.uid;
          const rail = document.createElement("div");
          rail.className = isOwn ? "chat-msg-rail own-msg" : "chat-msg-rail";

          const meta = document.createElement("span");
          meta.className = "chat-msg-meta mono";
          meta.style.cursor = "pointer";
          meta.style.display = "inline-flex";
          meta.style.alignItems = "center";
          meta.style.gap = "8px";
          meta.style.flexWrap = "wrap";
          const senderTag = document.createElement("span");
          senderTag.textContent = (m.senderName || "MIEMBRO").toUpperCase();
          meta.appendChild(senderTag);
          if (isCreatorAccount(m.senderInternalId, m.senderUid)) {
            meta.appendChild(createCreatorBadgeEl(true));
          }
          const restTag = document.createElement("span");
          restTag.textContent = `(@${m.senderHandle || "usuario"} · ${m.senderInternalId || deriveInternalId(m.senderUid)}) · ${formatDateEs(m.createdAtMs)}`;
          meta.appendChild(restTag);
          meta.addEventListener("click", () => renderInspectorContent(m.senderUid));

          const txt = document.createElement("p");
          txt.className = "chat-msg-text";
          txt.textContent = m.text || "";

          rail.appendChild(meta);
          rail.appendChild(txt);
          communityMessagesStreamEl.appendChild(rail);
        });

        communityMessagesStreamEl.scrollTop = communityMessagesStreamEl.scrollHeight;
      });
    };

    const renderCommunitiesRail = () => {
      if (!communitiesRailListEl) return;
      communitiesRailListEl.textContent = "";
      const merged = [...BUILTIN_COMMUNITIES];
      customCommunities.forEach((c) => {
        if (!merged.some((m) => m.id === c.id)) merged.push(c);
      });

      merged.forEach((comm) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = comm.id === selectedCommunityId ? "comm-channel-btn active" : "comm-channel-btn";
        btn.dataset.commId = comm.id;

        const title = document.createElement("span");
        title.className = "comm-channel-title";
        title.textContent = comm.title;

        const sub = document.createElement("span");
        sub.className = "comm-channel-sub mono";
        sub.textContent = comm.slug;

        btn.appendChild(title);
        btn.appendChild(sub);
        btn.addEventListener("click", () => openCommunityChannel(comm));
        communitiesRailListEl.appendChild(btn);
      });
    };

    if (communitiesRailListEl) {
      onSnapshot(collection(db, "communities"), (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        customCommunities = arr;
        renderCommunitiesRail();
      });
      renderCommunitiesRail();
      openCommunityChannel(BUILTIN_COMMUNITIES[0]);
    }

    const createCommForm = document.getElementById("createCommunityForm");
    document.getElementById("toggleCreateCommBtn")?.addEventListener("click", () => {
      if (createCommForm) createCommForm.hidden = !createCommForm.hidden;
    });
    document.getElementById("cancelCreateCommBtn")?.addEventListener("click", () => {
      if (createCommForm) createCommForm.hidden = true;
    });

    createCommForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!auth.currentUser) return;
      const title = (document.getElementById("newCommTitle")?.value || "").trim();
      const rawSlug = (document.getElementById("newCommSlug")?.value || "").trim();
      const description = (document.getElementById("newCommDesc")?.value || "").trim();
      if (!title || !rawSlug) return;

      const cleanId = sanitizeHandle(rawSlug, title).replace(/\./g, "-");
      const slug = `#${cleanId}`;
      const newComm = {
        title,
        slug,
        description,
        creatorUid: auth.currentUser.uid,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "communities", cleanId), newComm, { merge: true });
      createCommForm.reset();
      createCommForm.hidden = true;
      openCommunityChannel({ id: cleanId, ...newComm });
    });

    document.getElementById("communityComposeForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const me = auth.currentUser;
      const inp = document.getElementById("communityMessageInput");
      const text = (inp?.value || "").trim();
      if (!me || !text || !selectedCommunityId) return;
      inp.value = "";
      await addDoc(collection(db, "communities", selectedCommunityId, "messages"), {
        senderUid: me.uid,
        senderInternalId: currentOwnProfile?.internalId || deriveInternalId(me.uid),
        senderName: currentOwnProfile?.displayName || me.displayName || "Especialista",
        senderHandle: currentOwnProfile?.handle || "usuario",
        text,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    });

    // =========================================================
    // REPORTES Y PANEL DE BANEO POR ID INTERNO (ADMINISTRADOR)
    // =========================================================
    document.getElementById("reportByIdForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInp = document.getElementById("reportTargetIdInput");
      const rsInp = document.getElementById("reportReasonInput");
      const fb = document.getElementById("reportFeedback");
      const targetIdCode = (idInp?.value || "").trim();
      const reason = (rsInp?.value || "").trim();
      if (!targetIdCode || !reason || !cloudHooks.sendReportById) return;

      await cloudHooks.sendReportById({ targetIdCode, reason }).catch(() => {});
      if (idInp) idInp.value = "";
      if (rsInp) rsInp.value = "";
      if (fb) {
        fb.hidden = false;
        fb.textContent = `Reporte sobre ${targetIdCode.toUpperCase()} enviado al equipo de seguridad ✓`;
      }
    });

    document.getElementById("adminBanByIdForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const qInp = document.getElementById("adminTargetIdInput");
      const rInp = document.getElementById("adminBanReasonInput");
      const fb = document.getElementById("adminBanFeedback");
      const targetQuery = (qInp?.value || "").trim();
      const reason = (rInp?.value || "").trim();
      if (!targetQuery || !cloudHooks.adminBanUser) return;
      try {
        const bannedId = await cloudHooks.adminBanUser({ targetQuery, reason });
        if (fb) {
          fb.hidden = false;
          fb.textContent = `Cuenta ${bannedId} suspendida permanentemente en toda la red ✓`;
        }
      } catch (err) {
        if (fb) {
          fb.hidden = false;
          fb.textContent = err?.message || "No se pudo aplicar el baneo.";
        }
      }
    });

    document.getElementById("adminUnbanBtn")?.addEventListener("click", async () => {
      const qInp = document.getElementById("adminTargetIdInput");
      const fb = document.getElementById("adminBanFeedback");
      const targetQuery = (qInp?.value || "").trim();
      if (!targetQuery || !cloudHooks.adminUnbanUser) return;
      try {
        const unbannedId = await cloudHooks.adminUnbanUser(targetQuery);
        if (fb) {
          fb.hidden = false;
          fb.textContent = `Acceso restaurado para ${unbannedId} ✓`;
        }
      } catch (err) {
        if (fb) {
          fb.hidden = false;
          fb.textContent = err?.message || "No se encontró baneo activo.";
        }
      }
    });

    let unsubscribeAdminReports = null;
    const attachAdminReportsListener = (user) => {
      if (unsubscribeAdminReports) unsubscribeAdminReports();
      if (!isAdminUser(user)) return;
      const listEl = document.getElementById("adminReportsList");
      if (!listEl) return;

      unsubscribeAdminReports = onSnapshot(collection(db, "reports"), (snap) => {
        const reps = [];
        snap.forEach((d) => reps.push({ id: d.id, ...d.data() }));
        reps.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

        listEl.textContent = "";
        if (reps.length === 0 && bannedUsersMap.size === 0) {
          const p = document.createElement("p");
          p.style.fontSize = "0.86rem";
          p.style.color = "var(--muted)";
          p.textContent = "No hay reportes pendientes ni cuentas baneadas actualmente.";
          listEl.appendChild(p);
          return;
        }

        reps.forEach((r) => {
          const item = document.createElement("article");
          item.className = "submission-entry";
          const meta = document.createElement("span");
          meta.className = "mono";
          meta.style.fontSize = "0.74rem";
          meta.style.color = "var(--muted)";
          meta.textContent = `REPORTE CONTRA ${r.targetInternalId} (@${r.targetHandle || "?"}) · POR ${r.reporterInternalId} · ${formatDateEs(r.createdAtMs)}`;

          const body = document.createElement("p");
          body.style.fontSize = "0.9rem";
          body.style.color = "var(--silver-bright)";
          body.textContent = r.reason || "";

          const act = document.createElement("button");
          act.type = "button";
          act.className = "text-action-btn";
          act.textContent = `Cargar ${r.targetInternalId} arriba para banear`;
          act.addEventListener("click", () => {
            const inp = document.getElementById("adminTargetIdInput");
            const rs = document.getElementById("adminBanReasonInput");
            if (inp) inp.value = r.targetInternalId;
            if (rs) rs.value = r.reason || "Reporte verificado";
          });

          item.appendChild(meta);
          item.appendChild(body);
          item.appendChild(act);
          listEl.appendChild(item);
        });
      });
    };

    let unsubscribeAdminPendingComments = null;
    const attachAdminModerationListener = (user) => {
      if (unsubscribeAdminPendingComments) unsubscribeAdminPendingComments();
      if (!isAdminUser(user)) return;

      const pendingListEl = document.getElementById("adminPendingCommentsList");
      const badgeCount = document.getElementById("adminPendingCountBadge");
      if (!pendingListEl) return;

      if (cloudHooks.subscribeAdminPendingComments) {
        unsubscribeAdminPendingComments = cloudHooks.subscribeAdminPendingComments((pendingList) => {
          if (badgeCount) badgeCount.textContent = `${pendingList.length} EN REVISIÓN`;
          pendingListEl.textContent = "";

          if (pendingList.length === 0) {
            const emptyP = document.createElement("p");
            emptyP.style.fontSize = "0.86rem";
            emptyP.style.color = "var(--muted)";
            emptyP.textContent = "Bandeja limpia: no hay comentarios en duda pendientes de moderación ✓";
            pendingListEl.appendChild(emptyP);
            return;
          }

          pendingList.forEach((item) => {
            const card = document.createElement("article");
            card.className = "moderation-comment-card";

            const meta = document.createElement("div");
            meta.className = "comment-meta";

            const left = document.createElement("div");
            left.style.display = "flex";
            left.style.alignItems = "center";
            left.style.gap = "8px";
            left.style.flexWrap = "wrap";

            const nameStrong = document.createElement("strong");
            nameStrong.style.fontSize = "0.85rem";
            nameStrong.textContent = item.authorName || "Especialista";

            const handleSpan = document.createElement("span");
            handleSpan.className = "mono";
            handleSpan.style.fontSize = "0.74rem";
            handleSpan.style.color = "var(--muted)";
            handleSpan.textContent = `@${item.authorHandle || "usuario"} (${item.authorInternalId || "ID"})`;

            const scorePill = document.createElement("span");
            const authorScore = item.authorScore ?? 10;
            scorePill.className = `conduct-pill mono score-${authorScore <= 3 ? "bad" : authorScore <= 7 ? "warn" : "good"}`;
            scorePill.textContent = `Conducta: ${authorScore}/10`;

            left.appendChild(nameStrong);
            left.appendChild(handleSpan);
            left.appendChild(scorePill);

            const reasonSpan = document.createElement("span");
            reasonSpan.className = "mono";
            reasonSpan.style.fontSize = "0.72rem";
            reasonSpan.style.color = "var(--gold)";
            reasonSpan.textContent = item.flagReason || "Expresión ambigua";

            meta.appendChild(left);
            meta.appendChild(reasonSpan);

            const txt = document.createElement("p");
            txt.className = "post-comment-text";
            txt.style.background = "rgba(0,0,0,0.3)";
            txt.style.padding = "10px 14px";
            txt.style.borderLeft = "2px solid var(--gold)";
            txt.textContent = `«${item.commentText || ""}»`;

            const actions = document.createElement("div");
            actions.className = "comment-actions";

            // Botón 1: Aprobar
            const approveBtn = document.createElement("button");
            approveBtn.type = "button";
            approveBtn.className = "btn btn-white btn-sm";
            approveBtn.style.fontSize = "0.74rem";
            approveBtn.textContent = "✓ Aprobar comentario";
            approveBtn.addEventListener("click", async () => {
              approveBtn.disabled = true;
              await cloudHooks.adminApproveComment?.({
                pendingId: item.id,
                postId: item.postId,
                commentId: item.commentId
              });
            });
            actions.appendChild(approveBtn);

            // Botón 2: Eliminar y sancionar (-2 puntos de conducta)
            const sanctionBtn = document.createElement("button");
            sanctionBtn.type = "button";
            sanctionBtn.className = "btn btn-ghost btn-sm";
            sanctionBtn.style.fontSize = "0.74rem";
            sanctionBtn.style.color = "#f1c40f";
            sanctionBtn.textContent = "✕ Eliminar y sancionar (-2 pts)";
            sanctionBtn.addEventListener("click", async () => {
              sanctionBtn.disabled = true;
              await cloudHooks.adminRejectAndSanctionComment?.({
                pendingId: item.id,
                postId: item.postId,
                commentId: item.commentId,
                authorUid: item.authorUid
              });
            });
            actions.appendChild(sanctionBtn);

            // Botón 3: Banear cuenta permanente (1/10)
            const banBtn = document.createElement("button");
            banBtn.type = "button";
            banBtn.className = "text-action-btn";
            banBtn.style.fontSize = "0.74rem";
            banBtn.style.color = "#ff5555";
            banBtn.textContent = "🚫 Banear cuenta (1/10)";
            banBtn.addEventListener("click", async () => {
              if (confirm(`¿Banear permanentemente la cuenta de ${item.authorName} y fijar conducta en 1/10?`)) {
                banBtn.disabled = true;
                await cloudHooks.adminBanFromComment?.({
                  pendingId: item.id,
                  postId: item.postId,
                  commentId: item.commentId,
                  authorUid: item.authorUid
                });
              }
            });
            actions.appendChild(banBtn);

            card.appendChild(meta);
            card.appendChild(txt);
            card.appendChild(actions);
            pendingListEl.appendChild(card);
          });
        });
      }
    };

    // Formulario de gestión manual de conducta (1 al 10)
    document.getElementById("adminConductScoreForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const targetInp = document.getElementById("adminConductTargetInput");
      const scoreSel = document.getElementById("adminConductScoreSelect");
      const noteInp = document.getElementById("adminConductNoteInput");
      const fb = document.getElementById("adminConductFeedback");

      const target = (targetInp?.value || "").trim();
      const score = Number(scoreSel?.value) || 10;
      const note = (noteInp?.value || "").trim();

      if (!target || !cloudHooks.adminUpdateUserConduct) return;
      try {
        await cloudHooks.adminUpdateUserConduct(target, score, note);
        if (fb) {
          fb.hidden = false;
          fb.textContent = `Conducta de ${target} actualizada a ${score}/10 (${getConductLabel(score)}) ✓`;
        }
      } catch (err) {
        if (fb) {
          fb.hidden = false;
          fb.textContent = err?.message || "Error al actualizar conducta.";
        }
      }
    });

    // Escuchar baúl privado del usuario
    let unsubscribeVault = null;
    const attachVaultListener = (user) => {
      if (unsubscribeVault) unsubscribeVault();
      if (!document.getElementById("authenticatedWorkspace")) return;
      unsubscribeVault = onSnapshot(collection(db, "users", user.uid, "projects"), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        currentVaultItems = list;
        renderCloudVaultList();
      });
    };

    // Estado global de sesión de Google
    onAuthStateChanged(auth, async (user) => {
      activeAuthUser = user;
      sendHeartbeat();

      if (user) {
        if (navSignInBtn) navSignInBtn.hidden = true;
        if (navUserChip) navUserChip.hidden = false;
        if (navUserAvatar) {
          navUserAvatar.src = user.photoURL || "favicon.svg";
          navUserAvatar.classList.toggle("creator-avatar-ring", isCreatorAccount("", user.uid));
          navUserAvatar.onerror = () => {
            navUserAvatar.src = "favicon.svg";
          };
        }
        const shortName = (user.displayName || user.email || "Cuenta").split(" ")[0];
        if (navUserName) navUserName.textContent = shortName;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Entrar a mi perfil profesional";

        const myInternalId = deriveInternalId(user.uid);
        const dockBadge = document.getElementById("dockInternalIdBadge");
        if (dockBadge) dockBadge.textContent = `ID: ${myInternalId}`;

        if (navUserAvatar) {
          const isCreator = isCreatorAccount(myInternalId, user.uid);
          navUserAvatar.classList.toggle("creator-avatar-ring", isCreator);
        }

        await ensureUserCryptoKeys(user);
        await ensureUserProfileExists(user);

        const myTier = isCreatorAccount(myInternalId, user.uid) ? "creator" : (currentOwnProfile?.membershipTier || "standard");
        const dockHandleEl = document.getElementById("dockUserHandle");
        if (dockHandleEl) {
          dockHandleEl.textContent = `@${currentOwnProfile?.handle || sanitizeHandle(user.email?.split("@")[0] || "usuario")}`;
        }
        const dockCreatorSlot = document.getElementById("dockCreatorSlot");
        if (dockCreatorSlot) {
          mountCreatorBadgeSlot(dockCreatorSlot, isCreatorAccount(myInternalId, user.uid), true, myTier);
        }

        const sessionCache = {
          uid: user.uid,
          displayName: currentOwnProfile?.displayName || user.displayName || user.email || "Cuenta",
          handle: currentOwnProfile?.handle || sanitizeHandle(user.email?.split("@")[0] || "usuario"),
          email: user.email || "",
          photoURL: currentOwnProfile?.photoURL || user.photoURL || "",
          internalId: myInternalId,
          membershipTier: myTier
        };
        try {
          localStorage.setItem("xuanii_auth_session", JSON.stringify(sessionCache));
          document.documentElement.classList.add("xuanii-auth-cached");
        } catch (e) {}

        if (navUserAvatar) {
          const isCreator = isCreatorAccount(myInternalId, user.uid);
          navUserAvatar.classList.toggle("creator-avatar-ring", isCreator);
          navUserAvatar.classList.toggle("pro-avatar-ring", myTier === "pro");
          navUserAvatar.classList.toggle("plus-avatar-ring", myTier === "plus");
        }

        prefillKnownUserFields();
        renderAccountWorkspace();
        attachConnectionsListener(user);
        attachVaultListener(user);
        attachConversationsListener(user);
        attachAdminReportsListener(user);
        attachAdminModerationListener(user);

        // Cargar creadores seguidos y publicaciones guardadas
        const cachedFollowing = readJson(`endha_following_${user.uid}`, []);
        const profFollowing = Array.isArray(currentOwnProfile?.following) ? currentOwnProfile.following : cachedFollowing;
        myFollowingSet = new Set(profFollowing);

        const cachedSaved = readJson(`endha_saved_${user.uid}`, []);
        const profSaved = Array.isArray(currentOwnProfile?.savedPosts) ? currentOwnProfile.savedPosts : cachedSaved;
        mySavedPostsSet = new Set(profSaved);

        renderFeedAndOwnPortfolio();

        if (requestedChatUid && requestedChatUid !== user.uid) {
          switchWorkspaceTab("messages");
          await openDirectChatWith(requestedChatUid);
        }

        await setDoc(
          doc(db, "users", user.uid),
          {
            internalId: deriveInternalId(user.uid),
            displayName: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            lastLoginAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => {});
      } else {
        try {
          localStorage.removeItem("xuanii_auth_session");
          document.documentElement.classList.remove("xuanii-auth-cached");
        } catch (e) {}
        cachedAuthSession = null;
        currentOwnProfile = null;
        myCryptoKeys = null;
        myConnectionsMap = new Map();
        currentVaultItems = [];
        renderCloudVaultList();
        if (unsubscribeConnections) unsubscribeConnections();
        if (unsubscribeVault) unsubscribeVault();
        if (unsubscribeConversations) unsubscribeConversations();
        if (unsubscribeActiveConvDoc) unsubscribeActiveConvDoc();
        if (unsubscribeActiveMessages) unsubscribeActiveMessages();
        if (unsubscribeAdminReports) unsubscribeAdminReports();
        if (unsubscribeAdminPendingComments) unsubscribeAdminPendingComments();
        myFollowingSet.clear();
        mySavedPostsSet.clear();
        if (navSignInBtn) navSignInBtn.hidden = false;
        if (navUserChip) navUserChip.hidden = true;
        if (navUserAvatar) {
          navUserAvatar.classList.remove("creator-avatar-ring", "pro-avatar-ring", "plus-avatar-ring");
        }
        const dockBadge = document.getElementById("dockInternalIdBadge");
        if (dockBadge) dockBadge.textContent = "ID: XN-00000000";
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Crear mi perfil con Google";
        if (onboardingModal) onboardingModal.hidden = true;
        renderAccountWorkspace();
        renderFeedAndOwnPortfolio();
      }
    });
  })();
}
