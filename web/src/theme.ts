export type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'request-desk-theme'
const ORDER: ThemeChoice[] = ['system', 'light', 'dark']

export function readTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return ORDER.includes(saved as ThemeChoice) ? (saved as ThemeChoice) : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode)
  }
}

// "system" removes the attribute, so the CSS media query decides.
export function applyTheme(choice: ThemeChoice) {
  if (choice === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', choice)
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // not saving is fine, the choice still applies until the page is closed
  }
}

export function nextTheme(choice: ThemeChoice): ThemeChoice {
  return ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]
}
