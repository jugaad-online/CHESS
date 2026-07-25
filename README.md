# Games — Chess & Sudoku

Browser board games with a card-based home screen.

**Live demo:** [https://jugaad-online.github.io/CHESS/](https://jugaad-online.github.io/CHESS/)

## Quick start

1. Open [the live site](https://jugaad-online.github.io/CHESS/) or `index.html` locally
2. Choose a **card**: Chess or Sudoku
3. Use **← All games** to return to the picker
4. Open **Help & Rules** inside each game for full instructions

```bash
npx --yes serve .
```

## Home screen

| Card | Opens | Summary |
|------|--------|---------|
| **Chess** | `chess.html` | Play vs computer or 2 players; hardness levels up when you win |
| **Sudoku** | `sudoku.html` | Classic 9×9 puzzles — Easy, Medium, Hard |

## Chess

### Features
- Legal moves only: castling, en passant, promotion, check / checkmate / stalemate, 50-move draw
- **vs Computer** (you are White) or **2 Players**
- Hardness: Beginner → Easy → Medium → Hard → Expert (levels up after each win; saved until **Reset level**)
- Undo, flip board, move history (SAN), captured pieces

### Help & Rules (in-game)
Open **Help & Rules** for four tabs:

| Tab | Contents |
|-----|----------|
| How to play | Clicks, modes, hardness, board cues, home link |
| Pieces | How king, queen, rook, bishop, knight, and pawn move |
| Special rules | Checkmate, stalemate, castling, en passant, promotion, 50-move rule |
| Tips | Strategy tips and SAN notation guide |

Close help with **×**, click outside, or **Escape**.

## Sudoku

### Features
- Unique puzzles generated in the browser
- Easy / Medium / Hard
- Number pad + keyboard (`1–9`, arrows, Backspace)
- Check, Hint, Erase, timer
- Conflict highlighting (same number in row / column / box)

### Help & Rules (in-game)
Open **Help & Rules** for four tabs:

| Tab | Contents |
|-----|----------|
| How to play | Selecting cells, entering numbers, clues, conflicts, solving |
| Rules | Goal of Sudoku, clues, difficulty |
| Controls | Buttons and keyboard shortcuts |
| Tips | Singles, box logic, cross-hatching, when to use Check / Hint |

## Project files

| File | Purpose |
|------|---------|
| `index.html` / `home.css` | Game picker cards |
| `chess.html` / `styles.css` / `script.js` | Chess game + help |
| `sudoku.html` / `sudoku.css` / `sudoku.js` | Sudoku game + help |
| `README.md` | This documentation |

## Deploy (GitHub Pages)

1. Push to `main`
2. **Settings → Pages → Deploy from branch → `main` / root**
3. Visit `https://<user>.github.io/CHESS/`

## License

Use freely for learning and personal projects.
