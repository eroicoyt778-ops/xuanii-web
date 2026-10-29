/* =========================================================
   1. ESTADO LOCAL Y UTILIDADES DE PERSISTENCIA
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
    // Ignorar errores de cuota o modo privado estricto
  }
};

const formatDateEs = (iso) => {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

let cloudHooks = {
  saveSubmission: null,
  saveWaitlist: null,
  savePrefs: null
};

let activeAuthUser = null;

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

    // Retícula técnica abierta sobre el fondo blanco
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

    // Marcas ópticas en las esquinas (sin encerrar en caja)
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

    // Curvas tonales monocromáticas
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

    // Punto nodal activo sobre la curva principal
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
   4. AUTO-RELLENADO DE CORREO/NOMBRE Y FORMULARIO DE PHOTOSTUN
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

    const targetInbox = (window.XUANII_CONTACT_EMAIL || "").trim();
    if (targetInbox && isValidEmail(targetInbox)) {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetInbox)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `[PhotoStun · Acceso anticipado] ${email}`,
          email,
          prioridad: priority
        })
      }).catch(() => {});
    }

    if (submitBtn) submitBtn.disabled = false;
    if (feedbackEl) {
      feedbackEl.hidden = false;
      feedbackEl.textContent = `Solicitud registrada para ${email} (Prioridad: ${priority}). Puedes verificar tu estado en el apartado Cuenta.`;
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
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
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
      feedbackEl.textContent = "";

      const msgSpan = document.createElement("span");
      if (entry.deliveredEmail || entry.deliveredCloud) {
        msgSpan.textContent = "Mensaje enviado y respaldado correctamente. Lo revisaremos pronto. ";
      } else {
        msgSpan.textContent = "Tu propuesta quedó guardada en la plataforma. ";
      }
      feedbackEl.appendChild(msgSpan);

      const accountLink = document.createElement("a");
      accountLink.href = "cuenta.html";
      accountLink.className = "text-action-btn";
      accountLink.textContent = "Ver en Cuenta →";
      feedbackEl.appendChild(accountLink);

      if (targetInbox && !entry.deliveredEmail) {
        const sep = document.createTextNode("  ·  ");
        const mailtoLink = document.createElement("a");
        const mailSubject = encodeURIComponent(`[${category}] ${subject}`);
        const mailBody = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\n${message}`);
        mailtoLink.href = `mailto:${targetInbox}?subject=${mailSubject}&body=${mailBody}`;
        mailtoLink.className = "text-action-btn";
        mailtoLink.textContent = "Abrir en tu cliente de correo";
        feedbackEl.appendChild(sep);
        feedbackEl.appendChild(mailtoLink);
      }
    }
  });
}

/* =========================================================
   6. PANEL FUNCIONAL DE CUENTA, PREFERENCIAS E HISTORIAL
   ========================================================= */
const renderAccountPage = () => {
  const userStatusEl = document.getElementById("accountUserStatus");
  const userSubEl = document.getElementById("accountUserSub");
  const syncModeEl = document.getElementById("accountSyncMode");
  const signInBtn = document.getElementById("accountSignInBtn");
  const signOutBtn = document.getElementById("accountSignOutBtn");

  if (userStatusEl) {
    if (activeAuthUser) {
      userStatusEl.textContent = activeAuthUser.displayName || activeAuthUser.email || "Sesión activa";
      if (userSubEl) userSubEl.textContent = activeAuthUser.email || "Autenticado mediante Google OAuth 2.0.";
      if (syncModeEl) syncModeEl.textContent = "Sincronización en la nube activa";
      if (signInBtn) signInBtn.hidden = true;
      if (signOutBtn) signOutBtn.hidden = false;
    } else {
      userStatusEl.textContent = "Sin sesión iniciada";
      if (userSubEl) {
        userSubEl.textContent = "Inicia sesión con Google para sincronizar tu progreso entre dispositivos.";
      }
      if (syncModeEl) syncModeEl.textContent = "Memoria local en este navegador";
      if (signInBtn) signInBtn.hidden = false;
      if (signOutBtn) signOutBtn.hidden = true;
    }
  }

  // Estado de acceso anticipado a PhotoStun
  const waitlistStatusEl = document.getElementById("accountWaitlistStatus");
  const waitlistSubEl = document.getElementById("accountWaitlistSub");
  const waitlistLinkEl = document.getElementById("accountWaitlistLink");
  const waitlist = readJson(STORAGE_KEYS.WAITLIST, null);

  if (waitlistStatusEl) {
    if (waitlist?.email) {
      waitlistStatusEl.textContent = "Registrado";
      if (waitlistSubEl) {
        waitlistSubEl.textContent = `${waitlist.email} · Prioridad: ${waitlist.priority}`;
      }
      if (waitlistLinkEl) waitlistLinkEl.textContent = "Actualizar preferencia";
    } else {
      waitlistStatusEl.textContent = "No solicitado";
      if (waitlistSubEl) {
        waitlistSubEl.textContent = "Reserva tu acceso desde la ficha oficial de Productos.";
      }
      if (waitlistLinkEl) waitlistLinkEl.textContent = "Registrar correo";
    }
  }

  // Preferencias interactivas
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

  // Listado real de propuestas y mensajes enviados
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
      p.textContent = "Todavía no has enviado propuestas ni mensajes desde este navegador. Usa el apartado de Contacto para contarnos qué herramientas quieres ver.";
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
        meta.textContent = `${item.category.toUpperCase()} · ${formatDateEs(item.createdAtIso)} · ${item.email}`;

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

document.querySelectorAll(".open-toggle-btn[data-pref]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.pref;
    const prefs = readJson(STORAGE_KEYS.PREFS, {
      cloudAutosave: true,
      releaseAlerts: true
    });
    prefs[key] = !prefs[key];
    writeJson(STORAGE_KEYS.PREFS, prefs);
    renderAccountPage();

    if (cloudHooks.savePrefs) {
      await cloudHooks.savePrefs(prefs).catch(() => {});
    }
  });
});

