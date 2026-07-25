(() => {
  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const board = document.getElementById("board");
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  let grid, selected, over;

  function isHole(r, c) {
    if (r < 0 || r > 6 || c < 0 || c > 6) return false;
    if ((r < 2 || r > 4) && (c < 2 || c > 4)) return false;
    return true;
  }

  function reset() {
    grid = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (isHole(r, c) ? 1 : -1))
    );
    grid[3][3] = 0;
    selected = null;
    over = false;
    status.textContent = "Select a peg, then a landing hole";
    render();
  }

  function pegCount() {
    let n = 0;
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (grid[r][c] === 1) n++;
    return n;
  }

  function jumpsFrom(r, c) {
    const out = [];
    for (const [dr, dc] of DIRS) {
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (isHole(lr, lc) && grid[mr][mc] === 1 && grid[lr][lc] === 0) {
        out.push([lr, lc, mr, mc]);
      }
    }
    return out;
  }

  function anyMoves() {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (grid[r][c] === 1 && jumpsFrom(r, c).length) return true;
    return false;
  }

  function finishCheck() {
    const n = pegCount();
    scoreEl.textContent = `Pegs: ${n}`;
    if (!anyMoves()) {
      over = true;
      if (n === 1 && grid[3][3] === 1) status.textContent = "Perfect — one peg in the center!";
      else if (n === 1) status.textContent = "Win — one peg left!";
      else status.textContent = `Stuck with ${n} pegs — try again`;
    }
  }

  function onCell(r, c) {
    if (over || grid[r][c] === -1) return;
    if (selected) {
      const [sr, sc] = selected;
      const jump = jumpsFrom(sr, sc).find(([lr, lc]) => lr === r && lc === c);
      if (jump) {
        const [, , mr, mc] = jump;
        grid[sr][sc] = 0;
        grid[mr][mc] = 0;
        grid[r][c] = 1;
        selected = null;
        status.textContent = "Select a peg";
        render();
        finishCheck();
        return;
      }
      if (grid[r][c] === 1) {
        selected = [r, c];
        status.textContent = "Choose landing hole";
        render();
        return;
      }
      selected = null;
      status.textContent = "Select a peg";
      render();
      return;
    }
    if (grid[r][c] === 1) {
      if (!jumpsFrom(r, c).length) {
        status.textContent = "That peg has no jumps";
        return;
      }
      selected = [r, c];
      status.textContent = "Choose landing hole";
      render();
    }
  }

  function render() {
    board.innerHTML = "";
    const targets = selected ? jumpsFrom(selected[0], selected[1]).map(([lr, lc]) => `${lr},${lc}`) : [];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "peg-cell";
        if (grid[r][c] === -1) {
          btn.disabled = true;
        } else if (grid[r][c] === 1) {
          btn.classList.add("peg");
          if (selected && selected[0] === r && selected[1] === c) btn.classList.add("selected");
        } else {
          btn.classList.add("valid");
          if (targets.includes(`${r},${c}`)) btn.classList.add("target");
        }
        btn.addEventListener("click", () => onCell(r, c));
        board.appendChild(btn);
      }
    }
    scoreEl.textContent = `Pegs: ${pegCount()}`;
  }

  document.getElementById("btn-new").addEventListener("click", reset);
  reset();
})();
