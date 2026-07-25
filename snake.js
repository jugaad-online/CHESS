(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");

  const COLS = 16;
  const ROWS = 16;
  const BEST_KEY = "snake-best";

  let snake, dir, nextDir, food, score, running, timer, mode, animT;

  function cellSize() {
    return canvas.width / COLS;
  }

  function placeFood() {
    while (true) {
      const f = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!snake.some((s) => s.x === f.x && s.y === f.y)) return f;
    }
  }

  function updateBest() {
    const best = Math.max(score, Number(localStorage.getItem(BEST_KEY) || 0));
    localStorage.setItem(BEST_KEY, String(best));
    bestEl.textContent = best;
  }

  function reset() {
    snake = [
      { x: 7, y: 8 },
      { x: 6, y: 8 },
      { x: 5, y: 8 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    food = placeFood();
    score = 0;
    running = false;
    clearInterval(timer);
    scoreEl.textContent = "0";
    updateBest();
    statusEl.textContent = "Press Start";
    draw();
  }

  function setDir(nx, ny) {
    if (dir.x + nx === 0 && dir.y + ny === 0) return;
    nextDir = { x: nx, y: ny };
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      running = false;
      clearInterval(timer);
      statusEl.textContent = "Game over";
      updateBest();
      draw();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      food = placeFood();
      updateBest();
    } else {
      snake.pop();
    }
    draw();
  }

  function start() {
    if (running) return;
    if (statusEl.textContent === "Game over") reset();
    running = true;
    statusEl.textContent = "Go!";
    timer = setInterval(tick, 115);
  }

  function setMode(next) {
    mode = next === "3d" ? "3d" : "2d";
    draw();
  }

  // —— Drawing helpers ——
  function drawGrass(cs) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#1a4a38");
    g.addColorStop(1, "#0f2d22");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fillRect(x * cs, y * cs, cs, cs);
        }
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawApple2D(cx, cy, r) {
    // shadow
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + r * 0.85, r * 0.7, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();

    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#ff7a6e");
    g.addColorStop(0.55, "#e23d2f");
    g.addColorStop(1, "#8f1a14");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // highlight
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.3, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();

    // stem
    ctx.strokeStyle = "#4a3420";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.75);
    ctx.quadraticCurveTo(cx + 4, cy - r * 1.15, cx + 7, cy - r * 1.05);
    ctx.stroke();

    // leaf
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy - r * 1.0, 6, 3.2, 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#3d8b6e";
    ctx.fill();
  }

  function segmentColor(i, len) {
    const t = i / Math.max(1, len - 1);
    const light = 0.55 - t * 0.22;
    const r = Math.round(40 + light * 40);
    const g = Math.round(130 + light * 50);
    const b = Math.round(90 + light * 30);
    return { r, g, b, light };
  }

  function drawSnakeBody2D(cs) {
    // Draw as connected rounded capsules for a continuous look
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const cx = s.x * cs + cs / 2;
      const cy = s.y * cs + cs / 2;
      const radius = i === 0 ? cs * 0.42 : cs * 0.38;
      const col = segmentColor(i, snake.length);

      // soft shadow
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + radius * 0.7, radius * 0.85, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fill();

      const grd = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.1, cx, cy, radius);
      grd.addColorStop(0, `rgb(${col.r + 50},${col.g + 60},${col.b + 35})`);
      grd.addColorStop(0.55, `rgb(${col.r},${col.g},${col.b})`);
      grd.addColorStop(1, `rgb(${col.r - 25},${col.g - 35},${col.b - 20})`);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // scale speckles
      if (i > 0) {
        ctx.fillStyle = "rgba(20,60,40,0.22)";
        for (let k = 0; k < 3; k++) {
          const ang = (k / 3) * Math.PI * 2 + i;
          ctx.beginPath();
          ctx.ellipse(
            cx + Math.cos(ang) * radius * 0.35,
            cy + Math.sin(ang) * radius * 0.25,
            radius * 0.14,
            radius * 0.09,
            ang,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Head details
    const head = snake[0];
    const hx = head.x * cs + cs / 2;
    const hy = head.y * cs + cs / 2;
    const hr = cs * 0.42;
    const ang = Math.atan2(dir.y, dir.x);

    // eyes
    const eyeDist = hr * 0.45;
    const eyeSide = hr * 0.38;
    [[-1, 1], [1, 1]].forEach(([side]) => {
      const ex = hx + Math.cos(ang) * eyeDist + Math.cos(ang + Math.PI / 2) * eyeSide * side * 0.55;
      const ey = hy + Math.sin(ang) * eyeDist + Math.sin(ang + Math.PI / 2) * eyeSide * side * 0.55;
      ctx.beginPath();
      ctx.arc(ex, ey, hr * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "#f4faf7";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + Math.cos(ang) * 1.5, ey + Math.sin(ang) * 1.5, hr * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = "#142018";
      ctx.fill();
    });

    // tongue
    const tx = hx + Math.cos(ang) * hr * 0.95;
    const ty = hy + Math.sin(ang) * hr * 0.95;
    const flicker = 0.5 + 0.5 * Math.sin(animT / 120);
    ctx.strokeStyle = "#c45c48";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + Math.cos(ang) * 7 * flicker, ty + Math.sin(ang) * 7 * flicker);
    ctx.stroke();
    ctx.beginPath();
    const tipX = tx + Math.cos(ang) * 7 * flicker;
    const tipY = ty + Math.sin(ang) * 7 * flicker;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + Math.cos(ang - 0.7) * 4, tipY + Math.sin(ang - 0.7) * 4);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + Math.cos(ang + 0.7) * 4, tipY + Math.sin(ang + 0.7) * 4);
    ctx.stroke();
  }

  // —— 3D isometric projection ——
  function project3d(gx, gy, z = 0) {
    // Map grid to isometric screen space
    const cs = cellSize();
    const worldX = gx * cs;
    const worldY = gy * cs;
    const isoX = (worldX - worldY) * 0.55;
    const isoY = (worldX + worldY) * 0.28 - z;
    const ox = canvas.width / 2;
    const oy = canvas.height * 0.18;
    return { x: ox + isoX, y: oy + isoY };
  }

  function drawBoard3D() {
    const cs = cellSize();
    // ground plate
    const corners = [
      project3d(0, 0),
      project3d(COLS, 0),
      project3d(COLS, ROWS),
      project3d(0, ROWS),
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, corners[0].y, 0, corners[2].y);
    g.addColorStop(0, "#1c4f3c");
    g.addColorStop(1, "#0d2a20");
    ctx.fillStyle = g;
    ctx.fill();

    // tiles
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const a = project3d(x, y);
        const b = project3d(x + 1, y);
        const c = project3d(x + 1, y + 1);
        const d = project3d(x, y + 1);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fillStyle = (x + y) % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.08)";
        ctx.fill();
      }
    }

    // side rim
    const front = [project3d(0, ROWS), project3d(COLS, ROWS)];
    const depth = 14;
    ctx.beginPath();
    ctx.moveTo(front[0].x, front[0].y);
    ctx.lineTo(front[1].x, front[1].y);
    ctx.lineTo(front[1].x, front[1].y + depth);
    ctx.lineTo(front[0].x, front[0].y + depth);
    ctx.closePath();
    ctx.fillStyle = "#0a1f18";
    ctx.fill();
  }

  function drawSphere3D(p, radius, colorTop, colorBot) {
    // shadow on ground
    ctx.beginPath();
    ctx.ellipse(p.x + 3, p.y + radius * 0.55, radius * 0.9, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();

    const grd = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.4, radius * 0.1, p.x, p.y, radius);
    grd.addColorStop(0, colorTop);
    grd.addColorStop(1, colorBot);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  function drawSnake3D() {
    const baseR = cellSize() * 0.34;
    // draw tail first for depth sort by y+x
    const order = snake.map((s, i) => ({ s, i })).sort((a, b) => (a.s.x + a.s.y) - (b.s.x + b.s.y));
    for (const { s, i } of order) {
      const z = i === 0 ? 10 : 7;
      const p = project3d(s.x + 0.5, s.y + 0.5, z);
      const col = segmentColor(i, snake.length);
      const r = i === 0 ? baseR * 1.15 : baseR;
      drawSphere3D(
        p,
        r,
        `rgb(${col.r + 55},${col.g + 65},${col.b + 40})`,
        `rgb(${col.r - 20},${col.g - 30},${col.b - 15})`
      );
    }

    // head face
    const head = snake[0];
    const hp = project3d(head.x + 0.5, head.y + 0.5, 10);
    const ang = Math.atan2(dir.y, dir.x);
    // approximate facing offset in iso
    const fx = Math.cos(ang) * 4 - Math.sin(ang) * 2;
    const fy = Math.sin(ang) * 2 + Math.cos(ang) * 2;
    [[-1], [1]].forEach(([side]) => {
      const ex = hp.x + fx + side * 5;
      const ey = hp.y + fy - 2;
      ctx.beginPath();
      ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#f4faf7";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1, ey, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#142018";
      ctx.fill();
    });
  }

  function drawFood3D() {
    const p = project3d(food.x + 0.5, food.y + 0.5, 12);
    const bob = Math.sin(animT / 200) * 2;
    p.y += bob;
    drawSphere3D(p, cellSize() * 0.3, "#ff8a7a", "#9a1f18");
    ctx.beginPath();
    ctx.ellipse(p.x + 5, p.y - 10, 5, 2.5, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "#3d8b6e";
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === "3d") {
      // backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#163d30");
      bg.addColorStop(1, "#0a1c16");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawBoard3D();
      drawFood3D();
      drawSnake3D();
    } else {
      drawGrass(cellSize());
      const cs = cellSize();
      drawApple2D(food.x * cs + cs / 2, food.y * cs + cs / 2, cs * 0.32);
      drawSnakeBody2D(cs);
    }
  }

  function animate() {
    animT = performance.now();
    if (!running) draw();
    else if (mode === "2d" || mode === "3d") {
      // redraw for tongue flicker / food bob while running
      draw();
    }
    requestAnimationFrame(animate);
  }

  // —— Controls ——
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-new").onclick = reset;

  window.addEventListener("viewmodechange", (e) => {
    setMode(e.detail?.mode || "2d");
  });

  document.addEventListener("keydown", (e) => {
    const map = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      s: [0, 1],
      a: [-1, 0],
      d: [1, 0],
    };
    if (map[e.key]) {
      e.preventDefault();
      setDir(...map[e.key]);
      if (!running) start();
    }
  });

  document.querySelectorAll(".dpad button").forEach((btn) => {
    btn.onclick = () => {
      const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[btn.dataset.dir];
      setDir(...d);
      if (!running) start();
    };
  });

  let sx = 0;
  let sy = 0;
  canvas.addEventListener("touchstart", (e) => {
    sx = e.changedTouches[0].clientX;
    sy = e.changedTouches[0].clientY;
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
    if (!running) start();
  }, { passive: true });

  mode = (window.GameViewMode && window.GameViewMode.get()) || "2d";
  setMode(mode);
  reset();
  animT = 0;
  requestAnimationFrame(animate);
})();
