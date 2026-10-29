/* =========================================================
   1. ESTADO LOCAL, INDEXEDDB Y UTILIDADES
   ========================================================= */
const STORAGE_KEYS = {
  ENV: "xuanii_workspace_env",
  PREFS: "xuanii_prefs",
  PS_PREFS: "xuanii_photostun_prefs",
  SCRATCHPAD: "xuanii_scratchpad",
  WAITLIST: "xuanii_waitlist",
  SUBMISSIONS: "xuanii_submissions"
};

const DEFAULT_WORKSPACE_ENV = {
  theme: "obsidian", // "obsidian" | "graphite" | "light"
  backdrop: "grid", // "grid" | "dots" | "waves" | "solid" | "custom"
  bgOpacity: 0.26, // 0.05 .. 0.80
  bgBlur: 10, // 0 .. 32
  bgMono: true, // true | false
  density: "standard", // "standard" | "compact"
  guides: true // true | false
};

const THEME_LABELS = {
  obsidian: "Obsidiana",
  graphite: "Grafito",
  light: "Blanco Editorial"
};

const BACKDROP_LABELS = {
  grid: "Retícula CAD",
  dots: "Puntos ópticos",
  waves: "Ondas en vivo",
  solid: "Liso puro",
  custom: "Imagen propia"
};

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
    // Ignorar errores de cuota en almacenamiento local
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
      .slice(0, 8);
  }
  return String(raw || "")
    .split(",")
    .map((s) => s.trim().slice(0, 28))
    .filter(Boolean)
    .slice(0, 8);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Base de datos IndexedDB ligera para fondos de pantalla de alta resolución
