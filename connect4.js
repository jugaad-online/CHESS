(() => {
  const ROWS = 6, COLS = 7;
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let grid, over, thinking;

  function drop(col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) { grid[r][col] = player; return r; }
    }
    return -1;
  }

  function undo(col) {
    for (let r = 0; r < ROWS; r++) if (grid[r][col]) { grid[r][col] = 0; return; }
  }

  function winner() {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = grid[r][c];
      if (!p) continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k, cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || grid[rr][cc] !== p) break;
          n++;
        }
        if (n >= 4) return p;
      }
    }
    if (grid[0].every(Boolean)) return 3;
    return 0;
  }

  function scoreWindow(window, player) {
    const opp = player === 1 ? 2 : 1;
    const count = (x) => window.filter((v) => v === x).length;
    const mine = count(player), empty = count(0), enemy = count(opp);
    if (mine === 4) return 100000;
    if (enemy === 4) return -100000;
    if (mine === 3 && empty === 1) return 100;
    if (mine === 2 && empty === 2) return 10;
    if (enemy === 3 && empty === 1) return -120;
    return 0;
  }

  function evaluate(player) {
    let score = 0;
    const center = grid.map((row) => row[3]);
    score += center.filter((v) => v === player).length * 6;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([grid[r][c], grid[r][c+1], grid[r][c+2], grid[r][c+3]], player);
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 3; r++)
      score += scoreWindow([grid[r][c], grid[r+1][c], grid[r+2][c], grid[r+3][c]], player);
    for (let r = 0; r < ROWS - 3; r++) for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([grid[r][c], grid[r+1][c+1], grid[r+2][c+2], grid[r+3][c+3]], player);
    for (let r = 3; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([grid[r][c], grid[r-1][c+1], grid[r-2][c+2], grid[r-3][c+3]], player);
    return score;
  }

  function validCols() {
    return [...Array(COLS).keys()].filter((c) => !grid[0][c]);
  }

  function minimax(depth, alpha, beta, maximizing) {
    const w = winner();
    if (w === 2) return 1000000 + depth;
    if (w === 1) return -1000000 - depth;
    if (w === 3 || depth === 0) return evaluate(2);
    const cols = validCols();
    if (maximizing) {
      let best = -Infinity;
      for (const c of cols) {
        drop(c, 2);
        best = Math.max(best, minimax(depth - 1, alpha, beta, false));
        undo(c);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Infinity;
    for (const c of cols) {
      drop(c, 1);
      best = Math.min(best, minimax(depth - 1, alpha, beta, true));
      undo(c);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function aiMove() {
    let best = -Infinity, move = validCols()[0];
    for (const c of validCols()) {
      drop(c, 2);
      const score = minimax(4, -Infinity, Infinity, false);
      undo(c);
      if (score > best) { best = score; move = c; }
    }
    drop(move, 2);
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c4-cell";
      if (grid[r][c] === 1) btn.classList.add("p1");
      if (grid[r][c] === 2) btn.classList.add("p2");
      btn.disabled = over || thinking || !!grid[0][c];
      btn.onclick = () => play(c);
      boardEl.appendChild(btn);
    }
  }

  function finish() {
    const w = winner();
    if (!w) return false;
    over = true;
    statusEl.textContent = w === 1 ? "You win!" : w === 2 ? "Computer wins" : "Draw";
    return true;
  }

  function play(col) {
    if (over || thinking || grid[0][col]) return;
    drop(col, 1);
    if (finish()) { render(); return; }
    thinking = true;
    statusEl.textContent = "Computer thinking…";
    render();
    setTimeout(() => {
      aiMove();
      thinking = false;
      if (!finish()) statusEl.textContent = "Your turn";
      render();
    }, 180);
  }

  function newGame() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    over = false; thinking = false;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
