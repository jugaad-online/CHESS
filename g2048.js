(() => {
  const SIZE = 4;
  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const statusEl = document.getElementById("status");
  let grid, score, won, over;
  const BEST_KEY = "g2048-best";

  function emptyCells() {
    const out = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) out.push([r, c]);
    return out;
  }

  function spawn() {
    const cells = emptyCells();
    if (!cells.length) return;
    const [r, c] = cells[Math.floor(Math.random() * cells.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slide(line) {
    const nums = line.filter(Boolean);
    const out = [];
    let gained = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === nums[i + 1]) {
        const v = nums[i] * 2;
        out.push(v);
        gained += v;
        if (v === 2048) won = true;
        i++;
      } else out.push(nums[i]);
    }
    while (out.length < SIZE) out.push(0);
    return { line: out, gained, changed: out.some((v, i) => v !== line[i]) };
  }

  function move(dir) {
    if (over) return;
    let changed = false;
    let gained = 0;
    const next = grid.map((row) => row.slice());

    const apply = (get, set) => {
      for (let i = 0; i < SIZE; i++) {
        const line = [];
        for (let j = 0; j < SIZE; j++) line.push(get(i, j));
        const res = slide(line);
        gained += res.gained;
        if (res.changed) changed = true;
        for (let j = 0; j < SIZE; j++) set(i, j, res.line[j]);
      }
    };

    if (dir === "left") apply((i, j) => next[i][j], (i, j, v) => { next[i][j] = v; });
    if (dir === "right") apply((i, j) => next[i][SIZE - 1 - j], (i, j, v) => { next[i][SIZE - 1 - j] = v; });
    if (dir === "up") apply((i, j) => next[j][i], (i, j, v) => { next[j][i] = v; });
    if (dir === "down") apply((i, j) => next[SIZE - 1 - j][i], (i, j, v) => { next[SIZE - 1 - j][i] = v; });

    if (!changed) return;
    grid = next;
    score += gained;
    spawn();
    if (!canMove()) over = true;
    render();
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
    }
    return false;
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      const cell = document.createElement("div");
      cell.className = "cell-2048";
      if (v) {
        cell.textContent = v;
        cell.dataset.v = v > 2048 ? "super" : String(v);
      }
      boardEl.appendChild(cell);
    }
    scoreEl.textContent = score;
    const best = Math.max(score, Number(localStorage.getItem(BEST_KEY) || 0));
    localStorage.setItem(BEST_KEY, String(best));
    bestEl.textContent = best;
    statusEl.textContent = over ? "Game over" : won ? "You reached 2048!" : "Swipe or use arrow keys";
  }

  function newGame() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0; won = false; over = false;
    spawn(); spawn();
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  document.addEventListener("keydown", (e) => {
    const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  });

  let sx = 0, sy = 0;
  boardEl.addEventListener("touchstart", (e) => {
    sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
  }, { passive: true });
  boardEl.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  }, { passive: true });

  newGame();
})();
