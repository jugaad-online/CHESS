(() => {
  "use strict";

  const PATH = [
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0], [6, 0],
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], [8, 14],
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], [14, 6],
  ];

  const HOME = {
    red: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    yellow: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  };

  const YARD_SPOTS = {
    red: [[10, 1], [10, 3], [12, 1], [12, 3]],
    green: [[1, 1], [1, 3], [3, 1], [3, 3]],
    yellow: [[1, 10], [1, 12], [3, 10], [3, 12]],
    blue: [[10, 10], [10, 12], [12, 10], [12, 12]],
  };

  const PLAYERS = [
    { id: "red", name: "You", entry: 0, ai: false, color: "red" },
    { id: "green", name: "Green", entry: 13, ai: true, color: "green" },
    { id: "yellow", name: "Yellow", entry: 26, ai: true, color: "yellow" },
    { id: "blue", name: "Blue", entry: 39, ai: true, color: "blue" },
  ];

  const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const finishedEl = document.getElementById("finished-line");
  const diceValEl = document.getElementById("dice-val");
  const dice3d = document.getElementById("dice3d");
  const btnRoll = document.getElementById("btn-roll");
  const helpModal = document.getElementById("help-modal");

  let cells = [];
  let tokens = [];
  let turn = 0;
  let dice = 0;
  let waitingMove = false;
  let movable = [];
  let busy = false;
  let over = false;
  let tumble = 0;
  let winners = [];

  function key(r, c) { return `${r},${c}`; }

  function buildBoard() {
    boardEl.innerHTML = "";
    cells = Array.from({ length: 15 }, () => Array(15).fill(null));
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const el = document.createElement("div");
        el.className = "cell";
        el.dataset.r = r;
        el.dataset.c = c;

        if (r >= 9 && c <= 5) el.classList.add("yard-red");
        else if (r <= 5 && c <= 5) el.classList.add("yard-green");
        else if (r <= 5 && c >= 9) el.classList.add("yard-yellow");
        else if (r >= 9 && c >= 9) el.classList.add("yard-blue");

        if ((r >= 6 && r <= 8) || (c >= 6 && c <= 8)) {
          if (!(r >= 9 && c <= 5) && !(r <= 5 && c <= 5) && !(r <= 5 && c >= 9) && !(r >= 9 && c >= 9)) {
            el.classList.add("path");
          }
        }

        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          if (r === 7 && c === 7) el.classList.add("center");
        }

        HOME.red.forEach((p) => { if (p[0] === r && p[1] === c) el.classList.add("home-red"); });
        HOME.green.forEach((p) => { if (p[0] === r && p[1] === c) el.classList.add("home-green"); });
        HOME.yellow.forEach((p) => { if (p[0] === r && p[1] === c) el.classList.add("home-yellow"); });
        HOME.blue.forEach((p) => { if (p[0] === r && p[1] === c) el.classList.add("home-blue"); });

        const holder = document.createElement("div");
        holder.className = "tokens";
        el.appendChild(holder);
        boardEl.appendChild(el);
        cells[r][c] = el;
      }
    }

    PATH.forEach((p, i) => {
      const el = cells[p[0]][p[1]];
      el.classList.add("path");
      if (SAFE_ABS.has(i)) el.classList.add("safe");
      if (i === 0) el.classList.add("entry-red");
      if (i === 13) el.classList.add("entry-green");
      if (i === 26) el.classList.add("entry-yellow");
      if (i === 39) el.classList.add("entry-blue");
    });
  }

  function resetTokens() {
    tokens = [];
    PLAYERS.forEach((p) => {
      for (let i = 0; i < 4; i++) {
        tokens.push({ player: p.id, idx: i, steps: -1 }); // -1 yard, 0..56 path/home, 57 done
      }
    });
  }

  function playerOf(id) {
    return PLAYERS.find((p) => p.id === id);
  }

  function absPos(token) {
    if (token.steps < 0 || token.steps >= 52) return null;
    const entry = playerOf(token.player).entry;
    return (entry + token.steps) % 52;
  }

  function coordsOf(token) {
    if (token.steps < 0) return YARD_SPOTS[token.player][token.idx];
    if (token.steps >= 57) return [7, 7];
    if (token.steps >= 52) return HOME[token.player][token.steps - 52];
    const a = absPos(token);
    return PATH[a];
  }

  function render() {
    boardEl.querySelectorAll(".tokens").forEach((h) => { h.innerHTML = ""; });
    tokens.forEach((t) => {
      const [r, c] = coordsOf(t);
      const holder = cells[r][c].querySelector(".tokens");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `token ${t.player}`;
      btn.title = `${t.player} ${t.idx + 1}`;
      const can = movable.some((m) => m.player === t.player && m.idx === t.idx);
      if (can) {
        btn.classList.add("movable");
        btn.onclick = () => chooseToken(t);
      }
      holder.appendChild(btn);
    });

    finishedEl.textContent = winners.length
      ? `Finished: ${winners.map((w) => playerOf(w).name).join(", ")}`
      : "Finished: none yet";
  }

  function legalMoves(playerId, roll) {
    const mine = tokens.filter((t) => t.player === playerId);
    const moves = [];
    for (const t of mine) {
      if (t.steps === 57) continue;
      if (t.steps === -1) {
        if (roll === 6) moves.push(t);
        continue;
      }
      const next = t.steps + roll;
      if (next > 57) continue;
      // Block if own token occupies destination on home stretch / track (optional soft: allow stacking own)
      moves.push(t);
    }
    return moves;
  }

  function captureAt(abs, mover) {
    if (abs == null || SAFE_ABS.has(abs)) return;
    tokens.forEach((t) => {
      if (t.player === mover.player) return;
      if (t.steps < 0 || t.steps >= 52) return;
      if (absPos(t) === abs) t.steps = -1;
    });
  }

  function applyMove(token, roll) {
    if (token.steps === -1 && roll === 6) {
      token.steps = 0;
      captureAt(absPos(token), token);
      return;
    }
    token.steps += roll;
    if (token.steps < 52) captureAt(absPos(token), token);
    if (token.steps === 57) checkWin(token.player);
  }

  function checkWin(playerId) {
    if (tokens.filter((t) => t.player === playerId).every((t) => t.steps === 57)) {
      if (!winners.includes(playerId)) winners.push(playerId);
      if (playerId === "red") {
        over = true;
        statusEl.textContent = "You win!";
      } else if (winners[0] === playerId && playerId !== "red") {
        // continue until human finishes or all AI done - if AI finishes first announce
        if (!winners.includes("red") && winners[0] !== "red") {
          statusEl.textContent = `${playerOf(playerId).name} finished first — keep racing!`;
        }
      }
      if (winners.includes("red") && winners[0] === "red") {
        over = true;
        statusEl.textContent = "You win!";
      }
    }
  }

  async function showDice(value) {
    diceValEl.textContent = String(value);
    tumble += 1;
    dice3d.classList.remove("rolling");
    void dice3d.offsetWidth;
    dice3d.classList.add("rolling");
    await wait(700);
    dice3d.classList.remove("rolling");
    const spinX = 360 * (2 + (tumble % 2));
    const spinY = 360 * (2 + ((tumble + 1) % 2));
    const map = {
      1: `rotateX(${-22 + spinX}deg) rotateY(${28 + spinY}deg)`,
      2: `rotateX(${-22 + spinX}deg) rotateY(${208 + spinY}deg)`,
      3: `rotateX(${-22 + spinX}deg) rotateY(${-62 + spinY}deg)`,
      4: `rotateX(${-22 + spinX}deg) rotateY(${118 + spinY}deg)`,
      5: `rotateX(${-112 + spinX}deg) rotateY(${28 + spinY}deg)`,
      6: `rotateX(${68 + spinX}deg) rotateY(${28 + spinY}deg)`,
    };
    dice3d.style.transform = map[value];
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setBusy(v) {
    busy = v;
    btnRoll.disabled = v || over || waitingMove;
  }

  function nextTurn(extra) {
    waitingMove = false;
    movable = [];
    if (!extra) {
      do {
        turn = (turn + 1) % PLAYERS.length;
      } while (tokens.filter((t) => t.player === PLAYERS[turn].id).every((t) => t.steps === 57));
    }
    const p = PLAYERS[turn];
    statusEl.textContent = p.ai ? `${p.name}'s turn…` : "Your turn — roll the dice";
    setBusy(false);
    render();
    if (p.ai && !over) setTimeout(() => aiTurn(), 450);
  }

  async function rollDice() {
    if (busy || over || waitingMove) return;
    const p = PLAYERS[turn];
    if (p.ai) return;
    setBusy(true);
    dice = 1 + Math.floor(Math.random() * 6);
    await showDice(dice);
    await afterRoll(p);
  }

  async function afterRoll(p) {
    const moves = legalMoves(p.id, dice);
    if (!moves.length) {
      statusEl.textContent = `${p.name}: no moves`;
      await wait(500);
      nextTurn(false);
      return;
    }
    if (p.ai) {
      const choice = pickAiMove(moves, p, dice);
      applyMove(choice, dice);
      statusEl.textContent = `${p.name} moved`;
      render();
      await wait(450);
      nextTurn(dice === 6);
      return;
    }
    if (moves.length === 1) {
      applyMove(moves[0], dice);
      render();
      nextTurn(dice === 6);
      return;
    }
    waitingMove = true;
    movable = moves;
    statusEl.textContent = "Click a highlighted token to move";
    setBusy(false);
    render();
  }

  function chooseToken(token) {
    if (!waitingMove || over) return;
    if (!movable.some((m) => m.player === token.player && m.idx === token.idx)) return;
    applyMove(token, dice);
    waitingMove = false;
    movable = [];
    render();
    nextTurn(dice === 6);
  }

  function pickAiMove(moves, p, roll) {
    // Prefer capture, then leave yard on 6, then advance furthest
    let best = moves[0];
    let score = -Infinity;
    for (const m of moves) {
      let s = m.steps;
      if (m.steps === -1 && roll === 6) s = 50;
      const nextSteps = m.steps === -1 ? 0 : m.steps + roll;
      if (nextSteps < 52) {
        const abs = (p.entry + nextSteps) % 52;
        const capturable = tokens.some((t) => t.player !== p.id && t.steps >= 0 && t.steps < 52 && absPos(t) === abs && !SAFE_ABS.has(abs));
        if (capturable) s += 80;
      }
      if (nextSteps === 57) s += 100;
      s += nextSteps;
      if (s > score) { score = s; best = m; }
    }
    return best;
  }

  async function aiTurn() {
    if (over || busy) return;
    const p = PLAYERS[turn];
    if (!p.ai) return;
    setBusy(true);
    statusEl.textContent = `${p.name} rolling…`;
    dice = 1 + Math.floor(Math.random() * 6);
    await showDice(dice);
    await afterRoll(p);
  }

  function newGame() {
    turn = 0;
    dice = 0;
    waitingMove = false;
    movable = [];
    over = false;
    winners = [];
    diceValEl.textContent = "—";
    dice3d.style.transform = "rotateX(-22deg) rotateY(28deg)";
    resetTokens();
    statusEl.textContent = "Your turn — roll the dice";
    setBusy(false);
    render();
  }

  function openHelp() {
    helpModal.classList.remove("hidden");
    helpModal.removeAttribute("hidden");
  }
  function closeHelp() {
    helpModal.classList.add("hidden");
    helpModal.setAttribute("hidden", "");
  }

  btnRoll.addEventListener("click", rollDice);
  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("btn-help-close").addEventListener("click", closeHelp);
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) closeHelp(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeHelp();
    if (e.key === " " || e.key === "Enter") {
      if (!helpModal.classList.contains("hidden")) return;
      e.preventDefault();
      rollDice();
    }
  });

  buildBoard();
  newGame();
})();
