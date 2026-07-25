# Games — Jugaad Online

Thirty-two browser games from one home screen. Every game has a **2D / 3D** view toggle (shared across pages; press `2` or `3`).

**Live demo:** [https://jugaad-online.github.io/CHESS/](https://jugaad-online.github.io/CHESS/)

## Quick start

1. Open the live site or `index.html`
2. Pick a **card**
3. Use **← All games** to return

```bash
npx --yes serve .
```

## Board games

| Game | File | Notes |
|------|------|--------|
| **Chess** | `chess.html` | Vs computer / 2 players · auto hardness · Help |
| **Checkers** | `checkers.html` | Vs computer · jumps / kings |
| **Reversi** | `reversi.html` | Othello-style · flip discs |
| **Gomoku** | `gomoku.html` | Five in a row · 13×13 |
| **Hex** | `hex.html` | Connect opposite sides |
| **Connect Four** | `connect4.html` | Vs computer |
| **Tic-Tac-Toe** | `tictactoe.html` | Vs computer (unbeatable) |
| **Nine Men’s Morris** | `ninemensmorris.html` | Place · move · mill |
| **Quarto** | `quarto.html` | Shared-trait line of four |
| **Mancala** | `mancala.html` | Sow stones · stores |
| **Backgammon** | `backgammon.html` | Race, hit, bear off |
| **Ludo** | `ludo.html` | You (Red) vs 3 AIs · 3D dice |
| **Snakes & Ladders** | `snakesandladders.html` | Classic 1–100 · 3D dice |
| **Chinese Checkers** | `chinesecheckers.html` | Hop to the opposite tip |
| **Fox & Geese** | `foxandgeese.html` | Hunt / trap on the cross board |
| **Battleship** | `battleship.html` | Place fleet · fire |
| **Dots & Boxes** | `dotsandboxes.html` | Claim lines and boxes |
| **Peg Solitaire** | `pegsolitaire.html` | Jump until one peg left |
| **Dominoes** | `dominoes.html` | Match ends vs computer |
| **Mastermind** | `mastermind.html` | Crack the color code |
| **Yahtzee** | `yahtzee.html` | Dice scorecard |
| **Solitaire** | `solitaire.html` | Klondike foundations |
| **UNO** | `uno.html` | Vs 3 AIs · wilds · UNO call |
| **Monopoly** | `monopoly.html` | Vs 2 AIs · buy / rent / jail |

## Other games

| Game | File | Notes |
|------|------|--------|
| **Sudoku** | `sudoku.html` | Easy / Medium / Hard · hints |
| **2048** | `2048.html` | Arrow keys or swipe |
| **Memory** | `memory.html` | Match 8 pairs |
| **Minesweeper** | `minesweeper.html` | Easy / Medium / Hard |
| **Word Guess** | `wordle.html` | 5 letters · 6 tries |
| **Snake** | `snake.html` | 2D / 3D canvas |
| **Breakout** | `breakout.html` | Paddle · clear bricks |
| **Brick Game** | `brickgame.html` | Tetris-style · levels |

## Shared files

| File | Purpose |
|------|---------|
| `index.html` / `home.css` | Home game cards |
| `common.css` | Shared chrome for mini-games |
| `viewmode.css` / `viewmode.js` | Shared 2D / 3D toggle |
| `README.md` | This file |

## Deploy

Push `main` and enable GitHub Pages from the branch root:

`https://<user>.github.io/CHESS/`

## License

Use freely for learning and personal projects.
