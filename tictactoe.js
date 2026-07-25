(() => {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  let board, over, winLine;

  function winner(b) {
    for (const line of wins) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
    }
    if (b.every(Boolean)) return { player: "draw", line: null };
    return null;
  }

  function minimax(b, isMax) {
    const w = winner(b);
    if (w) return w.player === "O" ? 1 : w.player === "X" ? -1 : 0;
    let best = isMax ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = isMax ? "O" : "X";
      const score = minimax(b, !isMax);
      b[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function aiMove() {
    let best = -Infinity, move = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = "O";
      const score = minimax(board, false);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
    if (move >= 0) board[move] = "O";
  }

  function render() {
    boardEl.innerHTML = "";
    board.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.className = "ttt-cell";
      btn.type = "button";
      btn.textContent = v || "";
      if (winLine && winLine.includes(i)) btn.classList.add("win");
      btn.disabled = over || !!v;
      btn.onclick = () => play(i);
      boardEl.appendChild(btn);
    });
  }

  function play(i) {
    if (over || board[i]) return;
    board[i] = "X";
    let w = winner(board);
    if (!w) {
      aiMove();
      w = winner(board);
    }
    if (w) {
      over = true;
      winLine = w.line;
      statusEl.textContent = w.player === "draw" ? "Draw" : w.player === "X" ? "You win!" : "Computer wins";
    } else statusEl.textContent = "Your turn";
    render();
  }

  function newGame() {
    board = Array(9).fill(null);
    over = false; winLine = null;
    statusEl.textContent = "Your turn";
    render();
  }

  document.getElementById("btn-new").onclick = newGame;
  newGame();
})();
