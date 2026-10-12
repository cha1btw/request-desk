import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only cleans up automatically when test globals are on.
// We keep globals off, so remove rendered components after each test ourselves.
afterEach(cleanup)
