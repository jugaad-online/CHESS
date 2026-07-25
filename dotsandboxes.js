(() => {
  const DOTS = 5;
  const BOX = DOTS - 1;
  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const board = document.getElementById("board");

  let H, V, owners, turn, youScore, aiScore, over;

  function key(a, b, c, d) {
    return `${a},${b},${c},${d}`;
  }

  function reset() {
    H = {};
    V = {};
    owners = Array.from({ length: BOX }, () => Array(BOX).fill(null));
    turn = "you";
    youScore = 0;
    aiScore = 0;
    over = false;
    status.textContent = "Your turn — click a line";
    render();
  }

  function lineTaken(horiz, r, c) {
    return horiz ? !!H[key(r, c, r, c + 1)] : !!V[key(r, c, r + 1, c)];
  }

  function setLine(horiz, r, c, who) {
    if (horiz) H[key(r, c, r, c + 1)] = who;
    else V[key(r, c, r + 1, c)] = who;
  }

  function boxComplete(br, bc) {
    return (
      lineTaken(true, br, bc) &&
      lineTaken(true, br + 1, bc) &&
      lineTaken(false, br, bc) &&
      lineTaken(false, br, bc + 1)
    );
  }

  function claimBoxes(who) {
    let n = 0;
    for (let r = 0; r < BOX; r++) {
      for (let c = 0; c < BOX; c++) {
        if (!owners[r][c] && boxComplete(r, c)) {
          owners[r][c] = who;
          n++;
        }
      }
    }
    return n;
  }

  function freeLines() {
    const list = [];
    for (let r = 0; r < DOTS; r++)
      for (let c = 0; c < BOX; c++)
        if (!lineTaken(true, r, c)) list.push({ horiz: true, r, c });
    for (let r = 0; r < BOX; r++)
      for (let c = 0; c < DOTS; c++)
        if (!lineTaken(false, r, c)) list.push({ horiz: false, r, c });
    return list;
  }

  function sidesFilled(br, bc) {
    let n = 0;
    if (lineTaken(true, br, bc)) n++;
    if (lineTaken(true, br + 1, bc)) n++;
    if (lineTaken(false, br, bc)) n++;
    if (lineTaken(false, br, bc + 1)) n++;
    return n;
  }

  function play(horiz, r, c, who) {
    if (lineTaken(horiz, r, c) || over) return false;
    setLine(horiz, r, c, who);
    const gained = claimBoxes(who);
    if (who === "you") youScore += gained;
    else aiScore += gained;
    return gained > 0;
  }

  function finishCheck() {
    if (freeLines().length === 0) {
      over = true;
      if (youScore > aiScore) status.textContent = "You win!";
      else if (aiScore > youScore) status.textContent = "Computer wins";
      else status.textContent = "Draw";
      return true;
    }
    return false;
  }

  function updateScore() {
    scoreEl.textContent = `You ${youScore} · Computer ${aiScore}`;
  }

  function aiMove() {
    if (over || turn !== "ai") return;
    const free = freeLines();
    let choice = null;
    for (const L of free) {
      setLine(L.horiz, L.r, L.c, "ai");
      let completes = false;
      for (let r = 0; r < BOX && !completes; r++)
        for (let c = 0; c < BOX; c++)
          if (!owners[r][c] && boxComplete(r, c)) completes = true;
      if (L.horiz) delete H[key(L.r, L.c, L.r, L.c + 1)];
      else delete V[key(L.r, L.c, L.r + 1, L.c)];
      if (completes) {
        choice = L;
        break;
      }
    }
    if (!choice) {
      const safe = free.filter((L) => {
        setLine(L.horiz, L.r, L.c, "ai");
        let bad = false;
        for (let r = 0; r < BOX; r++)
          for (let c = 0; c < BOX; c++)
            if (!owners[r][c] && sidesFilled(r, c) === 3) bad = true;
        if (L.horiz) delete H[key(L.r, L.c, L.r, L.c + 1)];
        else delete V[key(L.r, L.c, L.r + 1, L.c)];
        return !bad;
      });
      const pool = safe.length ? safe : free;
      choice = pool[Math.floor(Math.random() * pool.length)];
    }
    const again = play(choice.horiz, choice.r, choice.c, "ai");
    updateScore();
    render();
    if (finishCheck()) {
      render();
      return;
    }
    if (again) {
      status.textContent = "Computer scored again…";
      setTimeout(aiMove, 350);
    } else {
      turn = "you";
      status.textContent = "Your turn";
      render();
    }
  }

  function onLine(horiz, r, c) {
    if (turn !== "you" || over) return;
    if (lineTaken(horiz, r, c)) return;
    const again = play(horiz, r, c, "you");
    updateScore();
    render();
    if (finishCheck()) {
      render();
      return;
    }
    if (again) {
      status.textContent = "Nice — play again";
      render();
    } else {
      turn = "ai";
      status.textContent = "Computer thinking…";
      render();
      setTimeout(aiMove, 400);
    }
  }

  function render() {
    const pad = 28;
    const step = (360 - pad * 2) / (DOTS - 1);
    let html = `<svg class="dab-svg" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">`;
    for (let r = 0; r < BOX; r++) {
      for (let c = 0; c < BOX; c++) {
        const x = pad + c * step;
        const y = pad + r * step;
        const own = owners[r][c];
        html += `<rect class="dab-box${own ? " " + own : ""}" x="${x}" y="${y}" width="${step}" height="${step}"/>`;
      }
    }
    for (let r = 0; r < DOTS; r++) {
      for (let c = 0; c < BOX; c++) {
        const x1 = pad + c * step;
        const y1 = pad + r * step;
        const x2 = pad + (c + 1) * step;
        const who = H[key(r, c, r, c + 1)];
        const cls = who ? `taken-${who}` : "";
        html += `<line class="dab-line ${cls}" data-h="1" data-r="${r}" data-c="${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}"/>`;
      }
    }
    for (let r = 0; r < BOX; r++) {
      for (let c = 0; c < DOTS; c++) {
        const x1 = pad + c * step;
        const y1 = pad + r * step;
        const y2 = pad + (r + 1) * step;
        const who = V[key(r, c, r + 1, c)];
        const cls = who ? `taken-${who}` : "";
        html += `<line class="dab-line ${cls}" data-h="0" data-r="${r}" data-c="${c}" x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}"/>`;
      }
    }
    for (let r = 0; r < DOTS; r++) {
      for (let c = 0; c < DOTS; c++) {
        const x = pad + c * step;
        const y = pad + r * step;
        html += `<circle class="dab-dot" cx="${x}" cy="${y}" r="7"/>`;
      }
    }
    html += "</svg>";
    board.innerHTML = html;
    board.querySelectorAll(".dab-line:not([class*='taken'])").forEach((el) => {
      el.addEventListener("click", () => {
        onLine(el.dataset.h === "1", +el.dataset.r, +el.dataset.c);
      });
    });
    updateScore();
  }

  document.getElementById("btn-new").addEventListener("click", reset);
  reset();
})();
