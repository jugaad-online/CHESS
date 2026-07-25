(() => {
  // Simple English draughts: dark (1) human bottom, light (2) AI top. Men move forward diagonals; kings both ways. Captures mandatory if any exist.
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let grid, turn, selected, legal, over, thinking;

  function clone(g) { return g.map((r) => r.slice()); }

  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function pieceOwner(p) { return p === 1 || p === 3 ? 1 : p === 2 || p === 4 ? 2 : 0; }
  function isKing(p) { return p === 3 || p === 4; }

  function dirsFor(p) {
    if (isKing(p)) return [[-1,-1],[-1,1],[1,-1],[1,1]];
    return pieceOwner(p) === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  }

  function capturesFrom(g, r, c, p, path = []) {
    const moves = [];
    for (const [dr, dc] of dirsFor(p)) {
      const mr = r + dr, mc = c + dc;
      const lr = r + dr * 2, lc = c + dc * 2;
      if (!inb(mr, mc) || !inb(lr, lc)) continue;
      const mid = g[mr][mc];
      if (!mid || pieceOwner(mid) === pieceOwner(p) || g[lr][lc]) continue;
      const ng = clone(g);
      ng[r][c] = 0;
      ng[mr][mc] = 0;
      let np = p;
      if (pieceOwner(p) === 1 && lr === 0) np = 3;
      if (pieceOwner(p) === 2 && lr === 7) np = 4;
      ng[lr][lc] = np;
      const next = capturesFrom(ng, lr, lc, np, path.concat([[lr, lc]]));
      if (next.length) moves.push(...next.map((m) => ({ path: [[lr, lc], ...m.path.slice(1)], board: m.board })));
      else moves.push({ path: path.concat([[lr, lc]]), board: ng });
    }
    return moves;
  }

  function quietMoves(g, r, c, p) {
    const moves = [];
    for (const [dr, dc] of dirsFor(p)) {
      const nr = r + dr, nc = c + dc;
      if (!inb(nr, nc) || g[nr][nc]) continue;
      const ng = clone(g);
      ng[r][c] = 0;
      let np = p;
      if (pieceOwner(p) === 1 && nr === 0) np = 3;
      if (pieceOwner(p) === 2 && nr === 7) np = 4;
      ng[nr][nc] = np;
      moves.push({ path: [[nr, nc]], board: ng });
    }
    return moves;
  }

  function allMoves(g, player) {
    const caps = [];
    const quiets = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = g[r][c];
      if (pieceOwner(p) !== player) continue;
      const cmoves = capturesFrom(g, r, c, p);
      if (cmoves.length) caps.push(...cmoves.map((m) => ({ from: [r, c], ...m })));
      else quiets.push(...quietMoves(g, r, c, p).map((m) => ({ from: [r, c], ...m })));
    }
    return caps.length ? caps : quiets;
  }

  function countPieces(g, player) {
    let n = 0, k = 0;
    for (const row of g) for (const p of row) {
      if (pieceOwner(p) === player) { n++; if (isKing(p)) k++; }
    }
    return n + k * 1.5;
  }

  function aiMove() {
    const moves = allMoves(grid, 2);
    if (!moves.length) { over = true; statusEl.textContent = "You win!"; return; }
    let best = null, bestScore = -Infinity;
    for (const m of moves) {
      const score = countPieces(m.board, 2) - countPieces(m.board, 1) + Math.random() * 0.2;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    grid = best.board;
    turn = 1;
    if (!allMoves(grid, 1).length) { over = true; statusEl.textContent = "Computer wins"; }
    else statusEl.textContent = "Your turn";
  }

  function render() {
    boardEl.innerHTML = "";
    const targets = new Map();
    if (selected) {
      legal.filter((m) => m.from[0] === selected[0] && m.from[1] === selected[1])
        .forEach((m) => targets.set(m.path[0].join(","), m));
    }
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ck-sq ${(r + c) % 2 ? "dark" : "light"}`;
      if (selected && selected[0] === r && selected[1] === c) btn.classList.add("selected");
      if (targets.has(`${r},${c}`)) btn.classList.add("legal");
      const p = grid[r][c];
      if (p) {
        const d = document.createElement("div");
        d.className = `piece ${pieceOwner(p) === 1 ? "p1" : "p2"}${isKing(p) ? " king" : ""}`;
        btn.appendChild(d);
      }
      btn.onclick = () => onClick(r, c, targets.get(`${r},${c}`));
      boardEl.appendChild(btn);
    }
  }

  function onClick(r, c, move) {
    if (over || thinking || turn !== 1) return;
    if (move) {
      grid = move.board;
      selected = null;
      legal = [];
      if (!allMoves(grid, 2).length) { over = true; statusEl.textContent = "You win!"; render(); return; }
      thinking = true;
      statusEl.textContent = "Computer thinking…";
      render();
      setTimeout(() => { thinking = false; aiMove(); render(); }, 220);
      return;
    }
    const p = grid[r][c];
    if (pieceOwner(p) === 1) {
      selected = [r, c];
      legal = allMoves(grid, 1);
      render();
    } else {
      selected = null; legal = []; render();
    }
  }

  function newGame() {
    grid = Array.from({ length: 8 }, () => Array(8).fill(0));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) grid[r][c] = 2;
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) grid[r][c] = 1;
    turn = 1; selected = null; legal = []; over = false; thinking = false;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
