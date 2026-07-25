(() => {
  // bits: tall=8, dark=4, round=2, hollow=1
  const ALL = Array.from({ length: 16 }, (_, i) => i);
  const boardEl = document.getElementById("board");
  const poolEl = document.getElementById("pool");
  const givenEl = document.getElementById("given");
  const statusEl = document.getElementById("status");
  let board, pool, given, phase, over, winLine;
  // phase: pick (human picks for AI) | place (human places given) | ai

  function attrs(p) {
    return {
      tall: !!(p & 8), dark: !!(p & 4), round: !!(p & 2), hollow: !!(p & 1),
    };
  }

  function pieceEl(p) {
    const a = attrs(p);
    const el = document.createElement("div");
    el.className = "piece "
      + (a.tall ? "tall " : "short ")
      + (a.dark ? "dark " : "light ")
      + (a.round ? "round " : "square ")
      + (a.hollow ? "hollow" : "solid");
    el.title = [a.tall?"tall":"short", a.dark?"dark":"light", a.round?"round":"square", a.hollow?"hollow":"solid"].join(" ");
    return el;
  }

  function lineWin(cells) {
    const ps = cells.map((i) => board[i]);
    if (ps.some((p) => p === null)) return false;
    for (let bit = 1; bit <= 8; bit <<= 1) {
      if (ps.every((p) => (p & bit) === (ps[0] & bit))) return true;
    }
    return false;
  }

  function checkWin() {
    const lines = [
      [0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],
      [0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],
      [0,5,10,15],[3,6,9,12],
    ];
    for (const L of lines) if (lineWin(L)) return L;
    return null;
  }

  function emptyCells() {
    return board.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  }

  function aiPlace() {
    // try winning place
    for (const i of emptyCells()) {
      board[i] = given;
      if (checkWin()) { given = null; return true; }
      board[i] = null;
    }
    // random place
    const opts = emptyCells();
    const i = opts[Math.floor(Math.random() * opts.length)];
    board[i] = given;
    given = null;
    return !!checkWin();
  }

  function aiPick() {
    // pick a piece that doesn't immediately lose if possible
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      let forcedLoss = false;
      for (const i of emptyCells()) {
        board[i] = p;
        if (checkWin()) forcedLoss = true;
        board[i] = null;
        if (forcedLoss) break;
      }
      if (!forcedLoss) return p;
    }
    return shuffled[0];
  }

  function afterHumanPlace() {
    const w = checkWin();
    if (w) { over = true; winLine = w; statusEl.textContent = "You win!"; render(); return; }
    if (!pool.length && !given) { over = true; statusEl.textContent = "Draw"; render(); return; }
    // AI picks piece for human
    const p = aiPick();
    pool = pool.filter((x) => x !== p);
    given = p;
    phase = "place";
    statusEl.textContent = "Place the given piece";
    render();
  }

  function humanPick(p) {
    if (over || phase !== "pick" || !pool.includes(p)) return;
    pool = pool.filter((x) => x !== p);
    given = p;
    phase = "ai";
    statusEl.textContent = "Computer placing…";
    render();
    setTimeout(() => {
      const won = aiPlace();
      if (won) {
        winLine = checkWin();
        over = true;
        statusEl.textContent = "Computer wins";
        render();
        return;
      }
      if (!pool.length) { over = true; statusEl.textContent = "Draw"; render(); return; }
      phase = "pick";
      statusEl.textContent = "Pick a piece for the computer";
      render();
    }, 350);
  }

  function humanPlace(i) {
    if (over || phase !== "place" || board[i] !== null || given === null) return;
    board[i] = given;
    given = null;
    afterHumanPlace();
  }

  function render() {
    boardEl.innerHTML = "";
    board.forEach((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "q-cell" + (winLine && winLine.includes(i) ? " win" : "");
      btn.disabled = over || phase !== "place" || p !== null;
      if (p !== null) btn.appendChild(pieceEl(p));
      btn.onclick = () => humanPlace(i);
      boardEl.appendChild(btn);
    });

    poolEl.innerHTML = "";
    ALL.forEach((p) => {
      if (!pool.includes(p)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.disabled = over || phase !== "pick";
      btn.appendChild(pieceEl(p));
      btn.onclick = () => humanPick(p);
      poolEl.appendChild(btn);
    });

    givenEl.innerHTML = "";
    if (given !== null) {
      const wrap = document.createElement("div");
      wrap.appendChild(pieceEl(given));
      givenEl.appendChild(wrap);
    }
  }

  function newGame() {
    board = Array(16).fill(null);
    pool = ALL.slice();
    given = null;
    phase = "pick";
    over = false;
    winLine = null;
    statusEl.textContent = "Pick a piece for the computer";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
