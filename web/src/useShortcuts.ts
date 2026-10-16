import { useEffect } from 'react'
import { useNavigate } from 'react-router'

// True when the key press happens while the user is typing somewhere.
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Global keys: "/" jumps to the client search, "n" opens the new request form.
// They are ignored while typing and when Ctrl/Cmd/Alt is held, so browser shortcuts still work.
export function useShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return

      if (event.key === '/') {
        const search = document.getElementById('client-search')
        if (!search) return
        event.preventDefault() // otherwise "/" would be typed into the field
        search.focus()
      } else if (event.key === 'n') {
        navigate('/requests/new')
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate])
}
