import { useState } from 'react'
import { applyTheme, nextTheme, readTheme, type ThemeChoice } from '../theme'

const LABELS: Record<ThemeChoice, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }
const ICONS: Record<ThemeChoice, string> = { system: '◐', light: '☀', dark: '☾' }

// One button that cycles Auto -> Light -> Dark. The choice is saved in localStorage.
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme)

  function cycle() {
    const next = nextTheme(choice)
    applyTheme(next)
    setChoice(next)
  }

  return (
    <button
      type="button"
      className="btn btn-secondary theme-toggle"
      onClick={cycle}
      title="Change the colour theme"
      aria-label={`Theme: ${LABELS[choice]}. Click to change.`}
    >
      <span aria-hidden="true">{ICONS[choice]}</span> {LABELS[choice]}
    </button>
  )
}
