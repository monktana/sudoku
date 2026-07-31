<script lang="ts">
  import { generateSudoku, getDifficultyTargetClues, type Difficulty, type SudokuPuzzle } from './lib/sudoku'

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']

  let selectedDifficulty: Difficulty = 'medium'
  let game: SudokuPuzzle = generateSudoku(selectedDifficulty)

  $: clueTarget = getDifficultyTargetClues(selectedDifficulty)

  function startNewGame(): void {
    game = generateSudoku(selectedDifficulty)
  }

  function labelForDifficulty(difficulty: Difficulty): string {
    switch (difficulty) {
      case 'easy':
        return 'Easy'
      case 'medium':
        return 'Medium'
      case 'hard':
        return 'Hard'
      case 'expert':
        return 'Expert'
      case 'master':
        return 'Master'
      default:
        return difficulty
    }
  }
</script>

<main class="layout">
  <header class="header">
    <h1>Sudoku</h1>
    <p>Vite + Svelte + TypeScript + CSS Grid + PWA Starter</p>
  </header>

  <section class="board" aria-label="Generated Sudoku board">
    {#each game.puzzle as value, i}
      <button class="cell" class:prefilled={value !== 0} aria-label={`Cell ${i + 1}`}>
        {value === 0 ? '' : value}
      </button>
    {/each}
  </section>

  <aside class="panel">
    <h2>Controls</h2>

    <div class="difficulty-control">
      <label for="difficulty">Difficulty</label>
      <select id="difficulty" bind:value={selectedDifficulty}>
        {#each difficulties as difficulty}
          <option value={difficulty}>{labelForDifficulty(difficulty)}</option>
        {/each}
      </select>
      <p class="difficulty-hint">Target clues: {clueTarget} | Actual clues: {game.clues}</p>
    </div>

    <div class="number-grid">
      {#each Array(9) as _, i}
        <button class="num-btn" disabled>{i + 1}</button>
      {/each}
    </div>

    <div class="actions">
      <button on:click={startNewGame}>New Game</button>
      <button disabled>Check</button>
      <button disabled>Hint</button>
    </div>
  </aside>
</main>
