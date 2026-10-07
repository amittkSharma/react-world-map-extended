import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom has no ResizeObserver, which react-svg-worldmap uses
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
