/* =========================================================
   1. CONSTANTES, ETIQUETAS Y UTILIDADES GENERALES
   ========================================================= */
const STORAGE_KEYS = {
  WAITLIST: "xuanii_waitlist",
  SUBMISSIONS: "xuanii_submissions"
};

const ADMIN_EMAIL = "thexsactc@gmail.com";

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
  portfolio: "MUESTRA DE PORTAFOLIO",
  job: "OFERTA / BÚSQUEDA DE TALENTO",
  available: "DISPONIBLE PARA TRABAJAR"
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
  deletePost: null,
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
   5. NAVEGACIÓN DE LA RED PROFESIONAL (CUENTA.HTML)
   ========================================================= */
const ALL_WS_TABS = ["feed", "network", "messages", "communities", "profile", "files", "settings"];
const wsNavButtons = document.querySelectorAll("[data-ws-tab]");

const switchWorkspaceTab = (tabName) => {
  if (!ALL_WS_TABS.includes(tabName)) return;
  wsNavButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.wsTab === tabName);
  });
  ALL_WS_TABS.forEach((key) => {
    const panel = document.getElementById(`wsPanel-${key}`);
    if (panel) panel.hidden = key !== tabName;
  });
};

wsNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchWorkspaceTab(btn.dataset.wsTab);
  });
});

const urlParams = new URLSearchParams(window.location.search);
const requestedTab = urlParams.get("tab");
const requestedChatUid = urlParams.get("chat");
if (requestedChatUid) {
  switchWorkspaceTab("messages");
} else if (requestedTab && ALL_WS_TABS.includes(requestedTab)) {
  switchWorkspaceTab(requestedTab);
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

  const idEl = document.getElementById("inspInternalId");
  if (idEl) {
    idEl.textContent = `ID: ${internalId}`;
    idEl.onclick = () => copyTextWithFeedback(internalId, idEl);
  }

  const avatarEl = document.getElementById("inspAvatar");
  if (avatarEl) {
    avatarEl.src = prof.photoURL || "favicon.svg";
    avatarEl.onerror = () => {
      avatarEl.src = "favicon.svg";
    };
  }

  const nameEl = document.getElementById("inspName");
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
  if (bioEl) {
    bioEl.textContent = prof.bio || "Sin descripción detallada aún.";
  }
  renderSkillTagsInto(skillsEl, prof.skills);

  // Botones de acción (Conectar, Enviar mensaje cifrado, Reportar ID)
  if (actionsEl) {
    actionsEl.textContent = "";
    const isMe = activeAuthUser && activeAuthUser.uid === targetUid;

    if (isMe) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-ghost btn-sm";
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
      const msgBtn = document.createElement("button");
      msgBtn.type = "button";
      msgBtn.className = "btn btn-white btn-sm";
      msgBtn.textContent = "Mensaje cifrado →";
      msgBtn.addEventListener("click", () => {
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
          connBtn.textContent = "+ Agregar a contactos";
          connBtn.addEventListener("click", async () => {
            connBtn.disabled = true;
            await cloudHooks.requestConnection?.(targetUid).catch(() => {});
            renderInspectorContent(targetUid);
          });
        } else if (conn.status === "accepted") {
          connBtn.textContent = "Contacto aceptado ✓";
          connBtn.disabled = true;
        } else if (conn.requesterUid === activeAuthUser.uid) {
          connBtn.textContent = "Solicitud enviada";
          connBtn.disabled = true;
        } else {
          connBtn.textContent = "Aceptar solicitud de contacto";
          connBtn.addEventListener("click", async () => {
            connBtn.disabled = true;
            await cloudHooks.acceptConnection?.(targetUid).catch(() => {});
            renderInspectorContent(targetUid);
          });
        }
        actionsEl.appendChild(connBtn);

        const repBtn = document.createElement("button");
        repBtn.type = "button";
        repBtn.className = "text-action-btn";
        repBtn.textContent = `Reportar ${internalId}`;
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
            window.location.href = "cuenta.html?tab=settings";
          }
        });
        actionsEl.appendChild(repBtn);
      }
    }
  }

  // Galería fotográfica del portafolio del usuario
  const portEl = document.getElementById("inspPortfolioList");
  if (portEl) {
    portEl.textContent = "";
    const userPosts = allPostsList.filter((p) => p.authorUid === targetUid);
    if (userPosts.length === 0) {
      const p = document.createElement("p");
      p.style.fontSize = "0.86rem";
      p.style.color = "var(--muted)";
      p.textContent = "Este especialista aún no ha subido muestras fotográficas a su portafolio.";
      portEl.appendChild(p);
    } else {
      userPosts.forEach((post) => {
        const card = document.createElement("div");
        card.className = "portfolio-shot";
        if (post.photoUrl) {
          const img = document.createElement("img");
          img.src = post.photoUrl;
          img.alt = post.caption || "Trabajo";
          card.appendChild(img);
        }
        const foot = document.createElement("div");
        foot.className = "portfolio-shot-foot";
        const cap = document.createElement("span");
        cap.textContent = (post.caption || "Publicación").slice(0, 80);
        foot.appendChild(cap);
        card.appendChild(foot);
        portEl.appendChild(card);
      });
    }
  }

  // Formulario y lista de valoraciones con estrellas
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
        const head = document.createElement("span");
        head.className = "mono";
        head.style.fontSize = "0.75rem";
        head.style.color = "var(--silver)";
        const starsStr = "★".repeat(r.stars || 5) + "☆".repeat(Math.max(0, 5 - (r.stars || 5)));
        head.textContent = `${starsStr} · ${r.reviewerName || "Usuario"} (@${r.reviewerHandle || "miembro"}) · ${formatDateEs(r.updatedAtMs)}`;

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

