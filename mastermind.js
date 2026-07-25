(() => {
  const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#eab308", "#7c3aed", "#ea580c"];
  const NAMES = ["R", "B", "G", "Y", "P", "O"];
  const LEN = 4;
  const MAX = 8;

  const status = document.getElementById("status");
  const rowsEl = document.getElementById("rows");
  const paletteEl = document.getElementById("palette");

  let secret, guesses, current, slot, color, over;

  function feedback(guess, code) {
    const g = guess.slice();
    const s = code.slice();
    let black = 0;
    let white = 0;
    for (let i = 0; i < LEN; i++) {
      if (g[i] === s[i]) {
        black++;
        g[i] = s[i] = -1;
      }
    }
    for (let i = 0; i < LEN; i++) {
      if (g[i] < 0) continue;
      const j = s.indexOf(g[i]);
      if (j >= 0) {
        white++;
        s[j] = -1;
      }
    }
    return { black, white };
  }

  function newGame() {
    secret = Array.from({ length: LEN }, () => Math.floor(Math.random() * COLORS.length));
    guesses = [];
    current = Array(LEN).fill(null);
    slot = 0;
    color = 0;
    over = false;
    status.textContent = `Guess 1 of ${MAX}`;
    render();
  }

  function submit() {
    if (over) return;
    if (current.some((c) => c === null)) {
      status.textContent = "Fill all four pegs";
      return;
    }
    const fb = feedback(current, secret);
    guesses.push({ pegs: current.slice(), ...fb });
    if (fb.black === LEN) {
      over = true;
      status.textContent = `You cracked it in ${guesses.length}!`;
      render(true);
      return;
    }
    if (guesses.length >= MAX) {
      over = true;
      status.textContent = "Out of guesses — code revealed";
      render(true);
      return;
    }
    current = Array(LEN).fill(null);
    slot = 0;
    status.textContent = `Guess ${guesses.length + 1} of ${MAX}`;
    render();
  }

  function render(showSecret) {
    paletteEl.innerHTML = COLORS.map(
      (c, i) =>
        `<button type="button" class="mm-swatch${color === i ? " sel" : ""}" style="background:${c}" data-c="${i}" aria-label="${NAMES[i]}"></button>`
    ).join("");
    paletteEl.querySelectorAll(".mm-swatch").forEach((el) => {
      el.addEventListener("click", () => {
        color = +el.dataset.c;
        render();
      });
    });

    let html = "";
    if (showSecret) {
      html += `<div class="mm-secret">${secret
        .map((c) => `<span class="mm-peg" style="background:${COLORS[c]};width:28px;height:28px;display:inline-block"></span>`)
        .join("")}</div>`;
    }

    for (let r = 0; r < MAX; r++) {
      const g = guesses[r];
      const isCur = !over && r === guesses.length;
      html += `<div class="mm-row"><span class="mm-num">${r + 1}</span>`;
      for (let i = 0; i < LEN; i++) {
        if (g) {
          html += `<span class="mm-peg" style="background:${COLORS[g.pegs[i]]}"></span>`;
        } else if (isCur) {
          const bg = current[i] !== null ? COLORS[current[i]] : "";
          html += `<button type="button" class="mm-peg${current[i] === null ? " empty" : ""}${slot === i ? " active" : ""}" style="${bg ? `background:${bg}` : ""}" data-i="${i}"></button>`;
        } else {
          html += `<span class="mm-peg empty"></span>`;
        }
      }
      html += `<div class="mm-fb">`;
      if (g) {
        const pegs = [];
        for (let k = 0; k < g.black; k++) pegs.push("black");
        for (let k = 0; k < g.white; k++) pegs.push("white");
        while (pegs.length < 4) pegs.push("");
        pegs.forEach((p) => {
          html += `<i class="${p}"></i>`;
        });
      } else {
        html += `<i></i><i></i><i></i><i></i>`;
      }
      html += `</div></div>`;
    }
    rowsEl.innerHTML = html;
    rowsEl.querySelectorAll(".mm-peg[data-i]").forEach((el) => {
      el.addEventListener("click", () => {
        const i = +el.dataset.i;
        slot = i;
        current[i] = color;
        const next = current.findIndex((c, idx) => idx > i && c === null);
        if (next >= 0) slot = next;
        else if (current.includes(null)) slot = current.indexOf(null);
        render();
      });
    });
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-submit").addEventListener("click", submit);
  newGame();
})();
