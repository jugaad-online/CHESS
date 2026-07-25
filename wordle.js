(() => {
  const WORDS = [
    "APPLE","BRAVE","CANDY","DREAM","EAGLE","FLAME","GRAPE","HOUSE","IRONY","JOKER",
    "KNIFE","LEMON","MANGO","NIGHT","OCEAN","PLANT","QUEEN","RIVER","STONE","TIGER",
    "ULTRA","VIVID","WHEAT","ZEBRA","CRANE","SLATE","TRACE","AUDIO","MUSIC","PIANO",
    "CHAIR","TABLE","LIGHT","CLOUD","STORM","BREAD","SHEEP","HORSE","TRAIN","PLANE",
    "SMILE","HAPPY","WORLD","EARTH","WATER","FROST","GHOST","SPELL","MAGIC","SWORD"
  ];
  const ALLOWED = new Set(WORDS);
  const boardEl = document.getElementById("board");
  const keysEl = document.getElementById("keys");
  const statusEl = document.getElementById("status");
  const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  let answer, row, col, grid, keyState, over;

  function newGame() {
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    row = 0; col = 0; over = false;
    grid = Array.from({ length: 6 }, () => Array(5).fill(""));
    keyState = {};
    statusEl.textContent = "Guess the word";
    render();
  }

  function scoreGuess(guess) {
    const res = Array(5).fill("absent");
    const pool = answer.split("");
    for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) { res[i] = "correct"; pool[i] = null; }
    for (let i = 0; i < 5; i++) {
      if (res[i] === "correct") continue;
      const idx = pool.indexOf(guess[i]);
      if (idx >= 0) { res[i] = "present"; pool[idx] = null; }
    }
    return res;
  }

  function submit() {
    if (over || col < 5) return;
    const guess = grid[row].join("");
    if (!ALLOWED.has(guess)) {
      statusEl.textContent = "Not in word list";
      return;
    }
    const res = scoreGuess(guess);
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const rank = { correct: 3, present: 2, absent: 1 };
      if (!keyState[letter] || rank[res[i]] > rank[keyState[letter]]) keyState[letter] = res[i];
    }
    grid[row]._res = res;
    if (guess === answer) {
      over = true;
      statusEl.textContent = "You got it!";
    } else if (row === 5) {
      over = true;
      statusEl.textContent = `Answer: ${answer}`;
    } else {
      row += 1; col = 0;
      statusEl.textContent = "Guess the word";
    }
    render();
  }

  function type(ch) {
    if (over) return;
    if (ch === "ENTER") return submit();
    if (ch === "DEL") {
      if (col > 0) { col -= 1; grid[row][col] = ""; render(); }
      return;
    }
    if (col < 5 && /^[A-Z]$/.test(ch)) {
      grid[row][col] = ch;
      col += 1;
      render();
    }
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < 6; r++) {
      const rowEl = document.createElement("div");
      rowEl.className = "word-row";
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement("div");
        cell.className = "word-cell";
        const letter = grid[r][c];
        cell.textContent = letter;
        if (letter) cell.classList.add("filled");
        if (grid[r]._res) cell.classList.add(grid[r]._res[c]);
        rowEl.appendChild(cell);
      }
      boardEl.appendChild(rowEl);
    }

    keysEl.innerHTML = "";
    ROWS.forEach((line, idx) => {
      const rowEl = document.createElement("div");
      rowEl.className = "key-row";
      const keys = idx === 2 ? ["ENTER", ...line.split(""), "DEL"] : line.split("");
      keys.forEach((k) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key" + (k.length > 1 ? " wide" : "");
        btn.textContent = k === "DEL" ? "⌫" : k;
        if (keyState[k]) btn.classList.add(keyState[k]);
        btn.onclick = () => type(k);
        rowEl.appendChild(btn);
      });
      keysEl.appendChild(rowEl);
    });
  }

  document.getElementById("btn-new").onclick = newGame;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") type("ENTER");
    else if (e.key === "Backspace") type("DEL");
    else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
  });
  newGame();
})();
