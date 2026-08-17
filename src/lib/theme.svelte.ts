export type ThemeMode = 'auto' | 'dark' | 'light'

const STORAGE_KEY = 'sudoku-theme'

function themeLabel(mode: ThemeMode): string {
  switch (mode) {
    case 'auto':
      return 'Auto theme (follows system)'
    case 'dark':
      return 'Dark theme'
    case 'light':
      return 'Light theme'
  }
}

function applyTheme(dark: boolean): void {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Tracks the persisted theme preference and keeps the document + system listener in sync.
export class ThemeState {
  mode: ThemeMode = $state('auto')
  isDark: boolean = $state(false)

  constructor() {
    // Load the persisted preference once on init.
    $effect(() => {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      this.mode = saved === 'dark' || saved === 'light' || saved === 'auto' ? saved : 'auto'
    })

    // Persist + apply whenever the mode changes.
    $effect(() => {
      localStorage.setItem(STORAGE_KEY, this.mode)
      this.sync()
    })

    // Track system preference changes while in auto mode.
    $effect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = () => {
        if (this.mode === 'auto') {
          this.sync()
        }
      }

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    })
  }

  get label(): string {
    return themeLabel(this.mode)
  }

  cycle(): void {
    const modes: ThemeMode[] = ['auto', 'dark', 'light']
    this.mode = modes[(modes.indexOf(this.mode) + 1) % modes.length]
  }

  private sync(): void {
    this.isDark = this.mode === 'auto' ? window.matchMedia('(prefers-color-scheme: dark)').matches : this.mode === 'dark'
    applyTheme(this.isDark)
  }
}