const openStudioIdb = () =>
  new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = indexedDB.open("xuanii_studio_db", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openStudioIdb();
    return await new Promise((resolve) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const idbSet = async (key, val) => {
  try {
    const db = await openStudioIdb();
    await new Promise((resolve) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    // Ignorar en modo incógnito restringido
  }
};

const idbDel = async (key) => {
  try {
    const db = await openStudioIdb();
    await new Promise((resolve) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    // Ignorar errores
  }
};

// Compresión de imágenes mediante HTML5 Canvas (compatible con capa gratuita de Cloud Firestore)
const compressImageDataUrl = (sourceFileOrUrl, maxDim = 1440, quality = 0.82) =>
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
    img.onerror = () => reject(new Error("No se pudo procesar la imagen."));

    if (typeof sourceFileOrUrl === "string") {
      img.src = sourceFileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(sourceFileOrUrl);
    }
  });

// Generador procedural de fondos monocromáticos de estudio ("Topografía" y "Luz mineral")
const generateStudioPresetWallpaper = (kind) => {
  const canvas = document.createElement("canvas");
  const w = 1600;
  const h = 1000;
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d");

  c.fillStyle = "#08080a";
  c.fillRect(0, 0, w, h);

  if (kind === "topo") {
    // Curvas topográficas arquitectónicas de precisión
    c.strokeStyle = "rgba(255, 255, 255, 0.28)";
    c.lineWidth = 1.2;
    for (let ring = 0; ring < 26; ring++) {
      c.beginPath();
      const baseY = 80 + ring * 36;
      for (let x = 0; x <= w; x += 14) {
        const nx = x / w;
        const y =
          baseY +
          Math.sin(nx * 6.2 + ring * 0.34) * (54 + ring * 1.4) +
          Math.cos(nx * 11.4 - ring * 0.22) * 24 +
          Math.sin(nx * 2.8 + ring * 0.5) * 38;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    // Marcas técnicas de retícula
    c.fillStyle = "rgba(255, 255, 255, 0.35)";
    for (let gx = 120; gx < w; gx += 160) {
      for (let gy = 100; gy < h; gy += 160) {
        c.fillRect(gx - 4, gy, 9, 1);
        c.fillRect(gx, gy - 4, 1, 9);
      }
    }
  } else {
    // Estudio de luz mineral diagonal (claroscuro editorial)
    const bgGrad = c.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#070709");
    bgGrad.addColorStop(0.45, "#1f2026");
    bgGrad.addColorStop(1, "#060608");
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, w, h);

    for (let beam = 0; beam < 7; beam++) {
      c.save();
      c.translate(w * (0.14 + beam * 0.13), 0);
      c.rotate(-0.38);
      const beamGrad = c.createLinearGradient(0, 0, 220, 0);
      beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.14 + (beam % 3) * 0.05})`);
      beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      c.fillStyle = beamGrad;
      c.fillRect(0, -300, 220, h + 600);
      c.restore();
    }
  }

  let dataUrl = canvas.toDataURL("image/webp", 0.84);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.84);
  }
  return dataUrl;
};

let cloudHooks = {
  saveSubmission: null,
  saveWaitlist: null,
  savePrefs: null,
  saveWorkspaceEnv: null,
  saveWallpaperCloud: null,
  saveScratchpad: null,
  savePhotostunPrefs: null,
  saveProfile: null,
  savePresenceMode: null,
  createVaultItem: null,
  deleteVaultItem: null,
  openChatWithPeer: null
};

let activeAuthUser = null;
let currentOwnProfile = null;
let currentVaultItems = [];
let currentWallpaperUrl = "";

/* =========================================================
   2. MOTOR EN TIEMPO REAL DE TEMA Y FONDO DE TRABAJO
   ========================================================= */
let workspaceEnv = {
  ...DEFAULT_WORKSPACE_ENV,
  ...(readJson(STORAGE_KEYS.ENV, {}) || {})
};

let envSyncTimer = null;
const scheduleCloudEnvSync = () => {
  const prefs = readJson(STORAGE_KEYS.PREFS, { cloudAutosave: true });
  if (!prefs.cloudAutosave || !cloudHooks.saveWorkspaceEnv) return;
  if (envSyncTimer) clearTimeout(envSyncTimer);
  envSyncTimer = setTimeout(() => {
    cloudHooks.saveWorkspaceEnv?.(workspaceEnv).catch(() => {});
  }, 450);
};

const applyWorkspaceEnv = (partial = {}, options = { saveLocal: true, syncCloud: false }) => {
  workspaceEnv = {
    ...DEFAULT_WORKSPACE_ENV,
    ...workspaceEnv,
    ...partial
  };

  if (!["obsidian", "graphite", "light"].includes(workspaceEnv.theme)) {
    workspaceEnv.theme = "obsidian";
  }
  if (!["grid", "dots", "waves", "solid", "custom"].includes(workspaceEnv.backdrop)) {
    workspaceEnv.backdrop = "grid";
  }
  workspaceEnv.bgOpacity = Math.min(0.8, Math.max(0.05, Number(workspaceEnv.bgOpacity) || 0.26));
  workspaceEnv.bgBlur = Math.min(32, Math.max(0, Math.round(Number(workspaceEnv.bgBlur) ?? 10)));
  workspaceEnv.bgMono = workspaceEnv.bgMono !== false;
  workspaceEnv.density = workspaceEnv.density === "compact" ? "compact" : "standard";
  workspaceEnv.guides = workspaceEnv.guides !== false;

  const root = document.documentElement;
  root.setAttribute("data-theme", workspaceEnv.theme);
  root.setAttribute("data-backdrop", workspaceEnv.backdrop);
  root.setAttribute("data-density", workspaceEnv.density);
  root.setAttribute("data-guides", workspaceEnv.guides ? "on" : "off");
  root.style.setProperty("--ws-bg-opacity", String(workspaceEnv.bgOpacity));
  root.style.setProperty("--ws-bg-blur", `${workspaceEnv.bgBlur}px`);
  root.style.setProperty("--ws-bg-mono", workspaceEnv.bgMono ? "100%" : "0%");

  if (options.saveLocal !== false) {
    writeJson(STORAGE_KEYS.ENV, workspaceEnv);
  }
  if (options.syncCloud) {
    scheduleCloudEnvSync();
  }

  // Sincronizar controles visuales del estudio (si existen en la página actual)
  document.querySelectorAll("[data-set-theme]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === workspaceEnv.theme);
  });

  document.querySelectorAll("[data-set-backdrop]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setBackdrop === workspaceEnv.backdrop);
  });

  const statEnvTitle = document.getElementById("statEnvTitle");
  if (statEnvTitle) {
    statEnvTitle.textContent = `${THEME_LABELS[workspaceEnv.theme] || "Obsidiana"} · ${BACKDROP_LABELS[workspaceEnv.backdrop] || "Retícula"}`;
  }

  const opacityPct = Math.round(workspaceEnv.bgOpacity * 100);
  const opacityRange = document.getElementById("wsOpacityRange");
  const opacityVal = document.getElementById("wsOpacityVal");
  if (opacityRange) opacityRange.value = String(opacityPct);
  if (opacityVal) opacityVal.textContent = `${opacityPct}%`;

  const blurRange = document.getElementById("wsBlurRange");
  const blurVal = document.getElementById("wsBlurVal");
  if (blurRange) blurRange.value = String(workspaceEnv.bgBlur);
  if (blurVal) blurVal.textContent = `${workspaceEnv.bgBlur}px`;

  const monoToggle = document.getElementById("wsMonoToggle");
  if (monoToggle) {
    monoToggle.dataset.active = String(workspaceEnv.bgMono);
    monoToggle.textContent = workspaceEnv.bgMono ? "BLANCO Y NEGRO" : "COLOR ORIGINAL";
  }

  const densityToggle = document.getElementById("wsDensityToggle");
  if (densityToggle) {
    const isCompact = workspaceEnv.density === "compact";
    densityToggle.dataset.active = String(isCompact);
    densityToggle.textContent = isCompact ? "COMPACTA" : "ESTÁNDAR";
  }

  const guidesToggle = document.getElementById("wsGuidesToggle");
  if (guidesToggle) {
    guidesToggle.dataset.active = String(workspaceEnv.guides);
    guidesToggle.textContent = workspaceEnv.guides ? "VISIBLES" : "OCULTAS";
  }

  const wallImg = document.getElementById("wsCustomWallpaper");
  const clearWallBtn = document.getElementById("wsClearWallpaperBtn");
  if (wallImg) {
    if (currentWallpaperUrl) {
      if (wallImg.getAttribute("src") !== currentWallpaperUrl) {
        wallImg.src = currentWallpaperUrl;
      }
      wallImg.hidden = workspaceEnv.backdrop !== "custom";
    } else {
      wallImg.hidden = true;
    }
  }
  if (clearWallBtn) {
    clearWallBtn.hidden = !currentWallpaperUrl;
  }
};

// Aplicar estado visual inicial y restaurar fondo personalizado desde IndexedDB
applyWorkspaceEnv({}, { saveLocal: false, syncCloud: false });

idbGet("custom_wallpaper").then((savedDataUrl) => {
  if (savedDataUrl && typeof savedDataUrl === "string") {
    currentWallpaperUrl = savedDataUrl;
    applyWorkspaceEnv({}, { saveLocal: false, syncCloud: false });
  }
});

// Botón rápido Blanco / Negro en la barra de navegación global
document.getElementById("navThemeToggleBtn")?.addEventListener("click", () => {
  const nextTheme = workspaceEnv.theme === "light" ? "obsidian" : "light";
  applyWorkspaceEnv({ theme: nextTheme }, { saveLocal: true, syncCloud: true });
});

// Selectores de tema y textura de fondo en cuenta.html
document.querySelectorAll("[data-set-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyWorkspaceEnv({ theme: btn.dataset.setTheme }, { saveLocal: true, syncCloud: true });
  });
});

document.querySelectorAll("[data-set-backdrop]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.setBackdrop || "grid";
    if (mode === "custom" && !currentWallpaperUrl) {
      // Si aún no ha subido imagen, generar Topografía por defecto para que vea el efecto inmediato
      currentWallpaperUrl = generateStudioPresetWallpaper("topo");
      idbSet("custom_wallpaper", currentWallpaperUrl);
    }
    applyWorkspaceEnv({ backdrop: mode }, { saveLocal: true, syncCloud: true });
  });
});

document.getElementById("wsOpacityRange")?.addEventListener("input", (e) => {
  const pct = Number(e.target.value) || 26;
  applyWorkspaceEnv({ bgOpacity: pct / 100 }, { saveLocal: true, syncCloud: true });
});

document.getElementById("wsBlurRange")?.addEventListener("input", (e) => {
  const px = Number(e.target.value) || 0;
  applyWorkspaceEnv({ bgBlur: px }, { saveLocal: true, syncCloud: true });
});

document.getElementById("wsMonoToggle")?.addEventListener("click", () => {
  applyWorkspaceEnv({ bgMono: !workspaceEnv.bgMono }, { saveLocal: true, syncCloud: true });
});

document.getElementById("wsDensityToggle")?.addEventListener("click", () => {
  const next = workspaceEnv.density === "compact" ? "standard" : "compact";
  applyWorkspaceEnv({ density: next }, { saveLocal: true, syncCloud: true });
});

document.getElementById("wsGuidesToggle")?.addEventListener("click", () => {
  applyWorkspaceEnv({ guides: !workspaceEnv.guides }, { saveLocal: true, syncCloud: true });
});

const applyAndSyncWallpaperDataUrl = async (fullDataUrl) => {
  currentWallpaperUrl = fullDataUrl;
  await idbSet("custom_wallpaper", fullDataUrl);
  applyWorkspaceEnv({ backdrop: "custom" }, { saveLocal: true, syncCloud: true });

  const prefs = readJson(STORAGE_KEYS.PREFS, { cloudAutosave: true });
  if (prefs.cloudAutosave && cloudHooks.saveWallpaperCloud) {
    try {
      const cloudThumb = await compressImageDataUrl(fullDataUrl, 1024, 0.66);
      if (cloudThumb.length < 320000) {
        await cloudHooks.saveWallpaperCloud(cloudThumb);
      }
    } catch {
      // Mantener copia local en IndexedDB si excede tamaño
    }
  }
};

document.getElementById("wsUploadWallpaperBtn")?.addEventListener("click", () => {
  document.getElementById("wsWallpaperInput")?.click();
});

document.getElementById("wsWallpaperInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const optimized = await compressImageDataUrl(file, 1920, 0.84);
    await applyAndSyncWallpaperDataUrl(optimized);
  } catch {
    // Archivo no compatible
  }
  e.target.value = "";
});

document.querySelectorAll("[data-preset-wall]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const presetUrl = generateStudioPresetWallpaper(btn.dataset.presetWall);
    await applyAndSyncWallpaperDataUrl(presetUrl);
  });
});

document.getElementById("wsClearWallpaperBtn")?.addEventListener("click", async () => {
  currentWallpaperUrl = "";
  await idbDel("custom_wallpaper");
  applyWorkspaceEnv({ backdrop: "grid" }, { saveLocal: true, syncCloud: true });
  if (cloudHooks.saveWallpaperCloud) {
    cloudHooks.saveWallpaperCloud("").catch(() => {});
  }
});

document.getElementById("wsResetAppearanceBtn")?.addEventListener("click", () => {
  applyWorkspaceEnv({ ...DEFAULT_WORKSPACE_ENV }, { saveLocal: true, syncCloud: true });
});

/* =========================================================
   3. LIENZOS ANIMADOS SENSIBLES AL TEMA (HERO, PHOTOSTUN Y STUDIO)
   ========================================================= */
// 3A. Ondas en vivo para el fondo del espacio de trabajo (cuenta.html)
const wsBackdropCanvas = document.getElementById("wsBackdropCanvas");
if (wsBackdropCanvas) {
  const wctx = wsBackdropCanvas.getContext("2d");
  let ww = 0;
  let wh = 0;
  let wt = 0;

  const resizeWsCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ww = window.innerWidth;
    wh = window.innerHeight;
    wsBackdropCanvas.width = Math.floor(ww * dpr);
    wsBackdropCanvas.height = Math.floor(wh * dpr);
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", resizeWsCanvas);
  resizeWsCanvas();

  const renderWsWaves = () => {
    if (workspaceEnv.backdrop === "waves") {
      wt += 0.008;
      wctx.clearRect(0, 0, ww, wh);
      const isLight = workspaceEnv.theme === "light";
      const rgb = isLight ? "9, 9, 11" : "255, 255, 255";

      wctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        wctx.beginPath();
        const baseY = wh * (0.2 + i * 0.12);
        for (let x = 0; x <= ww; x += 18) {
          const y =
            baseY +
            Math.sin(x * 0.0022 + wt + i * 0.85) * 48 +
            Math.cos(x * 0.0014 - wt * 0.7 + i * 0.4) * 26;
          if (x === 0) wctx.moveTo(x, y);
          else wctx.lineTo(x, y);
        }
        wctx.strokeStyle = `rgba(${rgb}, ${0.13 - i * 0.016})`;
        wctx.stroke();
      }
    }
    requestAnimationFrame(renderWsWaves);
  };
  renderWsWaves();
}

// 3B. Lienzo diagonal monocromático del Hero (index.html)
const heroBgCanvas = document.getElementById("monochromeCanvas");
if (heroBgCanvas) {
  const ctx = heroBgCanvas.getContext("2d");
  let w = 0;
  let h = 0;
  let t = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = heroBgCanvas.clientWidth || window.innerWidth;
    h = heroBgCanvas.clientHeight || 640;
    heroBgCanvas.width = Math.floor(w * dpr);
    heroBgCanvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", resize);
  resize();

  const drawRibbon = (offsetY, amp, freq, speed, alphaTop, alphaBot, isLight) => {
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
    if (isLight) {
      grad.addColorStop(0, `rgba(9, 9, 11, ${alphaTop * 0.75})`);
      grad.addColorStop(0.5, `rgba(82, 82, 91, ${(alphaTop + alphaBot) * 0.35})`);
      grad.addColorStop(1, `rgba(250, 250, 250, ${alphaBot})`);
    } else {
      grad.addColorStop(0, `rgba(255, 255, 255, ${alphaTop})`);
      grad.addColorStop(0.5, `rgba(185, 185, 195, ${(alphaTop + alphaBot) * 0.5})`);
      grad.addColorStop(1, `rgba(10, 10, 14, ${alphaBot})`);
    }
    ctx.fillStyle = grad;
    ctx.fill();
  };

  const tick = () => {
    t += 0.011;
    const theme = document.documentElement.getAttribute("data-theme") || "obsidian";
    const isLight = theme === "light";
    ctx.fillStyle = isLight ? "#fafafa" : theme === "graphite" ? "#111216" : "#050506";
    ctx.fillRect(0, 0, w, h);

    drawRibbon(h * 0.28, 52, 0.0024, 0.9, 0.16, 0.01, isLight);
    drawRibbon(h * 0.44, 64, 0.0031, -0.7, 0.22, 0.02, isLight);
    drawRibbon(h * 0.6, 46, 0.0038, 1.15, 0.13, 0.01, isLight);

    const strokeRgb = isLight ? "9, 9, 11" : "255, 255, 255";
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
      ctx.strokeStyle = `rgba(${strokeRgb}, ${0.14 - i * 0.025})`;
      ctx.stroke();
    }
    requestAnimationFrame(tick);
  };
  tick();
}

// 3C. Esquema interactivo de PhotoStun (Curva tonal en index.html y productos.html)
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
    phase += 0.014;
    ectx.clearRect(0, 0, cw, ch);

    // En data-theme="light", la sección de contraste (.section-white-*) se invierte a #09090b
    const isLightPage = document.documentElement.getAttribute("data-theme") === "light";
    const inkHex = isLightPage ? "#fafafa" : "#050506";
    const inkRgb = isLightPage ? "250, 250, 250" : "5, 5, 6";
    const labelHex = isLightPage ? "#a1a1aa" : "#52525b";

    if (!hoverActive) {
      targetNormX = Math.sin(phase * 0.55) * 0.32 + 0.5;
      targetGain = 1.0;
    }
    smoothNormX += (targetNormX - smoothNormX) * 0.1;
    smoothGain += (targetGain - smoothGain) * 0.1;

    ectx.strokeStyle = `rgba(${inkRgb}, 0.09)`;
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
      ectx.strokeStyle = inkHex;
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
      ectx.strokeStyle = layer === 0 ? inkHex : `rgba(${inkRgb}, ${0.45 - layer * 0.08})`;
      ectx.lineWidth = layer === 0 ? 2 : 1;
      ectx.stroke();
    }

    const fx = 50 + smoothNormX * (cw - 100);
    const fEnv = Math.sin(smoothNormX * Math.PI);
    const fy =
      ch * 0.54 -
      Math.sin(smoothNormX * 5.2 + phase) * (66 * smoothGain * fEnv) -
      Math.cos(smoothNormX * 2.4 - phase * 0.7) * (24 * smoothGain * fEnv);

    ectx.strokeStyle = `rgba(${inkRgb}, 0.24)`;
    ectx.setLineDash([3, 3]);
    ectx.beginPath();
    ectx.moveTo(fx, 40);
    ectx.lineTo(fx, ch - 40);
    ectx.stroke();
    ectx.setLineDash([]);

    ectx.fillStyle = inkHex;
    ectx.beginPath();
    ectx.arc(fx, fy, 4.5, 0, Math.PI * 2);
    ectx.fill();

    ectx.font = "500 11px 'JetBrains Mono', monospace";
    ectx.fillStyle = labelHex;
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
   4. AUTO-RELLENADO Y ACCESO ANTICIPADO A PHOTOSTUN
   ========================================================= */
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
        feedbackEl.textContent = "Introduce un correo electrónico válido para reservar tu acceso.";
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
      feedbackEl.textContent = `Acceso prioritario registrado para ${email} (${priority}).`;
    }
  });
}

/* =========================================================
   5. BUZÓN FUNCIONAL DE CONTACTO Y PROPUESTAS (CONTACTO.HTML)
   ========================================================= */
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
          ? "Por favor escribe un correo electrónico válido para poder responderte."
          : "Completa tu nombre, asunto y mensaje antes de enviar.";
      }
      return;
    }

    const originalLabel = submitBtn?.innerHTML || "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando mensaje...";
    }

    const entry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category,
      name,
      email,
      subject,
      message,
      uid: activeAuthUser?.uid || null,
      createdAtIso: new Date().toISOString(),
      deliveredEmail: false,
      deliveredCloud: false
    };

    const targetInbox = (window.XUANII_CONTACT_EMAIL || "").trim();
    if (targetInbox && isValidEmail(targetInbox)) {
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetInbox)}`, {
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
        });
        if (res.ok) entry.deliveredEmail = true;
      } catch {
        entry.deliveredEmail = false;
      }
    }

    if (cloudHooks.saveSubmission) {
      try {
        await cloudHooks.saveSubmission(entry);
        entry.deliveredCloud = true;
      } catch {
        entry.deliveredCloud = false;
      }
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
      feedbackEl.textContent = "Mensaje enviado y respaldado correctamente. Lo revisaremos pronto.";
    }
  });
}

