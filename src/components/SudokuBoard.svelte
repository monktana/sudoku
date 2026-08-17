<script lang="ts">
  import type { SudokuGame } from '../lib/game.svelte'

  let { sudoku }: { sudoku: SudokuGame } = $props()
</script>

<section class="board" aria-label="Generated Sudoku board">
  {#each sudoku.board as value, i}
    <button
      class="cell"
      class:prefilled={sudoku.game.puzzle[i] !== 0}
      class:selected={sudoku.selectedCellIndex === i}
      class:matching-value={sudoku.selectedFilledValue !== null &&
        sudoku.board[i] === sudoku.selectedFilledValue &&
        sudoku.board[i] !== 0}
      aria-label={`Cell ${i + 1}`}
      onclick={() => sudoku.selectCell(i)}
    >
      {#if value === 0}
        {#if sudoku.notesByCell[i].length > 0}
          <span class="cell-notes" aria-hidden="true">
            {#each Array(9) as _, noteIndex}
              <span class="note-value">{sudoku.notesByCell[i].includes(noteIndex + 1) ? noteIndex + 1 : ''}</span>
            {/each}
          </span>
        {/if}
      {:else}
        {value}
      {/if}
    </button>
  {/each}
</section>
