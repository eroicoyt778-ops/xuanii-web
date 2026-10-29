(function () {
  try {
    localStorage.removeItem("xuanii_workspace_env");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-backdrop");
    document.documentElement.style.backgroundColor = "#050507";
  } catch (e) {
    // Modo oscuro obsidiana permanente
  }
})();
