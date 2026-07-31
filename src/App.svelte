<main class="layout">
  <header class="header">
    <h1>Sudoku</h1>
    <p>Vite + Svelte + TypeScript + CSS Grid + PWA Starter</p>
  </header>

  <section class="board" aria-label="Sudoku board placeholder">
    {#each Array(81) as _, i}
      <button class="cell" aria-label={`Cell ${i + 1}`}></button>
    {/each}
  </section>

  <aside class="panel">
    <h2>Controls</h2>

    <div class="number-grid">
      {#each Array(9) as _, i}
        <button class="num-btn">{i + 1}</button>
      {/each}
    </div>

    <div class="actions">
      <button>New Game</button>
      <button>Check</button>
      <button>Hint</button>
    </div>
  </aside>
</main>