document.getElementById("clearLocalHistoryBtn")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
  renderAccountPage();
});

/* =========================================================
   7. AUTENTICACIÓN CON GOOGLE + PERSONAS EN LÍNEA EN TIEMPO REAL
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
renderAccountPage();

const fbCfg = window.XUANII_FIREBASE_CONFIG || {};
const isFirebaseConfigured = Boolean(fbCfg.apiKey && fbCfg.projectId);

if (!isFirebaseConfigured) {
  const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const peers = new Map([[tabId, Date.now()]]);

  const updateLocalCount = () => {
    const now = Date.now();
    for (const [id, ts] of peers.entries()) {
      if (id !== tabId && now - ts > 6000) peers.delete(id);
    }
    if (activeUsersEl) activeUsersEl.textContent = String(peers.size);
  };

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel("xuanii_live_sessions");
    const ping = () => {
      peers.set(tabId, Date.now());
      channel.postMessage({ type: "ping", tabId });
      updateLocalCount();
    };
    channel.onmessage = (ev) => {
      if (ev.data?.tabId) {
        if (ev.data.type === "bye") peers.delete(ev.data.tabId);
        else peers.set(ev.data.tabId, Date.now());
        updateLocalCount();
      }
    };
    window.addEventListener("pagehide", () => channel.postMessage({ type: "bye", tabId }));
    setInterval(ping, 2500);
    ping();
  }

  const openSetup = () => {
    if (authSetupModal) authSetupModal.hidden = false;
  };
  navSignInBtn?.addEventListener("click", openSetup);
  heroSignInBtn?.addEventListener("click", openSetup);
  accountSignInBtn?.addEventListener("click", openSetup);
} else {
  (async () => {
    const [
      { initializeApp },
      { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged },
      { getFirestore, doc, setDoc, addDoc, deleteDoc, collection, onSnapshot, serverTimestamp }
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

    cloudHooks.saveWaitlist = (record) =>
      addDoc(collection(db, "photostun_waitlist"), {
        ...record,
        createdAt: serverTimestamp()
      });

    cloudHooks.savePrefs = (prefs) => {
      if (!auth.currentUser) return Promise.resolve();
      return setDoc(
        doc(db, "users", auth.currentUser.uid),
        { preferences: prefs, updatedAt: serverTimestamp() },
        { merge: true }
      );
    };

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

    const triggerGoogleLogin = async () => {
      if (activeAuthUser) {
        window.location.href = "cuenta.html";
        return;
      }
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err?.code || "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          return;
        }
        if (authSetupModal) authSetupModal.hidden = false;
      }
    };

    navSignInBtn?.addEventListener("click", triggerGoogleLogin);
    heroSignInBtn?.addEventListener("click", triggerGoogleLogin);
    accountSignInBtn?.addEventListener("click", triggerGoogleLogin);

    const handleSignOut = () => signOut(auth);
    navSignOutBtn?.addEventListener("click", handleSignOut);
    accountSignOutBtn?.addEventListener("click", handleSignOut);

    onAuthStateChanged(auth, async (user) => {
      activeAuthUser = user;
      sendHeartbeat();

      if (user) {
        if (navSignInBtn) navSignInBtn.hidden = true;
        if (navUserChip) navUserChip.hidden = false;
        if (navUserAvatar) navUserAvatar.src = user.photoURL || "favicon.svg";
        if (navUserName) navUserName.textContent = user.displayName || user.email || "Cuenta";
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Ir a tu cuenta";

        prefillKnownUserFields();
        renderAccountPage();

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
        );
      } else {
        if (navSignInBtn) navSignInBtn.hidden = false;
        if (navUserChip) navUserChip.hidden = true;
        if (heroAuthBtnLabel) heroAuthBtnLabel.textContent = "Continuar con Google";
        renderAccountPage();
      }
    });
  })();
}
