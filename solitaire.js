(() => {
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const status = document.getElementById("status");
  const board = document.getElementById("board");

  let stock, waste, foundations, tableau, selected, over;

  function makeDeck() {
    const d = [];
    for (let s = 0; s < 4; s++)
      for (let r = 0; r < 13; r++)
        d.push({ suit: s, rank: r, face: false, id: s * 13 + r });
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function color(c) {
    return c.suit === 1 || c.suit === 2 ? "red" : "black";
  }

  function label(c) {
    return `${RANKS[c.rank]}${SUITS[c.suit]}`;
  }

  function newGame() {
    const deck = makeDeck();
    tableau = Array.from({ length: 7 }, () => []);
    for (let col = 0; col < 7; col++) {
      for (let n = 0; n <= col; n++) {
        const card = deck.pop();
        card.face = n === col;
        tableau[col].push(card);
      }
    }
    stock = deck.map((c) => {
      c.face = false;
      return c;
    });
    waste = [];
    foundations = [[], [], [], []];
    selected = null;
    over = false;
    status.textContent = "Click stock · move cards to build";
    render();
  }

  function canOnTableau(card, col) {
    const pile = tableau[col];
    if (!pile.length) return card.rank === 12;
    const top = pile[pile.length - 1];
    return top.face && color(card) !== color(top) && card.rank === top.rank - 1;
  }

  function canOnFound(card, fi) {
    const pile = foundations[fi];
    if (!pile.length) return card.rank === 0;
    const top = pile[pile.length - 1];
    return card.suit === top.suit && card.rank === top.rank + 1;
  }

  function clearSel() {
    selected = null;
  }

  function tryAutoFound(card, from) {
    for (let fi = 0; fi < 4; fi++) {
      if (canOnFound(card, fi)) {
        moveToFound(from, fi);
        return true;
      }
    }
    return false;
  }

  function removeSelected() {
    if (!selected) return null;
    if (selected.type === "waste") {
      return { cards: [waste.pop()], from: selected };
    }
    if (selected.type === "found") {
      return { cards: [foundations[selected.i].pop()], from: selected };
    }
    if (selected.type === "tab") {
      const pile = tableau[selected.col];
      const cards = pile.splice(selected.idx);
      return { cards, from: selected };
    }
    return null;
  }

  function restore(bundle) {
    if (!bundle) return;
    const { cards, from } = bundle;
    if (from.type === "waste") waste.push(...cards);
    else if (from.type === "found") foundations[from.i].push(...cards);
    else tableau[from.col].push(...cards);
  }

  function flipExposed(col) {
    const pile = tableau[col];
    if (pile.length && !pile[pile.length - 1].face) {
      pile[pile.length - 1].face = true;
    }
  }

  function moveToFound(from, fi) {
    let card;
    if (from.type === "waste") card = waste.pop();
    else if (from.type === "tab") {
      card = tableau[from.col].pop();
      flipExposed(from.col);
    } else return false;
    foundations[fi].push(card);
    return true;
  }

  function checkWin() {
    if (foundations.every((f) => f.length === 13)) {
      over = true;
      status.textContent = "You win!";
      return true;
    }
    return false;
  }

  function drawStock() {
    if (over) return;
    clearSel();
    if (stock.length) {
      const c = stock.pop();
      c.face = true;
      waste.push(c);
      status.textContent = "Drew from stock";
    } else if (waste.length) {
      while (waste.length) {
        const c = waste.pop();
        c.face = false;
        stock.push(c);
      }
      status.textContent = "Recycled waste to stock";
    }
    render();
  }

  function onSelect(sel) {
    if (over) return;
    if (!selected) {
      selected = sel;
      status.textContent = "Click destination (or foundation)";
      render();
      return;
    }
    if (
      selected.type === sel.type &&
      selected.col === sel.col &&
      selected.idx === sel.idx &&
      selected.i === sel.i
    ) {
      clearSel();
      render();
      return;
    }
    // double-path: try move selected onto target
    const bundle = removeSelected();
    if (!bundle) {
      clearSel();
      render();
      return;
    }
    const card = bundle.cards[0];
    let ok = false;

    if (sel.type === "found" && bundle.cards.length === 1) {
      if (canOnFound(card, sel.i)) {
        foundations[sel.i].push(card);
        if (bundle.from.type === "tab") flipExposed(bundle.from.col);
        ok = true;
      }
    } else if (sel.type === "tab") {
      if (canOnTableau(card, sel.col)) {
        tableau[sel.col].push(...bundle.cards);
        if (bundle.from.type === "tab") flipExposed(bundle.from.col);
        ok = true;
      }
    } else if (sel.type === "empty-tab") {
      if (canOnTableau(card, sel.col)) {
        tableau[sel.col].push(...bundle.cards);
        if (bundle.from.type === "tab") flipExposed(bundle.from.col);
        ok = true;
      }
    }

    if (!ok) {
      restore(bundle);
      // reselect new
      selected = sel.type === "empty-tab" ? null : sel;
      status.textContent = "Illegal move";
    } else {
      clearSel();
      status.textContent = "Nice move";
      checkWin();
    }
    render();
  }

  function cardEl(c, extra = {}) {
    const div = document.createElement("div");
    div.className = `card ${c.face ? color(c) : "back"}${extra.selected ? " selected" : ""}`;
    if (c.face) {
      div.innerHTML = `<span>${label(c)}</span><span>${SUITS[c.suit]}</span>`;
    }
    if (extra.z != null) div.style.zIndex = extra.z;
    if (extra.top != null) div.style.top = extra.top;
    if (extra.onClick) div.addEventListener("click", (e) => {
      e.stopPropagation();
      extra.onClick();
    });
    if (extra.onDbl) div.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      extra.onDbl();
    });
    return div;
  }

  function isSelected(type, opts) {
    if (!selected || selected.type !== type) return false;
    if (type === "waste") return true;
    if (type === "found") return selected.i === opts.i;
    if (type === "tab") return selected.col === opts.col && selected.idx === opts.idx;
    return false;
  }

  function render() {
    board.innerHTML = "";
    const top = document.createElement("div");
    top.className = "sol-top";

    const stockPile = document.createElement("div");
    stockPile.className = "pile stock";
    if (stock.length) {
      stockPile.appendChild(
        cardEl({ face: false }, {
          onClick: drawStock,
        })
      );
    } else {
      stockPile.innerHTML = '<span class="pile-empty-label">↻</span>';
      stockPile.style.cursor = "pointer";
      stockPile.addEventListener("click", drawStock);
    }
    top.appendChild(stockPile);

    const wastePile = document.createElement("div");
    wastePile.className = "pile waste";
    if (waste.length) {
      const c = waste[waste.length - 1];
      wastePile.appendChild(
        cardEl(c, {
          selected: isSelected("waste"),
          onClick: () => onSelect({ type: "waste" }),
          onDbl: () => {
            selected = { type: "waste" };
            if (tryAutoFound(c, selected)) {
              clearSel();
              checkWin();
            } else clearSel();
            render();
          },
        })
      );
    }
    top.appendChild(wastePile);

    const spacer = document.createElement("div");
    spacer.className = "spacer";
    top.appendChild(spacer);

    for (let fi = 0; fi < 4; fi++) {
      const fp = document.createElement("div");
      fp.className = "pile found";
      const pile = foundations[fi];
      if (!pile.length) {
        fp.innerHTML = `<span class="pile-empty-label">${SUITS[fi]}</span>`;
      } else {
        fp.appendChild(
          cardEl(pile[pile.length - 1], {
            selected: isSelected("found", { i: fi }),
            onClick: () => onSelect({ type: "found", i: fi }),
          })
        );
      }
      fp.addEventListener("click", (e) => {
        if (e.target === fp || e.target.classList.contains("pile-empty-label")) {
          if (selected) onSelect({ type: "found", i: fi });
        }
      });
      top.appendChild(fp);
    }
    board.appendChild(top);

    const tab = document.createElement("div");
    tab.className = "sol-tableau";
    for (let col = 0; col < 7; col++) {
      const pile = document.createElement("div");
      pile.className = "pile";
      const cards = tableau[col];
      if (!cards.length) {
        pile.innerHTML = '<span class="pile-empty-label">K</span>';
        pile.addEventListener("click", () => onSelect({ type: "empty-tab", col }));
      } else {
        cards.forEach((c, idx) => {
          const isTop = idx === cards.length - 1;
          pile.appendChild(
            cardEl(c, {
              z: idx + 1,
              top: `${idx * 18}px`,
              selected: isSelected("tab", { col, idx }),
              onClick: () => {
                if (!c.face) return;
                onSelect({ type: "tab", col, idx });
              },
              onDbl: () => {
                if (!c.face || !isTop) return;
                selected = { type: "tab", col, idx };
                if (tryAutoFound(c, selected)) {
                  clearSel();
                  checkWin();
                } else clearSel();
                render();
              },
            })
          );
        });
        pile.style.minHeight = `${72 + Math.max(0, cards.length - 1) * 18}px`;
      }
      tab.appendChild(pile);
    }
    board.appendChild(tab);
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  newGame();
})();
