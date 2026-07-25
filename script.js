(() => {
  "use strict";

  const FILES = "abcdefgh";
  const PIECES = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };

  const PIECE_VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const LEVEL_KEY = "chess-auto-level";

  const LEVELS = [
    { id: 1, name: "Beginner", depth: 1, noise: 0.55, topN: 6 },
    { id: 2, name: "Easy", depth: 1, noise: 0.35, topN: 4 },
    { id: 3, name: "Medium", depth: 2, noise: 0.18, topN: 3 },
    { id: 4, name: "Hard", depth: 3, noise: 0.08, topN: 2 },
    { id: 5, name: "Expert", depth: 3, noise: 0.02, topN: 1 },
  ];

  const PST = {
    P: [
      0, 0, 0, 0, 0, 0, 0, 0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0,
      5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0,
    ],
    N: [
      -50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20, 0, 0, 0, 0, -20, -40,
      -30, 0, 10, 15, 15, 10, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30,
      -30, 5, 10, 15, 15, 10, 5, -30,
      -40, -20, 0, 5, 5, 0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50,
    ],
    B: [
      -20, -10, -10, -10, -10, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10,
      -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 5, 0, 0, 0, 0, 5, -10,
      -20, -10, -10, -10, -10, -10, -10, -20,
    ],
    R: [
      0, 0, 0, 0, 0, 0, 0, 0,
      5, 10, 10, 10, 10, 10, 10, 5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      0, 0, 0, 5, 5, 0, 0, 0,
    ],
    Q: [
      -20, -10, -10, -5, -5, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 5, 5, 5, 0, -10,
      -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5,
      -10, 5, 5, 5, 5, 5, 0, -10,
      -10, 0, 5, 0, 0, 0, 0, -10,
      -20, -10, -10, -5, -5, -10, -10, -20,
    ],
    K: [
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20,
      20, 30, 10, 0, 0, 10, 30, 20,
    ],
  };

  const boardEl = document.getElementById("board");
  const turnEl = document.getElementById("turn-indicator");
  const messageEl = document.getElementById("game-message");
  const moveListEl = document.getElementById("move-list");
  const capturedWhiteEl = document.getElementById("captured-by-white");
  const capturedBlackEl = document.getElementById("captured-by-black");
  const modalEl = document.getElementById("promotion-modal");
  const promotionChoicesEl = document.getElementById("promotion-choices");
  const difficultyNameEl = document.getElementById("difficulty-name");
  const difficultyFillEl = document.getElementById("difficulty-fill");
  const difficultyNoteEl = document.getElementById("difficulty-note");
  const btnVsAi = document.getElementById("btn-vs-ai");
  const btnVsHuman = document.getElementById("btn-vs-human");
  const btnResetLevel = document.getElementById("btn-reset-level");

  let state = null;
  let selected = null;
  let legalTargets = new Map();
  let flipped = false;
  let pendingPromotion = null;
  let history = [];
  let vsAi = true;
  let humanColor = "w";
  let aiThinking = false;
  let aiTimer = null;
  let levelIndex = loadLevelIndex();
  let gameAdjusted = false;
  let lastLevelNote = "";

  function loadLevelIndex() {
    const raw = Number(localStorage.getItem(LEVEL_KEY));
    if (Number.isInteger(raw) && raw >= 0 && raw < LEVELS.length) return raw;
    return 0;
  }

  function saveLevelIndex() {
    localStorage.setItem(LEVEL_KEY, String(levelIndex));
  }

  function currentLevel() {
    return LEVELS[levelIndex];
  }

  function levelProgressPct() {
    return ((levelIndex + 1) / LEVELS.length) * 100;
  }

  function cloneState(s) {
    return {
      board: s.board.map((row) => row.slice()),
      turn: s.turn,
      castling: { ...s.castling },
      ep: s.ep ? { ...s.ep } : null,
      halfmove: s.halfmove,
      fullmove: s.fullmove,
      captured: {
        w: s.captured.w.slice(),
        b: s.captured.b.slice(),
      },
      lastMove: s.lastMove ? { ...s.lastMove } : null,
      status: s.status,
    };
  }

  function parseFEN(fen) {
    const [placement, turn, castling, ep, half, full] = fen.split(" ");
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const rows = placement.split("/");

    rows.forEach((row, r) => {
      let c = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) {
          c += Number(ch);
        } else {
          board[r][c] = ch;
          c += 1;
        }
      }
    });

    return {
      board,
      turn: turn === "w" ? "w" : "b",
      castling: {
        K: castling.includes("K"),
        Q: castling.includes("Q"),
        k: castling.includes("k"),
        q: castling.includes("q"),
      },
      ep: ep === "-" ? null : algebraicToRC(ep),
      halfmove: Number(half || 0),
      fullmove: Number(full || 1),
      captured: { w: [], b: [] },
      lastMove: null,
      status: "playing",
    };
  }

  function algebraicToRC(sq) {
    const file = FILES.indexOf(sq[0]);
    const rank = 8 - Number(sq[1]);
    return { r: rank, c: file };
  }

  function rcToAlgebraic(r, c) {
    return `${FILES[c]}${8 - r}`;
  }

  function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function isWhite(piece) {
    return piece === piece.toUpperCase();
  }

  function colorOf(piece) {
    return isWhite(piece) ? "w" : "b";
  }

  function opponent(color) {
    return color === "w" ? "b" : "w";
  }

  function findKing(board, color) {
    const target = color === "w" ? "K" : "k";
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (board[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  function squareAttacked(board, r, c, byColor) {
    const enemyPawn = byColor === "w" ? "P" : "p";
    const enemyKnight = byColor === "w" ? "N" : "n";
    const enemyKing = byColor === "w" ? "K" : "k";
    const enemyBishop = byColor === "w" ? "B" : "b";
    const enemyRook = byColor === "w" ? "R" : "r";
    const enemyQueen = byColor === "w" ? "Q" : "q";

    const pawnDir = byColor === "w" ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir;
      const pc = c + dc;
      if (inBounds(pr, pc) && board[pr][pc] === enemyPawn) return true;
    }

    const knightDeltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of knightDeltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc] === enemyKnight) return true;
    }

    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc] === enemyKing) return true;
      }
    }

    const rays = [
      { dirs: [[-1, 0], [1, 0], [0, -1], [0, 1]], pieces: [enemyRook, enemyQueen] },
      { dirs: [[-1, -1], [-1, 1], [1, -1], [1, 1]], pieces: [enemyBishop, enemyQueen] },
    ];

    for (const { dirs, pieces } of rays) {
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const p = board[nr][nc];
          if (p) {
            if (pieces.includes(p)) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    }

    return false;
  }

  function isInCheck(board, color) {
    const king = findKing(board, color);
    if (!king) return false;
    return squareAttacked(board, king.r, king.c, opponent(color));
  }

  function pushSlide(board, moves, r, c, color, deltas) {
    for (const [dr, dc] of deltas) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push({ r: nr, c: nc });
        } else {
          if (colorOf(target) !== color) moves.push({ r: nr, c: nc, capture: true });
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  function pseudoMovesFor(board, r, c, ep) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = colorOf(piece);
    const type = piece.toUpperCase();
    const moves = [];

    if (type === "P") {
      const dir = color === "w" ? -1 : 1;
      const startRank = color === "w" ? 6 : 1;
      const oneR = r + dir;
      if (inBounds(oneR, c) && !board[oneR][c]) {
        moves.push({ r: oneR, c, promote: oneR === 0 || oneR === 7 });
        const twoR = r + dir * 2;
        if (r === startRank && !board[twoR][c]) {
          moves.push({ r: twoR, c, doublePush: true });
        }
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = board[nr][nc];
        if (target && colorOf(target) !== color) {
          moves.push({ r: nr, c: nc, capture: true, promote: nr === 0 || nr === 7 });
        } else if (ep && ep.r === nr && ep.c === nc) {
          moves.push({ r: nr, c: nc, capture: true, enPassant: true });
        }
      }
    }

    if (type === "N") {
      const deltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = board[nr][nc];
        if (!target) moves.push({ r: nr, c: nc });
        else if (colorOf(target) !== color) moves.push({ r: nr, c: nc, capture: true });
      }
    }

    if (type === "B" || type === "Q") {
      pushSlide(board, moves, r, c, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    if (type === "R" || type === "Q") {
      pushSlide(board, moves, r, c, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    if (type === "K") {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (!target) moves.push({ r: nr, c: nc });
          else if (colorOf(target) !== color) moves.push({ r: nr, c: nc, capture: true });
        }
      }
    }

    return moves;
  }

  function canCastle(s, color, side) {
    const board = s.board;
    const rank = color === "w" ? 7 : 0;
    const kingC = 4;
    const rookC = side === "king" ? 7 : 0;
    const path = side === "king" ? [5, 6] : [1, 2, 3];
    const through = side === "king" ? [4, 5, 6] : [4, 3, 2];
    const flag = color === "w"
      ? (side === "king" ? "K" : "Q")
      : (side === "king" ? "k" : "q");

    if (!s.castling[flag]) return false;
    if (board[rank][kingC]?.toUpperCase() !== "K") return false;
    const rook = board[rank][rookC];
    if (!rook || rook.toUpperCase() !== "R" || colorOf(rook) !== color) return false;
    if (path.some((c) => board[rank][c])) return false;
    if (isInCheck(board, color)) return false;
    for (const c of through) {
      if (squareAttacked(board, rank, c, opponent(color))) return false;
    }
    return true;
  }

  function legalMovesFrom(s, r, c) {
    const piece = s.board[r][c];
    if (!piece || colorOf(piece) !== s.turn) return [];

    const color = s.turn;
    const candidates = pseudoMovesFor(s.board, r, c, s.ep);

    if (piece.toUpperCase() === "K") {
      if (canCastle(s, color, "king")) {
        candidates.push({ r: color === "w" ? 7 : 0, c: 6, castle: "king" });
      }
      if (canCastle(s, color, "queen")) {
        candidates.push({ r: color === "w" ? 7 : 0, c: 2, castle: "queen" });
      }
    }

    const legal = [];
    for (const move of candidates) {
      const next = applyMove(s, { from: { r, c }, to: move, promoteTo: "Q" }, true);
      if (!isInCheck(next.board, color)) {
        legal.push(move);
      }
    }
    return legal;
  }

  function allLegalMoves(s) {
    const moves = [];
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const piece = s.board[r][c];
        if (!piece || colorOf(piece) !== s.turn) continue;
        for (const to of legalMovesFrom(s, r, c)) {
          moves.push({ from: { r, c }, to });
        }
      }
    }
    return moves;
  }

  function applyMove(s, move, preview = false) {
    const next = cloneState(s);
    const { from, to } = move;
    const piece = next.board[from.r][from.c];
    const color = colorOf(piece);
    let captured = null;

    if (to.enPassant) {
      const capR = from.r;
      captured = next.board[capR][to.c];
      next.board[capR][to.c] = null;
    } else if (next.board[to.r][to.c]) {
      captured = next.board[to.r][to.c];
    }

    next.board[to.r][to.c] = piece;
    next.board[from.r][from.c] = null;

    if (to.castle === "king") {
      const rank = from.r;
      next.board[rank][5] = next.board[rank][7];
      next.board[rank][7] = null;
    } else if (to.castle === "queen") {
      const rank = from.r;
      next.board[rank][3] = next.board[rank][0];
      next.board[rank][0] = null;
    }

    if (to.promote || (piece.toUpperCase() === "P" && (to.r === 0 || to.r === 7))) {
      const promo = move.promoteTo || "Q";
      next.board[to.r][to.c] = color === "w" ? promo.toUpperCase() : promo.toLowerCase();
    }

    if (!preview && captured) {
      next.captured[color].push(captured);
    }

    if (piece.toUpperCase() === "K") {
      if (color === "w") {
        next.castling.K = false;
        next.castling.Q = false;
      } else {
        next.castling.k = false;
        next.castling.q = false;
      }
    }
    if (piece.toUpperCase() === "R") {
      if (from.r === 7 && from.c === 0) next.castling.Q = false;
      if (from.r === 7 && from.c === 7) next.castling.K = false;
      if (from.r === 0 && from.c === 0) next.castling.q = false;
      if (from.r === 0 && from.c === 7) next.castling.k = false;
    }
    if (captured?.toUpperCase() === "R") {
      if (to.r === 7 && to.c === 0) next.castling.Q = false;
      if (to.r === 7 && to.c === 7) next.castling.K = false;
      if (to.r === 0 && to.c === 0) next.castling.q = false;
      if (to.r === 0 && to.c === 7) next.castling.k = false;
    }

    next.ep = to.doublePush
      ? { r: (from.r + to.r) / 2, c: from.c }
      : null;

    if (piece.toUpperCase() === "P" || captured) next.halfmove = 0;
    else next.halfmove += 1;

    if (color === "b") next.fullmove += 1;

    next.turn = opponent(color);
    next.lastMove = {
      from: { ...from },
      to: { r: to.r, c: to.c },
      piece,
      captured,
      castle: to.castle || null,
      promoteTo: to.promote || (piece.toUpperCase() === "P" && (to.r === 0 || to.r === 7))
        ? (move.promoteTo || "Q")
        : null,
      enPassant: !!to.enPassant,
      san: null,
    };

    return next;
  }

  function pieceLetter(piece) {
    const t = piece.toUpperCase();
    return t === "P" ? "" : t;
  }

  function disambiguate(s, from, to, piece) {
    if (piece.toUpperCase() === "P" || piece.toUpperCase() === "K") return "";
    const same = [];
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        if (r === from.r && c === from.c) continue;
        if (s.board[r][c] !== piece) continue;
        const moves = legalMovesFrom(s, r, c);
        if (moves.some((m) => m.r === to.r && m.c === to.c)) {
          same.push({ r, c });
        }
      }
    }
    if (!same.length) return "";
    const fileClash = same.some((p) => p.c === from.c);
    const rankClash = same.some((p) => p.r === from.r);
    if (!fileClash) return FILES[from.c];
    if (!rankClash) return String(8 - from.r);
    return `${FILES[from.c]}${8 - from.r}`;
  }

  function toSAN(before, after, move) {
    const { from, to } = move;
    const piece = before.board[from.r][from.c];
    if (to.castle === "king") return "O-O";
    if (to.castle === "queen") return "O-O-O";

    const capture = !!(to.capture || to.enPassant || before.board[to.r][to.c]);
    let san = "";
    if (piece.toUpperCase() === "P") {
      if (capture) san += FILES[from.c] + "x";
      san += rcToAlgebraic(to.r, to.c);
    } else {
      san += pieceLetter(piece);
      san += disambiguate(before, from, to, piece);
      if (capture) san += "x";
      san += rcToAlgebraic(to.r, to.c);
    }

    const promo = after.lastMove?.promoteTo;
    if (promo) san += `=${promo.toUpperCase()}`;

    if (after.status === "checkmate") san += "#";
    else if (isInCheck(after.board, after.turn)) san += "+";

    return san;
  }

  function updateStatus(s) {
    const moves = allLegalMoves(s);
    const check = isInCheck(s.board, s.turn);
    if (!moves.length) {
      s.status = check ? "checkmate" : "stalemate";
    } else if (s.halfmove >= 100) {
      s.status = "draw";
    } else {
      s.status = check ? "check" : "playing";
    }
  }

  function pstValue(type, r, c, white) {
    const table = PST[type];
    if (!table) return 0;
    const idx = white ? r * 8 + c : (7 - r) * 8 + c;
    return table[idx];
  }

  function evaluate(s) {
    let score = 0;
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const p = s.board[r][c];
        if (!p) continue;
        const type = p.toUpperCase();
        const white = isWhite(p);
        const val = PIECE_VALUE[type] + pstValue(type, r, c, white);
        score += white ? val : -val;
      }
    }

    if (isInCheck(s.board, "w")) score -= 40;
    if (isInCheck(s.board, "b")) score += 40;

    return score;
  }

  function orderMoves(s, moves) {
    return moves.slice().sort((a, b) => {
      const capA = a.to.capture || a.to.enPassant || s.board[a.to.r][a.to.c] ? 1 : 0;
      const capB = b.to.capture || b.to.enPassant || s.board[b.to.r][b.to.c] ? 1 : 0;
      if (capA !== capB) return capB - capA;
      const promoA = a.to.promote ? 1 : 0;
      const promoB = b.to.promote ? 1 : 0;
      return promoB - promoA;
    });
  }

  function minimax(s, depth, alpha, beta, maximizing) {
    if (depth === 0 || s.status === "checkmate" || s.status === "stalemate" || s.status === "draw") {
      if (s.status === "checkmate") {
        return maximizing ? -100000 + (4 - depth) : 100000 - (4 - depth);
      }
      if (s.status === "stalemate" || s.status === "draw") return 0;
      return evaluate(s);
    }

    const moves = orderMoves(s, allLegalMoves(s));
    if (!moves.length) return evaluate(s);

    if (maximizing) {
      let best = -Infinity;
      for (const m of moves) {
        const next = applyMove(s, { ...m, promoteTo: "Q" }, true);
        updateStatus(next);
        const score = minimax(next, depth - 1, alpha, beta, false);
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const m of moves) {
      const next = applyMove(s, { ...m, promoteTo: "Q" }, true);
      updateStatus(next);
      const score = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }

  function pickAiMove(s, level) {
    const moves = allLegalMoves(s);
    if (!moves.length) return null;

    const scored = moves.map((m) => {
      const next = applyMove(s, { ...m, promoteTo: "Q" }, true);
      updateStatus(next);
      let score;
      if (next.status === "checkmate") {
        score = s.turn === "w" ? 100000 : -100000;
      } else {
        score = minimax(next, Math.max(0, level.depth - 1), -Infinity, Infinity, s.turn !== "w");
      }
      return { move: m, score };
    });

    scored.sort((a, b) => (s.turn === "w" ? b.score - a.score : a.score - b.score));

    if (Math.random() < level.noise) {
      const pool = scored.slice(0, Math.min(level.topN, scored.length));
      return pool[Math.floor(Math.random() * pool.length)].move;
    }

    return scored[0].move;
  }

  function adjustLevelAfterGame() {
    if (!vsAi || gameAdjusted) return;
    gameAdjusted = true;

    const humanWon =
      state.status === "checkmate" && state.turn !== humanColor;

    if (!humanWon) {
      lastLevelNote = humanLostOrDrawNote();
      renderDifficulty();
      return;
    }

    if (levelIndex < LEVELS.length - 1) {
      levelIndex += 1;
      saveLevelIndex();
      lastLevelNote = `Level up! Now ${currentLevel().name} — stays until reset`;
    } else {
      lastLevelNote = "Max level — Expert. Reset to start over";
    }

    renderDifficulty();
  }

  function humanLostOrDrawNote() {
    if (state.status === "checkmate") {
      return `Still ${currentLevel().name} — win to level up`;
    }
    return `Draw — still ${currentLevel().name}. Win to level up`;
  }

  function resetLevel() {
    levelIndex = 0;
    saveLevelIndex();
    gameAdjusted = false;
    lastLevelNote = "Hardness reset to Beginner";
    renderDifficulty();
  }

  function renderDifficulty() {
    const level = currentLevel();
    difficultyNameEl.textContent = vsAi ? level.name : "—";
    difficultyFillEl.style.width = vsAi ? `${levelProgressPct()}%` : "0%";

    if (!vsAi) {
      difficultyNoteEl.textContent = "Auto hardness off in 2-player";
    } else if (lastLevelNote) {
      difficultyNoteEl.textContent = lastLevelNote;
    } else {
      difficultyNoteEl.textContent = "Win to level up — keeps going until reset";
    }
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.classList.toggle("flipped", flipped);
    boardEl.classList.toggle("thinking", aiThinking);

    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const sq = document.createElement("button");
        sq.type = "button";
        sq.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
        sq.dataset.r = String(r);
        sq.dataset.c = String(c);
        sq.setAttribute("aria-label", rcToAlgebraic(r, c));

        if (c === 0) {
          const rank = document.createElement("span");
          rank.className = "coord rank";
          rank.textContent = String(8 - r);
          sq.appendChild(rank);
        }
        if (r === 7) {
          const file = document.createElement("span");
          file.className = "coord file";
          file.textContent = FILES[c];
          sq.appendChild(file);
        }

        if (state.lastMove) {
          const { from, to } = state.lastMove;
          if ((from.r === r && from.c === c) || (to.r === r && to.c === c)) {
            sq.classList.add("last-move");
          }
        }

        if (selected && selected.r === r && selected.c === c) {
          sq.classList.add("selected");
        }

        const key = `${r},${c}`;
        if (legalTargets.has(key)) {
          sq.classList.add("legal");
          if (legalTargets.get(key).capture || legalTargets.get(key).enPassant || state.board[r][c]) {
            sq.classList.add("capture");
          }
        }

        const piece = state.board[r][c];
        if (piece) {
          const span = document.createElement("span");
          span.className = "piece";
          span.textContent = PIECES[piece];
          sq.appendChild(span);

          if (
            piece.toUpperCase() === "K" &&
            colorOf(piece) === state.turn &&
            (state.status === "check" || state.status === "checkmate")
          ) {
            sq.classList.add("in-check");
          }
        }

        sq.addEventListener("click", () => onSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }
  }

  function renderSide() {
    const names = { w: "White", b: "Black" };
    if (state.status === "checkmate") {
      turnEl.textContent = `${names[opponent(state.turn)]} wins`;
      messageEl.textContent = "Checkmate";
    } else if (state.status === "stalemate") {
      turnEl.textContent = "Draw";
      messageEl.textContent = "Stalemate";
    } else if (state.status === "draw") {
      turnEl.textContent = "Draw";
      messageEl.textContent = "50-move rule";
    } else if (aiThinking) {
      turnEl.textContent = "Computer thinking…";
      messageEl.textContent = "";
    } else {
      turnEl.textContent = `${names[state.turn]} to move`;
      messageEl.textContent = state.status === "check" ? "Check!" : "";
    }

    const sortValue = (p) => "PNBRQK".indexOf(p.toUpperCase());
    const fmt = (arr) => arr.slice().sort((a, b) => sortValue(b) - sortValue(a)).map((p) => PIECES[p]).join("");
    capturedWhiteEl.textContent = fmt(state.captured.w);
    capturedBlackEl.textContent = fmt(state.captured.b);
  }

  function renderHistory() {
    moveListEl.innerHTML = "";
    for (let i = 0; i < history.length; i += 2) {
      const li = document.createElement("li");
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = `${Math.floor(i / 2) + 1}.`;
      const white = document.createElement("span");
      white.textContent = history[i]?.san || "";
      const black = document.createElement("span");
      black.textContent = history[i + 1]?.san || "";
      li.append(num, white, black);
      moveListEl.appendChild(li);
    }
    moveListEl.scrollTop = moveListEl.scrollHeight;
  }

  function render() {
    renderBoard();
    renderSide();
    renderHistory();
    renderDifficulty();
    btnVsAi.classList.toggle("active", vsAi);
    btnVsHuman.classList.toggle("active", !vsAi);
  }

  function clearSelection() {
    selected = null;
    legalTargets = new Map();
  }

  function isHumanTurn() {
    if (!vsAi) return true;
    return state.turn === humanColor;
  }

  function onSquareClick(r, c) {
    if (state.status === "checkmate" || state.status === "stalemate" || state.status === "draw") {
      return;
    }
    if (pendingPromotion || aiThinking || !isHumanTurn()) return;

    const piece = state.board[r][c];
    const key = `${r},${c}`;

    if (selected && legalTargets.has(key)) {
      const moveTo = legalTargets.get(key);
      attemptMove(selected, moveTo);
      return;
    }

    if (piece && colorOf(piece) === state.turn) {
      selected = { r, c };
      const moves = legalMovesFrom(state, r, c);
      legalTargets = new Map(moves.map((m) => [`${m.r},${m.c}`, m]));
      renderBoard();
      return;
    }

    clearSelection();
    renderBoard();
  }

  function attemptMove(from, to) {
    const piece = state.board[from.r][from.c];
    const needsPromo = piece.toUpperCase() === "P" && (to.r === 0 || to.r === 7);

    if (needsPromo) {
      pendingPromotion = { from, to };
      openPromotion(colorOf(piece));
      return;
    }

    commitMove(from, to, null);
  }

  function commitMove(from, to, promoteTo) {
    const before = cloneState(state);
    const move = { from, to, promoteTo: promoteTo || "Q" };
    const after = applyMove(state, move, false);
    updateStatus(after);
    after.lastMove.san = toSAN(before, after, move);
    history.push({
      san: after.lastMove.san,
      snapshot: cloneState(before),
    });
    state = after;
    clearSelection();
    pendingPromotion = null;
    hidePromotion();
    render();

    if (["checkmate", "stalemate", "draw"].includes(state.status)) {
      adjustLevelAfterGame();
      return;
    }

    scheduleAiMove();
  }

  function scheduleAiMove() {
    if (!vsAi || !isAiTurn() || aiThinking) return;
    if (["checkmate", "stalemate", "draw"].includes(state.status)) return;

    aiThinking = true;
    render();
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      const level = currentLevel();
      const choice = pickAiMove(state, level);
      aiThinking = false;
      if (!choice) {
        render();
        return;
      }
      const promoteTo = choice.to.promote ? "Q" : null;
      commitMove(choice.from, choice.to, promoteTo);
    }, 280 + Math.random() * 220);
  }

  function isAiTurn() {
    return vsAi && state.turn !== humanColor;
  }

  function openPromotion(color) {
    promotionChoicesEl.innerHTML = "";
    const options = color === "w" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
    for (const p of options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = PIECES[p];
      btn.setAttribute("aria-label", `Promote to ${p.toUpperCase()}`);
      btn.addEventListener("click", () => {
        if (!pendingPromotion) return;
        commitMove(pendingPromotion.from, pendingPromotion.to, p.toUpperCase());
      });
      promotionChoicesEl.appendChild(btn);
    }
    modalEl.classList.remove("hidden");
  }

  function hidePromotion() {
    modalEl.classList.add("hidden");
    promotionChoicesEl.innerHTML = "";
  }

  function newGame() {
    clearTimeout(aiTimer);
    aiThinking = false;
    state = parseFEN(START_FEN);
    history = [];
    clearSelection();
    pendingPromotion = null;
    hidePromotion();
    gameAdjusted = false;
    // Keep levelIndex — new game continues at current hardness until reset
    if (!lastLevelNote.includes("Level up") && !lastLevelNote.includes("Max level") && !lastLevelNote.includes("reset to")) {
      lastLevelNote = "";
    }
    render();
    scheduleAiMove();
  }

  function undoMove() {
    if (!history.length || pendingPromotion || aiThinking) return;
    clearTimeout(aiTimer);
    aiThinking = false;

    let target = null;
    if (vsAi) {
      const second = history.pop();
      const first = history.length ? history.pop() : null;
      target = first ? first.snapshot : second.snapshot;
    } else {
      target = history.pop().snapshot;
    }

    state = cloneState(target);
    gameAdjusted = false;
    clearSelection();
    render();
  }

  function flipBoard() {
    flipped = !flipped;
    renderBoard();
  }

  function setMode(ai) {
    vsAi = ai;
    newGame();
  }

  document.getElementById("btn-new").addEventListener("click", newGame);
  document.getElementById("btn-undo").addEventListener("click", undoMove);
  document.getElementById("btn-flip").addEventListener("click", flipBoard);
  btnResetLevel.addEventListener("click", resetLevel);
  btnVsAi.addEventListener("click", () => setMode(true));
  btnVsHuman.addEventListener("click", () => setMode(false));

  const helpModalEl = document.getElementById("help-modal");
  const helpTabs = Array.from(document.querySelectorAll(".help-tab"));
  const helpPanels = {
    play: document.getElementById("help-play"),
    pieces: document.getElementById("help-pieces"),
    rules: document.getElementById("help-rules"),
    tips: document.getElementById("help-tips"),
  };

  function openHelp() {
    helpModalEl.classList.remove("hidden");
    document.getElementById("btn-help-close").focus();
  }

  function closeHelp() {
    helpModalEl.classList.add("hidden");
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

  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("btn-help-close").addEventListener("click", closeHelp);
  helpTabs.forEach((tab) => {
    tab.addEventListener("click", () => showHelpTab(tab.dataset.tab));
  });
  helpModalEl.addEventListener("click", (e) => {
    if (e.target === helpModalEl) closeHelp();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !helpModalEl.classList.contains("hidden")) {
      closeHelp();
    }
  });

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      pendingPromotion = null;
      hidePromotion();
      clearSelection();
      renderBoard();
    }
  });

  newGame();
})();
