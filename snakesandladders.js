(() => {
  "use strict";

  // Classic-style snakes & ladders (1–100)
  const LADDERS = {
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
  };
  const SNAKES = {
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78,
  };

  const boardEl = document.getElementById("board");
  const pathsEl = document.getElementById("paths");
  const statusEl = document.getElementById("status");
  const diceEl = document.getElementById("dice");
  const dice3d = document.getElementById("dice3d");
  const posYouEl = document.getElementById("pos-you");
  const posCpuEl = document.getElementById("pos-cpu");
  const btnRoll = document.getElementById("btn-roll");
  const helpModal = document.getElementById("help-modal");

  let you = 0;
  let cpu = 0;
  let over = false;
  let busy = false;
  let cellEls = {};
  let tumbleCount = 0;

  async function showDice3D(value, animate = true) {
    diceEl.textContent = String(value);
    dice3d.dataset.value = String(value);
    dice3d.classList.remove("show-1", "show-2", "show-3", "show-4", "show-5", "show-6", "rolling");

    if (animate) {
      tumbleCount += 1;
      // Force reflow so animation restarts
      void dice3d.offsetWidth;
      dice3d.classList.add("rolling");
      await wait(700);
      dice3d.classList.remove("rolling");
    }

    // Extra spins so consecutive same numbers still look fresh
    const spinX = 360 * (2 + (tumbleCount % 2));
    const spinY = 360 * (2 + ((tumbleCount + 1) % 2));
    const base = {
      1: `rotateX(${-22 + spinX}deg) rotateY(${28 + spinY}deg)`,
      2: `rotateX(${-22 + spinX}deg) rotateY(${208 + spinY}deg)`,
      3: `rotateX(${-22 + spinX}deg) rotateY(${-62 + spinY}deg)`,
      4: `rotateX(${-22 + spinX}deg) rotateY(${118 + spinY}deg)`,
      5: `rotateX(${-112 + spinX}deg) rotateY(${28 + spinY}deg)`,
      6: `rotateX(${68 + spinX}deg) rotateY(${28 + spinY}deg)`,
    };
    dice3d.style.transform = base[value];
    dice3d.classList.add(`show-${value}`);
  }

  /** Board number → row/col in snake pattern (bottom-left is 1) */
  function numToRC(n) {
    if (n <= 0) return null;
    const rowFromBottom = Math.floor((n - 1) / 10);
    const row = 9 - rowFromBottom;
    const idx = (n - 1) % 10;
    const col = rowFromBottom % 2 === 0 ? idx : 9 - idx;
    return { row, col };
  }

  function centerOf(n) {
    const rc = numToRC(n);
    if (!rc) return null;
    return { x: rc.col * 10 + 5, y: rc.row * 10 + 5 };
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    cellEls = {};
    // Paint top-left first: row 0 is numbers 100–91
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const rowFromBottom = 9 - row;
        const n = rowFromBottom % 2 === 0
          ? rowFromBottom * 10 + col + 1
          : rowFromBottom * 10 + (9 - col) + 1;
        const cell = document.createElement("div");
        cell.className = `sl-cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        cell.dataset.n = String(n);
        if (n === 1) cell.classList.add("start");
        if (n === 100) cell.classList.add("finish");
        if (SNAKES[n]) cell.classList.add("snake-head");
        if (LADDERS[n]) cell.classList.add("ladder-foot");
        cell.innerHTML = `<span>${n}</span><div class="tokens" data-tokens></div>`;
        boardEl.appendChild(cell);
        cellEls[n] = cell;
      }
    }
    drawPaths();
    renderTokens();
  }

  function drawPaths() {
    let svg = "";
    Object.entries(LADDERS).forEach(([from, to]) => {
      const a = centerOf(Number(from));
      const b = centerOf(Number(to));
      if (!a || !b) return;
      svg += `<line class="ladder" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
      svg += `<circle cx="${a.x}" cy="${a.y}" r="1.4" fill="#2f6f8f" />`;
      svg += `<circle cx="${b.x}" cy="${b.y}" r="1.4" fill="#2f6f8f" />`;
    });
    Object.entries(SNAKES).forEach(([from, to]) => {
      const a = centerOf(Number(from));
      const b = centerOf(Number(to));
      if (!a || !b) return;
      const mx = (a.x + b.x) / 2 + (a.y > b.y ? 4 : -4);
      const my = (a.y + b.y) / 2;
      svg += `<path class="snake" d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" />`;
      svg += `<circle cx="${a.x}" cy="${a.y}" r="1.6" fill="#c45c48" />`;
    });
    pathsEl.innerHTML = svg;
  }

  function clearTokens() {
    boardEl.querySelectorAll("[data-tokens]").forEach((el) => { el.innerHTML = ""; });
  }

  function renderTokens() {
    clearTokens();
    const place = (pos, cls) => {
      if (pos <= 0) return;
      const cell = cellEls[pos];
      if (!cell) return;
      const holder = cell.querySelector("[data-tokens]");
      const t = document.createElement("span");
      t.className = `token ${cls}`;
      holder.appendChild(t);
    };
    place(you, "you");
    place(cpu, "cpu");
    posYouEl.textContent = you;
    posCpuEl.textContent = cpu;
  }

  function applyPortal(pos) {
    if (LADDERS[pos]) return { pos: LADDERS[pos], kind: "ladder" };
    if (SNAKES[pos]) return { pos: SNAKES[pos], kind: "snake" };
    return { pos, kind: null };
  }

  function movePlayer(who, roll) {
    let pos = who === "you" ? you : cpu;
    const next = pos + roll;
    if (next > 100) {
      return { pos, msg: `${who === "you" ? "You" : "Computer"} need exact roll to finish` };
    }
    pos = next;
    const portal = applyPortal(pos);
    pos = portal.pos;
    if (who === "you") you = pos; else cpu = pos;
    let msg = `${who === "you" ? "You" : "Computer"} rolled ${roll} → ${pos}`;
    if (portal.kind === "ladder") msg += " (ladder!)";
    if (portal.kind === "snake") msg += " (snake!)";
    if (pos === 100) {
      over = true;
      msg = who === "you" ? "You win!" : "Computer wins!";
    }
    return { pos, msg };
  }

  function setBusy(v) {
    busy = v;
    btnRoll.disabled = v || over;
  }

  async function rollDice() {
    if (busy || over) return;
    setBusy(true);

    const roll = 1 + Math.floor(Math.random() * 6);
    await showDice3D(roll, true);

    const result = movePlayer("you", roll);
    renderTokens();
    statusEl.textContent = result.msg;
    if (over) { setBusy(false); return; }

    await wait(550);
    statusEl.textContent = "Computer rolling…";
    const cpuRoll = 1 + Math.floor(Math.random() * 6);
    await showDice3D(cpuRoll, true);
    const cpuResult = movePlayer("cpu", cpuRoll);
    renderTokens();
    statusEl.textContent = over ? cpuResult.msg : `${cpuResult.msg} — your turn`;
    setBusy(false);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function newGame() {
    you = 0;
    cpu = 0;
    over = false;
    diceEl.textContent = "—";
    dice3d.classList.remove("rolling", "show-1", "show-2", "show-3", "show-4", "show-5", "show-6");
    dice3d.style.transform = "rotateX(-22deg) rotateY(28deg)";
    statusEl.textContent = "Your turn — roll the dice";
    setBusy(false);
    renderTokens();
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
