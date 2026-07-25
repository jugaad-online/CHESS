(() => {
  "use strict";

  const STORAGE_KEY = "jugaad-games-view-mode";

  function currentMode() {
    return localStorage.getItem(STORAGE_KEY) === "3d" ? "3d" : "2d";
  }

  function applyMode(mode) {
    const stages = document.querySelectorAll("[data-view-stage]");
    const twos = document.querySelectorAll('[data-view="2d"]');
    const threes = document.querySelectorAll('[data-view="3d"]');

    stages.forEach((el) => {
      el.classList.toggle("is-3d", mode === "3d");
      el.setAttribute("data-mode", mode);
    });

    twos.forEach((btn) => btn.classList.toggle("active", mode === "2d"));
    threes.forEach((btn) => btn.classList.toggle("active", mode === "3d"));

    document.documentElement.setAttribute("data-view-mode", mode);
    localStorage.setItem(STORAGE_KEY, mode);

    window.dispatchEvent(new CustomEvent("viewmodechange", { detail: { mode } }));
  }

  function bind() {
    document.body.classList.add("is-game");
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-view") === "3d" ? "3d" : "2d";
        applyMode(mode);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "2") applyMode("2d");
      if (e.key === "3") applyMode("3d");
    });

    applyMode(currentMode());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }

  window.GameViewMode = { apply: applyMode, get: currentMode };
})();
