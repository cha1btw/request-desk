import { describe, expect, it } from 'vitest'
import { initials } from './format'

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
