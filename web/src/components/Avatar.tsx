import type { CSSProperties } from 'react'
import { initials } from '../format'

// The same name always gets the same colour, so people are easy to tell apart.
function hueFor(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" style={{ '--avatar-hue': hueFor(name) } as CSSProperties} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
