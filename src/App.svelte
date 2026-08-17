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
  let isDarkMode: boolean = $state(false)
  let themeMode: 'auto' | 'dark' | 'light' = $state('auto')

  let clueTarget = $derived(getDifficultyTargetClues(selectedDifficulty))
  let canEditSelectedCell = $derived(selectedCellIndex !== null && game.puzzle[selectedCellIndex] === 0)
  let isBoardComplete = $derived(currentBoard.every((value) => value !== 0))
  let selectedFilledValue = $derived(
    selectedCellIndex !== null && currentBoard[selectedCellIndex] !== 0 ? currentBoard[selectedCellIndex] : null
  )

  // Initialize theme from localStorage or system preference
  $effect(() => {
    const savedTheme = localStorage.getItem('sudoku-theme') as 'auto' | 'dark' | 'light' | null
    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'auto') {
      themeMode = savedTheme
    } else {
      themeMode = 'auto'
    }
  })

  // Watch for themeMode changes and update the theme
  $effect(() => {
    localStorage.setItem('sudoku-theme', themeMode)
    updateTheme()
  })

  // Listen for system preference changes
  $effect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      // Only update if in auto mode
      if (themeMode === 'auto') {
        updateTheme()
      }
    }
    
    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Legacy API fallback
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  })

  function updateTheme(): void {
    let shouldBeDark: boolean
    
    if (themeMode === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else if (themeMode === 'dark') {
      shouldBeDark = true
    } else {
      shouldBeDark = false
    }
    
    isDarkMode = shouldBeDark
    applyTheme(shouldBeDark)
  }

  function applyTheme(dark: boolean): void {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function toggleDarkMode(): void {
    const modes: ('auto' | 'dark' | 'light')[] = ['auto', 'dark', 'light']
    const currentIndex = modes.indexOf(themeMode)
    themeMode = modes[(currentIndex + 1) % modes.length]
  }

  function themeLabel(mode: 'auto' | 'dark' | 'light'): string {
    switch (mode) {
      case 'auto':
        return 'Auto theme (follows system)'
      case 'dark':
        return 'Dark theme'
      case 'light':
        return 'Light theme'
    }
  }

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

    if (event.key === 'Backspace' || event.key === 'Delete') {
      clearSelectedCell()
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
  <header class="masthead">
    <div class="masthead-main">
      <h1 class="masthead-title">Sudoku</h1>
      <p class="masthead-subtitle">Fill every row, column and box with 1–9</p>
    </div>
    <button
      class="theme-toggle"
      onclick={toggleDarkMode}
      aria-label={`${themeLabel(themeMode)}. Click to change.`}
      title={themeLabel(themeMode)}
    >
      {#if themeMode === 'auto'}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
        </svg>
      {:else if themeMode === 'dark'}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        </svg>
      {:else}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.5" />
          <path
            d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8l1.8-1.8M18 6l1.8-1.8"
          />
        </svg>
      {/if}
    </button>
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
      <p class="difficulty-hint">{game.clues} clues given (target {clueTarget})</p>
    </div>

    <div class="number-grid">
      {#each Array(9) as _, i}
        <button class="num-btn" onclick={() => setSelectedCellValue(i + 1)} disabled={!canEditSelectedCell}>
          {i + 1}
        </button>
      {/each}
    </div>

    <button class="notes-toggle" class:active={isNotesMode} onclick={toggleNotesMode} aria-pressed={isNotesMode}>
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
      {isNotesMode ? 'Notes on' : 'Notes off'}
    </button>

    <div class="actions">
      <button onclick={clearSelectedCell} disabled={!canEditSelectedCell}>Clear</button>
      <button onclick={checkSolution} disabled={!isBoardComplete}>Check</button>
      <button disabled title="Coming soon">Hint</button>
    </div>

    {#if checkResult !== 'idle'}
      <p class="check-result" class:correct={checkResult === 'correct'} class:incorrect={checkResult === 'incorrect'}>
        {checkResult === 'correct' ? 'Correct solution. Well done.' : 'Not quite. Check your entries.'}
      </p>
    {/if}
  </aside>
</main>