/* =========================================================
   6. STUDIO APP SHELL: ESCRITORIO, ARCHIVOS, APPS, PERFIL Y DATOS
   ========================================================= */
const ALL_WS_TABS = ["overview", "files", "apps", "messages", "profile", "appearance", "settings"];
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

document.querySelectorAll("[data-jump-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchWorkspaceTab(btn.dataset.jumpTab);
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

// Reloj en vivo y saludo dinámico en el Escritorio
const studioLiveClockEl = document.getElementById("studioLiveClock");
const updateStudioClockAndGreeting = () => {
  const now = new Date();
  if (studioLiveClockEl) {
    const formatted = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(now);
    studioLiveClockEl.textContent = `${formatted} · Nube activa`;
  }

  const greetingEl = document.getElementById("studioGreeting");
  if (greetingEl) {
    const hr = now.getHours();
    const prefix = hr < 12 ? "Buenos días" : hr < 19 ? "Buenas tardes" : "Buenas noches";
    const firstName = (
      currentOwnProfile?.displayName ||
      activeAuthUser?.displayName ||
      activeAuthUser?.email?.split("@")[0] ||
      ""
    )
      .trim()
      .split(" ")[0];
    greetingEl.textContent = firstName ? `${prefix}, ${firstName}` : "Bienvenido a tu espacio";
  }
};
updateStudioClockAndGreeting();
if (studioLiveClockEl) {
  setInterval(updateStudioClockAndGreeting, 30000);
}

// Bloc rápido de trabajo con autoguardado local + nube
const quickScratchpadEl = document.getElementById("quickScratchpad");
const scratchpadStatusEl = document.getElementById("scratchpadStatus");
if (quickScratchpadEl) {
  const localNote = localStorage.getItem(STORAGE_KEYS.SCRATCHPAD);
  if (localNote) quickScratchpadEl.value = localNote;

  let scratchTimer = null;
  quickScratchpadEl.addEventListener("input", () => {
    const val = quickScratchpadEl.value;
    try {
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, val);
    } catch {
      // Ignorar errores de cuota
    }
    if (scratchpadStatusEl) scratchpadStatusEl.textContent = "Guardando...";
    if (scratchTimer) clearTimeout(scratchTimer);
    scratchTimer = setTimeout(async () => {
      if (cloudHooks.saveScratchpad && activeAuthUser) {
        await cloudHooks.saveScratchpad(val).catch(() => {});
        if (scratchpadStatusEl) scratchpadStatusEl.textContent = "Sincronizado en la nube ✓";
      } else if (scratchpadStatusEl) {
        scratchpadStatusEl.textContent = "Guardado localmente ✓";
      }
    }, 650);
  });
}

// Selector rápido de disponibilidad en la barra lateral
const studioPresenceSelect = document.getElementById("studioPresenceSelect");
const syncPresenceSummaryText = (mode) => {
  const summaryEl = document.getElementById("statPresenceSummary");
  if (!summaryEl) return;
  if (mode === "focus") {
    summaryEl.textContent = "Modo enfoque activo: apareces ocupado en el directorio público.";
  } else if (mode === "away") {
    summaryEl.textContent = "Modo exploración: sin recibir avisos de nuevos encargos.";
  } else {
    summaryEl.textContent = "Disponible para trabajos: tu perfil destaca en el directorio.";
  }
};

