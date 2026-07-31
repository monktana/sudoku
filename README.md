# Sudoku

A free, ad-free Sudoku webapp built with **Vite + TypeScript + Svelte + CSS Grid**, installable as a **PWA** (Progressive Web App).

## Features

- 🎮 Three difficulty levels: Easy, Medium, Hard
- ✏️ Note mode for pencil-marking candidates
- ⌨️ Full keyboard support (arrow keys, number keys, N for notes, Backspace to erase)
- 🔢 Conflict highlighting (invalid placements shown in red)
- 🏆 Solved state detection with timer
- 📱 Installable PWA – works offline
- 🌙 Automatic dark mode

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vite.dev/) | Fast build tool & dev server |
| [Svelte 5](https://svelte.dev/) | Reactive UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| CSS Grid | Sudoku board layout |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA / service worker |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   └── sudoku.ts      # Puzzle generation & validation logic
├── App.svelte         # Main UI (board, controls, game state)
├── app.css            # Global styles entry point
└── main.ts            # Svelte mount entry point
public/
├── favicon.svg
└── icons/             # PWA icons
index.html
vite.config.ts         # Vite + Svelte + PWA configuration
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9` | Enter a digit |
| `Backspace` / `Delete` | Erase selected cell |
| `Arrow keys` | Move cell selection |
| `N` | Toggle note mode |
