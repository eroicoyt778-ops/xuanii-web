(function () {
  try {
    localStorage.removeItem("xuanii_workspace_env");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-backdrop");
    document.documentElement.style.backgroundColor = "#050507";

    // Forzar HTTPS en producción para asegurar el candado de seguridad
    if (typeof window !== "undefined" && window.location) {
      if (window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        window.location.replace("https://" + window.location.hostname + (window.location.port ? ":" + window.location.port : "") + window.location.pathname + window.location.search + window.location.hash);
        return;
      }
    }

    // Pre-validar si ya existía sesión activa para eliminar el parpadeo de 1-2 segundos
    var authSession = localStorage.getItem("xuanii_auth_session");
    if (authSession) {
      document.documentElement.classList.add("xuanii-auth-cached");
    }

    // Limpieza instantánea y profesional de .html en la barra de direcciones (Clean URLs)
    if (typeof window !== "undefined" && window.location) {
      var pathname = window.location.pathname;
      if (pathname.endsWith(".html")) {
        var cleanPath = pathname.replace(/\.html$/, "");
        if (cleanPath.endsWith("/index")) {
          cleanPath = cleanPath.slice(0, -5) || "/";
        }
        window.history.replaceState(null, "", cleanPath + window.location.search + window.location.hash);
      }
    }
  } catch (e) {
    // Modo oscuro obsidiana permanente
  }
})();
