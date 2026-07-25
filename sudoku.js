(() => {
  "use strict";

  const DIFFICULTY = {
    easy: 38,
    medium: 48,
    hard: 56,
  };

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status-text");
  const timerEl = document.getElementById("timer-text");
  const keypadEl = document.getElementById("keypad");

  let solution = Array(81).fill(0);
  let puzzle = Array(81).fill(0);
  let grid = Array(81).fill(0);
  let given = Array(81).fill(false);
  let selected = null;
  let difficulty = "easy";
  let completed = false;
  let seconds = 0;
  let timerId = null;

  function idx(r, c) {
    return r * 9 + c;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function isValid(board, pos, num) {
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    for (let i = 0; i < 9; i += 1) {
      if (board[idx(r, i)] === num) return false;
      if (board[idx(i, c)] === num) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr += 1) {
      for (let cc = bc; cc < bc + 3; cc += 1) {
        if (board[idx(rr, cc)] === num) return false;
      }
    }
    return true;
  }

  function solve(board) {
    const pos = board.indexOf(0);
    if (pos === -1) return true;
    for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (!isValid(board, pos, num)) continue;
      board[pos] = num;
      if (solve(board)) return true;
      board[pos] = 0;
    }
    return false;
  }

  function countSolutions(board, limit = 2) {
    let count = 0;
    function dfs(b) {
      if (count >= limit) return;
      const pos = b.indexOf(0);
      if (pos === -1) {
        count += 1;
        return;
      }
      for (let num = 1; num <= 9; num += 1) {
        if (!isValid(b, pos, num)) continue;
        b[pos] = num;
        dfs(b);
        b[pos] = 0;
        if (count >= limit) return;
      }
    }
    dfs(board.slice());
    return count;
  }

  function generatePuzzle(removeCount) {
    const full = Array(81).fill(0);
    solve(full);
    solution = full.slice();
    const order = shuffle([...Array(81).keys()]);
    const board = full.slice();
    let removed = 0;

    for (const pos of order) {
      if (removed >= removeCount) break;
      const keep = board[pos];
      board[pos] = 0;
      if (countSolutions(board, 2) !== 1) {
        board[pos] = keep;
      } else {
        removed += 1;
      }
    }

    puzzle = board.slice();
    grid = board.slice();
    given = board.map((n) => n !== 0);
  }

  function formatTime(total) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function startTimer() {
    clearInterval(timerId);
    seconds = 0;
    timerEl.textContent = "0:00";
    timerId = setInterval(() => {
      if (completed) return;
      seconds += 1;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function conflictsAt(pos) {
    const num = grid[pos];
    if (!num) return false;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    for (let i = 0; i < 9; i += 1) {
      const rowPos = idx(r, i);
      const colPos = idx(i, c);
      if (rowPos !== pos && grid[rowPos] === num) return true;
      if (colPos !== pos && grid[colPos] === num) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr += 1) {
      for (let cc = bc; cc < bc + 3; cc += 1) {
        const p = idx(rr, cc);
        if (p !== pos && grid[p] === num) return true;
      }
    }
    return false;
  }

  function isComplete() {
    return grid.every((n, i) => n === solution[i]);
  }

  function relatedSet(pos) {
    const set = new Set();
    if (pos == null) return set;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    for (let i = 0; i < 9; i += 1) {
      set.add(idx(r, i));
      set.add(idx(i, c));
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr += 1) {
      for (let cc = bc; cc < bc + 3; cc += 1) {
        set.add(idx(rr, cc));
      }
    }
    return set;
  }

  function render() {
    boardEl.innerHTML = "";
    const related = relatedSet(selected);
    const selectedNum = selected != null ? grid[selected] : 0;

    for (let i = 0; i < 81; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.dataset.i = String(i);
      const r = Math.floor(i / 9);
      const c = i % 9;
      if (c === 2 || c === 5) btn.classList.add("box-right");
      if (r === 2 || r === 5) btn.classList.add("box-bottom");
      if (given[i]) btn.classList.add("given");
      if (selected === i) btn.classList.add("selected");
      else if (related.has(i)) btn.classList.add("related");
      if (selectedNum && grid[i] === selectedNum) btn.classList.add("same");
      if (grid[i] && conflictsAt(i)) btn.classList.add("error");
      btn.textContent = grid[i] ? String(grid[i]) : "";
      btn.addEventListener("click", () => {
        selected = i;
        render();
      });
      boardEl.appendChild(btn);
    }
  }

  function setNumber(num) {
    if (completed || selected == null || given[selected]) return;
    grid[selected] = num;
    render();
    if (isComplete()) {
      completed = true;
      statusEl.textContent = "Solved!";
      clearInterval(timerId);
    } else {
      statusEl.textContent = "Playing";
    }
  }

  function erase() {
    setNumber(0);
  }

  function checkBoard() {
    let wrong = 0;
    let empty = 0;
    for (let i = 0; i < 81; i += 1) {
      if (!grid[i]) empty += 1;
      else if (grid[i] !== solution[i]) wrong += 1;
    }
    if (wrong === 0 && empty === 0) {
      statusEl.textContent = "Solved!";
      completed = true;
      clearInterval(timerId);
    } else if (wrong === 0) {
      statusEl.textContent = `Looking good — ${empty} empty`;
    } else {
      statusEl.textContent = `${wrong} incorrect`;
    }
    render();
  }

  function hint() {
    if (completed) return;
    const empties = [];
    for (let i = 0; i < 81; i += 1) {
      if (!grid[i]) empties.push(i);
    }
    if (!empties.length) {
      statusEl.textContent = "No empty cells";
      return;
    }
    const pos = empties[Math.floor(Math.random() * empties.length)];
    selected = pos;
    grid[pos] = solution[pos];
    render();
    const cell = boardEl.children[pos];
    if (cell) cell.classList.add("ok-flash");
    if (isComplete()) {
      completed = true;
      statusEl.textContent = "Solved!";
      clearInterval(timerId);
    } else {
      statusEl.textContent = "Hint placed";
    }
  }

  function newGame() {
    completed = false;
    selected = null;
    statusEl.textContent = "Generating…";
    render();

    // Yield so UI can show generating state on harder puzzles
    setTimeout(() => {
      generatePuzzle(DIFFICULTY[difficulty]);
      statusEl.textContent = "Playing";
      startTimer();
      render();
    }, 20);
  }

  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      difficulty = btn.dataset.diff;
      newGame();
    });
  });

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-check").addEventListener("click", checkBoard);
  document.getElementById("btn-hint").addEventListener("click", hint);
  document.getElementById("btn-erase").addEventListener("click", erase);

  const helpModalEl = document.getElementById("help-modal");
  const helpTabs = Array.from(document.querySelectorAll(".help-tab"));
  const helpPanels = {
    play: document.getElementById("help-play"),
    rules: document.getElementById("help-rules"),
    controls: document.getElementById("help-controls"),
    tips: document.getElementById("help-tips"),
  };

  function openHelp() {
    helpModalEl.classList.remove("hidden");
    helpModalEl.removeAttribute("hidden");
    document.getElementById("btn-help-close").focus();
  }

  function closeHelp() {
    helpModalEl.classList.add("hidden");
    helpModalEl.setAttribute("hidden", "");
  }

  function showHelpTab(name) {
    helpTabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    Object.entries(helpPanels).forEach(([key, panel]) => {
      const active = key === name;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  function helpOpen() {
    return !helpModalEl.classList.contains("hidden");
  }

  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("btn-help-close").addEventListener("click", closeHelp);
  helpTabs.forEach((tab) => {
    tab.addEventListener("click", () => showHelpTab(tab.dataset.tab));
  });
  helpModalEl.addEventListener("click", (e) => {
    if (e.target === helpModalEl) closeHelp();
  });

  keypadEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-num]");
    if (!btn) return;
    setNumber(Number(btn.dataset.num));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && helpOpen()) {
      closeHelp();
      return;
    }
    if (helpOpen()) return;
    if (e.key >= "1" && e.key <= "9") setNumber(Number(e.key));
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") erase();
    if (selected == null) return;
    const r = Math.floor(selected / 9);
    const c = selected % 9;
    if (e.key === "ArrowUp" && r > 0) selected = idx(r - 1, c);
    if (e.key === "ArrowDown" && r < 8) selected = idx(r + 1, c);
    if (e.key === "ArrowLeft" && c > 0) selected = idx(r, c - 1);
    if (e.key === "ArrowRight" && c < 8) selected = idx(r, c + 1);
    if (e.key.startsWith("Arrow")) render();
  });

  newGame();
})();
