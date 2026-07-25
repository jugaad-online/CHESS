(() => {
  // pits: 0-5 human, 6 human store, 7-12 AI, 13 AI store
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  let pits, turn, over;

  function clone(p) { return p.slice(); }

  function sow(state, i) {
    let stones = state[i];
    if (!stones) return { state, again: false };
    state = clone(state);
    state[i] = 0;
    const skip = turnStoreOpp(i);
    let pos = i;
    while (stones > 0) {
      pos = (pos + 1) % 14;
      if (pos === skip) continue;
      state[pos]++;
      stones--;
    }
    const mine = isHumanSide(i);
    const store = mine ? 6 : 13;
    const again = pos === store;
    // capture
    if (!again && state[pos] === 1 && isSide(pos, mine) && state[13 - pos] > 0) {
      state[store] += state[pos] + state[13 - pos];
      state[pos] = 0;
      state[13 - pos] = 0;
    }
    return { state, again };
  }

  function turnStoreOpp(start) {
    // when sowing from human, skip AI store 13; from AI skip human store 6
    return isHumanSide(start) ? 13 : 6;
  }
  function isHumanSide(i) { return i >= 0 && i <= 5; }
  function isSide(i, human) { return human ? i >= 0 && i <= 5 : i >= 7 && i <= 12; }

  function sideEmpty(state, human) {
    const a = human ? 0 : 7, b = human ? 5 : 12;
    for (let i = a; i <= b; i++) if (state[i]) return false;
    return true;
  }

  function finishIfNeeded(state) {
    if (!sideEmpty(state, true) && !sideEmpty(state, false)) return { state, done: false };
    state = clone(state);
    for (let i = 0; i <= 5; i++) { state[6] += state[i]; state[i] = 0; }
    for (let i = 7; i <= 12; i++) { state[13] += state[i]; state[i] = 0; }
    return { state, done: true };
  }

  function legal(state, human) {
    const a = human ? 0 : 7, b = human ? 5 : 12;
    const m = [];
    for (let i = a; i <= b; i++) if (state[i]) m.push(i);
    return m;
  }

  function aiPick() {
    const opts = legal(pits, false);
    let best = opts[0], bestScore = -Infinity;
    for (const i of opts) {
      let { state, again } = sow(pits, i);
      // pretend turn for sow capture sides — temporarily set via start index
      // re-sow with correct skip by temporarily using AI index
      const sim = (() => {
        // manual sim with AI as sower
        let s = clone(pits);
        let stones = s[i]; s[i] = 0; let pos = i;
        while (stones > 0) {
          pos = (pos + 1) % 14;
          if (pos === 6) continue;
          s[pos]++; stones--;
        }
        let ag = pos === 13;
        if (!ag && s[pos] === 1 && pos >= 7 && pos <= 12 && s[13 - pos] > 0) {
          s[13] += s[pos] + s[13 - pos]; s[pos] = 0; s[13 - pos] = 0;
        }
        return { state: s, again: ag };
      })();
      const score = sim.state[13] * 3 + (sim.again ? 2 : 0) + sim.state.slice(7, 13).reduce((a, b) => a + b, 0) * 0.1 + Math.random();
      if (score > bestScore) { bestScore = score; best = i; }
    }
    return best;
  }

  function applyHuman(i) {
    let stones = pits[i]; pits[i] = 0; let pos = i;
    while (stones > 0) {
      pos = (pos + 1) % 14;
      if (pos === 13) continue;
      pits[pos]++; stones--;
    }
    let again = pos === 6;
    if (!again && pits[pos] === 1 && pos >= 0 && pos <= 5 && pits[13 - pos] > 0) {
      pits[6] += pits[pos] + pits[13 - pos];
      pits[pos] = 0; pits[13 - pos] = 0;
    }
    return again;
  }

  function applyAI(i) {
    let stones = pits[i]; pits[i] = 0; let pos = i;
    while (stones > 0) {
      pos = (pos + 1) % 14;
      if (pos === 6) continue;
      pits[pos]++; stones--;
    }
    let again = pos === 13;
    if (!again && pits[pos] === 1 && pos >= 7 && pos <= 12 && pits[13 - pos] > 0) {
      pits[13] += pits[pos] + pits[13 - pos];
      pits[pos] = 0; pits[13 - pos] = 0;
    }
    return again;
  }

  function checkEnd() {
    const f = finishIfNeeded(pits);
    pits = f.state;
    if (f.done) {
      over = true;
      statusEl.textContent = pits[6] > pits[13] ? "You win!" : pits[13] > pits[6] ? "Computer wins" : "Draw";
      return true;
    }
    return false;
  }

  function aiTurn() {
    if (over) return;
    statusEl.textContent = "Computer…";
    render();
    setTimeout(() => {
      const move = aiPick();
      const again = applyAI(move);
      if (checkEnd()) { render(); return; }
      if (again && legal(pits, false).length) {
        aiTurn();
        return;
      }
      turn = 1;
      statusEl.textContent = "Your turn (bottom)";
      render();
    }, 400);
  }

  function play(i) {
    if (over || turn !== 1 || i < 0 || i > 5 || !pits[i]) return;
    const again = applyHuman(i);
    if (checkEnd()) { render(); return; }
    if (again) {
      statusEl.textContent = "Extra turn!";
      render();
      return;
    }
    turn = 2;
    aiTurn();
  }

  function render() {
    scoreEl.textContent = `You ${pits[6]} · Computer ${pits[13]}`;
    boardEl.innerHTML = "";
    const left = document.createElement("div");
    left.className = "store";
    left.innerHTML = `${pits[13]}<span>CPU</span>`;
    const mid = document.createElement("div");
    mid.className = "pits";
    const top = document.createElement("div");
    top.className = "pit-row top";
    for (let i = 12; i >= 7; i--) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pit"; b.textContent = pits[i]; b.disabled = true;
      top.appendChild(b);
    }
    const bot = document.createElement("div");
    bot.className = "pit-row";
    for (let i = 0; i <= 5; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pit" + (turn === 1 && !over && pits[i] ? " playable" : "");
      b.textContent = pits[i];
      b.disabled = over || turn !== 1 || !pits[i];
      b.onclick = () => play(i);
      bot.appendChild(b);
    }
    mid.append(top, bot);
    const right = document.createElement("div");
    right.className = "store";
    right.innerHTML = `${pits[6]}<span>YOU</span>`;
    boardEl.append(left, mid, right);
  }

  function newGame() {
    pits = [4,4,4,4,4,4,0, 4,4,4,4,4,4,0];
    turn = 1; over = false;
    statusEl.textContent = "Your turn (bottom)";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
