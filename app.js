/* =========================================================
   1. ESTADO LOCAL Y UTILIDADES
   ========================================================= */
const STORAGE_KEYS = {
  PREFS: "xuanii_prefs",
  WAITLIST: "xuanii_waitlist",
  SUBMISSIONS: "xuanii_submissions"
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
    // Ignorar errores de cuota
  }
};

const formatDateEs = (val) => {
  try {
    const d = typeof val === "number" ? new Date(val) : new Date(val);
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

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

let cloudHooks = {
  saveSubmission: null,
  saveWaitlist: null,
  savePrefs: null,
  saveProfile: null,
  openChatWithPeer: null
};

let activeAuthUser = null;
let currentOwnProfile = null;

/* =========================================================
   2. LIENZO DIAGONAL MONOCROMÁTICO DEL HERO (INDEX)
   ========================================================= */
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
    grad.addColorStop(0.5, `rgba(185, 185, 195, ${(alphaTop + alphaBot) * 0.5})`);
    grad.addColorStop(1, `rgba(10, 10, 14, ${alphaBot})`);
    ctx.fillStyle = grad;
    ctx.fill();
  };

  const tick = () => {
    t += 0.011;
    ctx.fillStyle = "#050506";
    ctx.fillRect(0, 0, w, h);

    drawRibbon(h * 0.28, 52, 0.0024, 0.9, 0.16, 0.01);
    drawRibbon(h * 0.44, 64, 0.0031, -0.7, 0.22, 0.02);
    drawRibbon(h * 0.6, 46, 0.0038, 1.15, 0.13, 0.01);

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
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 - i * 0.025})`;
      ctx.stroke();
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* =========================================================
   3. ESQUEMA INTERACTIVO ABIERTO DE PHOTOSTUN (CURVA TONAL)
   ========================================================= */
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

    if (!hoverActive) {
      targetNormX = Math.sin(phase * 0.55) * 0.32 + 0.5;
      targetGain = 1.0;
    }
    smoothNormX += (targetNormX - smoothNormX) * 0.1;
    smoothGain += (targetGain - smoothGain) * 0.1;

    ectx.strokeStyle = "rgba(5, 5, 6, 0.08)";
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
      ectx.strokeStyle = "#050506";
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
      ectx.strokeStyle = layer === 0 ? "#050506" : `rgba(5, 5, 6, ${0.45 - layer * 0.08})`;
      ectx.lineWidth = layer === 0 ? 2 : 1;
      ectx.stroke();
    }

    const fx = 50 + smoothNormX * (cw - 100);
    const fEnv = Math.sin(smoothNormX * Math.PI);
    const fy =
      ch * 0.54 -
      Math.sin(smoothNormX * 5.2 + phase) * (66 * smoothGain * fEnv) -
      Math.cos(smoothNormX * 2.4 - phase * 0.7) * (24 * smoothGain * fEnv);

    ectx.strokeStyle = "rgba(5, 5, 6, 0.22)";
    ectx.setLineDash([3, 3]);
    ectx.beginPath();
    ectx.moveTo(fx, 40);
    ectx.lineTo(fx, ch - 40);
    ectx.stroke();
    ectx.setLineDash([]);

    ectx.fillStyle = "#050506";
    ectx.beginPath();
    ectx.arc(fx, fy, 4.5, 0, Math.PI * 2);
    ectx.fill();

    ectx.font = "500 11px 'JetBrains Mono', monospace";
    ectx.fillStyle = "#52525b";
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
   6. ESPACIO PRIVADO DE CUENTA: APPS, PERFIL, CHAT Y AJUSTES
   ========================================================= */
const wsTabs = document.querySelectorAll(".workspace-tab[data-ws-tab]");
const switchWorkspaceTab = (tabName) => {
  wsTabs.forEach((btn) => {
    const active = btn.dataset.wsTab === tabName;
    btn.classList.toggle("active", active);
  });
  ["apps", "profile", "messages", "settings"].forEach((key) => {
    const panel = document.getElementById(`wsPanel-${key}`);
    if (panel) panel.hidden = key !== tabName;
  });
};

wsTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchWorkspaceTab(btn.dataset.wsTab);
  });
});

// Leer parámetros iniciales de URL en cuenta.html (?tab=profile o ?chat=UID)
const urlParams = new URLSearchParams(window.location.search);
const requestedTab = urlParams.get("tab");
const requestedChatUid = urlParams.get("chat");
if (requestedChatUid) {
  switchWorkspaceTab("messages");
} else if (requestedTab && ["apps", "profile", "messages", "settings"].includes(requestedTab)) {
  switchWorkspaceTab(requestedTab);
}

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
        userStatusEl.textContent = activeAuthUser.displayName || activeAuthUser.email || "Sesión activa";
      }
      if (userSubEl) {
        userSubEl.textContent = activeAuthUser.email || "Autenticado mediante Google OAuth 2.0.";
      }
    } else {
      authGateEl.hidden = false;
      workspaceEl.hidden = true;
    }
  }

  // Estado de PhotoStun dentro del lanzador de aplicaciones
  const hubStateEl = document.getElementById("hubPhotostunState");
  const hubPriorityBtn = document.getElementById("hubPhotostunPriorityBtn");
  const waitlist = readJson(STORAGE_KEYS.WAITLIST, null);

  if (hubPriorityBtn) {
    if (waitlist?.email || currentOwnProfile?.photostunPriority) {
      if (hubStateEl) hubStateEl.textContent = "Acceso prioritario vinculado";
      hubPriorityBtn.textContent = "Acceso prioritario activo ✓";
      hubPriorityBtn.disabled = true;
    } else {
      if (hubStateEl) hubStateEl.textContent = "Cuenta vinculada";
      hubPriorityBtn.textContent = "Activar acceso prioritario";
      hubPriorityBtn.disabled = false;
    }
  }

  // Preferencias
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

// Botón de 1 clic para activar acceso prioritario a PhotoStun en el panel de Mis aplicaciones
document.getElementById("hubPhotostunPriorityBtn")?.addEventListener("click", async () => {
  if (!activeAuthUser) return;
  const record = {
    email: activeAuthUser.email || "",
    priority: "Activado desde lanzador de cuenta",
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

// Formulario de edición de Perfil Público dentro de cuenta.html
const profileEditForm = document.getElementById("profileEditForm");
const profileDisplayNameEl = document.getElementById("profileDisplayName");
const profileHandleEl = document.getElementById("profileHandle");
const profileRoleEl = document.getElementById("profileRole");
const profileBioEl = document.getElementById("profileBio");
const profileAvailableBtn = document.getElementById("profileAvailableBtn");
const profilePublicBtn = document.getElementById("profilePublicBtn");
const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");
const profilePreviewName = document.getElementById("profilePreviewName");
const profilePreviewHandle = document.getElementById("profilePreviewHandle");
const profilePreviewRole = document.getElementById("profilePreviewRole");
const profileSaveFeedback = document.getElementById("profileSaveFeedback");

const syncProfilePreview = () => {
  if (profilePreviewName && profileDisplayNameEl) {
    profilePreviewName.textContent = profileDisplayNameEl.value.trim() || "Tu nombre";
  }
  if (profilePreviewHandle && profileHandleEl) {
    profilePreviewHandle.textContent = `@${sanitizeHandle(profileHandleEl.value, activeAuthUser?.displayName)}`;
  }
  if (profilePreviewRole && profileRoleEl) {
    profilePreviewRole.textContent = profileRoleEl.value.trim() || "Miembro de Xuanii";
  }
  if (profilePreviewAvatar && activeAuthUser?.photoURL) {
    profilePreviewAvatar.src = activeAuthUser.photoURL;
  }
};

const populateProfileForm = (prof) => {
  if (!prof) return;
  if (profileDisplayNameEl) profileDisplayNameEl.value = prof.displayName || "";
  if (profileHandleEl) profileHandleEl.value = prof.handle || "";
  if (profileRoleEl) profileRoleEl.value = prof.role || "";
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
  syncProfilePreview();
};

[profileDisplayNameEl, profileHandleEl, profileRoleEl].forEach((inp) => {
  inp?.addEventListener("input", syncProfilePreview);
});

profileAvailableBtn?.addEventListener("click", () => {
  const next = profileAvailableBtn.dataset.active !== "true";
  profileAvailableBtn.dataset.active = String(next);
  profileAvailableBtn.textContent = next ? "DISPONIBLE" : "NO DISPONIBLE";
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
  const bio = (profileBioEl?.value || "").trim();
  const availableForWork = profileAvailableBtn?.dataset.active !== "false";
  const isPublic = profilePublicBtn?.dataset.active !== "false";

  const saveBtn = document.getElementById("profileSaveBtn");
  if (saveBtn) saveBtn.disabled = true;

  await cloudHooks.saveProfile({
    displayName,
    handle,
    role,
    bio,
    availableForWork,
    isPublic
  });

  if (profileHandleEl) profileHandleEl.value = handle;
  syncProfilePreview();
  if (saveBtn) saveBtn.disabled = false;

  if (profileSaveFeedback) {
    profileSaveFeedback.hidden = false;
    profileSaveFeedback.textContent = "Perfil guardado y sincronizado en el directorio público.";
  }
});

/* =========================================================
   7. FIREBASE AUTH, PERFILES EN TIEMPO REAL Y CHAT DIRECTO
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

    cloudHooks.saveProfile = async (fields) => {
      const user = auth.currentUser;
      if (!user) return;
      const payload = {
        uid: user.uid,
        displayName: fields.displayName,
        handle: fields.handle,
        role: fields.role,
        bio: fields.bio,
        photoURL: user.photoURL || "",
        availableForWork: fields.availableForWork,
        isPublic: fields.isPublic,
        updatedAtMs: Date.now(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
      currentOwnProfile = { ...(currentOwnProfile || {}), ...payload };
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
          await setDoc(profRef, { photoURL: user.photoURL }, { merge: true }).catch(() => {});
          currentOwnProfile.photoURL = user.photoURL;
        }
      } else {
        const defaultHandle = sanitizeHandle(
          user.email ? user.email.split("@")[0] : user.displayName,
          user.uid.slice(0, 6)
        );
        const initialProfile = {
          uid: user.uid,
          displayName: user.displayName || "Miembro de Xuanii",
          handle: defaultHandle,
          role: "Creador digital",
          bio: "",
          photoURL: user.photoURL || "",
          availableForWork: true,
          isPublic: true,
          updatedAtMs: Date.now(),
          createdAt: serverTimestamp()
        };
        await setDoc(profRef, initialProfile, { merge: true }).catch(() => {});
        currentOwnProfile = initialProfile;
      }
      populateProfileForm(currentOwnProfile);
    };

    // Inicio de sesión con Google -> lleva directo al espacio privado (cuenta.html)
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
          const hay = `${p.displayName || ""} @${p.handle || ""} ${p.role || ""} ${p.bio || ""}`.toLowerCase();
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
          statusLabel.textContent = isAvail ? "Disponible para trabajos" : "Miembro activo";
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
          document.querySelectorAll("#profileFilterTabs .topic-tab").forEach((b) => b.classList.remove("active"));
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
    const wsMessagesTabBtn = document.getElementById("wsMessagesTabBtn");

    const openDirectChatWith = async (peerUid) => {
      const me = auth.currentUser;
      if (!me || !peerUid || peerUid === me.uid || !chatActiveThreadEl) return;

      const convId = [me.uid, peerUid].sort().join("_");
      selectedConvId = convId;
      selectedPeerUid = peerUid;

      // Cargar perfil del destinatario
      const peerSnap = await getDoc(doc(db, "profiles", peerUid)).catch(() => null);
      const peerProf = peerSnap?.exists()
        ? peerSnap.data()
        : { uid: peerUid, displayName: "Miembro", handle: "usuario", role: "", photoURL: "" };

      // Asegurar que exista el documento raíz de la conversación para habilitar escucha en tiempo real
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

        if (wsMessagesTabBtn) {
          wsMessagesTabBtn.textContent =
            convs.length > 0 ? `Mensajes y trabajos (${convs.length})` : "Mensajes y trabajos";
        }

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

    // Escuchar estado global de sesión de Google
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
        attachConversationsListener(user);

        if (requestedChatUid && requestedChatUid !== user.uid) {
          switchWorkspaceTab("messages");
          await openDirectChatWith(requestedChatUid);
        }

        const userSnap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
        if (userSnap?.exists() && userSnap.data()?.photostunPriority) {
          currentOwnProfile = { ...(currentOwnProfile || {}), photostunPriority: true };
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
            lastLoginAt: serverTimestamp()
          },
          { merge: true }
        ).catch(() => {});
      } else {
        currentOwnProfile = null;
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
