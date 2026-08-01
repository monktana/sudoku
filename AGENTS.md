# AGENTS.md

This file gives coding agents the minimum project context needed to work effectively in this repository.

## Project Snapshot

- Stack: Vite 5, Svelte 4, TypeScript, vite-plugin-pwa
- App type: single-page Sudoku web app with local puzzle generation
- Main logic split:
  - UI and interaction flow: src/App.svelte
  - Sudoku generation and puzzle constraints: src/lib/sudoku.ts

For user-facing setup and run instructions, see [README.md](README.md).

## Commands Agents Should Use

- Install deps: `npm ci` (preferred) or `npm install`
- Dev server: `npm run dev`
- Type check: `npm run check`
- Production build: `npm run build`
- Preview build: `npm run preview`

Validation order before proposing merge-ready changes:
1. `npm run check`
2. `npm run build`

CI mirrors this in [.github/workflows/ci.yml](.github/workflows/ci.yml) on Node 20.

## Architecture and Data Conventions

- Board model is a flat array of length 81 (`number[]`).
- `0` means empty cell; `1..9` are filled values.
- Difficulty keys are English string literals only: `easy`, `medium`, `hard`, `expert`, `master`.
- Generator API contract is `generateSudoku(difficulty)` returning puzzle + solution + clue count.
- Puzzle uniqueness is enforced by counting solutions up to 2 in `countSolutions`.

When changing Sudoku logic, keep these invariants intact.

## UI and Interaction Conventions

- Prefilled cells are non-editable and should not become active-edit targets.
- Keyboard entry accepts only digits `1..9` and should be ignored in typing contexts.
- Board updates are done via immutable array copies before reassignment.
- Keep desktop and mobile behavior intact (layout switches at narrow widths).

## PWA and Runtime Notes

- Service worker registration is in src/main.ts via `registerSW({ immediate: true })`.
- PWA manifest and plugin config live in vite.config.ts.
- If changing app identity, icons, or install metadata, update manifest values together.

## Agent Guardrails

- Prefer minimal, focused edits; avoid broad refactors unless explicitly requested.
- Keep naming and style consistent with existing TypeScript + Svelte code.
- If behavior changes, include a short manual verification checklist in your final response.
- Do not introduce new dependencies unless necessary for the requested task.

## Session-Derived Pitfall to Avoid

- A prior workflow issue involved CI/PR validation gaps. Always run `npm run check` and `npm run build` locally before suggesting that a change is complete.