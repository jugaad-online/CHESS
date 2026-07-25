(() => {
  const N = 9;
  const NEI = [[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]];
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let grid, over;

  function inB(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }

  function connected(p, startPred, endPred) {
    const seen = new Set();
    const q = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] === p && startPred(r, c)) { q.push([r, c]); seen.add(r + "," + c); }
    }
    while (q.length) {
      const [r, c] = q.shift();
      if (endPred(r, c)) return true;
      for (const [dr, dc] of NEI) {
        const nr = r + dr, nc = c + dc;
        const k = nr + "," + nc;
        if (!inB(nr, nc) || seen.has(k) || grid[nr][nc] !== p) continue;
        seen.add(k); q.push([nr, nc]);
      }
    }
    return false;
  }

  function winner() {
    if (connected(1, (_, c) => c === 0, (_, c) => c === N - 1)) return 1;
    if (connected(2, (r) => r === 0, (r) => r === N - 1)) return 2;
    return 0;
  }

  function aiMove() {
    let best = null, bestScore = -Infinity;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c]) continue;
      grid[r][c] = 2;
      if (winner() === 2) { grid[r][c] = 0; return [r, c]; }
      grid[r][c] = 1;
      const block = winner() === 1;
      grid[r][c] = 0;
      const center = N / 2;
      const s = (block ? 1000 : 0) - Math.abs(r - center) * 2 + Math.random() * 3;
      if (s > bestScore) { bestScore = s; best = [r, c]; }
    }
    return best;
  }

  function play(r, c) {
    if (over || grid[r][c]) return;
    grid[r][c] = 1;
    let w = winner();
    if (w) { over = true; statusEl.textContent = "You win!"; render(); return; }
    statusEl.textContent = "Computer…";
    render();
    setTimeout(() => {
      const m = aiMove();
      if (m) grid[m[0]][m[1]] = 2;
      w = winner();
      if (w === 2) { over = true; statusEl.textContent = "Computer wins"; }
      else if (grid.every(row => row.every(Boolean))) { over = true; statusEl.textContent = "Draw"; }
      else statusEl.textContent = "Your turn (red)";
      render();
    }, 220);
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) {
      const row = document.createElement("div");
      row.className = "hex-row";
      row.style.setProperty("--i", r);
      for (let c = 0; c < N; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hex-cell" + (grid[r][c] === 1 ? " red" : grid[r][c] === 2 ? " blue" : "");
        btn.disabled = over || !!grid[r][c];
        btn.onclick = () => play(r, c);
        row.appendChild(btn);
      }
      boardEl.appendChild(row);
    }
  }

  function newGame() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    over = false;
    statusEl.textContent = "Your turn (red)";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
