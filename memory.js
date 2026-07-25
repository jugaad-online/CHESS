(() => {
  const SYMBOLS = ["♚", "♛", "♜", "♝", "♞", "♟", "★", "◆"];
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const matchesEl = document.getElementById("matches");
  const statusEl = document.getElementById("status");
  let cards, flipped, lock, moves, matches;

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function render() {
    boardEl.innerHTML = "";
    cards.forEach((card, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      if (card.flipped || card.matched) {
        btn.classList.add(card.matched ? "matched" : "flipped");
        btn.textContent = card.symbol;
      } else btn.textContent = "?";
      btn.onclick = () => flip(i);
      boardEl.appendChild(btn);
    });
    movesEl.textContent = moves;
    matchesEl.textContent = matches;
    statusEl.textContent = matches === 8 ? "You won!" : "Find all pairs";
  }

  function flip(i) {
    if (lock || cards[i].flipped || cards[i].matched) return;
    cards[i].flipped = true;
    flipped.push(i);
    render();
    if (flipped.length < 2) return;
    moves += 1;
    lock = true;
    const [a, b] = flipped;
    if (cards[a].symbol === cards[b].symbol) {
      cards[a].matched = cards[b].matched = true;
      matches += 1;
      flipped = [];
      lock = false;
      render();
    } else {
      setTimeout(() => {
        cards[a].flipped = cards[b].flipped = false;
        flipped = [];
        lock = false;
        render();
      }, 650);
    }
  }

  function newGame() {
    cards = shuffle([...SYMBOLS, ...SYMBOLS]).map((symbol) => ({ symbol, flipped: false, matched: false }));
    flipped = []; lock = false; moves = 0; matches = 0;
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
