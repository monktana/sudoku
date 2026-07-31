<script lang="ts">
  import { generatePuzzle, isValid, isSolved, type Board, type CellValue, type Difficulty } from './lib/sudoku';

  type GameState = 'idle' | 'playing' | 'won';

  let difficulty = $state<Difficulty>('medium');
  let gameState = $state<GameState>('idle');
  let puzzle = $state<Board>(Array.from({ length: 9 }, () => Array(9).fill(null)));
  let solution = $state<Board>(Array.from({ length: 9 }, () => Array(9).fill(null)));
  let given = $state<boolean[][]>(Array.from({ length: 9 }, () => Array(9).fill(false)));
  let selected = $state<[number, number] | null>(null);
  let errors = $state<boolean[][]>(Array.from({ length: 9 }, () => Array(9).fill(false)));
  let notes = $state<Set<number>[][]>(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())));
  let noteMode = $state(false);
  let elapsedSeconds = $state(0);

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  function startGame() {
    const result = generatePuzzle(difficulty);
    puzzle = result.puzzle.map(row => [...row]);
    solution = result.solution.map(row => [...row]);
    given = puzzle.map(row => row.map(cell => cell !== null));
    errors = Array.from({ length: 9 }, () => Array(9).fill(false));
    notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    selected = null;
    gameState = 'playing';
    elapsedSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => { elapsedSeconds++; }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function selectCell(row: number, col: number) {
    if (gameState !== 'playing') return;
    selected = [row, col];
  }

  function inputNumber(num: number) {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (given[r][c]) return;

    if (noteMode) {
      const newNotes = notes.map(row => row.map(cell => new Set(cell)));
      if (newNotes[r][c].has(num)) {
        newNotes[r][c].delete(num);
      } else {
        newNotes[r][c].add(num);
      }
      notes = newNotes;
    } else {
      const newPuzzle = puzzle.map(row => [...row]);
      const newErrors = errors.map(row => [...row]);
      const newNotes = notes.map(row => row.map(cell => new Set(cell)));

      if (newPuzzle[r][c] === num as CellValue) {
        // Toggle off same number
        newPuzzle[r][c] = null;
        newErrors[r][c] = false;
      } else {
        newPuzzle[r][c] = num as CellValue;
        newErrors[r][c] = !isValid(newPuzzle, r, c, num);
        // Clear notes in same row, col, box when number placed
        newNotes[r][c].clear();
        for (let i = 0; i < 9; i++) {
          newNotes[r][i].delete(num);
          newNotes[i][c].delete(num);
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            newNotes[br + dr][bc + dc].delete(num);
          }
        }
      }

      puzzle = newPuzzle;
      errors = newErrors;
      notes = newNotes;

      if (isSolved(newPuzzle, solution)) {
        gameState = 'won';
        stopTimer();
      }
    }
  }

  function eraseCell() {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (given[r][c]) return;
    const newPuzzle = puzzle.map(row => [...row]);
    newPuzzle[r][c] = null;
    const newErrors = errors.map(row => [...row]);
    newErrors[r][c] = false;
    const newNotes = notes.map(row => row.map(cell => new Set(cell)));
    newNotes[r][c].clear();
    puzzle = newPuzzle;
    errors = newErrors;
    notes = newNotes;
  }

  function moveSelection(dr: number, dc: number) {
    if (!selected) {
      selected = [0, 0];
      return;
    }
    const [r, c] = selected;
    const nr = Math.min(8, Math.max(0, r + dr));
    const nc = Math.min(8, Math.max(0, c + dc));
    selected = [nr, nc];
  }

  function handleKeydown(event: KeyboardEvent) {
    if (gameState !== 'playing') return;
    const key = event.key;
    if (key >= '1' && key <= '9') {
      inputNumber(parseInt(key));
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
      eraseCell();
    } else if (key === 'ArrowUp') { event.preventDefault(); moveSelection(-1, 0); }
    else if (key === 'ArrowDown') { event.preventDefault(); moveSelection(1, 0); }
    else if (key === 'ArrowLeft') { event.preventDefault(); moveSelection(0, -1); }
    else if (key === 'ArrowRight') { event.preventDefault(); moveSelection(0, 1); }
    else if (key === 'n' || key === 'N') { noteMode = !noteMode; }
  }

  function isHighlighted(r: number, c: number): boolean {
    if (!selected) return false;
    const [sr, sc] = selected;
    if (r === sr && c === sc) return false;
    if (r === sr || c === sc) return true;
    if (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)) return true;
    return false;
  }

  function isSameNumber(r: number, c: number): boolean {
    if (!selected) return false;
    const [sr, sc] = selected;
    const selVal = puzzle[sr][sc];
    return selVal !== null && puzzle[r][c] === selVal;
  }

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div id="app">
  <header>
    <h1>Sudoku</h1>
    {#if gameState === 'playing'}
      <span class="timer">{formatTime(elapsedSeconds)}</span>
    {/if}
  </header>

  {#if gameState === 'idle'}
    <main class="start-screen">
      <p>Choose a difficulty and start playing!</p>
      <div class="difficulty-picker">
        {#each (['easy', 'medium', 'hard'] as Difficulty[]) as diff}
          <button
            class="diff-btn"
            class:active={difficulty === diff}
            onclick={() => { difficulty = diff; }}
          >{diff}</button>
        {/each}
      </div>
      <button class="primary-btn" onclick={startGame}>New Game</button>
    </main>

  {:else if gameState === 'won'}
    <main class="win-screen">
      <div class="win-card">
        <h2>🎉 Puzzle solved!</h2>
        <p>Time: <strong>{formatTime(elapsedSeconds)}</strong></p>
        <button class="primary-btn" onclick={startGame}>Play again</button>
        <button class="secondary-btn" onclick={() => { gameState = 'idle'; }}>Change difficulty</button>
      </div>
    </main>

  {:else}
    <main class="game">
      <div class="board" role="grid" aria-label="Sudoku board">
        {#each puzzle as row, r}
          {#each row as cell, c}
            {@const isSelected = selected !== null && selected[0] === r && selected[1] === c}
            {@const isGiven = given[r][c]}
            {@const hasError = errors[r][c]}
            {@const highlighted = isHighlighted(r, c)}
            {@const sameNum = isSameNumber(r, c)}
            {@const cellNotes = notes[r][c]}
            <button
              class="cell"
              class:selected={isSelected}
              class:given={isGiven}
              class:error={hasError}
              class:highlighted={highlighted}
              class:same-number={sameNum}
              class:box-right={c === 2 || c === 5}
              class:box-bottom={r === 2 || r === 5}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`Row ${r + 1}, column ${c + 1}${cell ? `, value ${cell}` : ', empty'}`}
              onclick={() => selectCell(r, c)}
            >
              {#if cell !== null}
                <span class="cell-value">{cell}</span>
              {:else if cellNotes.size > 0}
                <span class="notes-grid">
                  {#each [1,2,3,4,5,6,7,8,9] as n}
                    <span class="note">{cellNotes.has(n) ? n : ''}</span>
                  {/each}
                </span>
              {/if}
            </button>
          {/each}
        {/each}
      </div>

      <div class="controls">
        <div class="number-pad">
          {#each [1,2,3,4,5,6,7,8,9] as n}
            <button class="num-btn" onclick={() => inputNumber(n)}>{n}</button>
          {/each}
        </div>
        <div class="action-row">
          <button class="action-btn" onclick={eraseCell} title="Erase (Backspace)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20 5H9L2 12l7 7h11a2 2 0 002-2V7a2 2 0 00-2-2z"/>
              <line x1="18" y1="9" x2="14" y2="13"/>
              <line x1="14" y1="9" x2="18" y2="13"/>
            </svg>
            Erase
          </button>
          <button class="action-btn" class:active={noteMode} onclick={() => { noteMode = !noteMode; }} title="Toggle notes (N)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Notes
          </button>
          <button class="action-btn" onclick={startGame} title="New game">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            New
          </button>
        </div>
      </div>
    </main>
  {/if}
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg, #f8f7ff);
    color: var(--text, #1e1b2e);
    min-height: 100svh;
    display: flex;
    justify-content: center;
  }

  :global(:root) {
    --bg: #f8f7ff;
    --surface: #ffffff;
    --border: #d0cfe8;
    --border-strong: #4f46e5;
    --text: #1e1b2e;
    --text-muted: #6e6a8a;
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --primary-text: #ffffff;
    --highlight: #eef2ff;
    --same-num: #c7d2fe;
    --cell-given: #1e1b2e;
    --cell-user: #4f46e5;
    --cell-error: #ef4444;
    --cell-selected-bg: #4f46e5;
    --cell-selected-text: #ffffff;
    --note-color: #6366f1;
    --radius: 8px;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #0f0e1a;
      --surface: #1e1b2e;
      --border: #3a3555;
      --border-strong: #818cf8;
      --text: #e5e3f5;
      --text-muted: #9d97c4;
      --primary: #6366f1;
      --primary-hover: #818cf8;
      --highlight: #2a2650;
      --same-num: #3a3670;
      --cell-given: #e5e3f5;
      --cell-user: #818cf8;
      --cell-error: #f87171;
      --cell-selected-bg: #6366f1;
      --cell-selected-text: #ffffff;
      --note-color: #a5b4fc;
    }
  }

  #app {
    width: 100%;
    max-width: 480px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: -0.5px;
  }

  .timer {
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* ── Start / Win screens ── */
  .start-screen,
  .win-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 40px 0;
  }

  .win-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,.08);
    width: 100%;
  }

  h2 {
    font-size: 1.75rem;
  }

  .difficulty-picker {
    display: flex;
    gap: 8px;
  }

  .diff-btn {
    padding: 8px 20px;
    border-radius: 999px;
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    text-transform: capitalize;
    transition: all 0.15s;
  }

  .diff-btn.active,
  .diff-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--highlight);
  }

  .primary-btn {
    padding: 12px 32px;
    border-radius: var(--radius);
    border: none;
    background: var(--primary);
    color: var(--primary-text);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
    max-width: 240px;
  }

  .primary-btn:hover {
    background: var(--primary-hover);
  }

  .secondary-btn {
    padding: 10px 24px;
    border-radius: var(--radius);
    border: 2px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    max-width: 240px;
  }

  .secondary-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  /* ── Game layout ── */
  .game {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Board (CSS Grid) ── */
  .board {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 1fr);
    aspect-ratio: 1;
    border: 2px solid var(--border-strong);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--surface);
    box-shadow: 0 4px 24px rgba(0,0,0,.06);
  }

  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: background 0.1s;
    font-size: clamp(14px, 4vw, 22px);
    color: var(--cell-user);
  }

  .cell.given {
    color: var(--cell-given);
    font-weight: 600;
  }

  .cell.error {
    color: var(--cell-error);
  }

  .cell.highlighted {
    background: var(--highlight);
  }

  .cell.same-number {
    background: var(--same-num);
  }

  .cell.selected {
    background: var(--cell-selected-bg) !important;
    color: var(--cell-selected-text) !important;
    z-index: 1;
  }

  /* Thicker box borders */
  .cell.box-right {
    border-right: 2px solid var(--border-strong);
  }
  .cell.box-bottom {
    border-bottom: 2px solid var(--border-strong);
  }

  /* Notes micro-grid */
  .notes-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    padding: 1px;
  }

  .note {
    font-size: clamp(6px, 1.4vw, 9px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--note-color);
    font-weight: 500;
  }

  /* ── Number pad ── */
  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .number-pad {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 4px;
  }

  .num-btn {
    aspect-ratio: 1;
    border-radius: var(--radius);
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--primary);
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.1s;
  }

  .num-btn:hover {
    background: var(--highlight);
    border-color: var(--primary);
  }

  .action-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 8px;
    border-radius: var(--radius);
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn svg {
    width: 20px;
    height: 20px;
  }

  .action-btn:hover,
  .action-btn.active {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--highlight);
  }
</style>
