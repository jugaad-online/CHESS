(() => {
  const N = 8;
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  let grid, turn, over;

  const opp = (p) => (p === 1 ? 2 : 1);

  function inB(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }

  function flipsAt(r, c, p) {
    if (grid[r][c]) return [];
    const all = [];
    for (const [dr, dc] of DIRS) {
      const line = [];
      let nr = r + dr, nc = c + dc;
      while (inB(nr, nc) && grid[nr][nc] === opp(p)) {
        line.push([nr, nc]);
        nr += dr; nc += dc;
      }
      if (line.length && inB(nr, nc) && grid[nr][nc] === p) all.push(...line);
    }
    return all;
  }

  function moves(p) {
    const m = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (flipsAt(r, c, p).length) m.push([r, c]);
    return m;
  }

  function apply(r, c, p) {
    const f = flipsAt(r, c, p);
    grid[r][c] = p;
    for (const [fr, fc] of f) grid[fr][fc] = p;
  }

  function count() {
    let b = 0, w = 0;
    for (const row of grid) for (const v of row) { if (v === 1) b++; else if (v === 2) w++; }
    return { b, w };
  }

  function aiMove() {
    const opts = moves(2);
    if (!opts.length) return false;
    let best = null, bestScore = -Infinity;
    for (const [r, c] of opts) {
      const f = flipsAt(r, c, 2).length;
      const corner = (r === 0 || r === 7) && (c === 0 || c === 7) ? 20 : 0;
      const edge = r === 0 || r === 7 || c === 0 || c === 7 ? 4 : 0;
      const s = f + corner + edge + Math.random();
      if (s > bestScore) { bestScore = s; best = [r, c]; }
    }
    apply(best[0], best[1], 2);
    return true;
  }

  function endCheck() {
    const m1 = moves(1).length, m2 = moves(2).length;
    if (!m1 && !m2) {
      over = true;
      const { b, w } = count();
      statusEl.textContent = b > w ? "You win!" : w > b ? "Computer wins" : "Draw";
      return true;
    }
    return false;
  }

  function afterHuman() {
    if (endCheck()) { render(); return; }
    if (!moves(2).length) {
      statusEl.textContent = "White passes — your turn";
      turn = 1;
      render();
      return;
    }
    statusEl.textContent = "Computer thinking…";
    render();
    setTimeout(() => {
      aiMove();
      if (endCheck()) { render(); return; }
      if (!moves(1).length) {
        statusEl.textContent = "You pass — computer moves";
        setTimeout(() => {
          aiMove();
          endCheck();
          turn = 1;
          if (!over) statusEl.textContent = "Your turn";
          render();
        }, 350);
        return;
      }
      turn = 1;
      statusEl.textContent = "Your turn";
      render();
    }, 320);
  }

  function play(r, c) {
    if (over || turn !== 1) return;
    if (!flipsAt(r, c, 1).length) return;
    apply(r, c, 1);
    turn = 2;
    afterHuman();
  }

  function render() {
    const { b, w } = count();
    scoreEl.textContent = `Black ${b} · White ${w}`;
    const hints = turn === 1 && !over ? new Set(moves(1).map(([r, c]) => r * N + c)) : new Set();
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rev-cell" + (hints.has(r * N + c) ? " hint" : "");
        btn.disabled = over || turn !== 1 || !hints.has(r * N + c);
        if (grid[r][c]) {
          const d = document.createElement("span");
          d.className = "disc " + (grid[r][c] === 1 ? "b" : "w");
          btn.appendChild(d);
          btn.disabled = true;
        }
        btn.onclick = () => play(r, c);
        boardEl.appendChild(btn);
      }
    }
  }

  function newGame() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    grid[3][3] = 2; grid[3][4] = 1; grid[4][3] = 1; grid[4][4] = 2;
    turn = 1; over = false;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
