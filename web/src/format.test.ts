import { describe, expect, it } from 'vitest'
import { formatDate, initials, timeAgo } from './format'

describe('initials', () => {
  it('takes the first letters of the first and last word', () => {
    expect(initials('Anna Petrenko')).toBe('AP')
    expect(initials('anna maria petrenko')).toBe('AP')
  })

  it('works for a single word', () => {
    expect(initials('olena')).toBe('O')
  })

  it('does not break on empty or spaced input', () => {
    expect(initials('')).toBe('?')
    expect(initials('   ')).toBe('?')
  })
})

describe('timeAgo', () => {
  const now = new Date('2026-10-16T12:00:00Z').getTime()
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString()

  it('says "just now" for the last few seconds', () => {
    expect(timeAgo(ago(10), now)).toBe('just now')
  })

  it('counts minutes, hours and days', () => {
    expect(timeAgo(ago(5 * 60), now)).toBe('5 minutes ago')
    expect(timeAgo(ago(2 * 3600), now)).toBe('2 hours ago')
    expect(timeAgo(ago(86400), now)).toBe('yesterday')
    expect(timeAgo(ago(3 * 86400), now)).toBe('3 days ago')
  })

  it('shows the real date after a week', () => {
    expect(timeAgo(ago(10 * 86400), now)).toBe(formatDate(ago(10 * 86400)))
  })
})
