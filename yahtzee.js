(() => {
  const CATS = [
    { id: "ones", label: "Ones" },
    { id: "twos", label: "Twos" },
    { id: "threes", label: "Threes" },
    { id: "fours", label: "Fours" },
    { id: "fives", label: "Fives" },
    { id: "sixes", label: "Sixes" },
    { id: "three", label: "3 of a Kind" },
    { id: "four", label: "4 of a Kind" },
    { id: "full", label: "Full House" },
    { id: "small", label: "Sm. Straight" },
    { id: "large", label: "Lg. Straight" },
    { id: "yahtzee", label: "Yahtzee" },
    { id: "chance", label: "Chance" },
  ];

  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const diceEl = document.getElementById("dice");
  const cardEl = document.getElementById("card");

  let dice, held, rollsLeft, scores, turn, over, rolled;

  function counts(d) {
    const c = [0, 0, 0, 0, 0, 0, 0];
    d.forEach((v) => c[v]++);
    return c;
  }

  function sum(d) {
    return d.reduce((a, b) => a + b, 0);
  }

  function hasStraight(d, len) {
    const u = [...new Set(d)].sort((a, b) => a - b);
    let run = 1;
    for (let i = 1; i < u.length; i++) {
      if (u[i] === u[i - 1] + 1) {
        run++;
        if (run >= len) return true;
      } else run = 1;
    }
    return false;
  }

  function scoreCat(id, d) {
    const c = counts(d);
    const s = sum(d);
    switch (id) {
      case "ones": return c[1];
      case "twos": return c[2] * 2;
      case "threes": return c[3] * 3;
      case "fours": return c[4] * 4;
      case "fives": return c[5] * 5;
      case "sixes": return c[6] * 6;
      case "three": return c.some((n, i) => i && n >= 3) ? s : 0;
      case "four": return c.some((n, i) => i && n >= 4) ? s : 0;
      case "full": {
        const vals = c.filter((n, i) => i && n);
        return vals.includes(3) && vals.includes(2) ? 25 : 0;
      }
      case "small": return hasStraight(d, 4) ? 30 : 0;
      case "large": return hasStraight(d, 5) ? 40 : 0;
      case "yahtzee": return c.some((n, i) => i && n === 5) ? 50 : 0;
      case "chance": return s;
      default: return 0;
    }
  }

  function total() {
    return Object.values(scores).reduce((a, b) => a + (b ?? 0), 0);
  }

  function scoredCount() {
    return Object.values(scores).filter((v) => v !== null).length;
  }

  function newGame() {
    dice = [1, 1, 1, 1, 1];
    held = [false, false, false, false, false];
    rollsLeft = 3;
    scores = Object.fromEntries(CATS.map((c) => [c.id, null]));
    turn = 1;
    over = false;
    rolled = false;
    status.textContent = "Roll the dice (3 rolls)";
    render();
  }

  function roll() {
    if (over || rollsLeft <= 0) return;
    for (let i = 0; i < 5; i++) {
      if (!held[i]) dice[i] = 1 + Math.floor(Math.random() * 6);
    }
    rollsLeft--;
    rolled = true;
    status.textContent =
      rollsLeft > 0
        ? `Rolls left: ${rollsLeft} — click dice to hold, then score`
        : "No rolls left — pick a category";
    render();
  }

  function pick(id) {
    if (over || scores[id] !== null || !rolled) {
      if (!rolled) status.textContent = "Roll first";
      return;
    }
    scores[id] = scoreCat(id, dice);
    if (scoredCount() >= 13) {
      over = true;
      status.textContent = `Game over — total ${total()}`;
      render();
      return;
    }
    turn++;
    held = [false, false, false, false, false];
    rollsLeft = 3;
    rolled = false;
    status.textContent = `Turn ${turn}/13 — roll`;
    render();
  }

  function render() {
    scoreEl.textContent = `Total: ${total()} · Turn ${Math.min(turn, 13)}/13 · Rolls: ${rollsLeft}`;
    diceEl.innerHTML = dice
      .map(
        (v, i) =>
          `<button type="button" class="die${held[i] ? " held" : ""}" data-i="${i}" ${!rolled || over || rollsLeft === 3 ? "disabled" : ""}>${v}</button>`
      )
      .join("");
    diceEl.querySelectorAll(".die").forEach((el) => {
      el.addEventListener("click", () => {
        const i = +el.dataset.i;
        if (!rolled || over || rollsLeft === 3) return;
        held[i] = !held[i];
        render();
      });
    });

    cardEl.innerHTML = CATS.map((c) => {
      const scored = scores[c.id] !== null;
      const preview = !scored && rolled ? scoreCat(c.id, dice) : null;
      const val = scored ? scores[c.id] : preview !== null ? preview : "—";
      return `<button type="button" class="yh-cat${scored ? " scored" : ""}" data-id="${c.id}" ${scored || over || !rolled ? "disabled" : ""}>${c.label}</button><span class="yh-val${!scored && preview !== null ? " preview" : ""}">${val}</span>`;
    }).join("");
    cardEl.querySelectorAll(".yh-cat").forEach((el) => {
      el.addEventListener("click", () => pick(el.dataset.id));
    });
    document.getElementById("btn-roll").disabled = over || rollsLeft <= 0;
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-roll").addEventListener("click", roll);
  newGame();
})();
