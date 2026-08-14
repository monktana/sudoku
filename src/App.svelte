<script lang="ts">
  import { generateSudoku, getDifficultyTargetClues, type Difficulty, type SudokuPuzzle } from './lib/sudoku'

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master']
  type CheckResult = 'idle' | 'correct' | 'incorrect'

  const initialGame = generateSudoku('medium')
  let selectedDifficulty: Difficulty = $state('medium')
  let game: SudokuPuzzle = $state(initialGame)
  let currentBoard: number[] = $state([...initialGame.puzzle])
  let selectedCellIndex: number | null = $state(null)
  let checkResult: CheckResult = $state('idle')
  let notesByCell: number[][] = $state(Array.from({ length: 81 }, () => []))
  let isNotesMode: boolean = $state(false)

  let clueTarget = $derived(getDifficultyTargetClues(selectedDifficulty))
  let canEditSelectedCell = $derived(selectedCellIndex !== null && game.puzzle[selectedCellIndex] === 0)
  let isBoardComplete = $derived(currentBoard.every((value) => value !== 0))
  let selectedFilledValue = $derived(
    selectedCellIndex !== null && currentBoard[selectedCellIndex] !== 0 ? currentBoard[selectedCellIndex] : null
  )

  function startNewGame(): void {
    game = generateSudoku(selectedDifficulty)
    currentBoard = [...game.puzzle]
    notesByCell = Array.from({ length: 81 }, () => [])
    isNotesMode = false
    selectedCellIndex = null
    checkResult = 'idle'
  }

  function selectCell(index: number): void {
    selectedCellIndex = index
  }

  function setSelectedCellValue(value: number): void {
    if (!canEditSelectedCell || selectedCellIndex === null) {
      return
    }

    if (isNotesMode) {
      toggleSelectedCellNote(value)
      return
    }

    const nextBoard = [...currentBoard]
    nextBoard[selectedCellIndex] = nextBoard[selectedCellIndex] === value ? 0 : value
    currentBoard = nextBoard

    const nextNotes = [...notesByCell]
    nextNotes[selectedCellIndex] = []
    notesByCell = nextNotes
    checkResult = 'idle'
  }

  function toggleSelectedCellNote(value: number): void {
    if (!canEditSelectedCell || selectedCellIndex === null || currentBoard[selectedCellIndex] !== 0) {
      return
    }

    const nextNotes = [...notesByCell]
    const currentNotes = nextNotes[selectedCellIndex]
    const hasNote = currentNotes.includes(value)
    nextNotes[selectedCellIndex] = hasNote
      ? currentNotes.filter((note: number) => note !== value)
      : [...currentNotes, value].sort((a, b) => a - b)
    notesByCell = nextNotes
    checkResult = 'idle'
  }

  function clearSelectedCell(): void {
    if (!canEditSelectedCell || selectedCellIndex === null) {
      return
    }

    const nextBoard = [...currentBoard]
    nextBoard[selectedCellIndex] = 0
    currentBoard = nextBoard

    const nextNotes = [...notesByCell]
    nextNotes[selectedCellIndex] = []
    notesByCell = nextNotes
    checkResult = 'idle'
  }

  function toggleNotesMode(): void {
    isNotesMode = !isNotesMode
  }

  function checkSolution(): void {
    if (!isBoardComplete) {
      return
    }

    const isCorrect = currentBoard.every((value, index) => value === game.solution[index])
    checkResult = isCorrect ? 'correct' : 'incorrect'
  }

  function handleKeydown(event: KeyboardEvent): void {
    const activeTag = (document.activeElement?.tagName ?? '').toLowerCase()
    const isTypingContext =
      activeTag === 'input' ||
      activeTag === 'textarea' ||
      activeTag === 'select' ||
      document.activeElement?.hasAttribute('contenteditable')

    if (isTypingContext) {
      return
    }

    if (!/^[1-9]$/.test(event.key)) {
      return
    }

    setSelectedCellValue(Number(event.key))
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

<svelte:window onkeydown={handleKeydown} />

<main class="layout">
  <header class="header">
    <h1>Sudoku</h1>
    <p>Vite + Svelte + TypeScript + CSS Grid + PWA Starter</p>
  </header>

  <section class="board" aria-label="Generated Sudoku board">
    {#each currentBoard as value, i}
      <button
        class="cell"
        class:prefilled={game.puzzle[i] !== 0}
        class:selected={selectedCellIndex === i}
        class:matching-value={selectedFilledValue !== null && currentBoard[i] === selectedFilledValue && currentBoard[i] !== 0}
        aria-label={`Cell ${i + 1}`}
        onclick={() => selectCell(i)}
      >
        {#if value === 0}
          {#if notesByCell[i].length > 0}
            <span class="cell-notes" aria-hidden="true">
              {#each Array(9) as _, noteIndex}
                <span class="note-value">{notesByCell[i].includes(noteIndex + 1) ? noteIndex + 1 : ''}</span>
              {/each}
            </span>
          {/if}
        {:else}
          {value}
        {/if}
      </button>
    {/each}
  </section>

  <aside class="panel">
    <h2>Controls</h2>

    <div class="difficulty-control">
      <label for="difficulty">Difficulty</label>
      <div class="difficulty-row">
        <select id="difficulty" bind:value={selectedDifficulty}>
          {#each difficulties as difficulty}
            <option value={difficulty}>{labelForDifficulty(difficulty)}</option>
          {/each}
        </select>
        <button class="new-game-btn" onclick={startNewGame}>New Game</button>
      </div>
      <p class="difficulty-hint">Target clues: {clueTarget} | Actual clues: {game.clues}</p>
    </div>

    <div class="number-grid">
      {#each Array(9) as _, i}
        <button class="num-btn" onclick={() => setSelectedCellValue(i + 1)} disabled={!canEditSelectedCell}>
          {i + 1}
        </button>
      {/each}
    </div>

    <button class:active={isNotesMode} onclick={toggleNotesMode} aria-pressed={isNotesMode}>
      {isNotesMode ? 'Notes Mode: On' : 'Notes Mode: Off'}
    </button>

    <div class="actions">
      <button onclick={clearSelectedCell} disabled={!canEditSelectedCell}>Clear Cell</button>
      <button onclick={checkSolution} disabled={!isBoardComplete}>Check</button>
      <button disabled>Hint</button>
    </div>

    {#if checkResult !== 'idle'}
      <p class="check-result" class:correct={checkResult === 'correct'} class:incorrect={checkResult === 'incorrect'}>
        {checkResult === 'correct' ? 'Correct solution! Well done.' : 'Not correct yet. Please check your entries.'}
      </p>
    {/if}
  </aside>
</main>
