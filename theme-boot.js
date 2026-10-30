(function () {
  try {
    localStorage.removeItem("xuanii_workspace_env");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-backdrop");
    document.documentElement.style.backgroundColor = "#050507";

    // Pre-validar si ya existía sesión activa para eliminar el parpadeo de 1-2 segundos
    var authSession = localStorage.getItem("xuanii_auth_session");
    if (authSession) {
      document.documentElement.classList.add("xuanii-auth-cached");
    }
  } catch (e) {
    // Modo oscuro obsidiana permanente
  }
})();
