(() => {
  // Simplified 2-player Chinese Checkers on a diamond board (rows 1..9..1)
  // Cells keyed "r,c" within each row. Neighbors: adjacent in row + diagonals to next rows.
  const ROWS = [1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1];
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let cells, selected, turn, over, hopFrom;

  function key(r, c) { return r + "," + c; }

  function buildEmpty() {
    const m = new Map();
    ROWS.forEach((len, r) => {
      for (let c = 0; c < len; c++) m.set(key(r, c), 0);
    });
    return m;
  }

  function neighbors(r, c) {
    const len = ROWS[r];
    const out = [];
    if (c > 0) out.push([r, c - 1]);
    if (c < len - 1) out.push([r, c + 1]);
    // row above
    if (r > 0) {
      const up = ROWS[r - 1];
      const offset = (up - len) / 2;
      const candidates = [c + offset - 0.5, c + offset + 0.5];
      for (const cc of candidates) {
        if (Number.isInteger(cc) && cc >= 0 && cc < up) out.push([r - 1, cc]);
      }
      // also same-ish index when expanding/shrinking
      for (let cc = 0; cc < up; cc++) {
        if (Math.abs((cc + 0.5) / up - (c + 0.5) / len) < 0.55 / len + 0.55 / up) {
          if (!out.some(([rr, xx]) => rr === r - 1 && xx === cc)) {
            // keep tight adjacency only
          }
        }
      }
    }
    if (r < ROWS.length - 1) {
      const dn = ROWS[r + 1];
      const offset = (dn - len) / 2;
      for (const adj of [c + offset - 0.5, c + offset + 0.5]) {
        if (Number.isInteger(adj) && adj >= 0 && adj < dn) out.push([r + 1, adj]);
      }
    }
    return out;
  }

  // Better neighbor model: axial-like for diamond by mapping to 2D coords
  function pos(r, c) {
    const len = ROWS[r];
    const x = c - (len - 1) / 2;
    const y = r;
    return { x, y };
  }

  function allNeighbors(r, c) {
    const p = pos(r, c);
    const out = [];
    cells.forEach((_, k) => {
      const [rr, cc] = k.split(",").map(Number);
      if (rr === r && cc === c) return;
      const q = pos(rr, cc);
      const dx = Math.abs(p.x - q.x), dy = Math.abs(p.y - q.y);
      if (dy === 0 && dx <= 1.01) out.push([rr, cc]);
      else if (dy === 1 && dx <= 0.76) out.push([rr, cc]);
    });
    return out;
  }

  function stepMoves(r, c) {
    return allNeighbors(r, c).filter(([nr, nc]) => cells.get(key(nr, nc)) === 0);
  }

  function hopMoves(r, c, seen = new Set()) {
    const res = [];
    for (const [nr, nc] of allNeighbors(r, c)) {
      if (!cells.get(key(nr, nc))) continue;
      const p = pos(r, c), m = pos(nr, nc);
      const lx = m.x + (m.x - p.x), ly = m.y + (m.y - p.y);
      // find landing
      let land = null;
      cells.forEach((_, k) => {
        const [rr, cc] = k.split(",").map(Number);
        const q = pos(rr, cc);
        if (Math.abs(q.x - lx) < 0.2 && Math.abs(q.y - ly) < 0.2) land = [rr, cc];
      });
      if (!land) continue;
      const lk = key(land[0], land[1]);
      if (cells.get(lk) !== 0 || seen.has(lk)) continue;
      res.push(land);
      const nextSeen = new Set(seen); nextSeen.add(lk);
      // chain hops from land — only hops, not steps
      for (const h of hopMoves(land[0], land[1], nextSeen)) res.push(h);
    }
    // unique
    const u = new Map();
    for (const [rr, cc] of res) u.set(key(rr, cc), [rr, cc]);
    return [...u.values()];
  }

  function movesFrom(r, c) {
    const steps = stepMoves(r, c);
    const hops = hopMoves(r, c);
    const u = new Map();
    for (const m of [...steps, ...hops]) u.set(key(m[0], m[1]), m);
    return [...u.values()];
  }

  function homeKeys(player) {
    // red starts top tip (rows 0-3), goal bottom (rows 13-16)
    // blue opposite
    const keys = [];
    if (player === 1) {
      for (let r = 0; r <= 3; r++) for (let c = 0; c < ROWS[r]; c++) keys.push(key(r, c));
    } else {
      for (let r = ROWS.length - 4; r < ROWS.length; r++) for (let c = 0; c < ROWS[r]; c++) keys.push(key(r, c));
    }
    return keys;
  }

  function goalKeys(player) {
    return homeKeys(player === 1 ? 2 : 1);
  }

  function setup() {
    cells = buildEmpty();
    for (const k of homeKeys(1)) cells.set(k, 1);
    for (const k of homeKeys(2)) cells.set(k, 2);
  }

  function won(player) {
    return goalKeys(player).every((k) => cells.get(k) === player);
  }

  function pieces(player) {
    const out = [];
    cells.forEach((v, k) => { if (v === player) out.push(k.split(",").map(Number)); });
    return out;
  }

  function aiMove() {
    const opts = [];
    for (const [r, c] of pieces(2)) {
      for (const [tr, tc] of movesFrom(r, c)) {
        const before = pos(r, c).y, after = pos(tr, tc).y;
        // prefer moving toward top (smaller y)
        const score = (before - after) * 10 + (hopMoves(r, c).some(([a,b]) => a===tr && b===tc) ? 5 : 0) + Math.random();
        opts.push({ fr: r, fc: c, tr, tc, score });
      }
    }
    if (!opts.length) return null;
    opts.sort((a, b) => b.score - a.score);
    return opts[0];
  }

  function doMove(fr, fc, tr, tc, player) {
    cells.set(key(fr, fc), 0);
    cells.set(key(tr, tc), player);
  }

  function afterHuman() {
    if (won(1)) { over = true; statusEl.textContent = "You win!"; render(); return; }
    turn = 2;
    statusEl.textContent = "Computer…";
    render();
    setTimeout(() => {
      const m = aiMove();
      if (m) doMove(m.fr, m.fc, m.tr, m.tc, 2);
      if (won(2)) { over = true; statusEl.textContent = "Computer wins"; }
      else { turn = 1; statusEl.textContent = "Your turn"; }
      selected = null;
      render();
    }, 280);
  }

  function click(r, c) {
    if (over || turn !== 1) return;
    const k = key(r, c);
    if (selected) {
      const [sr, sc] = selected;
      const legal = movesFrom(sr, sc).some(([a, b]) => a === r && b === c);
      if (legal) {
        doMove(sr, sc, r, c, 1);
        selected = null;
        afterHuman();
        return;
      }
    }
    if (cells.get(k) === 1) {
      selected = [r, c];
      render();
    } else selected = null;
  }

  function render() {
    boardEl.innerHTML = "";
    let dests = new Set();
    if (selected && turn === 1) {
      const [sr, sc] = selected;
      for (const [r, c] of movesFrom(sr, sc)) dests.add(key(r, c));
    }
    ROWS.forEach((len, r) => {
      const row = document.createElement("div");
      row.className = "cc-row";
      for (let c = 0; c < len; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        const v = cells.get(key(r, c));
        btn.className = "cc-hole"
          + (v === 1 ? " red" : v === 2 ? " blue" : "")
          + (selected && selected[0] === r && selected[1] === c ? " sel" : "")
          + (dests.has(key(r, c)) ? " dest" : "");
        btn.onclick = () => click(r, c);
        row.appendChild(btn);
      }
      boardEl.appendChild(row);
    });
  }

  function newGame() {
    setup();
    selected = null; turn = 1; over = false;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
