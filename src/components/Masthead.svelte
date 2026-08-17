<script lang="ts">
  import type { ThemeState } from '../lib/theme.svelte'

  let { theme }: { theme: ThemeState } = $props()
</script>

<header class="masthead">
  <div class="masthead-main">
    <h1 class="masthead-title">Sudoku</h1>
    <p class="masthead-subtitle">Fill every row, column and box with 1–9</p>
  </div>
  <button
    class="theme-toggle"
    onclick={() => theme.cycle()}
    aria-label={`${theme.label}. Click to change.`}
    title={theme.label}
  >
    {#if theme.mode === 'auto'}
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
      </svg>
    {:else if theme.mode === 'dark'}
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
