(() => {
  const status = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const tableEl = document.getElementById("table");
  const handEl = document.getElementById("hand");
  const aiCountEl = document.getElementById("ai-count");

  let boneyard, hand, aiHand, chain, leftEnd, rightEnd, turn, over, pending;

  function allTiles() {
    const t = [];
    for (let a = 0; a <= 6; a++)
      for (let b = a; b <= 6; b++) t.push([a, b]);
    return t;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pips(tile) {
    return tile[0] + tile[1];
  }

  function handPips(h) {
    return h.reduce((s, t) => s + pips(t), 0);
  }

  function canPlay(tile) {
    if (!chain.length) return true;
    return tile.includes(leftEnd) || tile.includes(rightEnd);
  }

  function playSides(tile) {
    if (!chain.length) return ["start"];
    const sides = [];
    if (tile.includes(leftEnd)) sides.push("L");
    if (tile.includes(rightEnd)) sides.push("R");
    return [...new Set(sides)];
  }

  function place(tile, side, whose) {
    const list = whose === "you" ? hand : aiHand;
    const idx = list.findIndex((t) => t[0] === tile[0] && t[1] === tile[1]);
    if (idx < 0) return false;
    list.splice(idx, 1);
    if (!chain.length) {
      chain.push(tile);
      leftEnd = tile[0];
      rightEnd = tile[1];
      return true;
    }
    if (side === "L") {
      const oriented = tile[1] === leftEnd ? tile : [tile[1], tile[0]];
      chain.unshift(oriented);
      leftEnd = oriented[0];
    } else {
      const oriented = tile[0] === rightEnd ? tile : [tile[1], tile[0]];
      chain.push(oriented);
      rightEnd = oriented[1];
    }
    return true;
  }

  function endGame(msg) {
    over = true;
    status.textContent = msg;
    render();
  }

  function checkEnd(whoPlayed) {
    const h = whoPlayed === "you" ? hand : aiHand;
    if (h.length === 0) {
      const opp = whoPlayed === "you" ? aiHand : hand;
      const pts = handPips(opp);
      endGame(
        whoPlayed === "you"
          ? `You win! (+${pts} pips)`
          : `Computer wins (+${pts} pips)`
      );
      return true;
    }
    const youCan = hand.some(canPlay) || boneyard.length > 0;
    const aiCan = aiHand.some(canPlay) || boneyard.length > 0;
    if (!youCan && !aiCan) {
      const yp = handPips(hand);
      const ap = handPips(aiHand);
      if (yp < ap) endGame(`Blocked — you win (${yp} vs ${ap} pips)`);
      else if (ap < yp) endGame(`Blocked — computer wins (${ap} vs ${yp} pips)`);
      else endGame(`Blocked — draw (${yp} pips each)`);
      return true;
    }
    return false;
  }

  function afterPlay(who) {
    pending = null;
    if (checkEnd(who)) return;
    turn = who === "you" ? "ai" : "you";
    if (turn === "ai") {
      status.textContent = "Computer playing…";
      render();
      setTimeout(aiTurn, 500);
    } else {
      status.textContent = "Your turn — play or draw";
      render();
    }
  }

  function tryDraw() {
    if (over || turn !== "you" || pending) return;
    if (hand.some(canPlay)) {
      status.textContent = "You can still play a tile";
      return;
    }
    if (!boneyard.length) {
      status.textContent = "Boneyard empty — pass";
      afterPlay("you");
      return;
    }
    hand.push(boneyard.pop());
    status.textContent = "Drew a tile";
    render();
    if (!hand.some(canPlay) && !boneyard.length) afterPlay("you");
  }

  function onHandTile(tile) {
    if (over || turn !== "you") return;
    if (!canPlay(tile)) {
      status.textContent = "Doesn't match either end";
      return;
    }
    const sides = playSides(tile);
    if (sides.length === 1 || sides[0] === "start") {
      place(tile, sides[0] === "start" ? "R" : sides[0], "you");
      afterPlay("you");
      return;
    }
    pending = tile;
    status.textContent = "Click Left or Right end on the table";
    render();
  }

  function onEndPick(side) {
    if (!pending) return;
    place(pending, side, "you");
    afterPlay("you");
  }

  function aiTurn() {
    if (over || turn !== "ai") return;
    let played = false;
    while (!played) {
      const playable = aiHand.filter(canPlay);
      if (playable.length) {
        playable.sort((a, b) => pips(b) - pips(a));
        const tile = playable[0];
        const sides = playSides(tile);
        place(tile, sides[0] === "start" ? "R" : sides[0], "ai");
        played = true;
      } else if (boneyard.length) {
        aiHand.push(boneyard.pop());
      } else {
        status.textContent = "Computer passes";
        afterPlay("ai");
        return;
      }
    }
    afterPlay("ai");
  }

  function tileHtml(tile, opts = {}) {
    const [a, b] = tile;
    const cls = ["tile"];
    if (opts.vert) cls.push("vert");
    if (opts.playable) cls.push("playable");
    if (opts.table) cls.push("table-tile");
    if (opts.back) cls.push("back");
    if (opts.endPick) cls.push("end-pick");
    const tag = opts.button === false ? "div" : "button";
    const dis = opts.disabled ? " disabled" : "";
    return `<${tag} type="button" class="${cls.join(" ")}"${dis} data-a="${a}" data-b="${b}" data-side="${opts.side || ""}"><span>${opts.back ? "" : a}</span><span>${opts.back ? "" : b}</span></${tag}>`;
  }

  function render() {
    aiCountEl.textContent = aiHand.length;
    scoreEl.textContent = chain.length
      ? `Ends: ${leftEnd} · ${rightEnd} · Boneyard: ${boneyard.length}`
      : `Play any tile · Boneyard: ${boneyard.length}`;

    let tableHtml = "";
    if (pending) {
      tableHtml += tileHtml([leftEnd, leftEnd], { button: true, endPick: true, side: "L" });
    }
    chain.forEach((t, i) => {
      tableHtml += tileHtml(t, { table: true, button: false, vert: i % 3 === 1 });
    });
    if (pending) {
      tableHtml += tileHtml([rightEnd, rightEnd], { button: true, endPick: true, side: "R" });
    }
    if (!chain.length) tableHtml = `<span style="color:#64748b;font-size:0.9rem">Empty table</span>`;
    tableEl.innerHTML = tableHtml;

    handEl.innerHTML = hand
      .map((t) =>
        tileHtml(t, {
          playable: turn === "you" && !over && canPlay(t),
          disabled: over || turn !== "you",
        })
      )
      .join("");

    handEl.querySelectorAll(".tile").forEach((el) => {
      el.addEventListener("click", () => onHandTile([+el.dataset.a, +el.dataset.b]));
    });
    tableEl.querySelectorAll(".end-pick").forEach((el) => {
      el.addEventListener("click", () => onEndPick(el.dataset.side));
    });
  }

  function newGame() {
    const deck = shuffle(allTiles());
    hand = deck.splice(0, 7);
    aiHand = deck.splice(0, 7);
    boneyard = deck;
    chain = [];
    leftEnd = rightEnd = null;
    turn = "you";
    over = false;
    pending = null;
    status.textContent = "Your turn — play any tile to start";
    render();
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-draw").addEventListener("click", tryDraw);
  newGame();
})();