studioPresenceSelect?.addEventListener("change", async () => {
  const mode = studioPresenceSelect.value || "available";
  syncPresenceSummaryText(mode);
  const availBtn = document.getElementById("profileAvailableBtn");
  if (availBtn) {
    const isAvail = mode === "available";
    availBtn.dataset.active = String(isAvail);
    availBtn.textContent = isAvail ? "DISPONIBLE" : "NO DISPONIBLE";
  }
  if (cloudHooks.savePresenceMode) {
    await cloudHooks.savePresenceMode(mode).catch(() => {});
  }
});

// Preferencias sincronizadas de PhotoStun
const psDefaultFormatEl = document.getElementById("psDefaultFormat");
const psCanvasBackdropEl = document.getElementById("psCanvasBackdrop");
const applyPhotostunPrefsToUi = (psPrefs) => {
  if (!psPrefs) return;
  if (psDefaultFormatEl && psPrefs.format) psDefaultFormatEl.value = psPrefs.format;
  if (psCanvasBackdropEl && psPrefs.backdrop) psCanvasBackdropEl.value = psPrefs.backdrop;
};
applyPhotostunPrefsToUi(readJson(STORAGE_KEYS.PS_PREFS, { format: "png", backdrop: "obsidian" }));

const handlePhotostunPrefChange = async () => {
  const next = {
    format: psDefaultFormatEl?.value || "png",
    backdrop: psCanvasBackdropEl?.value || "obsidian"
  };
  writeJson(STORAGE_KEYS.PS_PREFS, next);
  if (cloudHooks.savePhotostunPrefs) {
    await cloudHooks.savePhotostunPrefs(next).catch(() => {});
  }
};
psDefaultFormatEl?.addEventListener("change", handlePhotostunPrefChange);
psCanvasBackdropEl?.addEventListener("change", handlePhotostunPrefChange);

// Renderizado general del estado de la cuenta en cuenta.html
const renderAccountWorkspace = () => {
  const authGateEl = document.getElementById("accountAuthGate");
  const workspaceEl = document.getElementById("authenticatedWorkspace");
  const userStatusEl = document.getElementById("accountUserStatus");
  const userSubEl = document.getElementById("accountUserSub");

  if (authGateEl && workspaceEl) {
    if (activeAuthUser) {
      authGateEl.hidden = true;
      workspaceEl.hidden = false;
      if (userStatusEl) {
        userStatusEl.textContent = activeAuthUser.displayName || activeAuthUser.email || "Conectado";
      }
      if (userSubEl) {
        userSubEl.textContent = activeAuthUser.email || "Autenticado mediante Google OAuth 2.0.";
      }
    } else {
      authGateEl.hidden = false;
      workspaceEl.hidden = true;
    }
  }

  // Identidad en la barra lateral del estudio
  const sideAvatar = document.getElementById("studioSideAvatar");
  const sideName = document.getElementById("studioSideName");
  const sideHandle = document.getElementById("studioSideHandle");
  if (activeAuthUser) {
    if (sideAvatar) {
      sideAvatar.src = currentOwnProfile?.photoURL || activeAuthUser.photoURL || "favicon.svg";
      sideAvatar.onerror = () => {
        sideAvatar.src = "favicon.svg";
      };
    }
    if (sideName) {
      sideName.textContent =
        currentOwnProfile?.displayName || activeAuthUser.displayName || "Mi espacio";
    }
    if (sideHandle) {
      const h =
        currentOwnProfile?.handle ||
        sanitizeHandle(activeAuthUser.email?.split("@")[0] || activeAuthUser.displayName);
      sideHandle.textContent = `@${h}`;
    }
  }

  updateStudioClockAndGreeting();

  // Estado de PhotoStun en el panel de Aplicaciones
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

  // Preferencias de sincronización
  const prefs = readJson(STORAGE_KEYS.PREFS, {
    cloudAutosave: true,
    releaseAlerts: true
  });

  document.querySelectorAll(".open-toggle-btn[data-pref]").forEach((btn) => {
    const key = btn.dataset.pref;
    const isActive = Boolean(prefs[key]);
    btn.dataset.active = String(isActive);
    btn.textContent = isActive ? "ACTIVADO" : "DESACTIVADO";
  });

  // Historial de propuestas enviadas a Xuanii
  const listEl = document.getElementById("accountSubmissionsList");
  const clearBtn = document.getElementById("clearLocalHistoryBtn");
  if (listEl) {
    const submissions = readJson(STORAGE_KEYS.SUBMISSIONS, []);
    listEl.textContent = "";

    if (submissions.length === 0) {
      if (clearBtn) clearBtn.hidden = true;
      const emptyEntry = document.createElement("div");
      emptyEntry.className = "arch-col";
      const idx = document.createElement("span");
      idx.className = "col-index mono";
      idx.textContent = "SIN ENVÍOS RECIENTES";
      const p = document.createElement("p");
      p.textContent = "Todavía no has enviado propuestas desde este navegador.";
      emptyEntry.appendChild(idx);
      emptyEntry.appendChild(p);
      listEl.appendChild(emptyEntry);
    } else {
      if (clearBtn) clearBtn.hidden = false;
      submissions.forEach((item) => {
        const row = document.createElement("article");
        row.className = "submission-entry";

        const meta = document.createElement("span");
        meta.className = "submission-meta mono";
        meta.textContent = `${item.category.toUpperCase()} · ${formatDateEs(item.createdAtIso)}`;

        const title = document.createElement("h3");
        title.className = "submission-subject";
        title.textContent = item.subject;

        const body = document.createElement("p");
        body.className = "submission-body";
        body.textContent = item.message;

        row.appendChild(meta);
        row.appendChild(title);
        row.appendChild(body);
        listEl.appendChild(row);
      });
    }
  }
};

document.getElementById("hubPhotostunPriorityBtn")?.addEventListener("click", async () => {
  if (!activeAuthUser) return;
  const record = {
    email: activeAuthUser.email || "",
    priority: "Activado desde espacio de trabajo",
    uid: activeAuthUser.uid,
    createdAtIso: new Date().toISOString()
  };
  writeJson(STORAGE_KEYS.WAITLIST, record);
  if (cloudHooks.saveWaitlist) {
    await cloudHooks.saveWaitlist(record).catch(() => {});
  }
  renderAccountWorkspace();
});

document.querySelectorAll(".open-toggle-btn[data-pref]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.pref;
    const prefs = readJson(STORAGE_KEYS.PREFS, {
      cloudAutosave: true,
      releaseAlerts: true
    });
    prefs[key] = !prefs[key];
    writeJson(STORAGE_KEYS.PREFS, prefs);
    renderAccountWorkspace();

    if (cloudHooks.savePrefs) {
      await cloudHooks.savePrefs(prefs).catch(() => {});
    }
  });
});

document.getElementById("clearLocalHistoryBtn")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  renderAccountWorkspace();
});

// Exportar copia completa de datos en JSON (1 clic)
document.getElementById("exportAccountJsonBtn")?.addEventListener("click", () => {
  const handle = sanitizeHandle(currentOwnProfile?.handle, activeAuthUser?.displayName || "xuanii");
  const payload = {
    exportedAt: new Date().toISOString(),
    account: activeAuthUser
      ? {
          uid: activeAuthUser.uid,
          email: activeAuthUser.email,
          displayName: activeAuthUser.displayName
        }
      : null,
    profile: currentOwnProfile || null,
    workspaceAppearance: workspaceEnv,
    photostunPreferences: readJson(STORAGE_KEYS.PS_PREFS, { format: "png", backdrop: "obsidian" }),
    scratchpad: quickScratchpadEl?.value || localStorage.getItem(STORAGE_KEYS.SCRATCHPAD) || "",
    cloudFilesAndNotes: currentVaultItems.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      mimeType: item.mimeType || "text/plain",
      sizeBytes: item.sizeBytes || 0,
      content: item.content || "",
      createdAtMs: item.createdAtMs || 0
    })),
    submissions: readJson(STORAGE_KEYS.SUBMISSIONS, [])
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

/* =========================================================
   7. BAÚL DE ARCHIVOS E IMÁGENES EN LA NUBE (CUENTA.HTML)
   ========================================================= */
const cloudNoteForm = document.getElementById("cloudNoteForm");
const newNoteTitleEl = document.getElementById("newNoteTitle");
const newNoteBodyEl = document.getElementById("newNoteBody");
const vaultFeedbackEl = document.getElementById("vaultFeedback");
const cloudVaultListEl = document.getElementById("cloudVaultList");
const vaultViewerBox = document.getElementById("vaultViewerBox");
const vaultViewerMeta = document.getElementById("vaultViewerMeta");
const vaultViewerTitle = document.getElementById("vaultViewerTitle");
const vaultViewerImg = document.getElementById("vaultViewerImg");
const vaultViewerText = document.getElementById("vaultViewerText");
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

