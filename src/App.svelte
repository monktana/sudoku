<script lang="ts">
  import { ThemeState } from './lib/theme.svelte'
  import { SudokuGame } from './lib/game.svelte'
  import { PersistenceConsent, loadSavedGame, saveGame } from './lib/persistence.svelte'
  import Masthead from './components/Masthead.svelte'
  import SudokuBoard from './components/SudokuBoard.svelte'
  import ControlPanel from './components/ControlPanel.svelte'
  import SaveConsentBanner from './components/SaveConsentBanner.svelte'

  const theme = new ThemeState()
  const consent = new PersistenceConsent()
  const sudoku = new SudokuGame('medium', consent.isAccepted ? loadSavedGame() : null)

  $effect(() => {
    if (!consent.isAccepted) {
      return
    }

    saveGame({
      difficulty: sudoku.difficulty,
      game: sudoku.game,
      board: sudoku.board,
      notesByCell: sudoku.notesByCell,
      isNotesMode: sudoku.isNotesMode,
      hintsUsed: sudoku.hintsUsed,
      lastHintAt: sudoku.lastHintAt
    })
  })

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
      sudoku.clearSelectedCell()
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      sudoku.moveSelection(event.key)
      return
    }

    if (!/^[1-9]$/.test(event.key)) {
      return
    }

    sudoku.setSelectedCellValue(Number(event.key))
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !consent.isDecided}
  <SaveConsentBanner onAccept={() => consent.accept()} onDecline={() => consent.decline()} />
{/if}

<main class="layout">
  <Masthead {theme} />
  <SudokuBoard {sudoku} />
  <ControlPanel {sudoku} {consent} />
</main>
