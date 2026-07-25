(() => {
  const COLORS = ["R", "Y", "G", "B"];
  const NAMES = ["You", "Alex", "Sam", "Rio"];
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const handEl = document.getElementById("hand");
  const discardEl = document.getElementById("discard");
  const opsEl = document.getElementById("opponents");
  const wildEl = document.getElementById("wild-pick");
  let deck, discard, hands, turn, dir, color, pendingDraw, over, saidUno, waitingWild;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeDeck() {
    const d = [];
    for (const c of COLORS) {
      d.push({ c, v: "0" });
      for (let n = 1; n <= 9; n++) {
        d.push({ c, v: String(n) });
        d.push({ c, v: String(n) });
      }
      for (const v of ["S", "R", "D2"]) {
        d.push({ c, v });
        d.push({ c, v });
      }
    }
    for (let i = 0; i < 4; i++) {
      d.push({ c: "W", v: "W" });
      d.push({ c: "W", v: "W4" });
    }
    return shuffle(d);
  }

  function drawOne() {
    if (!deck.length) {
      const top = discard.pop();
      deck = shuffle(discard);
      discard = top ? [top] : [];
    }
    return deck.pop();
  }

  function canPlay(card) {
    if (pendingDraw > 0) {
      return card.v === "D2" || card.v === "W4";
    }
    if (card.c === "W") return true;
    return card.c === color || card.v === discard[discard.length - 1].v;
  }

  function label(card) {
    if (card.v === "S") return "⊘";
    if (card.v === "R") return "↺";
    if (card.v === "D2") return "+2";
    if (card.v === "W") return "W";
    if (card.v === "W4") return "+4";
    return card.v;
  }

  function cardBtn(card, playable) {
    const btn = document.createElement("button");
    btn.type = "button";
    const cls = card.c === "W" ? color || "W" : card.c;
    btn.className = "uno-card " + cls + (playable ? " playable" : "");
    btn.innerHTML = `<span class="badge">${card.c === "W" ? "★" : card.c}</span>${label(card)}`;
    btn.disabled = !playable;
    return btn;
  }

  function advance(steps) {
    for (let s = 0; s < steps; s++) turn = (turn + dir + 4) % 4;
  }

  function applyCard(card, chosenColor) {
    discard.push(card);
    color = card.c === "W" ? chosenColor : card.c;

    if (card.v === "R") dir *= -1;
    if (card.v === "S" || card.v === "R") advance(2);
    else if (card.v === "D2") {
      pendingDraw += 2;
      advance(1);
    } else if (card.v === "W4") {
      pendingDraw += 4;
      advance(1);
    } else advance(1);
  }

  function checkWin(player) {
    if (hands[player].length === 0) {
      over = true;
      statusEl.textContent = player === 0 ? "You win!" : NAMES[player] + " wins";
      return true;
    }
    return false;
  }

  function afterHuman() {
    if (checkWin(0)) {
      render();
      return;
    }
    render();
    setTimeout(aiLoop, 400);
  }

  function humanPlay(i) {
    if (over || turn !== 0 || waitingWild) return;
    const card = hands[0][i];
    if (!canPlay(card)) return;

    if (hands[0].length === 2 && !saidUno) {
      hands[0].push(drawOne(), drawOne());
      statusEl.textContent = "Forgot UNO — draw 2, still your play";
      render();
      return;
    }

    hands[0].splice(i, 1);
    saidUno = false;

    if (card.c === "W") {
      waitingWild = card;
      wildEl.classList.remove("hidden");
      statusEl.textContent = "Choose a color";
      render();
      return;
    }

    applyCard(card);
    afterHuman();
  }

  function finishWild(col) {
    if (!waitingWild) return;
    const card = waitingWild;
    waitingWild = null;
    wildEl.classList.add("hidden");
    applyCard(card, col);
    afterHuman();
  }

  function humanDraw() {
    if (over || turn !== 0 || waitingWild) return;

    if (pendingDraw > 0) {
      for (let i = 0; i < pendingDraw; i++) hands[0].push(drawOne());
      pendingDraw = 0;
      advance(1);
      statusEl.textContent = "Took penalty cards";
      render();
      setTimeout(aiLoop, 400);
      return;
    }

    const c = drawOne();
    if (canPlay(c)) {
      if (c.c === "W") {
        waitingWild = c;
        wildEl.classList.remove("hidden");
        statusEl.textContent = "Drew wild — choose color";
        render();
        return;
      }
      applyCard(c);
      afterHuman();
      return;
    }

    hands[0].push(c);
    advance(1);
    statusEl.textContent = "Drew — cannot play";
    render();
    setTimeout(aiLoop, 400);
  }

  function aiLoop() {
    if (over) return;

    while (turn !== 0 && !over) {
      const plays = hands[turn]
        .map((c, i) => ({ c, i }))
        .filter((x) => canPlay(x.c));

      if (pendingDraw > 0 && !plays.some((p) => p.c.v === "D2" || p.c.v === "W4")) {
        for (let i = 0; i < pendingDraw; i++) hands[turn].push(drawOne());
        pendingDraw = 0;
        advance(1);
        continue;
      }

      if (!plays.length) {
        const c = drawOne();
        if (canPlay(c)) {
          const col =
            c.c === "W"
              ? COLORS.slice().sort(
                  (a, b) =>
                    hands[turn].filter((x) => x.c === b).length -
                    hands[turn].filter((x) => x.c === a).length
                )[0]
              : null;
          applyCard(c, col);
          if (checkWin(turn)) {
            render();
            return;
          }
        } else {
          hands[turn].push(c);
          advance(1);
        }
        continue;
      }

      plays.sort((a, b) => {
        const aw = a.c.c === "W" ? 1 : 0;
        const bw = b.c.c === "W" ? 1 : 0;
        if (aw !== bw) return aw - bw;
        return (b.c.c === color ? 1 : 0) - (a.c.c === color ? 1 : 0);
      });

      const pick = plays[0];
      hands[turn].splice(pick.i, 1);
      const col =
        pick.c.c === "W"
          ? COLORS.slice().sort(
              (a, b) =>
                hands[turn].filter((x) => x.c === b).length -
                hands[turn].filter((x) => x.c === a).length
            )[0]
          : null;
      applyCard(pick.c, col);
      if (checkWin(turn)) {
        render();
        return;
      }
    }

    saidUno = false;
    statusEl.textContent = pendingDraw
      ? `Your turn — stack or draw ${pendingDraw}`
      : "Your turn";
    render();
  }

  function render() {
    const colorName = { R: "Red", Y: "Yellow", G: "Green", B: "Blue" }[color] || color;
    scoreEl.textContent =
      `${colorName} · ${dir > 0 ? "clockwise" : "counter"} · pile ${deck.length}` +
      (pendingDraw ? ` · +${pendingDraw} pending` : "");

    opsEl.innerHTML = "";
    for (let i = 1; i < 4; i++) {
      const d = document.createElement("div");
      d.className =
        "op" + (turn === i ? " active" : "") + (hands[i].length === 1 ? " uno-warn" : "");
      d.innerHTML = `${NAMES[i]}<span class="count">${hands[i].length}</span>`;
      opsEl.appendChild(d);
    }

    const top = discard[discard.length - 1];
    discardEl.innerHTML = "";
    const topEl = cardBtn(top, false);
    if (top.c === "W") {
      topEl.className = "uno-card " + color;
      topEl.innerHTML = `<span class="badge">W</span>${label(top)}`;
    }
    discardEl.appendChild(topEl);

    handEl.innerHTML = "";
    hands[0].forEach((c, i) => {
      const el = cardBtn(c, turn === 0 && !over && !waitingWild && canPlay(c));
      el.onclick = () => humanPlay(i);
      handEl.appendChild(el);
    });
  }

  function newGame() {
    deck = makeDeck();
    hands = [[], [], [], []];
    for (let p = 0; p < 4; p++) for (let i = 0; i < 7; i++) hands[p].push(drawOne());
    discard = [];
    let start;
    do {
      start = drawOne();
    } while (start.c === "W" || ["S", "R", "D2"].includes(start.v));
    discard.push(start);
    color = start.c;
    turn = 0;
    dir = 1;
    pendingDraw = 0;
    over = false;
    saidUno = false;
    waitingWild = null;
    wildEl.classList.add("hidden");
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  document.getElementById("btn-draw").onclick = humanDraw;
  document.getElementById("draw-pile").onclick = humanDraw;
  document.getElementById("btn-uno").onclick = () => {
    if (hands[0].length <= 2) {
      saidUno = true;
      statusEl.textContent = "UNO!";
    }
  };
  wildEl.querySelectorAll("[data-color]").forEach((b) => {
    b.onclick = () => finishWild(b.getAttribute("data-color"));
  });

  newGame();
})();