const openVaultItemViewer = (item) => {
  if (!vaultViewerBox) return;
  activeViewedItemId = item.id;
  vaultViewerBox.hidden = false;
  if (vaultViewerMeta) {
    const label = item.type === "image" ? "IMAGEN" : item.type === "file" ? "ARCHIVO" : "DOCUMENTO";
    vaultViewerMeta.textContent = `${label} · ${formatBytes(item.sizeBytes)} · ${formatDateEs(item.createdAtMs)}`;
  }
  if (vaultViewerTitle) vaultViewerTitle.textContent = item.title || "Sin título";

  if (item.type === "image" && item.dataUrl) {
    if (vaultViewerImg) {
      vaultViewerImg.src = item.dataUrl;
      vaultViewerImg.hidden = false;
    }
    if (vaultViewerText) vaultViewerText.textContent = "";
  } else {
    if (vaultViewerImg) vaultViewerImg.hidden = true;
    if (vaultViewerText) {
      vaultViewerText.textContent =
        item.content ||
        `Archivo almacenado (${item.mimeType || "binario"}). Pulsa «Descargar» para abrirlo en tu equipo.`;
    }
  }
};

const downloadVaultItem = (item) => {
  const a = document.createElement("a");
  if (item.dataUrl) {
    a.href = item.dataUrl;
    a.download = item.title || "archivo-xuanii";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  const blob = new Blob([item.content || ""], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeTitle = (item.title || "nota").replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "nota";
  a.href = url;
  a.download = `${safeTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const renderCloudVaultList = () => {
  const count = currentVaultItems.length;
  const totalBytes = currentVaultItems.reduce((acc, it) => acc + (Number(it.sizeBytes) || 0), 0);

  const badgeFiles = document.getElementById("badgeFilesCount");
  const statFiles = document.getElementById("statFilesCount");
  const statStorage = document.getElementById("statStorageUsed");

  if (badgeFiles) badgeFiles.textContent = String(count);
  if (statFiles) statFiles.textContent = String(count);
  if (statStorage) {
    statStorage.textContent =
      count > 0
        ? `${formatBytes(totalBytes)} sincronizados en tu nube privada de Google.`
        : "Espacio listo para guardar trabajos, imágenes e ideas.";
  }

  if (!cloudVaultListEl) return;
  cloudVaultListEl.textContent = "";

  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "arch-col";
    const idx = document.createElement("span");
    idx.className = "col-index mono";
    idx.textContent = "TU NUBE ESTÁ VACÍA";
    const h3 = document.createElement("h3");
    h3.textContent = "Guarda tu primer archivo o nota";
    const p = document.createElement("p");
    p.textContent =
      "Sube imágenes de referencia, documentos ligeros o redacta un brief a la izquierda. Todo quedará vinculado a tu cuenta de Google.";
    empty.appendChild(idx);
    empty.appendChild(h3);
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
      thumb.alt = item.title || "";
      main.appendChild(thumb);
    }

    const textCol = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "vault-type-tag mono";
    const kindLabel = item.type === "image" ? "IMAGEN" : item.type === "file" ? "ARCHIVO" : "NOTA";
    tag.textContent = `${kindLabel} · ${formatBytes(item.sizeBytes)} · ${formatDateEs(item.createdAtMs)}`;

    const title = document.createElement("h3");
    title.className = "vault-title";
    title.textContent = item.title || "Documento sin título";

    textCol.appendChild(tag);
    textCol.appendChild(title);

    if (item.content) {
      const snippet = document.createElement("p");
      snippet.className = "vault-snippet";
      snippet.textContent = item.content.length > 140 ? `${item.content.slice(0, 140)}…` : item.content;
      textCol.appendChild(snippet);
    }

    main.appendChild(textCol);

    const actions = document.createElement("div");
    actions.className = "vault-actions";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "text-action-btn";
    viewBtn.textContent = "Ver";
    viewBtn.addEventListener("click", () => openVaultItemViewer(item));

    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "text-action-btn";
    dlBtn.textContent = "Descargar";
    dlBtn.addEventListener("click", () => downloadVaultItem(item));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "text-action-btn";
    delBtn.textContent = "Eliminar";
    delBtn.addEventListener("click", async () => {
      if (!cloudHooks.deleteVaultItem) return;
      if (activeViewedItemId === item.id && vaultViewerBox) {
        vaultViewerBox.hidden = true;
        activeViewedItemId = null;
      }
      await cloudHooks.deleteVaultItem(item.id).catch(() => {});
    });

    actions.appendChild(viewBtn);
    actions.appendChild(dlBtn);
    actions.appendChild(delBtn);

    row.appendChild(main);
    row.appendChild(actions);
    cloudVaultListEl.appendChild(row);
  });
};

cloudNoteForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeAuthUser || !cloudHooks.createVaultItem) return;

  const title = (newNoteTitleEl?.value || "").trim();
  const content = (newNoteBodyEl?.value || "").trim();
  if (!title || !content) {
    showVaultFeedback("Escribe un título y el contenido antes de guardar en tu nube.");
    return;
  }

  const saveBtn = document.getElementById("saveCloudNoteBtn");
  if (saveBtn) saveBtn.disabled = true;

  const sizeBytes = new Blob([content]).size;
  try {
    await cloudHooks.createVaultItem({
      type: "note",
      title,
      content,
      mimeType: "text/plain",
      sizeBytes,
      createdAtMs: Date.now()
    });
    if (newNoteTitleEl) newNoteTitleEl.value = "";
    if (newNoteBodyEl) newNoteBodyEl.value = "";
    showVaultFeedback("Documento guardado y sincronizado en tu nube ✓");
  } catch {
    showVaultFeedback("No se pudo guardar el documento. Inténtalo de nuevo.");
  }

  if (saveBtn) saveBtn.disabled = false;
});

document.getElementById("triggerCloudUploadBtn")?.addEventListener("click", () => {
  document.getElementById("cloudFileUploadInput")?.click();
});

document.getElementById("cloudFileUploadInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file || !activeAuthUser || !cloudHooks.createVaultItem) return;

  const uploadBtn = document.getElementById("triggerCloudUploadBtn");
  const originalText = uploadBtn?.innerHTML || "";
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Subiendo a la nube...";
  }

  try {
    if (file.type.startsWith("image/")) {
      let dataUrl = await compressImageDataUrl(file, 1440, 0.82);
      if (dataUrl.length > 760000) {
        dataUrl = await compressImageDataUrl(file, 1080, 0.68);
      }
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      await cloudHooks.createVaultItem({
        type: "image",
        title: file.name,
        mimeType: "image/webp",
        dataUrl,
        content: "",
        sizeBytes: approxBytes,
        createdAtMs: Date.now()
      });
      showVaultFeedback(`Imagen «${file.name}» optimizada y guardada en tu nube ✓`);
    } else {
      if (file.size > 650 * 1024) {
        showVaultFeedback(
          "Para archivos que no son imágenes el límite gratuito por documento es 650 KB (las imágenes sí se optimizan solas)."
        );
        if (uploadBtn) {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = originalText;
        }
        return;
      }

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Error de lectura"));
        reader.readAsDataURL(file);
      });

      let textPreview = "";
      if (
        file.type.startsWith("text/") ||
        /\.(txt|md|json|csv|svg)$/i.test(file.name)
      ) {
        textPreview = await file.text().catch(() => "");
        textPreview = textPreview.slice(0, 3000);
      }

      await cloudHooks.createVaultItem({
        type: "file",
        title: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        content: textPreview,
        sizeBytes: file.size,
        createdAtMs: Date.now()
      });
      showVaultFeedback(`Archivo «${file.name}» guardado en tu nube ✓`);
    }
  } catch {
    showVaultFeedback("No se pudo subir el archivo. Verifica el formato e inténtalo de nuevo.");
  }

  if (uploadBtn) {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalText;
  }
});

/* =========================================================
   8. PERFIL PÚBLICO Y ETIQUETAS DE HABILIDADES (CUENTA.HTML)
   ========================================================= */
const profileEditForm = document.getElementById("profileEditForm");
const profileDisplayNameEl = document.getElementById("profileDisplayName");
const profileHandleEl = document.getElementById("profileHandle");
const profileRoleEl = document.getElementById("profileRole");
const profileSkillsEl = document.getElementById("profileSkills");
const profileBioEl = document.getElementById("profileBio");
const profileAvailableBtn = document.getElementById("profileAvailableBtn");
const profilePublicBtn = document.getElementById("profilePublicBtn");
const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");
const profilePreviewName = document.getElementById("profilePreviewName");
const profilePreviewHandle = document.getElementById("profilePreviewHandle");
const profilePreviewRole = document.getElementById("profilePreviewRole");
const profilePreviewSkills = document.getElementById("profilePreviewSkills");
const profileSaveFeedback = document.getElementById("profileSaveFeedback");

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

const syncProfilePreview = () => {
  if (profilePreviewName && profileDisplayNameEl) {
    profilePreviewName.textContent = profileDisplayNameEl.value.trim() || "Tu nombre";
  }
  if (profilePreviewHandle && profileHandleEl) {
    profilePreviewHandle.textContent = `@${sanitizeHandle(profileHandleEl.value, activeAuthUser?.displayName)}`;
  }
  if (profilePreviewRole && profileRoleEl) {
    profilePreviewRole.textContent = profileRoleEl.value.trim() || "Creador digital";
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
  if (profileRoleEl) profileRoleEl.value = prof.role || "";
  if (profileSkillsEl) {
    profileSkillsEl.value = Array.isArray(prof.skills) ? prof.skills.join(", ") : prof.skills || "";
  }
  if (profileBioEl) profileBioEl.value = prof.bio || "";
  if (profileAvailableBtn) {
    const av = prof.availableForWork !== false;
    profileAvailableBtn.dataset.active = String(av);
    profileAvailableBtn.textContent = av ? "DISPONIBLE" : "NO DISPONIBLE";
  }
  if (profilePublicBtn) {
    const pub = prof.isPublic !== false;
    profilePublicBtn.dataset.active = String(pub);
    profilePublicBtn.textContent = pub ? "PÚBLICO" : "PRIVADO";
  }
  if (studioPresenceSelect) {
    const mode = prof.presenceMode || (prof.availableForWork === false ? "away" : "available");
    studioPresenceSelect.value = ["available", "focus", "away"].includes(mode) ? mode : "available";
    syncPresenceSummaryText(studioPresenceSelect.value);
  }
  syncProfilePreview();
};

[profileDisplayNameEl, profileHandleEl, profileRoleEl, profileSkillsEl].forEach((inp) => {
  inp?.addEventListener("input", syncProfilePreview);
});

profileAvailableBtn?.addEventListener("click", () => {
  const next = profileAvailableBtn.dataset.active !== "true";
  profileAvailableBtn.dataset.active = String(next);
  profileAvailableBtn.textContent = next ? "DISPONIBLE" : "NO DISPONIBLE";
  if (studioPresenceSelect) {
    studioPresenceSelect.value = next ? "available" : "away";
    syncPresenceSummaryText(studioPresenceSelect.value);
  }
});

profilePublicBtn?.addEventListener("click", () => {
  const next = profilePublicBtn.dataset.active !== "true";
  profilePublicBtn.dataset.active = String(next);
  profilePublicBtn.textContent = next ? "PÚBLICO" : "PRIVADO";
});

profileEditForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeAuthUser || !cloudHooks.saveProfile) return;

  const displayName = (profileDisplayNameEl?.value || "").trim() || activeAuthUser.displayName || "Usuario";
  const handle = sanitizeHandle(profileHandleEl?.value, displayName);
  const role = (profileRoleEl?.value || "").trim() || "Creador digital";
  const skills = parseSkillsList(profileSkillsEl?.value || "");
  const bio = (profileBioEl?.value || "").trim();
  const availableForWork = profileAvailableBtn?.dataset.active !== "false";
  const presenceMode = availableForWork
    ? "available"
    : studioPresenceSelect?.value === "focus"
      ? "focus"
      : "away";
  const isPublic = profilePublicBtn?.dataset.active !== "false";

  const saveBtn = document.getElementById("profileSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  await cloudHooks.saveProfile({
    displayName,
    handle,
    role,
    skills,
    bio,
    availableForWork,
    presenceMode,
    isPublic
  });

  if (profileHandleEl) profileHandleEl.value = handle;
  syncProfilePreview();
  renderAccountWorkspace();
  if (saveBtn) saveBtn.disabled = false;

  if (profileSaveFeedback) {
    profileSaveFeedback.hidden = false;
    profileSaveFeedback.textContent = "Perfil profesional actualizado en el directorio en tiempo real ✓";
  }
});

/* =========================================================
   9. FIREBASE AUTH, FIRESTORE CLOUD SYNC, PERFILES Y CHAT
   ========================================================= */
const activeUsersEl = document.getElementById("activeUsersCount");
const navSignInBtn = document.getElementById("navGoogleSignInBtn");
const heroSignInBtn = document.getElementById("heroGoogleSignInBtn");
const accountSignInBtn = document.getElementById("accountSignInBtn");
const heroAuthBtnLabel = document.getElementById("heroAuthBtnLabel");
const navUserChip = document.getElementById("navUserChip");
const navUserAvatar = document.getElementById("navUserAvatar");
const navUserName = document.getElementById("navUserName");
const navSignOutBtn = document.getElementById("navSignOutBtn");
const accountSignOutBtn = document.getElementById("accountSignOutBtn");
const sidebarSignOutBtn = document.getElementById("sidebarSignOutBtn");

const authSetupModal = document.getElementById("authSetupModal");
const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
const closeAuthModalAction = document.getElementById("closeAuthModalAction");

const closeSetupModal = () => {
  if (authSetupModal) authSetupModal.hidden = true;
};
closeAuthModalBtn?.addEventListener("click", closeSetupModal);
closeAuthModalAction?.addEventListener("click", closeSetupModal);
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
        deleteDoc,
        collection,
        query,
        where,
        orderBy,
        onSnapshot,
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

    cloudHooks.saveSubmission = (entry) =>
      addDoc(collection(db, "messages"), {
        ...entry,
        createdAt: serverTimestamp()
      });

    cloudHooks.saveWaitlist = async (record) => {
      await addDoc(collection(db, "photostun_waitlist"), {
        ...record,
        createdAt: serverTimestamp()
      });
      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { photostunPriority: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    };

    cloudHooks.savePrefs = (prefs) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        { preferences: prefs, updatedAt: serverTimestamp() },
        { merge: true }
      );
    };

    cloudHooks.saveWorkspaceEnv = (envState) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        { workspaceEnv: envState, updatedAt: serverTimestamp() },
        { merge: true }
      );
    };

    cloudHooks.saveWallpaperCloud = (dataUrl) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        { wallpaperCloud: dataUrl || "", updatedAt: serverTimestamp() },
        { merge: true }
      );
    };

    cloudHooks.saveScratchpad = (text) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          scratchpad: String(text || "").slice(0, 15000),
          scratchpadUpdatedAtMs: Date.now(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    };

    cloudHooks.savePhotostunPrefs = (psPrefs) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        { photostunPrefs: psPrefs, updatedAt: serverTimestamp() },
        { merge: true }
      );
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
      const payload = {
        uid: user.uid,
        displayName: String(fields.displayName || "Usuario").slice(0, 80),
        handle: fields.handle,
        role: fields.role,
        skills: Array.isArray(fields.skills) ? fields.skills : [],
        bio: fields.bio,
        photoURL: user.photoURL || "",
        availableForWork: fields.availableForWork,
        presenceMode: fields.presenceMode || (fields.availableForWork ? "available" : "away"),
        isPublic: fields.isPublic,
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
      currentOwnProfile = { ...(currentOwnProfile || {}), ...payload };
    };

    cloudHooks.savePresenceMode = async (mode) => {
      const user = auth.currentUser;
      if (!user) return;
      const availableForWork = mode === "available";
      const displayName = String(
        currentOwnProfile?.displayName || user.displayName || "Miembro de Xuanii"
      ).slice(0, 80);
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          displayName,
          presenceMode: mode,
          availableForWork,
          updatedAtMs: Date.now(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      currentOwnProfile = {
        ...(currentOwnProfile || {}),
        presenceMode: mode,
        availableForWork
      };
    };

    // Presencia global en tiempo real ("Personas en línea")
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
      if (activeUsersEl) activeUsersEl.textContent = String(Math.max(1, liveCount));
    });

    // Garantizar que todo usuario autenticado tenga su documento en profiles/{uid}
    const ensureUserProfileExists = async (user) => {
      const profRef = doc(db, "profiles", user.uid);
      const snap = await getDoc(profRef).catch(() => null);
      if (snap && snap.exists()) {
        currentOwnProfile = snap.data();
        if (user.photoURL && currentOwnProfile.photoURL !== user.photoURL) {
          await setDoc(
            profRef,
            {
              displayName: String(currentOwnProfile.displayName || user.displayName || "Miembro").slice(0, 80),
              photoURL: user.photoURL
            },
            { merge: true }
          ).catch(() => {});
          currentOwnProfile.photoURL = user.photoURL;
        }
      } else {
        const defaultHandle = sanitizeHandle(
          user.email ? user.email.split("@")[0] : user.displayName,
          user.uid.slice(0, 6)
        );
        const initialProfile = {
          uid: user.uid,
          displayName: String(user.displayName || "Miembro de Xuanii").slice(0, 80),
          handle: defaultHandle,
          role: "Creador digital",
          skills: [],
          bio: "",
          photoURL: user.photoURL || "",
          availableForWork: true,
          presenceMode: "available",
          isPublic: true,
          updatedAtMs: Date.now(),
          createdAt: serverTimestamp()
        };
        await setDoc(profRef, initialProfile, { merge: true }).catch(() => {});
        currentOwnProfile = initialProfile;
      }
      populateProfileForm(currentOwnProfile);
    };

    // Inicio de sesión con Google -> entra directo al espacio de trabajo (cuenta.html)
    const signInAndEnterWorkspace = async (destinationUrl = "cuenta.html") => {
      if (activeAuthUser) {
        window.location.href = destinationUrl;
        return;
      }
      try {
        const cred = await signInWithPopup(auth, provider);
        if (cred?.user) {
          await ensureUserProfileExists(cred.user);
          const onAccountPage = window.location.pathname.endsWith("cuenta.html");
          if (!onAccountPage || destinationUrl !== "cuenta.html") {
            window.location.href = destinationUrl;
          }
        }
      } catch (err) {
        const code = err?.code || "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          return;
        }
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
    navSignOutBtn?.addEventListener("click", handleSignOut);
    accountSignOutBtn?.addEventListener("click", handleSignOut);
    sidebarSignOutBtn?.addEventListener("click", handleSignOut);

    // =========================================================
    // DIRECTORIO EN TIEMPO REAL DE PERFILES (PERFILES.HTML)
    // =========================================================
    const profilesListEl = document.getElementById("profilesDirectoryList");
    if (profilesListEl) {
      let allPublicProfiles = [];
      let currentFilter = "all";
      let searchQuery = "";

      const renderProfilesDirectory = () => {
        profilesListEl.textContent = "";
        const q = searchQuery.trim().toLowerCase();

        const filtered = allPublicProfiles.filter((p) => {
          if (p.isPublic === false) return false;
          if (currentFilter === "available" && p.availableForWork === false) return false;
          if (!q) return true;
          const skillsText = Array.isArray(p.skills) ? p.skills.join(" ") : p.skills || "";
          const hay = `${p.displayName || ""} @${p.handle || ""} ${p.role || ""} ${skillsText} ${p.bio || ""}`.toLowerCase();
          return hay.includes(q);
        });

        if (filtered.length === 0) {
          const empty = document.createElement("div");
          empty.className = "arch-col";
          const idx = document.createElement("span");
          idx.className = "col-index mono";
          idx.textContent = allPublicProfiles.length === 0 ? "PRIMEROS PERFILES" : "SIN COINCIDENCIAS";
          const txt = document.createElement("p");
          txt.textContent =
            allPublicProfiles.length === 0
              ? "Sé el primero en aparecer aquí: inicia sesión con Google para activar tu perfil profesional y recibir propuestas de trabajo."
              : "No encontramos perfiles con ese criterio de búsqueda.";
          empty.appendChild(idx);
          empty.appendChild(txt);
          profilesListEl.appendChild(empty);
          return;
        }

        filtered.forEach((prof) => {
          const row = document.createElement("article");
          row.className = "profile-open-row";

          const left = document.createElement("div");
          left.className = "profile-identity";

          const avatar = document.createElement("img");
          avatar.className = "profile-avatar-lg";
          avatar.src = prof.photoURL || "favicon.svg";
          avatar.alt = prof.displayName || "Perfil";
          avatar.addEventListener("error", () => {
            avatar.src = "favicon.svg";
          });

          const meta = document.createElement("div");
          meta.className = "profile-meta-stack";

          const nameLine = document.createElement("div");
          nameLine.className = "profile-name-line";
          const h3 = document.createElement("h3");
          h3.textContent = prof.displayName || "Miembro";
          const handleSpan = document.createElement("span");
          handleSpan.className = "profile-handle mono";
          handleSpan.textContent = `@${prof.handle || "usuario"}`;
          nameLine.appendChild(h3);
          nameLine.appendChild(handleSpan);

          const roleSpan = document.createElement("span");
          roleSpan.className = "profile-role";
          roleSpan.textContent = prof.role || "Creador digital";

          meta.appendChild(nameLine);
          meta.appendChild(roleSpan);

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

          left.appendChild(avatar);
          left.appendChild(meta);

          const right = document.createElement("div");
          right.className = "profile-cta-col";

          const statusTag = document.createElement("span");
          statusTag.className = "work-status-inline mono";
          const dot = document.createElement("span");
          const isAvail = prof.availableForWork !== false;
          dot.className = isAvail ? "work-dot" : "work-dot muted-dot";
          const statusLabel = document.createElement("span");
          statusLabel.textContent = isAvail
            ? "Disponible para trabajos"
            : prof.presenceMode === "focus"
              ? "En modo enfoque"
              : "Miembro activo";
          statusTag.appendChild(dot);
          statusTag.appendChild(statusLabel);
          right.appendChild(statusTag);

          const isMe = activeAuthUser && prof.uid === activeAuthUser.uid;
          if (isMe) {
            const editLink = document.createElement("a");
            editLink.href = "cuenta.html?tab=profile";
            editLink.className = "link-editorial";
            editLink.style.padding = "4px 0";
            editLink.textContent = "Editar mi perfil →";
            right.appendChild(editLink);
          } else {
            const chatBtn = document.createElement("button");
            chatBtn.type = "button";
            chatBtn.className = "btn btn-white btn-sm";
            chatBtn.textContent = "Hablar / Proponer trabajo →";
            chatBtn.addEventListener("click", () => {
              const chatTargetUrl = `cuenta.html?chat=${encodeURIComponent(prof.uid)}`;
              signInAndEnterWorkspace(chatTargetUrl);
            });
            right.appendChild(chatBtn);
          }

          row.appendChild(left);
          row.appendChild(right);
          profilesListEl.appendChild(row);
        });
      };

      onSnapshot(collection(db, "profiles"), (snap) => {
        const items = [];
        snap.forEach((d) => items.push(d.data()));
        items.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
        allPublicProfiles = items;
        renderProfilesDirectory();
      });

      document.querySelectorAll("#profileFilterTabs .topic-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document
            .querySelectorAll("#profileFilterTabs .topic-tab")
            .forEach((b) => b.classList.remove("active"));
          tab.classList.add("active");
          currentFilter = tab.dataset.filter || "all";
          renderProfilesDirectory();
        });
      });

      document.getElementById("profileSearchInput")?.addEventListener("input", (e) => {
        searchQuery = e.target.value || "";
        renderProfilesDirectory();
      });
    }

    // =========================================================
    // ESCUCHA EN TIEMPO REAL DEL BAÚL DE ARCHIVOS Y NOTAS
    // =========================================================
    let unsubscribeVault = null;
    const attachVaultListener = (user) => {
      if (unsubscribeVault) {
        unsubscribeVault();
        unsubscribeVault = null;
      }
      if (!document.getElementById("authenticatedWorkspace")) return;

      unsubscribeVault = onSnapshot(collection(db, "users", user.uid, "projects"), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        currentVaultItems = list;
        renderCloudVaultList();
      });
    };

    // =========================================================
    // MENSAJERÍA DIRECTA EN TIEMPO REAL PARA TRABAJOS (CUENTA.HTML)
    // =========================================================
    let unsubscribeConversations = null;
    let unsubscribeActiveMessages = null;
    let selectedConvId = null;
    let selectedPeerUid = null;

    const conversationsListEl = document.getElementById("conversationsList");
    const chatEmptyStateEl = document.getElementById("chatEmptyState");
    const chatActiveThreadEl = document.getElementById("chatActiveThread");
    const chatPeerAvatarEl = document.getElementById("chatPeerAvatar");
    const chatPeerNameEl = document.getElementById("chatPeerName");
    const chatPeerHandleEl = document.getElementById("chatPeerHandle");
    const chatPeerRoleEl = document.getElementById("chatPeerRole");
    const chatMessagesStreamEl = document.getElementById("chatMessagesStream");
    const chatComposeForm = document.getElementById("chatComposeForm");
    const chatMessageInput = document.getElementById("chatMessageInput");

    const openDirectChatWith = async (peerUid) => {
      const me = auth.currentUser;
      if (!me || !peerUid || peerUid === me.uid || !chatActiveThreadEl) return;

      const convId = [me.uid, peerUid].sort().join("_");
      selectedConvId = convId;
      selectedPeerUid = peerUid;

      const peerSnap = await getDoc(doc(db, "profiles", peerUid)).catch(() => null);
      const peerProf = peerSnap?.exists()
        ? peerSnap.data()
        : { uid: peerUid, displayName: "Miembro", handle: "usuario", role: "", photoURL: "" };

      const convRef = doc(db, "conversations", convId);
      const convSnap = await getDoc(convRef).catch(() => null);
      const myMeta = {
        displayName: currentOwnProfile?.displayName || me.displayName || "Usuario",
        handle: currentOwnProfile?.handle || "usuario",
        photoURL: me.photoURL || ""
      };
      const peerMeta = {
        displayName: peerProf.displayName || "Miembro",
        handle: peerProf.handle || "usuario",
        photoURL: peerProf.photoURL || ""
      };

      if (!convSnap || !convSnap.exists()) {
        await setDoc(convRef, {
          participants: [me.uid, peerUid],
          participantProfiles: {
            [me.uid]: myMeta,
            [peerUid]: peerMeta
          },
          lastMessage: "",
          updatedAtMs: Date.now(),
          createdAt: serverTimestamp()
        });
      }

      if (chatEmptyStateEl) chatEmptyStateEl.hidden = true;
      chatActiveThreadEl.hidden = false;

      if (chatPeerAvatarEl) {
        chatPeerAvatarEl.src = peerProf.photoURL || "favicon.svg";
        chatPeerAvatarEl.onerror = () => {
          chatPeerAvatarEl.src = "favicon.svg";
        };
      }
      if (chatPeerNameEl) chatPeerNameEl.textContent = peerProf.displayName || "Miembro";
      if (chatPeerHandleEl) chatPeerHandleEl.textContent = `@${peerProf.handle || "usuario"}`;
      if (chatPeerRoleEl) chatPeerRoleEl.textContent = peerProf.role || "Conversación directa";

      document.querySelectorAll(".conv-item-open").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.convId === convId);
      });

      if (unsubscribeActiveMessages) {
        unsubscribeActiveMessages();
        unsubscribeActiveMessages = null;
      }

      const msgsQuery = query(
        collection(db, "conversations", convId, "messages"),
        orderBy("createdAtMs", "asc")
      );

      unsubscribeActiveMessages = onSnapshot(msgsQuery, (snap) => {
        if (!chatMessagesStreamEl) return;
        chatMessagesStreamEl.textContent = "";

        if (snap.empty) {
          const hint = document.createElement("div");
          hint.className = "chat-msg-rail";
          const p = document.createElement("p");
          p.className = "chat-msg-text";
          p.style.color = "var(--muted)";
          p.textContent = "Escribe el primer mensaje abajo para presentarte o proponer un trabajo.";
          hint.appendChild(p);
          chatMessagesStreamEl.appendChild(hint);
          return;
        }

        snap.forEach((mDoc) => {
          const m = mDoc.data();
          const isOwn = m.senderUid === me.uid;
          const rail = document.createElement("div");
          rail.className = isOwn ? "chat-msg-rail own-msg" : "chat-msg-rail";

          const meta = document.createElement("span");
          meta.className = "chat-msg-meta mono";
          meta.textContent = `${isOwn ? "TÚ" : (m.senderName || peerProf.displayName || "MIEMBRO").toUpperCase()} · ${formatDateEs(m.createdAtMs)}`;

          const txt = document.createElement("p");
          txt.className = "chat-msg-text";
          txt.textContent = m.text || "";

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

      chatMessageInput.value = "";
      const senderName = currentOwnProfile?.displayName || me.displayName || "Usuario";
      const nowMs = Date.now();

      await addDoc(collection(db, "conversations", selectedConvId, "messages"), {
        senderUid: me.uid,
        senderName,
        text,
        createdAtMs: nowMs,
        createdAt: serverTimestamp()
      });

      await setDoc(
        doc(db, "conversations", selectedConvId),
        {
          lastMessage: text.slice(0, 140),
          lastSenderUid: me.uid,
          updatedAtMs: nowMs,
          [`participantProfiles.${me.uid}`]: {
            displayName: senderName,
            handle: currentOwnProfile?.handle || "usuario",
            photoURL: me.photoURL || ""
          }
        },
        { merge: true }
      );
    });

    const attachConversationsListener = (user) => {
      if (!conversationsListEl) return;
      if (unsubscribeConversations) {
        unsubscribeConversations();
        unsubscribeConversations = null;
      }

      const convQ = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
      unsubscribeConversations = onSnapshot(convQ, (snap) => {
        const convs = [];
        snap.forEach((d) => convs.push({ id: d.id, ...d.data() }));
        convs.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));

        const badgeMsgs = document.getElementById("badgeMsgsCount");
        const statChats = document.getElementById("statChatsCount");
        if (badgeMsgs) badgeMsgs.textContent = String(convs.length);
        if (statChats) statChats.textContent = String(convs.length);

        conversationsListEl.textContent = "";
        if (convs.length === 0) {
          const emptyP = document.createElement("p");
          emptyP.style.fontSize = "0.86rem";
          emptyP.style.color = "var(--muted)";
          emptyP.textContent = "Aún no tienes conversaciones abiertas.";
          conversationsListEl.appendChild(emptyP);
          return;
        }

        convs.forEach((c) => {
          const otherUid = (c.participants || []).find((id) => id !== user.uid) || "";
          const otherInfo = c.participantProfiles?.[otherUid] || {};

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
          prev.textContent = c.lastMessage || "Conversación abierta";

          col.appendChild(nm);
          col.appendChild(prev);
          btn.appendChild(img);
          btn.appendChild(col);

          btn.addEventListener("click", () => {
            openDirectChatWith(otherUid);
          });

          conversationsListEl.appendChild(btn);
        });
      });
    };

    // Escuchar estado global de sesión de Google y restaurar entorno en la nube
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
        if (navUserName) navUserName.textContent = `Mi espacio · ${shortName}`;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Entrar a mi espacio";

        await ensureUserProfileExists(user);
        prefillKnownUserFields();
        renderAccountWorkspace();
        attachVaultListener(user);
        attachConversationsListener(user);

        if (requestedChatUid && requestedChatUid !== user.uid) {
          switchWorkspaceTab("messages");
          await openDirectChatWith(requestedChatUid);
        }

        // Restaurar tema, wallpaper, bloc rápido y ajustes de PhotoStun desde Cloud Firestore
        const userSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
        if (userSnap?.exists()) {
          const uData = userSnap.data() || {};

          if (uData.photostunPriority) {
            currentOwnProfile = { ...(currentOwnProfile || {}), photostunPriority: true };
          }
          if (uData.preferences && typeof uData.preferences === "object") {
            writeJson(STORAGE_KEYS.PREFS, uData.preferences);
          }
          if (uData.photostunPrefs && typeof uData.photostunPrefs === "object") {
            writeJson(STORAGE_KEYS.PS_PREFS, uData.photostunPrefs);
            applyPhotostunPrefsToUi(uData.photostunPrefs);
          }
          if (typeof uData.scratchpad === "string") {
            try {
              localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, uData.scratchpad);
            } catch {
              // Ignorar
            }
            if (quickScratchpadEl && document.activeElement !== quickScratchpadEl) {
              quickScratchpadEl.value = uData.scratchpad;
            }
          }
          if (uData.wallpaperCloud && !currentWallpaperUrl) {
            currentWallpaperUrl = uData.wallpaperCloud;
            await idbSet("custom_wallpaper", uData.wallpaperCloud);
          }
          if (uData.workspaceEnv && typeof uData.workspaceEnv === "object") {
            // Si el usuario aún no había personalizado localmente este navegador, adoptar su entorno de la nube
            if (!localStorage.getItem(STORAGE_KEYS.ENV)) {
              applyWorkspaceEnv(uData.workspaceEnv, { saveLocal: true, syncCloud: false });
            } else {
              applyWorkspaceEnv({}, { saveLocal: false, syncCloud: false });
            }
          }
          renderAccountWorkspace();
        }

        await setDoc(
          doc(db, "users", user.uid),
          {
            displayName: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            preferences: readJson(STORAGE_KEYS.PREFS, {
              cloudAutosave: true,
              releaseAlerts: true
            }),
            workspaceEnv,
            lastLoginAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => {});
      } else {
        currentOwnProfile = null;
        currentVaultItems = [];
        renderCloudVaultList();
        if (unsubscribeVault) {
          unsubscribeVault();
          unsubscribeVault = null;
        }
        if (unsubscribeConversations) {
          unsubscribeConversations();
          unsubscribeConversations = null;
        }
        if (unsubscribeActiveMessages) {
          unsubscribeActiveMessages();
          unsubscribeActiveMessages = null;
        }
        if (navSignInBtn) navSignInBtn.hidden = false;
        if (navUserChip) navUserChip.hidden = true;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Continuar con Google";
        renderAccountWorkspace();
      }
    });
  })();
}
