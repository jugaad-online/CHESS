(() => {
  const LEVELS = { easy: { w: 9, h: 9, mines: 10 }, medium: { w: 12, h: 12, mines: 24 }, hard: { w: 14, h: 14, mines: 40 } };
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const minesEl = document.getElementById("mines");
  const flagsEl = document.getElementById("flags");
  let cfg = LEVELS.easy, grid, started, over, flags;

  function idx(r, c) { return r * cfg.w + c; }
  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < cfg.h && cc >= 0 && cc < cfg.w) out.push([rr, cc]);
    }
    return out;
  }

  function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.h);
      const c = Math.floor(Math.random() * cfg.w);
      if ((r === safeR && c === safeC) || grid[idx(r, c)].mine) continue;
      grid[idx(r, c)].mine = true;
      placed++;
    }
    for (let r = 0; r < cfg.h; r++) for (let c = 0; c < cfg.w; c++) {
      const cell = grid[idx(r, c)];
      if (cell.mine) continue;
      cell.n = neighbors(r, c).filter(([rr, cc]) => grid[idx(rr, cc)].mine).length;
    }
  }

  function open(r, c) {
    const cell = grid[idx(r, c)];
    if (cell.open || cell.flag || over) return;
    if (!started) { placeMines(r, c); started = true; }
    cell.open = true;
    if (cell.mine) {
      over = true;
      grid.forEach((g) => { if (g.mine) g.open = true; });
      statusEl.textContent = "Boom — you hit a mine";
      render();
      return;
    }
    if (cell.n === 0) neighbors(r, c).forEach(([rr, cc]) => open(rr, cc));
    const left = grid.filter((g) => !g.mine && !g.open).length;
    if (!left) {
      over = true;
      statusEl.textContent = "Cleared!";
      grid.forEach((g) => { if (g.mine) g.flag = true; });
    }
  }

  function render() {
    boardEl.style.gridTemplateColumns = `repeat(${cfg.w}, minmax(0, 1fr))`;
    boardEl.innerHTML = "";
    flags = grid.filter((g) => g.flag).length;
    minesEl.textContent = cfg.mines;
    flagsEl.textContent = flags;
    for (let r = 0; r < cfg.h; r++) for (let c = 0; c < cfg.w; c++) {
      const cell = grid[idx(r, c)];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ms-cell";
      if (cell.open) {
        btn.classList.add("open");
        if (cell.mine) { btn.classList.add("mine"); btn.textContent = "✱"; }
        else if (cell.n) { btn.textContent = cell.n; btn.classList.add(`c${cell.n}`); }
      } else if (cell.flag) btn.classList.add("flag");
      btn.oncontextmenu = (e) => { e.preventDefault(); if (over || cell.open) return; cell.flag = !cell.flag; render(); };
      btn.onclick = () => { open(r, c); if (!over || statusEl.textContent === "Cleared!") statusEl.textContent = over ? statusEl.textContent : "Clear the field"; render(); };
      boardEl.appendChild(btn);
    }
  }

  function newGame() {
    grid = Array.from({ length: cfg.w * cfg.h }, () => ({ mine: false, open: false, flag: false, n: 0 }));
    started = false; over = false; flags = 0;
    statusEl.textContent = "Clear the field";
    render();
  }

  document.querySelectorAll(".diff").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".diff").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      btn.classList.remove("btn-ghost");
      document.querySelectorAll(".diff").forEach((b) => { if (b !== btn) b.classList.add("btn-ghost"); });
      cfg = LEVELS[btn.dataset.diff];
      newGame();
    };
  });
  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
