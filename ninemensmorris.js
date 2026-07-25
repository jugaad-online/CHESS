(() => {
  /* 24 points: rings 0 outer, 1 mid, 2 inner; 8 positions each (N,NE,E,SE,S,SW,W,NW) */
  const POS = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
    [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7],
    [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7],
  ];
  const MILLS = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
  ];
  const ADJ = [
    [1, 7], [0, 2, 9], [1, 3], [2, 4, 11], [3, 5], [4, 6, 13], [5, 7], [0, 6, 15],
    [9, 15], [1, 8, 10, 17], [9, 11], [3, 10, 12, 19], [11, 13], [5, 12, 14, 21], [13, 15], [7, 8, 14, 23],
    [17, 23], [9, 16, 18], [17, 19], [11, 18, 20], [19, 21], [13, 20, 22], [21, 23], [15, 16, 22],
  ];

  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const board = document.getElementById("board");

  let cells, placeLeft, selected, phase, removing, turn, over;

  function count(who) {
    return cells.filter((c) => c === who).length;
  }

  function inMill(i, who) {
    return MILLS.some((m) => m.includes(i) && m.every((p) => cells[p] === who));
  }

  function canRemove(i) {
    if (cells[i] !== "ai") return false;
    const allInMill = cells.every((c, idx) => c !== "ai" || inMill(idx, "ai"));
    return allInMill || !inMill(i, "ai");
  }

  function flying(who) {
    return count(who) === 3 && placeLeft[who] === 0;
  }

  function legalMoves(from) {
    if (flying("you")) {
      return cells.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
    }
    return ADJ[from].filter((i) => cells[i] === null);
  }

  function gamePhase() {
    if (placeLeft.you > 0 || placeLeft.ai > 0) return "place";
    return "move";
  }

  function checkWin() {
    if (placeLeft.you === 0 && placeLeft.ai === 0) {
      if (count("you") < 3) {
        over = true;
        status.textContent = "Computer wins — you have under 3 men";
        return true;
      }
      if (count("ai") < 3) {
        over = true;
        status.textContent = "You win — AI has under 3 men";
        return true;
      }
      if (turn === "you" && !cells.some((c, i) => c === "you" && legalMoves(i).length)) {
        over = true;
        status.textContent = "Computer wins — you can't move";
        return true;
      }
    }
    return false;
  }

  function updateScore() {
    const yp = placeLeft.you;
    const ap = placeLeft.ai;
    if (yp > 0 || ap > 0) {
      scoreEl.textContent = `You ${yp} to place (${count("you")} on board) · AI ${ap} to place (${count("ai")} on board)`;
    } else {
      scoreEl.textContent = `You ${count("you")} · AI ${count("ai")}`;
    }
  }

  function afterPlaceOrMove(who, idx) {
    if (inMill(idx, who)) {
      removing = who;
      turn = who;
      status.textContent = who === "you" ? "Mill! Remove an enemy piece" : "AI formed a mill…";
      render();
      if (who === "ai") setTimeout(aiRemove, 400);
      return;
    }
    nextTurn(who);
  }

  function nextTurn(whoJustPlayed) {
    turn = whoJustPlayed === "you" ? "ai" : "you";
    selected = null;
    removing = null;
    if (checkWin()) {
      render();
      return;
    }
    if (turn === "ai") {
      status.textContent = "Computer thinking…";
      render();
      setTimeout(aiPlay, 450);
    } else {
      phase = gamePhase();
      status.textContent = phase === "place" ? "Place a man" : flying("you") ? "Fly — move any empty point" : "Move a man";
      render();
    }
  }

  function doRemove(i, who) {
    if (!canRemoveFor(i, who === "you" ? "ai" : "you")) return false;
    cells[i] = null;
    removing = null;
    nextTurn(who);
    return true;
  }

  function canRemoveFor(i, enemy) {
    if (cells[i] !== enemy) return false;
    const allInMill = cells.every((c, idx) => c !== enemy || inMill(idx, enemy));
    return allInMill || !inMill(i, enemy);
  }

  function onPoint(i) {
    if (over || turn !== "you") return;
    if (removing === "you") {
      if (doRemove(i, "you")) updateScore();
      else status.textContent = "Pick an AI piece not in a mill (if possible)";
      render();
      return;
    }
    phase = gamePhase();
    if (phase === "place") {
      if (cells[i] !== null || placeLeft.you <= 0) return;
      cells[i] = "you";
      placeLeft.you--;
      updateScore();
      afterPlaceOrMove("you", i);
      return;
    }
    if (selected === null) {
      if (cells[i] !== "you") return;
      selected = i;
      status.textContent = "Choose destination";
      render();
      return;
    }
    if (selected === i) {
      selected = null;
      status.textContent = "Move a man";
      render();
      return;
    }
    if (!legalMoves(selected).includes(i)) {
      if (cells[i] === "you") {
        selected = i;
        render();
      }
      return;
    }
    cells[i] = "you";
    cells[selected] = null;
    selected = null;
    updateScore();
    afterPlaceOrMove("you", i);
  }

  function aiRemove() {
    const opts = cells.map((c, i) => (canRemoveFor(i, "you") ? i : -1)).filter((i) => i >= 0);
    if (!opts.length) {
      nextTurn("ai");
      return;
    }
    const pick = opts.find((i) => !inMill(i, "you")) ?? opts[0];
    cells[pick] = null;
    removing = null;
    updateScore();
    nextTurn("ai");
  }

  function aiPlay() {
    if (over || turn !== "ai") return;
    phase = gamePhase();
    if (phase === "place" && placeLeft.ai > 0) {
      let best = -1;
      let bestScore = -999;
      for (let i = 0; i < 24; i++) {
        if (cells[i] !== null) continue;
        cells[i] = "ai";
        let s = inMill(i, "ai") ? 50 : 0;
        cells[i] = "you";
        if (inMill(i, "you")) s += 40;
        cells[i] = null;
        s += ADJ[i].length + Math.random();
        if (s > bestScore) {
          bestScore = s;
          best = i;
        }
      }
      cells[best] = "ai";
      placeLeft.ai--;
      updateScore();
      afterPlaceOrMove("ai", best);
      return;
    }
    const moves = [];
    for (let from = 0; from < 24; from++) {
      if (cells[from] !== "ai") continue;
      const dests = flying("ai")
        ? cells.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0)
        : ADJ[from].filter((i) => cells[i] === null);
      dests.forEach((to) => moves.push({ from, to }));
    }
    if (!moves.length) {
      over = true;
      status.textContent = "You win — AI can't move";
      render();
      return;
    }
    let best = moves[0];
    let bestScore = -999;
    for (const m of moves) {
      cells[m.to] = "ai";
      cells[m.from] = null;
      let s = inMill(m.to, "ai") ? 60 : 0;
      cells[m.to] = "you";
      if (inMill(m.to, "you")) s += 45;
      cells[m.to] = null;
      cells[m.from] = "ai";
      s += Math.random();
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    cells[best.to] = "ai";
    cells[best.from] = null;
    updateScore();
    afterPlaceOrMove("ai", best.to);
  }

  function xy(i) {
    const [ring, slot] = POS[i];
    const sizes = [0.42, 0.28, 0.14];
    const s = sizes[ring];
    const angles = [-90, -45, 0, 45, 90, 135, 180, 225].map((d) => (d * Math.PI) / 180);
    const a = angles[slot];
    return [50 + Math.cos(a) * s * 100, 50 + Math.sin(a) * s * 100];
  }

  function render() {
    const lines = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
      [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
      [1, 9], [9, 17], [3, 11], [11, 19], [5, 13], [13, 21], [7, 15], [15, 23],
    ];
    let html = `<svg class="nmm-svg" viewBox="0 0 100 100">`;
    for (const [a, b] of lines) {
      const [x1, y1] = xy(a);
      const [x2, y2] = xy(b);
      html += `<line class="nmm-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    const legals = selected !== null ? legalMoves(selected) : [];
    for (let i = 0; i < 24; i++) {
      const [x, y] = xy(i);
      let cls = "nmm-pt";
      if (cells[i]) cls += " " + cells[i];
      if (selected === i) cls += " sel";
      if (legals.includes(i)) cls += " legal";
      if (removing === "you" && canRemoveFor(i, "ai")) cls += " legal";
      html += `<circle class="${cls}" data-i="${i}" cx="${x}" cy="${y}" r="3.2"/>`;
    }
    html += "</svg>";
    board.innerHTML = html;
    board.querySelectorAll(".nmm-pt").forEach((el) => {
      el.addEventListener("click", () => onPoint(+el.dataset.i));
    });
    updateScore();
  }

  function newGame() {
    cells = Array(24).fill(null);
    placeLeft = { you: 9, ai: 9 };
    selected = null;
    removing = null;
    turn = "you";
    over = false;
    phase = "place";
    status.textContent = "Place your men (9)";
    updateScore();
    render();
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  newGame();
})();
