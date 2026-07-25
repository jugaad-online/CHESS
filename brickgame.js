(() => {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const SIZE = 30;

  const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
  };

  const COLORS = {
    I: "#2f6f8f",
    O: "#c4a35a",
    T: "#7a5ea8",
    S: "#2f6b4f",
    Z: "#c45c48",
    J: "#3a5a8c",
    L: "#b07050",
  };

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const nextCanvas = document.getElementById("next");
  const nctx = nextCanvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const statusEl = document.getElementById("status");

  let grid, piece, nextPiece, score, lines, level, running, over, timer, dropMs;

  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomType() {
    const keys = Object.keys(SHAPES);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function spawn(type) {
    const matrix = SHAPES[type].map((row) => row.slice());
    return {
      type,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    };
  }

  function rotate(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    const out = Array.from({ length: w }, () => Array(h).fill(0));
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) out[c][h - 1 - r] = matrix[r][c];
    }
    return out;
  }

  function collides(p, ox = 0, oy = 0, mat = p.matrix) {
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (!mat[r][c]) continue;
        const x = p.x + c + ox;
        const y = p.y + r + oy;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && grid[y][x]) return true;
      }
    }
    return false;
  }

  function merge() {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;
        const y = piece.y + r;
        const x = piece.x + c;
        if (y >= 0) grid[y][x] = piece.type;
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(Boolean)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared += 1;
        r += 1;
      }
    }
    if (!cleared) return;
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] * level;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    dropMs = Math.max(120, 700 - (level - 1) * 55);
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
    restartTimer();
  }

  function drawBlock(context, x, y, color, size, mode3d) {
    if (mode3d) {
      context.fillStyle = "rgba(0,0,0,0.28)";
      context.fillRect(x + 3, y + 3, size - 2, size - 2);
    }
    const g = context.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, shade(color, 35));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, -35));
    context.fillStyle = g;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);
    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
  }

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function is3d() {
    return document.documentElement.getAttribute("data-view-mode") === "3d"
      || (window.GameViewMode && window.GameViewMode.get() === "3d");
  }

  function draw() {
    const mode3d = is3d();
    // Clear playfield with a readable slate (not pure black)
    ctx.fillStyle = "#243041";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Checker well so empty board is obviously visible
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#2a374a" : "#223041";
        ctx.fillRect(c * SIZE, r * SIZE, SIZE, SIZE);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * SIZE + 0.5, 0);
      ctx.lineTo(x * SIZE + 0.5, ROWS * SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * SIZE + 0.5);
      ctx.lineTo(COLS * SIZE, y * SIZE + 0.5);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        drawBlock(ctx, c * SIZE, r * SIZE, COLORS[grid[r][c]], SIZE, mode3d);
      }
    }

    if (piece) {
      // ghost
      let gy = 0;
      while (!collides(piece, 0, gy + 1)) gy += 1;
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (!piece.matrix[r][c]) continue;
          const x = (piece.x + c) * SIZE;
          const y = (piece.y + r + gy) * SIZE;
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.strokeRect(x + 3, y + 3, SIZE - 6, SIZE - 6);
        }
      }
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (!piece.matrix[r][c]) continue;
          drawBlock(
            ctx,
            (piece.x + c) * SIZE,
            (piece.y + r) * SIZE,
            COLORS[piece.type],
            SIZE,
            mode3d
          );
        }
      }
    }

    // next
    nctx.fillStyle = "#243041";
    nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
      const m = nextPiece.matrix;
      const s = 24;
      const ox = (nextCanvas.width - m[0].length * s) / 2;
      const oy = (nextCanvas.height - m.length * s) / 2;
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          drawBlock(nctx, ox + c * s, oy + r * s, COLORS[nextPiece.type], s, mode3d);
        }
      }
    }
  }

  function lockPiece() {
    merge();
    clearLines();
    piece = nextPiece;
    nextPiece = spawn(randomType());
    if (collides(piece)) {
      over = true;
      running = false;
      clearInterval(timer);
      statusEl.textContent = "Game over";
    }
  }

  function softDrop() {
    if (!piece || over) return;
    if (!collides(piece, 0, 1)) {
      piece.y += 1;
      score += 1;
      scoreEl.textContent = score;
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (!piece || over || !running) return;
    while (!collides(piece, 0, 1)) {
      piece.y += 1;
      score += 2;
    }
    scoreEl.textContent = score;
    lockPiece();
    draw();
  }

  function move(dx) {
    if (!piece || over || !running) return;
    if (!collides(piece, dx, 0)) piece.x += dx;
    draw();
  }

  function rotatePiece() {
    if (!piece || over || !running) return;
    const next = rotate(piece.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(piece, k, 0, next)) {
        piece.matrix = next;
        piece.x += k;
        draw();
        return;
      }
    }
  }

  function restartTimer() {
    clearInterval(timer);
    if (!running || over) return;
    timer = setInterval(softDrop, dropMs);
  }

  function toggleStart() {
    if (over) {
      newGame();
      running = true;
      statusEl.textContent = "Go!";
      restartTimer();
      return;
    }
    running = !running;
    statusEl.textContent = running ? "Go!" : "Paused";
    if (running) restartTimer();
    else clearInterval(timer);
  }

  function newGame() {
    grid = emptyGrid();
    score = 0;
    lines = 0;
    level = 1;
    dropMs = 700;
    over = false;
    running = false;
    clearInterval(timer);
    piece = spawn(randomType());
    nextPiece = spawn(randomType());
    scoreEl.textContent = "0";
    linesEl.textContent = "0";
    levelEl.textContent = "1";
    statusEl.textContent = "Press Start";
    draw();
  }

  document.getElementById("btn-start").onclick = toggleStart;
  document.getElementById("btn-new").onclick = newGame;

  document.addEventListener("keydown", (e) => {
    const map = {
      ArrowLeft: () => move(-1),
      ArrowRight: () => move(1),
      ArrowDown: () => softDrop(),
      ArrowUp: () => rotatePiece(),
      x: () => rotatePiece(),
      X: () => rotatePiece(),
      " ": () => hardDrop(),
      p: () => toggleStart(),
      P: () => toggleStart(),
    };
    if (map[e.key]) {
      e.preventDefault();
      if (!running && !over && e.key !== "p" && e.key !== "P") toggleStart();
      map[e.key]();
    }
  });

  document.querySelectorAll(".pad button").forEach((btn) => {
    btn.onclick = () => {
      if (!running && !over) toggleStart();
      const act = btn.dataset.act;
      if (act === "left") move(-1);
      if (act === "right") move(1);
      if (act === "down") softDrop();
      if (act === "rot") rotatePiece();
      if (act === "drop") hardDrop();
    };
  });

  window.addEventListener("viewmodechange", draw);

  newGame();
})();
