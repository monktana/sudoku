<script lang="ts">
  import { DIFFICULTIES, labelForDifficulty, type SudokuGame } from '../lib/game.svelte'

  let { sudoku }: { sudoku: SudokuGame } = $props()
</script>

<aside class="panel">
  <h2>Controls</h2>

  <div class="difficulty-control">
    <label for="difficulty">Difficulty</label>
    <div class="difficulty-row">
      <select id="difficulty" bind:value={sudoku.difficulty}>
        {#each DIFFICULTIES as difficulty}
          <option value={difficulty}>{labelForDifficulty(difficulty)}</option>
        {/each}
      </select>
      <button class="new-game-btn" onclick={() => sudoku.startNewGame()}>New Game</button>
    </div>
    <p class="difficulty-hint">{sudoku.game.clues} clues given (target {sudoku.clueTarget})</p>
  </div>

  <div class="number-grid">
    {#each Array(9) as _, i}
      <button class="num-btn" onclick={() => sudoku.setSelectedCellValue(i + 1)} disabled={!sudoku.canEditSelectedCell}>
        {i + 1}
      </button>
    {/each}
  </div>

  <button
    class="notes-toggle"
    class:active={sudoku.isNotesMode}
    onclick={() => sudoku.toggleNotesMode()}
    aria-pressed={sudoku.isNotesMode}
  >
    <svg
      class="pencil-icon"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4.5l5 5L8 21H3v-5Z" />
      <path d="M12.5 6.5l5 5" />
    </svg>
    {sudoku.isNotesMode ? 'Notes on' : 'Notes off'}
  </button>

  <div class="actions">
    <button onclick={() => sudoku.clearSelectedCell()} disabled={!sudoku.canEditSelectedCell}>Clear</button>
    <button onclick={() => sudoku.checkSolution()} disabled={!sudoku.isBoardComplete}>Check</button>
    <button disabled title="Coming soon">Hint</button>
  </div>

  {#if sudoku.checkResult !== 'idle'}
    <p class="check-result" class:correct={sudoku.checkResult === 'correct'} class:incorrect={sudoku.checkResult === 'incorrect'}>
      {sudoku.checkResult === 'correct' ? 'Correct solution. Well done.' : 'Not quite. Check your entries.'}
    </p>
  {/if}
</aside>
