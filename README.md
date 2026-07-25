# Chess

A browser chess game with a computer opponent, adaptive difficulty, and full rules support.

**Live demo:** [https://jugaad-online.github.io/CHESS/](https://jugaad-online.github.io/CHESS/)

## Features

- Play **vs Computer** (you are White) or **2 Players** on the same device
- Legal moves only — castling, en passant, promotion, check, checkmate, stalemate, 50-move draw
- **Hardness levels** that go up automatically each time you beat the computer
- Undo, flip board, move history (SAN), captured pieces
- In-app **Help & Rules** with piece moves, special rules, and tips

## Hardness

Levels: **Beginner → Easy → Medium → Hard → Expert**

- Winning against the computer raises the level by one
- The level is saved in the browser and kept across new games
- Use **Reset level** to return to Beginner

## How to play

1. Open `index.html` in a browser, or visit the live demo above
2. Click a piece, then a highlighted square to move
3. Use **Help & Rules** for full instructions

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and help content |
| `styles.css` | Layout and styling |
| `script.js` | Chess rules, AI, and UI logic |

## Run locally

No build step required:

```bash
# Option A — open the file
open index.html

# Option B — simple local server (recommended)
npx --yes serve .
```

Then open the URL shown in the terminal (usually `http://localhost:3000`).

## Deploy (GitHub Pages)

This repo is set up for GitHub Pages from the `main` branch root.

1. Push changes to `main`
2. In the repo: **Settings → Pages → Deploy from branch → `main` / root**
3. Site will be at `https://<user>.github.io/CHESS/`

## Controls

| Control | Action |
|---------|--------|
| New game | Start a fresh match (keeps hardness) |
| Undo | Take back the last move (and the computer’s reply in vs Computer) |
| Flip board | Rotate the board view |
| Help & Rules | Open rules, piece moves, and tips |
| Reset level | Set hardness back to Beginner |

## License

Use freely for learning and personal projects.
