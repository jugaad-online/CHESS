(() => {
  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const board = document.getElementById("board");
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  let grid, selected, turn, over;

  function isHole(r, c) {
    if (r < 0 || r > 6 || c < 0 || c > 6) return false;
    if ((r < 2 || r > 4) && (c < 2 || c > 4)) return false;
    return true;
  }

  function reset() {
    grid = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (isHole(r, c) ? null : "x"))
    );
    // 13 geese on top/north of cross
    const gooseSpots = [
      [0, 2], [0, 3], [0, 4],
      [1, 2], [1, 3], [1, 4],
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
    ];
    gooseSpots.forEach(([r, c]) => { grid[r][c] = "G"; });
    grid[5][3] = "F";
    selected = null;
    turn = "fox";
    over = false;
    status.textContent = "Your turn — select the fox, then a square";
    render();
  }

  function findFox() {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (grid[r][c] === "F") return [r, c];
    return null;
  }

  function geese() {
    const g = [];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (grid[r][c] === "G") g.push([r, c]);
    return g;
  }

  function foxMoves() {
    const fox = findFox();
    if (!fox) return [];
    const [r, c] = fox;
    const moves = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (isHole(nr, nc) && grid[nr][nc] === null) moves.push({ to: [nr, nc] });
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (isHole(lr, lc) && grid[mr][mc] === "G" && grid[lr][lc] === null) {
        moves.push({ to: [lr, lc], cap: [mr, mc] });
      }
    }
    return moves;
  }

  function gooseMovesFrom(r, c) {
    const moves = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (isHole(nr, nc) && grid[nr][nc] === null) moves.push([nr, nc]);
    }
    return moves;
  }

  function allGooseMoves() {
    const list = [];
    geese().forEach(([r, c]) => {
      gooseMovesFrom(r, c).forEach((to) => list.push({ from: [r, c], to }));
    });
    return list;
  }

  function applyFox(move) {
    const fox = findFox();
    grid[fox[0]][fox[1]] = null;
    grid[move.to[0]][move.to[1]] = "F";
    if (move.cap) grid[move.cap[0]][move.cap[1]] = null;
  }

  function checkEnd() {
    const g = geese().length;
    scoreEl.textContent = `Geese left: ${g}`;
    if (g === 0) {
      over = true;
      status.textContent = "You win — all geese captured!";
      return true;
    }
    if (!foxMoves().length) {
      over = true;
      status.textContent = "Geese win — fox is trapped!";
      return true;
    }
    if (!allGooseMoves().length) {
      over = true;
      status.textContent = "You win — geese can't move!";
      return true;
    }
    return false;
  }

  function aiGeese() {
    if (over || turn !== "geese") return;
    const moves = allGooseMoves();
    if (!moves.length) {
      checkEnd();
      render();
      return;
    }
    const fox = findFox();
    // Prefer blocking / approaching fox; avoid giving easy jumps
    let best = moves[0];
    let bestScore = -9999;
    for (const m of moves) {
      grid[m.from[0]][m.from[1]] = null;
      grid[m.to[0]][m.to[1]] = "G";
      let s = -Math.abs(m.to[0] - fox[0]) - Math.abs(m.to[1] - fox[1]);
      s -= foxMoves().filter((fm) => fm.cap).length * 8;
      s += Math.random();
      grid[m.to[0]][m.to[1]] = null;
      grid[m.from[0]][m.from[1]] = "G";
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    grid[best.from[0]][best.from[1]] = null;
    grid[best.to[0]][best.to[1]] = "G";
    turn = "fox";
    if (!checkEnd()) status.textContent = "Your turn — move the fox";
    render();
  }

  function onCell(r, c) {
    if (over || turn !== "fox" || !isHole(r, c)) return;
    const moves = foxMoves();
    if (!selected) {
      if (grid[r][c] !== "F") return;
      selected = [r, c];
      status.textContent = "Choose destination (jump to capture)";
      render();
      return;
    }
    const move = moves.find((m) => m.to[0] === r && m.to[1] === c);
    if (move) {
      applyFox(move);
      selected = null;
      if (checkEnd()) {
        render();
        return;
      }
      turn = "geese";
      status.textContent = "Geese moving…";
      render();
      setTimeout(aiGeese, 400);
      return;
    }
    if (grid[r][c] === "F") {
      selected = [r, c];
      render();
      return;
    }
    selected = null;
    status.textContent = "Select the fox";
    render();
  }

  function render() {
    scoreEl.textContent = `Geese left: ${geese().length}`;
    board.innerHTML = "";
    const moves = selected ? foxMoves() : [];
    const legal = new Set(moves.map((m) => m.to.join(",")));
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fg-cell";
        if (!isHole(r, c)) {
          btn.disabled = true;
        } else {
          btn.classList.add("hole");
          if (selected && selected[0] === r && selected[1] === c) btn.classList.add("selected");
          if (legal.has(`${r},${c}`)) btn.classList.add("legal");
          if (grid[r][c] === "F") btn.innerHTML = '<span class="fox"></span>';
          if (grid[r][c] === "G") btn.innerHTML = '<span class="goose"></span>';
          btn.addEventListener("click", () => onCell(r, c));
        }
        board.appendChild(btn);
      }
    }
  }

  document.getElementById("btn-new").addEventListener("click", reset);
  reset();
})();