document.getElementById("previewOwnInspectorBtn")?.addEventListener("click", () => {
  if (activeAuthUser) renderInspectorContent(activeAuthUser.uid);
});

// Constructor de fila de especialista para perfiles.html y networkExploreList
const createProfileDirectoryRow = (prof, signInCallback) => {
  const row = document.createElement("article");
  row.className = "profile-open-row";

  const internalId = prof.internalId || deriveInternalId(prof.uid);
  const stats = getRatingStats(prof.uid);

  const left = document.createElement("div");
  left.className = "profile-identity";

  const avatar = document.createElement("img");
  avatar.className = "profile-avatar-lg";
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
  nameLine.appendChild(handleSpan);
  nameLine.appendChild(idSpan);

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
      thumb.addEventListener("click", () => renderInspectorContent(prof.uid));
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
    profilePreviewInternalId.textContent = `ID: ${idCode}`;
    profilePreviewInternalId.onclick = () => copyTextWithFeedback(idCode, profilePreviewInternalId);
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

  const isBanned = Boolean(activeAuthUser && bannedUsersMap.has(activeAuthUser.uid));

  if (authGateEl && workspaceEl) {
    if (!activeAuthUser) {
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

  if (activeAuthUser) {
    const myId = currentOwnProfile?.internalId || deriveInternalId(activeAuthUser.uid);
    const myStats = getRatingStats(activeAuthUser.uid);

    const sideAvatar = document.getElementById("studioSideAvatar");
    const sideName = document.getElementById("studioSideName");
    const sideHandle = document.getElementById("studioSideHandle");
    const sideIdBadge = document.getElementById("studioSideIdBadge");
    const sideStars = document.getElementById("studioSideStars");
    const settingsId = document.getElementById("settingsInternalId");
    const userStatusEl = document.getElementById("accountUserStatus");
    const userSubEl = document.getElementById("accountUserSub");

    if (sideAvatar) {
      sideAvatar.src = currentOwnProfile?.photoURL || activeAuthUser.photoURL || "favicon.svg";
      sideAvatar.onerror = () => {
        sideAvatar.src = "favicon.svg";
      };
    }
    if (sideName) {
      sideName.textContent = currentOwnProfile?.displayName || activeAuthUser.displayName || "Mi cuenta";
    }
    if (sideHandle) {
      sideHandle.textContent = `@${currentOwnProfile?.handle || sanitizeHandle(activeAuthUser.email?.split("@")[0])}`;
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
    if (userStatusEl) {
      userStatusEl.textContent = activeAuthUser.displayName || activeAuthUser.email || "Conectado";
    }
    if (userSubEl) {
      userSubEl.textContent = activeAuthUser.email || "OAuth 2.0 activo.";
    }

    // Mostrar panel de moderación exclusivamente al propietario
    const adminPanel = document.getElementById("adminModerationPanel");
    if (adminPanel) {
      adminPanel.hidden = activeAuthUser.email !== ADMIN_EMAIL;
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
    priority: "Activado desde red profesional",
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

prefillKnownUserFields();
renderAccountWorkspace();
renderCloudVaultList();

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
        ...(myCryptoKeys?.publicKeyJwk ? { publicKeyJwk: myCryptoKeys.publicKeyJwk } : {}),
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
      currentOwnProfile = { ...(currentOwnProfile || {}), ...payload };
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

    cloudHooks.publishPost = async ({ kind, caption, photoUrl }) => {
      const user = auth.currentUser;
      if (!user) return;
      const prof = currentOwnProfile || {};
      await addDoc(collection(db, "posts"), {
        authorUid: user.uid,
        authorInternalId: prof.internalId || deriveInternalId(user.uid),
        authorName: prof.displayName || user.displayName || "Especialista",
        authorHandle: prof.handle || sanitizeHandle(user.email?.split("@")[0]),
        authorAvatar: prof.photoURL || user.photoURL || "",
        authorRole: prof.role || CATEGORY_LABELS[prof.category] || "Especialista digital",
        kind: kind || "portfolio",
        caption: String(caption || "").slice(0, 2200),
        photoUrl: photoUrl || "",
        likes: [],
        createdAtMs: Date.now(),
        createdAt: serverTimestamp()
      });
    };

    cloudHooks.toggleLikePost = async (postId, currentlyLiked) => {
      const user = auth.currentUser;
      if (!user || !postId) return;
      await updateDoc(doc(db, "posts", postId), {
        likes: currentlyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    };

    cloudHooks.deletePost = async (postId) => {
      if (!auth.currentUser || !postId) return;
      await deleteDoc(doc(db, "posts", postId));
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
      if (matched?.uid === auth.currentUser?.uid) throw new Error("No puedes suspender tu propia cuenta administradora.");
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
        window.location.href = destinationUrl;
        return;
      }
      try {
        const cred = await signInWithPopup(auth, provider);
        if (cred?.user) {
          const onAccountPage = window.location.pathname.endsWith("cuenta.html");
          if (!onAccountPage || destinationUrl !== "cuenta.html") {
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

    const handleSignOut = async () => {
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
    // ESCUCHAS GLOBALES: BANEOS, RESEÑAS, PERFILES Y PUBLICACIONES
    // =========================================================
    let directoryFilter = "all";
    let directoryQuery = "";
    let networkQuery = "";
    let feedFilter = "all";

    const profilesListEl = document.getElementById("profilesDirectoryList");
    const networkExploreListEl = document.getElementById("networkExploreList");
    const socialFeedStreamEl = document.getElementById("socialFeedStream");
    const ownPortfolioGridEl = document.getElementById("ownProfilePortfolioGrid");

    const renderAllProfileViews = () => {
      const visibleProfiles = allProfilesList.filter(
        (p) => p.isPublic !== false && !bannedUsersMap.has(p.uid)
      );

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

      if (inspectedProfileUid) {
        renderInspectorContent(inspectedProfileUid);
      }
    };

    const renderFeedAndOwnPortfolio = () => {
      const cleanPosts = allPostsList.filter((p) => !bannedUsersMap.has(p.authorUid));

      // Muro social en cuenta.html
      if (socialFeedStreamEl) {
        socialFeedStreamEl.textContent = "";
        const filtered = cleanPosts.filter((p) => {
          if (feedFilter === "portfolio") return p.kind === "portfolio";
          if (feedFilter === "job") return p.kind === "job" || p.kind === "available";
          return true;
        });

        if (filtered.length === 0) {
          const empty = document.createElement("div");
          empty.className = "arch-col";
          const idx = document.createElement("span");
          idx.className = "col-index mono";
          idx.textContent = "ESTRENA EL MURO";
          const p = document.createElement("p");
          p.textContent =
            "Sube la primera fotografía de un trabajo terminado o publica una búsqueda de especialista arriba.";
          empty.appendChild(idx);
          empty.appendChild(p);
          socialFeedStreamEl.appendChild(empty);
        } else {
          filtered.forEach((post) => {
            const art = document.createElement("article");
            art.className = "feed-post-open";

            const head = document.createElement("div");
            head.className = "feed-post-head";

            const authorBox = document.createElement("div");
            authorBox.className = "feed-author-info";
            authorBox.addEventListener("click", () => renderInspectorContent(post.authorUid));

            const av = document.createElement("img");
            av.className = "feed-author-avatar";
            av.src = post.authorAvatar || "favicon.svg";
            av.alt = "";
            av.onerror = () => {
              av.src = "favicon.svg";
            };

            const meta = document.createElement("div");
            const nm = document.createElement("div");
            nm.className = "profile-name-line";
            const strong = document.createElement("strong");
            strong.style.fontSize = "0.95rem";
            strong.textContent = post.authorName || "Especialista";
            const hnd = document.createElement("span");
            hnd.className = "profile-handle mono";
            hnd.textContent = `@${post.authorHandle || "usuario"} · ${post.authorInternalId || deriveInternalId(post.authorUid)}`;
            nm.appendChild(strong);
            nm.appendChild(hnd);

            const sub = document.createElement("span");
            sub.className = "open-row-sub";
            sub.style.marginTop = "0";
            sub.textContent = `${post.authorRole || "Especialista"} · ${formatDateEs(post.createdAtMs)}`;

            meta.appendChild(nm);
            meta.appendChild(sub);
            authorBox.appendChild(av);
            authorBox.appendChild(meta);

            const kindBadge = document.createElement("span");
            kindBadge.className = "feed-post-kind mono";
            kindBadge.textContent = POST_KIND_LABELS[post.kind] || "PUBLICACIÓN";

            head.appendChild(authorBox);
            head.appendChild(kindBadge);
            art.appendChild(head);

            if (post.caption) {
              const cap = document.createElement("p");
              cap.className = "feed-post-caption";
              cap.textContent = post.caption;
              art.appendChild(cap);
            }

            if (post.photoUrl) {
              const frame = document.createElement("div");
              frame.className = "post-photo-frame";
              const img = document.createElement("img");
              img.src = post.photoUrl;
              img.alt = "Muestra de trabajo";
              frame.appendChild(img);
              art.appendChild(frame);
            }

            const bar = document.createElement("div");
            bar.className = "post-actions-bar";

            const likesArr = Array.isArray(post.likes) ? post.likes : [];
            const likedByMe = Boolean(activeAuthUser && likesArr.includes(activeAuthUser.uid));

            const likeBtn = document.createElement("button");
            likeBtn.type = "button";
            likeBtn.className = likedByMe ? "post-like-btn liked" : "post-like-btn";
            likeBtn.textContent = `${likedByMe ? "♥" : "♡"} ${likesArr.length} Me gusta`;
            likeBtn.addEventListener("click", () => {
              cloudHooks.toggleLikePost?.(post.id, likedByMe);
            });
            bar.appendChild(likeBtn);

            const inspectBtn = document.createElement("button");
            inspectBtn.type = "button";
            inspectBtn.className = "text-action-btn";
            inspectBtn.textContent = "Ver perfil / ★";
            inspectBtn.addEventListener("click", () => renderInspectorContent(post.authorUid));
            bar.appendChild(inspectBtn);

            if (activeAuthUser && post.authorUid !== activeAuthUser.uid) {
              const contactBtn = document.createElement("button");
              contactBtn.type = "button";
              contactBtn.className = "text-action-btn";
              contactBtn.textContent = "Enviar mensaje";
              contactBtn.addEventListener("click", () => {
                switchWorkspaceTab("messages");
                cloudHooks.openChatWithPeer?.(post.authorUid);
              });
              bar.appendChild(contactBtn);
            }

            if (
              activeAuthUser &&
              (post.authorUid === activeAuthUser.uid || activeAuthUser.email === ADMIN_EMAIL)
            ) {
              const delBtn = document.createElement("button");
              delBtn.type = "button";
              delBtn.className = "text-action-btn";
              delBtn.textContent = "Eliminar";
              delBtn.addEventListener("click", () => {
                cloudHooks.deletePost?.(post.id);
              });
              bar.appendChild(delBtn);
            }

            art.appendChild(bar);
            socialFeedStreamEl.appendChild(art);
          });
        }
      }

      // Galería propia en Mi Perfil
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

    // Publicador del Muro Social con foto adjunta
    let stagedFeedPhotoDataUrl = "";
    const feedPhotoInput = document.getElementById("feedPhotoInput");
    const feedPhotoPreviewWrap = document.getElementById("feedPhotoPreviewWrap");
    const feedPhotoPreviewImg = document.getElementById("feedPhotoPreviewImg");
    const feedComposerFeedback = document.getElementById("feedComposerFeedback");

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
      if (!caption && !stagedFeedPhotoDataUrl) {
        capEl?.focus();
        return;
      }

      const btn = document.getElementById("feedPublishBtn");
      if (btn) btn.disabled = true;
      await cloudHooks
        .publishPost({
          kind: kindEl?.value || "portfolio",
          caption: caption || "Muestra fotográfica de trabajo",
          photoUrl: stagedFeedPhotoDataUrl
        })
        .catch(() => {});

      if (capEl) capEl.value = "";
      stagedFeedPhotoDataUrl = "";
      if (feedPhotoPreviewWrap) feedPhotoPreviewWrap.hidden = true;
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
          const row = document.createElement("div");
          row.className = "open-row";
          const info = document.createElement("div");
          const t = document.createElement("span");
          t.className = "open-row-title";
          t.textContent = `${prof?.displayName || "Usuario"} (@${prof?.handle || "miembro"})`;
          const s = document.createElement("span");
          s.className = "open-row-sub";
          s.textContent = `${prof?.role || "Quiere conectar contigo"} · ID: ${prof?.internalId || deriveInternalId(otherUid)}`;
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
            const row = document.createElement("div");
            row.className = "open-row";
            const info = document.createElement("div");
            const t = document.createElement("span");
            t.className = "open-row-title";
            t.textContent = `${prof?.displayName || "Contacto"} (@${prof?.handle || "usuario"})`;
            const s = document.createElement("span");
            s.className = "open-row-sub";
            s.textContent = `${prof?.role || "Especialista"} · ${prof?.internalId || deriveInternalId(otherUid)}`;
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

      if (avEl) {
        avEl.src = selectedPeerProfile.photoURL || "favicon.svg";
        avEl.onerror = () => {
          avEl.src = "favicon.svg";
        };
      }
      if (nmEl) nmEl.textContent = selectedPeerProfile.displayName || "Especialista";
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

          const img = document.createElement("img");
          img.className = "conv-item-avatar";
          img.src = otherInfo.photoURL || "favicon.svg";
          img.alt = "";
          img.onerror = () => {
            img.src = "favicon.svg";
          };

          const col = document.createElement("div");
          col.className = "conv-item-text";

          const nm = document.createElement("span");
          nm.className = "conv-item-name";
          nm.textContent = otherInfo.displayName || "Conversación";

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
          meta.textContent = `${(m.senderName || "MIEMBRO").toUpperCase()} (@${m.senderHandle || "usuario"} · ${m.senderInternalId || deriveInternalId(m.senderUid)}) · ${formatDateEs(m.createdAtMs)}`;
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
      if (user.email !== ADMIN_EMAIL) return;
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
          navUserAvatar.onerror = () => {
            navUserAvatar.src = "favicon.svg";
          };
        }
        const shortName = (user.displayName || user.email || "Cuenta").split(" ")[0];
        if (navUserName) navUserName.textContent = `Mi red · ${shortName}`;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Entrar a mi red profesional";

        await ensureUserCryptoKeys(user);
        await ensureUserProfileExists(user);
        prefillKnownUserFields();
        renderAccountWorkspace();
        attachConnectionsListener(user);
        attachVaultListener(user);
        attachConversationsListener(user);
        attachAdminReportsListener(user);
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
        if (navSignInBtn) navSignInBtn.hidden = false;
        if (navUserChip) navUserChip.hidden = true;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Crear mi perfil con Google";
        if (onboardingModal) onboardingModal.hidden = true;
        renderAccountWorkspace();
      }
    });
  })();
}
