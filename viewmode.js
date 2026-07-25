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
    requestAnimationFrame(fitAllStages);
  }

  function ensureScaler(stage) {
    let scaler = stage.querySelector(":scope > .fit-scaler");
    if (scaler) return scaler;
    const kids = [...stage.children];
    if (!kids.length) return null;
    scaler = document.createElement("div");
    scaler.className = "fit-scaler";
    kids.forEach((k) => scaler.appendChild(k));
    stage.appendChild(scaler);
    return scaler;
  }

  function fitStage(stage) {
    const scaler = ensureScaler(stage);
    if (!scaler) return;

    scaler.style.transform = "none";
    scaler.style.marginBottom = "0";
    scaler.style.width = "";

    const stageStyle = getComputedStyle(stage);
    const padX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
    const padY = parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);

    const availW = Math.max(0, stage.clientWidth - padX);
    // Prefer remaining viewport under chrome when stage height is still expanding
    const chrome = stage.getBoundingClientRect().top;
    const availH = Math.max(
      stage.clientHeight - padY,
      window.innerHeight - chrome - padY - 12
    );
    if (availW < 40 || availH < 40) return;

    const rect = scaler.getBoundingClientRect();
    const w = rect.width || scaler.scrollWidth;
    const h = rect.height || scaler.scrollHeight;
    if (!w || !h) return;

    const scale = Math.min(1, availW / w, availH / h);
    if (scale < 0.995) {
      scaler.style.transformOrigin = "top center";
      scaler.style.transform = `scale(${scale})`;
      scaler.style.marginBottom = `${-((1 - scale) * h)}px`;
    }
  }

  function fitAllStages() {
    document.querySelectorAll("[data-view-stage]").forEach(fitStage);
  }

  function bindFit() {
    fitAllStages();
    window.addEventListener("resize", () => {
      clearTimeout(bindFit._t);
      bindFit._t = setTimeout(fitAllStages, 80);
    });
    window.addEventListener("orientationchange", () => setTimeout(fitAllStages, 180));
    window.addEventListener("viewmodechange", () => setTimeout(fitAllStages, 40));

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        clearTimeout(bindFit._t);
        bindFit._t = setTimeout(fitAllStages, 50);
      });
      document.querySelectorAll("[data-view-stage]").forEach((el) => ro.observe(el));
      if (document.querySelector(".app")) ro.observe(document.querySelector(".app"));
    }

    // Re-fit after fonts / late layout
    setTimeout(fitAllStages, 120);
    setTimeout(fitAllStages, 400);
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
    bindFit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }

  window.GameViewMode = { apply: applyMode, get: currentMode, fit: fitAllStages };
})();
