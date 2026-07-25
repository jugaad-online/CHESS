(() => {
  const N = 8;
  const SHIPS = [4, 3, 3, 2];
  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const playerBoard = document.getElementById("player-board");
  const enemyBoard = document.getElementById("enemy-board");

  let phase, horizontal, placeIdx;
  let player, enemy;
  let huntTarget = null;

  function emptyGrid() {
    return Array.from({ length: N }, () => Array(N).fill(0));
  }

  function fleet() {
    return {
      grid: emptyGrid(),
      ships: [],
      shots: emptyGrid(),
      sunk: 0,
    };
  }

  function inBounds(r, c) {
    return r >= 0 && r < N && c >= 0 && c < N;
  }

  function canPlace(g, r, c, len, horiz) {
    for (let i = 0; i < len; i++) {
      const rr = horiz ? r : r + i;
      const cc = horiz ? c + i : c;
      if (!inBounds(rr, cc) || g[rr][cc]) return false;
    }
    return true;
  }

  function placeShip(f, r, c, len, horiz) {
    if (!canPlace(f.grid, r, c, len, horiz)) return false;
    const cells = [];
    for (let i = 0; i < len; i++) {
      const rr = horiz ? r : r + i;
      const cc = horiz ? c + i : c;
      f.grid[rr][cc] = f.ships.length + 1;
      cells.push([rr, cc]);
    }
    f.ships.push({ cells, hits: 0, sunk: false });
    return true;
  }

  function placeRandom(f) {
    for (const len of SHIPS) {
      let ok = false;
      for (let t = 0; t < 200 && !ok; t++) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * N);
        const c = Math.floor(Math.random() * N);
        ok = placeShip(f, r, c, len, horiz);
      }
    }
  }

  function fire(f, r, c) {
    if (f.shots[r][c]) return null;
    f.shots[r][c] = 1;
    const id = f.grid[r][c];
    if (!id) return "miss";
    const ship = f.ships[id - 1];
    ship.hits++;
    if (ship.hits >= ship.cells.length) {
      ship.sunk = true;
      f.sunk++;
      ship.cells.forEach(([rr, cc]) => { f.shots[rr][cc] = 2; });
      return "sunk";
    }
    return "hit";
  }

  function shipsAlive(f) {
    return f.ships.length - f.sunk;
  }

  function renderBoard(el, f, showShips, clickable) {
    el.innerHTML = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bs-cell";
        const shot = f.shots[r][c];
        if (showShips && f.grid[r][c]) btn.classList.add("ship");
        if (shot === 2) btn.classList.add("sunk");
        else if (shot && f.grid[r][c]) btn.classList.add("hit");
        else if (shot) btn.classList.add("miss");
        if (!clickable || shot || phase === "over") btn.disabled = true;
        else {
          btn.addEventListener("click", () => onCell(el === playerBoard ? "p" : "e", r, c));
        }
        el.appendChild(btn);
      }
    }
  }

  function render() {
    const placePhase = phase === "place";
    renderBoard(playerBoard, player, true, placePhase);
    renderBoard(enemyBoard, enemy, false, phase === "play");
    scoreEl.textContent = `Ships left — You: ${shipsAlive(player)} · Enemy: ${shipsAlive(enemy)}`;
  }

  function onCell(which, r, c) {
    if (phase === "place" && which === "p") {
      const len = SHIPS[placeIdx];
      if (!placeShip(player, r, c, len, horizontal)) {
        status.textContent = "Can't place there";
        return;
      }
      placeIdx++;
      if (placeIdx >= SHIPS.length) {
        phase = "play";
        status.textContent = "Your shot — fire on enemy waters";
      } else {
        status.textContent = `Place ship ${placeIdx + 1}/4 (length ${SHIPS[placeIdx]})`;
      }
      render();
      return;
    }
    if (phase === "play" && which === "e") {
      const res = fire(enemy, r, c);
      if (!res) return;
      if (res === "miss") status.textContent = "Miss!";
      else if (res === "hit") status.textContent = "Hit!";
      else status.textContent = "You sunk a ship!";
      render();
      if (shipsAlive(enemy) === 0) {
        phase = "over";
        status.textContent = "Victory — enemy fleet destroyed!";
        render();
        return;
      }
      setTimeout(aiTurn, 450);
    }
  }

  function aiPick() {
    const open = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (!player.shots[r][c]) open.push([r, c]);
    if (!open.length) return null;

    if (huntTarget) {
      const [hr, hc] = huntTarget;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const adj = dirs
        .map(([dr, dc]) => [hr + dr, hc + dc])
        .filter(([r, c]) => inBounds(r, c) && !player.shots[r][c]);
      if (adj.length) return adj[Math.floor(Math.random() * adj.length)];
      huntTarget = null;
    }
    return open[Math.floor(Math.random() * open.length)];
  }

  function aiTurn() {
    if (phase !== "play") return;
    const pick = aiPick();
    if (!pick) return;
    const [r, c] = pick;
    const res = fire(player, r, c);
    if (res === "hit") {
      huntTarget = [r, c];
      status.textContent = "Enemy hit your ship!";
    } else if (res === "sunk") {
      huntTarget = null;
      status.textContent = "Enemy sunk one of your ships!";
    } else {
      status.textContent = "Enemy missed — your shot";
    }
    render();
    if (shipsAlive(player) === 0) {
      phase = "over";
      status.textContent = "Defeat — your fleet is gone";
      render();
    }
  }

  function newGame() {
    phase = "place";
    horizontal = true;
    placeIdx = 0;
    huntTarget = null;
    player = fleet();
    enemy = fleet();
    placeRandom(enemy);
    status.textContent = `Place ship 1/4 (length ${SHIPS[0]}) — click your grid`;
    render();
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-rotate").addEventListener("click", () => {
    horizontal = !horizontal;
    if (phase === "place") {
      status.textContent = `Ship ${placeIdx + 1}/4 · ${horizontal ? "horizontal" : "vertical"}`;
    }
  });

  newGame();
})();
