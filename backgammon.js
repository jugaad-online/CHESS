(() => {
  // points 1-24: positive = white count, negative = black
  // white home 1-6, moves down; black home 19-24, moves up
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const diceEl = document.getElementById("dice");
  const rollBtn = document.getElementById("btn-roll");
  let pts, barW, barB, offW, offB, dice, turn, selected, over;

  function startPos() {
    pts = Array(25).fill(0);
    pts[24] = 2; pts[13] = 5; pts[8] = 3; pts[6] = 5;
    pts[1] = -2; pts[12] = -5; pts[17] = -3; pts[19] = -5;
    barW = 0; barB = 0; offW = 0; offB = 0;
  }

  function countAt(p, color) {
    if (color === 1) return Math.max(0, pts[p]);
    return Math.max(0, -pts[p]);
  }

  function enemyAt(p, color) {
    return color === 1 ? pts[p] < 0 : pts[p] > 0;
  }

  function aloneEnemy(p, color) {
    return color === 1 ? pts[p] === -1 : pts[p] === 1;
  }

  function blocked(p, color) {
    return color === 1 ? pts[p] <= -2 : pts[p] >= 2;
  }

  function allHome(color) {
    if (color === 1) {
      if (barW) return false;
      for (let i = 7; i <= 24; i++) if (pts[i] > 0) return false;
      return true;
    }
    if (barB) return false;
    for (let i = 1; i <= 18; i++) if (pts[i] < 0) return false;
    return true;
  }

  function dest(from, die, color) {
    if (from === "bar") return color === 1 ? 25 - die : die;
    return color === 1 ? from - die : from + die;
  }

  function canBear(die, color) {
    if (!allHome(color)) return false;
    if (color === 1) {
      if (countAt(die, 1)) return true;
      for (let i = die + 1; i <= 6; i++) if (countAt(i, 1)) return false;
      for (let i = 1; i < die; i++) if (countAt(i, 1)) return true;
      return false;
    }
    const p = 25 - die;
    if (countAt(p, -1)) return true;
    for (let i = p - 1; i >= 19; i--) if (countAt(i, -1)) return false;
    for (let i = 24; i > p; i--) if (countAt(i, -1)) return true;
    return false;
  }

  function legalMoves(color) {
    const moves = [];
    const bar = color === 1 ? barW : barB;
    if (bar > 0) {
      for (const d of [...new Set(dice)]) {
        const to = dest("bar", d, color);
        if (to < 1 || to > 24) continue;
        if (!blocked(to, color)) moves.push({ from: "bar", to, die: d });
      }
      return moves;
    }
    for (let from = 1; from <= 24; from++) {
      if (!countAt(from, color)) continue;
      for (const d of [...new Set(dice)]) {
        const to = dest(from, d, color);
        if (to >= 1 && to <= 24) {
          if (!blocked(to, color)) moves.push({ from, to, die: d });
        } else if ((color === 1 && to <= 0) || (color === -1 && to >= 25)) {
          if (canBear(d, color) && ((color === 1 && from <= 6) || (color === -1 && from >= 19))) {
            // bearing: die must match or be excess from highest
            if (color === 1) {
              if (from === d || (from < d && !Array.from({length:6-from},(_,k)=>from+1+k).some(p => countAt(p,1)))) {
                moves.push({ from, to: "off", die: d });
              }
            } else {
              const need = 25 - from;
              if (need === d || (need < d && !Array.from({length:from-19},(_,k)=>from-1-k).some(p => countAt(p,-1)))) {
                moves.push({ from, to: "off", die: d });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  function applyMove(m, color) {
    if (m.from === "bar") {
      if (color === 1) barW--; else barB--;
    } else {
      pts[m.from] -= color;
    }
    if (m.to === "off") {
      if (color === 1) offW++; else offB++;
    } else {
      if (aloneEnemy(m.to, color)) {
        if (color === 1) { pts[m.to] = 0; barB++; }
        else { pts[m.to] = 0; barW++; }
      }
      pts[m.to] += color;
    }
    const idx = dice.indexOf(m.die);
    if (idx >= 0) dice.splice(idx, 1);
  }

  function rollDice() {
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    dice = a === b ? [a, a, a, a] : [a, b];
    diceEl.textContent = `Dice: ${dice.join(", ")}`;
  }

  function endTurnOrWin() {
    if (offW >= 15) { over = true; statusEl.textContent = "You win!"; rollBtn.disabled = true; return true; }
    if (offB >= 15) { over = true; statusEl.textContent = "Computer wins"; rollBtn.disabled = true; return true; }
    return false;
  }

  function aiPlay() {
    statusEl.textContent = "Computer…";
    render();
    const step = () => {
      if (over) return;
      const moves = legalMoves(-1);
      if (!moves.length || !dice.length) {
        turn = 1;
        dice = [];
        diceEl.textContent = "Dice: —";
        statusEl.textContent = "Your turn — roll";
        rollBtn.disabled = false;
        selected = null;
        render();
        return;
      }
      // prefer hits and bearing
      moves.sort((a, b) => {
        const score = (m) => (m.to === "off" ? 50 : 0) + (m.to !== "off" && aloneEnemy(m.to, -1) ? 30 : 0) + Math.random();
        return score(b) - score(a);
      });
      applyMove(moves[0], -1);
      if (endTurnOrWin()) { render(); return; }
      render();
      setTimeout(step, 280);
    };
    setTimeout(step, 300);
  }

  function onRoll() {
    if (over || turn !== 1 || dice.length) return;
    rollDice();
    rollBtn.disabled = true;
    selected = null;
    const moves = legalMoves(1);
    if (!moves.length) {
      statusEl.textContent = "No moves — passing";
      setTimeout(() => {
        turn = -1;
        rollDice();
        aiPlay();
      }, 600);
      render();
      return;
    }
    statusEl.textContent = "Select a checker, then a destination";
    render();
  }

  function trySelect(from) {
    if (over || turn !== 1 || !dice.length) return;
    const moves = legalMoves(1).filter((m) => m.from === from);
    if (!moves.length) return;
    selected = from;
    render();
  }

  function tryDest(to) {
    if (selected === null) return;
    const m = legalMoves(1).find((x) => x.from === selected && x.to === to);
    if (!m) return;
    applyMove(m, 1);
    selected = null;
    if (endTurnOrWin()) { render(); return; }
    if (!dice.length || !legalMoves(1).length) {
      turn = -1;
      statusEl.textContent = "Computer rolling…";
      render();
      setTimeout(() => {
        rollDice();
        aiPlay();
      }, 400);
      return;
    }
    statusEl.textContent = "Continue your move";
    render();
  }

  function render() {
    boardEl.innerHTML = "";
    // top row: points 13-18, bar, 19-24
    const topOrder = [13,14,15,16,17,18, "bar", 19,20,21,22,23,24, "off"];
    const botOrder = [12,11,10,9,8,7, "bar2", 6,5,4,3,2,1, "off2"];

    function pointBtn(p, side) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "point " + side + (p % 2 ? " dark" : "");
      if (selected === p) btn.classList.add("sel");
      const moves = turn === 1 && dice.length ? legalMoves(1) : [];
      if (selected !== null && moves.some((m) => m.from === selected && m.to === p)) btn.classList.add("dest");
      const nW = countAt(p, 1), nB = countAt(p, -1);
      const n = nW || nB;
      const color = nW ? 1 : -1;
      const show = Math.min(n, 5);
      for (let i = 0; i < show; i++) {
        const c = document.createElement("span");
        c.className = "chk " + (color === 1 ? "w" : "b");
        btn.appendChild(c);
      }
      if (n > 5) {
        const t = document.createElement("span");
        t.style.cssText = "z-index:2;font-size:0.65rem;color:#fff;font-weight:700";
        t.textContent = n;
        btn.appendChild(t);
      }
      btn.onclick = () => {
        if (selected !== null && moves.some((m) => m.from === selected && m.to === p)) tryDest(p);
        else if (countAt(p, 1)) trySelect(p);
      };
      return btn;
    }

    topOrder.forEach((p) => {
      if (p === "bar") {
        const d = document.createElement("div");
        d.className = "bar";
        d.innerHTML = `Bar<br>${barB ? "●".repeat(Math.min(barB,5)) : "·"}`;
        if (selected === "bar") d.style.outline = "2px solid #c9a227";
        d.onclick = () => { if (barW) trySelect("bar"); };
        // also dest for black hits already handled
        const moves = turn === 1 && dice.length ? legalMoves(1) : [];
        if (selected === "bar" || (selected !== null && moves.some(m => m.from === selected && m.to === "bar"))) {}
        if (barW && turn === 1) d.style.cursor = "pointer";
        boardEl.appendChild(d);
      } else if (p === "off") {
        const d = document.createElement("div");
        d.className = "off";
        d.textContent = `Off ${offB}`;
        boardEl.appendChild(d);
      } else boardEl.appendChild(pointBtn(p, "top"));
    });

    const mid = document.createElement("div");
    mid.className = "midbar";
    mid.style.gridColumn = "1 / -1";
    mid.textContent = barW ? `Your bar: ${barW}` : " ";
    // Actually mid should span - our grid is wrong. Simplify layout:
  }

  // Simpler render override
  function render() {
    boardEl.innerHTML = "";
    boardEl.style.display = "grid";
    boardEl.style.gridTemplateColumns = "repeat(13, 1fr)";
    boardEl.style.gridTemplateRows = "1fr 24px 1fr";

    const place = (p, row) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "point " + row + (p % 2 ? " dark" : "");
      if (selected === p) btn.classList.add("sel");
      const moves = turn === 1 && dice.length ? legalMoves(1) : [];
      if (selected !== null && moves.some((m) => m.from === selected && m.to === p)) btn.classList.add("dest");
      const nW = countAt(p, 1), nB = countAt(p, -1);
      const n = nW || nB;
      const color = nW ? 1 : nB ? -1 : 0;
      const show = Math.min(n, 5);
      for (let i = 0; i < show; i++) {
        const c = document.createElement("span");
        c.className = "chk " + (color === 1 ? "w" : "b");
        btn.appendChild(c);
      }
      if (n > 5) {
        const t = document.createElement("span");
        t.style.cssText = "z-index:2;font-size:0.65rem;color:#fff;font-weight:700";
        t.textContent = String(n);
        btn.appendChild(t);
      }
      btn.onclick = () => {
        if (selected !== null && moves.some((m) => m.from === selected && m.to === p)) tryDest(p);
        else if (countAt(p, 1) || (p && false)) trySelect(p);
        else if (barW && selected !== "bar") {}
      };
      return btn;
    };

    [13,14,15,16,17,18].forEach((p) => boardEl.appendChild(place(p, "top")));
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `<div>BAR</div><div class="chk b" style="display:${barB?"":"none"}"></div><div style="font-size:0.7rem">${barB||""}</div><div class="chk w" style="display:${barW?"":"none"}"></div><div style="font-size:0.7rem">${barW||""}</div>`;
    bar.onclick = () => {
      const moves = turn === 1 && dice.length ? legalMoves(1) : [];
      if (barW) trySelect("bar");
    };
    if (selected === "bar") bar.style.outline = "2px solid #c9a227";
    boardEl.appendChild(bar);
    [19,20,21,22,23,24].forEach((p) => boardEl.appendChild(place(p, "top")));

    const mid = document.createElement("div");
    mid.className = "midbar";
    mid.style.gridColumn = "1 / -1";
    mid.textContent = `Off — You ${offW} · CPU ${offB}`;
    boardEl.appendChild(mid);

    [12,11,10,9,8,7].forEach((p) => boardEl.appendChild(place(p, "bot")));
    const off = document.createElement("div");
    off.className = "off";
    off.textContent = "BEAR";
    const moves = turn === 1 && dice.length ? legalMoves(1) : [];
    if (selected !== null && moves.some((m) => m.from === selected && m.to === "off")) {
      off.style.outline = "2px solid #7dcea0";
      off.style.cursor = "pointer";
      off.onclick = () => tryDest("off");
    }
    boardEl.appendChild(off);
    [6,5,4,3,2,1].forEach((p) => boardEl.appendChild(place(p, "bot")));
  }

  function newGame() {
    startPos();
    dice = []; turn = 1; selected = null; over = false;
    statusEl.textContent = "Your turn — roll";
    diceEl.textContent = "Dice: —";
    rollBtn.disabled = false;
    render();
  }

  rollBtn.onclick = onRoll;
  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
