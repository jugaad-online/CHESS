(() => {
  const NAMES = ["You", "Banker Bot", "Tycoon AI"];
  const GO = 0, JAIL = 10, PARKING = 20, GOTOJAIL = 30;

  // Classic-inspired 40 spaces (simplified rents = price/8 or listed)
  const SPACES = [
    { name: "GO", type: "go" },
    { name: "Mediterranean", type: "prop", price: 60, group: "g-brown", rent: 10 },
    { name: "Community", type: "chest" },
    { name: "Baltic", type: "prop", price: 60, group: "g-brown", rent: 12 },
    { name: "Income Tax", type: "tax", amount: 200 },
    { name: "Reading RR", type: "rail", price: 200, group: "g-rail", rent: 25 },
    { name: "Oriental", type: "prop", price: 100, group: "g-lightblue", rent: 15 },
    { name: "Chance", type: "chance" },
    { name: "Vermont", type: "prop", price: 100, group: "g-lightblue", rent: 15 },
    { name: "Connecticut", type: "prop", price: 120, group: "g-lightblue", rent: 20 },
    { name: "Jail", type: "jail" },
    { name: "St. Charles", type: "prop", price: 140, group: "g-pink", rent: 25 },
    { name: "Electric Co", type: "util", price: 150, group: "g-util" },
    { name: "States", type: "prop", price: 140, group: "g-pink", rent: 25 },
    { name: "Virginia", type: "prop", price: 160, group: "g-pink", rent: 30 },
    { name: "Penn RR", type: "rail", price: 200, group: "g-rail", rent: 25 },
    { name: "St. James", type: "prop", price: 180, group: "g-orange", rent: 35 },
    { name: "Community", type: "chest" },
    { name: "Tennessee", type: "prop", price: 180, group: "g-orange", rent: 35 },
    { name: "New York", type: "prop", price: 200, group: "g-orange", rent: 40 },
    { name: "Free Parking", type: "park" },
    { name: "Kentucky", type: "prop", price: 220, group: "g-red", rent: 45 },
    { name: "Chance", type: "chance" },
    { name: "Indiana", type: "prop", price: 220, group: "g-red", rent: 45 },
    { name: "Illinois", type: "prop", price: 240, group: "g-red", rent: 50 },
    { name: "B&O RR", type: "rail", price: 200, group: "g-rail", rent: 25 },
    { name: "Atlantic", type: "prop", price: 260, group: "g-yellow", rent: 55 },
    { name: "Ventnor", type: "prop", price: 260, group: "g-yellow", rent: 55 },
    { name: "Water Works", type: "util", price: 150, group: "g-util" },
    { name: "Marvin", type: "prop", price: 280, group: "g-yellow", rent: 60 },
    { name: "Go To Jail", type: "gotojail" },
    { name: "Pacific", type: "prop", price: 300, group: "g-green", rent: 65 },
    { name: "N. Carolina", type: "prop", price: 300, group: "g-green", rent: 65 },
    { name: "Community", type: "chest" },
    { name: "Penn Ave", type: "prop", price: 320, group: "g-green", rent: 70 },
    { name: "Short Line", type: "rail", price: 200, group: "g-rail", rent: 25 },
    { name: "Chance", type: "chance" },
    { name: "Park Place", type: "prop", price: 350, group: "g-blue", rent: 85 },
    { name: "Luxury Tax", type: "tax", amount: 100 },
    { name: "Boardwalk", type: "prop", price: 400, group: "g-blue", rent: 100 },
  ];

  // Grid positions for perimeter (clockwise from bottom-left GO)
  function cellPos(i) {
    if (i <= 10) return { c: 10 - i, r: 10 }; // bottom
    if (i <= 20) return { c: 0, r: 10 - (i - 10) }; // left
    if (i <= 30) return { c: i - 20, r: 0 }; // top
    return { c: 10, r: i - 30 }; // right
  }

  const boardEl = document.getElementById("board");
  const panelEl = document.getElementById("panel");
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const rollBtn = document.getElementById("btn-roll");
  const buyBtn = document.getElementById("btn-buy");
  const endBtn = document.getElementById("btn-end");

  let players, owners, turn, phase, lastDice, over, doubles;

  // phase: roll | act | end

  function alive() {
    return players.map((p, i) => (p.broke ? -1 : i)).filter((i) => i >= 0);
  }

  function railCount(owner) {
    return SPACES.reduce((n, s, i) => n + (s.type === "rail" && owners[i] === owner ? 1 : 0), 0);
  }

  function utilCount(owner) {
    return SPACES.reduce((n, s, i) => n + (s.type === "util" && owners[i] === owner ? 1 : 0), 0);
  }

  function rentDue(idx, diceSum) {
    const s = SPACES[idx];
    const o = owners[idx];
    if (o === null || o === undefined || o === turn) return 0;
    if (s.type === "prop") return s.rent;
    if (s.type === "rail") return [0, 25, 50, 100, 200][railCount(o)];
    if (s.type === "util") return diceSum * (utilCount(o) >= 2 ? 10 : 4);
    return 0;
  }

  function pay(from, to, amount, why) {
    if (amount <= 0) return true;
    players[from].cash -= amount;
    if (to !== null) players[to].cash += amount;
    if (players[from].cash < 0) {
      // bankrupt: give properties to creditor or bank
      SPACES.forEach((_, i) => {
        if (owners[i] === from) owners[i] = to;
      });
      players[from].broke = true;
      players[from].cash = 0;
      statusEl.textContent = `${NAMES[from]} went bankrupt${why ? " — " + why : ""}`;
      return false;
    }
    return true;
  }

  function drawCard(kind) {
    const chance = [
      () => ({ msg: "Advance to GO", fn: () => moveTo(GO, true) }),
      () => ({ msg: "Go to Jail", fn: () => sendJail() }),
      () => ({ msg: "Bank error — collect $100", fn: () => { players[turn].cash += 100; } }),
      () => ({ msg: "Pay poor tax $50", fn: () => pay(turn, null, 50, "tax") }),
      () => ({ msg: "Advance to Illinois", fn: () => moveTo(24, true) }),
      () => ({ msg: "Take a ride on Reading RR", fn: () => moveTo(5, true) }),
    ];
    const chest = [
      () => ({ msg: "Doctor fee $50", fn: () => pay(turn, null, 50, "fee") }),
      () => ({ msg: "From sale of stock $50", fn: () => { players[turn].cash += 50; } }),
      () => ({ msg: "Holiday fund $100", fn: () => { players[turn].cash += 100; } }),
      () => ({ msg: "Go to Jail", fn: () => sendJail() }),
      () => ({ msg: "Advance to GO", fn: () => moveTo(GO, true) }),
      () => ({ msg: "School tax $50", fn: () => pay(turn, null, 50, "tax") }),
    ];
    const deck = kind === "chance" ? chance : chest;
    return deck[Math.floor(Math.random() * deck.length)]();
  }

  function sendJail() {
    players[turn].pos = JAIL;
    players[turn].jail = 2;
    doubles = 0;
  }

  function moveTo(pos, collectGo) {
    const cur = players[turn].pos;
    if (collectGo && pos < cur) players[turn].cash += 200;
    players[turn].pos = pos;
    resolveSpace(lastDice || 7);
  }

  function moveBy(steps) {
    const p = players[turn];
    const from = p.pos;
    p.pos = (p.pos + steps) % 40;
    if (p.pos < from) p.cash += 200; // passed GO
    resolveSpace(steps);
  }

  function resolveSpace(diceSum) {
    const p = players[turn];
    const s = SPACES[p.pos];
    let note = `Landed on ${s.name}`;

    if (s.type === "gotojail") {
      sendJail();
      note = "Go to Jail!";
      phase = "end";
      statusEl.textContent = note;
      updateButtons();
      render();
      return;
    }
    if (s.type === "tax") {
      pay(turn, null, s.amount, "tax");
      note += ` — paid $${s.amount}`;
      phase = "end";
    } else if (s.type === "chance" || s.type === "chest") {
      const card = drawCard(s.type);
      note = card.msg;
      card.fn();
      if (players[turn].jail) phase = "end";
      else if (owners[players[turn].pos] === null && ["prop", "rail", "util"].includes(SPACES[players[turn].pos].type))
        phase = canBuy() ? "act" : "end";
      else phase = "end";
    } else if (["prop", "rail", "util"].includes(s.type)) {
      if (owners[p.pos] === null) {
        phase = canBuy() ? "act" : "end";
        note += s.price ? ` — $${s.price}` : "";
      } else if (owners[p.pos] !== turn) {
        const r = rentDue(p.pos, diceSum);
        pay(turn, owners[p.pos], r, "rent");
        note += ` — rent $${r} to ${NAMES[owners[p.pos]]}`;
        phase = "end";
      } else {
        note += " (yours)";
        phase = "end";
      }
    } else {
      phase = "end";
    }

    statusEl.textContent = note;
    checkWinner();
    updateButtons();
    render();
  }

  function canBuy() {
    const s = SPACES[players[turn].pos];
    return (
      owners[players[turn].pos] === null &&
      ["prop", "rail", "util"].includes(s.type) &&
      players[turn].cash >= s.price &&
      !players[turn].broke
    );
  }

  function buy() {
    if (phase !== "act" || !canBuy()) return;
    const idx = players[turn].pos;
    const s = SPACES[idx];
    players[turn].cash -= s.price;
    owners[idx] = turn;
    statusEl.textContent = `Bought ${s.name} for $${s.price}`;
    phase = "end";
    updateButtons();
    render();
  }

  function checkWinner() {
    const a = alive();
    if (a.length === 1) {
      over = true;
      statusEl.textContent = a[0] === 0 ? "You win!" : NAMES[a[0]] + " wins";
      phase = "over";
      updateButtons();
    }
  }

  function nextPlayer() {
    doubles = 0;
    const a = alive();
    if (a.length <= 1) return;
    let i = turn;
    do {
      i = (i + 1) % 3;
    } while (players[i].broke);
    turn = i;
    phase = "roll";
    statusEl.textContent = turn === 0 ? "Your turn — roll" : NAMES[turn] + " thinking…";
    updateButtons();
    render();
    if (turn !== 0) setTimeout(aiTurn, 500);
  }

  function roll() {
    if (over || phase !== "roll" || turn !== 0) return;
    doRoll();
  }

  function doRoll() {
    const p = players[turn];
    if (p.jail > 0) {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      lastDice = d1 + d2;
      if (d1 === d2) {
        p.jail = 0;
        statusEl.textContent = `Doubles ${d1}+${d2} — out of jail!`;
        doubles = 1;
        moveBy(lastDice);
        return;
      }
      p.jail -= 1;
      if (p.jail === 0) {
        pay(turn, null, 50, "jail");
        statusEl.textContent = `Paid $50 to leave jail, rolled ${d1}+${d2}`;
        moveBy(lastDice);
        return;
      }
      statusEl.textContent = `Still in jail (${d1}+${d2})`;
      phase = "end";
      doubles = 0;
      updateButtons();
      render();
      return;
    }

    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    lastDice = d1 + d2;
    if (d1 === d2) {
      doubles += 1;
      if (doubles >= 3) {
        sendJail();
        statusEl.textContent = "Three doubles — jail!";
        phase = "end";
        doubles = 0;
        updateButtons();
        render();
        return;
      }
    } else doubles = 0;

    statusEl.textContent = `Rolled ${d1} + ${d2} = ${lastDice}`;
    moveBy(lastDice);
  }

  function aiTurn() {
    if (over || turn === 0) return;
    if (phase === "roll") {
      doRoll();
      setTimeout(() => {
        if (over) return;
        if (phase === "act" && canBuy()) {
          // buy if affordable and price not too high relative to cash
          const s = SPACES[players[turn].pos];
          if (players[turn].cash > s.price + 80) buy();
          else {
            phase = "end";
            updateButtons();
          }
        }
        setTimeout(() => {
          if (over) return;
          if (phase === "end") {
            if (doubles > 0 && !players[turn].jail) {
              phase = "roll";
              setTimeout(aiTurn, 350);
            } else nextPlayer();
          }
        }, 350);
      }, 400);
    }
  }

  function updateButtons() {
    rollBtn.disabled = over || turn !== 0 || phase !== "roll";
    buyBtn.disabled = over || turn !== 0 || phase !== "act" || !canBuy();
    endBtn.disabled = over || turn !== 0 || (phase !== "end" && phase !== "act");
    endBtn.textContent = phase === "act" ? "Skip buy" : "End turn";
  }

  function endTurn() {
    if (over || turn !== 0) return;
    if (phase === "act") {
      phase = "end";
      statusEl.textContent = "Declined to buy";
      updateButtons();
      return;
    }
    if (phase !== "end") return;
    if (doubles > 0 && !players[turn].jail) {
      phase = "roll";
      statusEl.textContent = "Doubles! Roll again";
      updateButtons();
      return;
    }
    nextPlayer();
  }

  function render() {
    scoreEl.textContent = NAMES.map((n, i) =>
      players[i].broke ? `${n}: out` : `${n}: $${players[i].cash}`
    ).join(" · ");

    boardEl.innerHTML = "";
    const center = document.createElement("div");
    center.className = "cell center";
    center.textContent = "Monopoly";
    boardEl.appendChild(center);

    SPACES.forEach((s, i) => {
      const { c, r } = cellPos(i);
      const el = document.createElement("div");
      el.className = "cell";
      el.style.gridColumn = c + 1;
      el.style.gridRow = r + 1;
      const stripe = s.group ? `<div class="stripe ${s.group}"></div>` : "";
      const price =
        s.price != null
          ? `<span class="price">$${s.price}</span>`
          : s.amount
            ? `<span class="price">$${s.amount}</span>`
            : "";
      const toks = players
        .map((p, pi) => (!p.broke && p.pos === i ? `<span class="tok p${pi}" title="${NAMES[pi]}"></span>` : ""))
        .join("");
      el.innerHTML = `${stripe}<span class="name">${s.name}</span>${price}<div class="tokens">${toks}</div>`;
      if (owners[i] !== null && owners[i] !== undefined) {
        el.style.outline = `2px solid ${["#c45c48", "#2f6f8f", "#c4a35a"][owners[i]]}`;
        el.style.outlineOffset = "-2px";
      }
      boardEl.appendChild(el);
    });

    const props = (pi) =>
      SPACES.map((s, i) => (owners[i] === pi ? s.name : null)).filter(Boolean);

    panelEl.innerHTML = `<h3>Players</h3>` +
      players
        .map(
          (p, i) => `<div class="row${p.broke ? " bust" : ""}">
          <span>${turn === i ? "▶ " : ""}${NAMES[i]}${p.jail ? " (jail)" : ""}</span>
          <span class="cash">${p.broke ? "—" : "$" + p.cash}</span>
        </div>
        <div style="font-size:0.72rem;color:#3d4a45;margin-bottom:0.45rem">${props(i).slice(0, 6).join(", ") || "no deeds"}${props(i).length > 6 ? "…" : ""}</div>`
        )
        .join("");
  }

  function newGame() {
    players = [0, 1, 2].map(() => ({ pos: 0, cash: 1500, jail: 0, broke: false }));
    owners = Array(40).fill(null);
    turn = 0;
    phase = "roll";
    lastDice = 0;
    over = false;
    doubles = 0;
    statusEl.textContent = "Your turn — roll";
    updateButtons();
    render();
  }

  rollBtn.onclick = roll;
  buyBtn.onclick = buy;
  endBtn.onclick = endTurn;
  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
