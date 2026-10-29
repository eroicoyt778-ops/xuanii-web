(function () {
  try {
    var raw = localStorage.getItem("xuanii_workspace_env");
    if (!raw) return;
    var env = JSON.parse(raw);
    var root = document.documentElement;
    if (env.theme && ["obsidian", "graphite", "light"].indexOf(env.theme) !== -1) {
      root.setAttribute("data-theme", env.theme);
    }
    if (env.density === "compact") {
      root.setAttribute("data-density", "compact");
    }
    if (env.guides === false) {
      root.setAttribute("data-guides", "off");
    }
    if (typeof env.bgOpacity === "number") {
      root.style.setProperty("--ws-bg-opacity", String(env.bgOpacity));
    }
    if (typeof env.bgBlur === "number") {
      root.style.setProperty("--ws-bg-blur", env.bgBlur + "px");
    }
    if (typeof env.bgMono === "boolean") {
      root.style.setProperty("--ws-bg-mono", env.bgMono ? "100%" : "0%");
    }
    if (env.backdrop) {
      root.setAttribute("data-backdrop", env.backdrop);
    }
  } catch (e) {
    // Ignorar errores de acceso a localStorage
  }
})();
