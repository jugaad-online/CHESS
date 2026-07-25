(() => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const W = canvas.width, H = canvas.height;
  let paddle, ball, bricks, score, lives, running, won;

  function buildBricks() {
    const rows = 6, cols = 8, bw = 46, bh = 16, pad = 6, top = 60, left = 18;
    const colors = ["#c45c48", "#c4a35a", "#2f6b4f", "#2f6f8f", "#a85d5d", "#8b6914"];
    bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      bricks.push({ x: left + c * (bw + pad), y: top + r * (bh + pad), w: bw, h: bh, alive: true, color: colors[r] });
    }
  }

  function resetBall() {
    ball = { x: W / 2, y: H - 60, r: 7, vx: 0, vy: 0, stuck: true };
  }

  function newGame() {
    paddle = { w: 78, h: 12, x: W / 2 - 39, y: H - 36 };
    score = 0; lives = 3; running = false; won = false;
    scoreEl.textContent = "0"; livesEl.textContent = "3";
    statusEl.textContent = "Click or press Space to launch";
    buildBricks();
    resetBall();
    draw();
  }

  function launch() {
    if (won || lives <= 0) return;
    if (ball.stuck) {
      ball.stuck = false;
      ball.vx = (Math.random() < 0.5 ? -1 : 1) * 3.2;
      ball.vy = -4.2;
      running = true;
      statusEl.textContent = "Go!";
    }
  }

  function step() {
    if (!running || ball.stuck) { draw(); requestAnimationFrame(step); return; }

    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy *= -1;

    if (ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w && ball.vy > 0) {
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      ball.vx = hit * 4.5;
      ball.vy = -Math.abs(ball.vy);
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }

    if (bricks.every((b) => !b.alive)) {
      running = false; won = true;
      statusEl.textContent = "You cleared the board!";
    }

    if (ball.y > H) {
      lives -= 1;
      livesEl.textContent = lives;
      if (lives <= 0) {
        running = false;
        statusEl.textContent = "Game over";
      } else {
        resetBall();
        statusEl.textContent = "Click or press Space to launch";
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.fillStyle = "#2a1c14";
    ctx.fillRect(0, 0, W, H);
    for (const b of bricks) if (b.alive) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.fillStyle = "#e8d4c4";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    if (ball.stuck) { ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - ball.r - 1; }
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#f2c14e";
    ctx.fill();
  }

  function movePaddle(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
  }

  canvas.addEventListener("mousemove", (e) => movePaddle(e.clientX));
  canvas.addEventListener("touchmove", (e) => { movePaddle(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  canvas.addEventListener("click", launch);
  canvas.addEventListener("touchstart", (e) => { movePaddle(e.touches[0].clientX); launch(); }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); launch(); }
    if (e.key === "ArrowLeft") paddle.x = Math.max(0, paddle.x - 24);
    if (e.key === "ArrowRight") paddle.x = Math.min(W - paddle.w, paddle.x + 24);
  });
  document.getElementById("btn-new").onclick = newGame;

  newGame();
  requestAnimationFrame(step);
})();
