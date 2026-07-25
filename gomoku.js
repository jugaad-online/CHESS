(() => {
  const N = 13, WIN = 5;
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let grid, over, last;

  function checkWin(p) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] !== p) continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        for (let k = 1; k < WIN; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= N || nc < 0 || nc >= N || grid[nr][nc] !== p) break;
          n++;
        }
        if (n >= WIN) return true;
      }
    }
    return false;
  }

  function scoreLine(p, r, c, dr, dc) {
    let count = 0, open = 0;
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === p) {
      count++; nr += dr; nc += dc;
    }
    if (nr >= 0 && nr < N && nc >= 0 && nc < N && !grid[nr][nc]) open++;
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === p) {
      count++; nr -= dr; nc -= dc;
    }
    if (nr >= 0 && nr < N && nc >= 0 && nc < N && !grid[nr][nc]) open++;
    if (count >= 4) return 100000;
    if (count === 3 && open === 2) return 10000;
    if (count === 3 && open === 1) return 1000;
    if (count === 2 && open === 2) return 200;
    if (count === 2 && open === 1) return 40;
    if (count === 1 && open) return 10;
    return 0;
  }

  function evalCell(r, c, p) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    let s = 0;
    for (const [dr, dc] of dirs) s += scoreLine(p, r, c, dr, dc);
    const mid = Math.abs(r - 6) + Math.abs(c - 6);
    return s + (12 - mid);
  }

  function aiMove() {
    let best = null, bestScore = -Infinity;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c]) continue;
      // prefer near existing stones
      let near = false;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc]) near = true;
      }
      if (!near && grid.some(row => row.some(Boolean))) continue;
      grid[r][c] = 2;
      if (checkWin(2)) { grid[r][c] = 0; return [r, c]; }
      grid[r][c] = 0;
      grid[r][c] = 1;
      const block = checkWin(1);
      grid[r][c] = 0;
      const score = evalCell(r, c, 2) * 1.1 + evalCell(r, c, 1) + (block ? 50000 : 0) + Math.random();
      if (score > bestScore) { bestScore = score; best = [r, c]; }
    }
    if (!best) {
      for (let r = 0; r < N && !best; r++)
        for (let c = 0; c < N && !best; c++)
          if (!grid[r][c]) best = [r, c];
    }
    return best;
  }

  function play(r, c) {
    if (over || grid[r][c]) return;
    grid[r][c] = 1;
    last = [r, c];
    if (checkWin(1)) {
      over = true;
      statusEl.textContent = "You win!";
      render();
      return;
    }
    if (grid.every(row => row.every(Boolean))) {
      over = true;
      statusEl.textContent = "Draw";
      render();
      return;
    }
    statusEl.textContent = "Computer…";
    render();
    setTimeout(() => {
      const m = aiMove();
      if (m) {
        grid[m[0]][m[1]] = 2;
        last = m;
        if (checkWin(2)) { over = true; statusEl.textContent = "Computer wins"; }
        else if (grid.every(row => row.every(Boolean))) { over = true; statusEl.textContent = "Draw"; }
        else statusEl.textContent = "Your turn";
      }
      render();
    }, 200);
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "go-cell";
      btn.disabled = over || !!grid[r][c];
      if (grid[r][c]) {
        const s = document.createElement("span");
        s.className = "stone " + (grid[r][c] === 1 ? "b" : "w");
        if (last && last[0] === r && last[1] === c) s.classList.add("last");
        btn.appendChild(s);
      }
      btn.onclick = () => play(r, c);
      boardEl.appendChild(btn);
    }
  }

  function newGame() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    over = false; last = null;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
