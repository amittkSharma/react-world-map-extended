import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExtendedWorldMap } from '../src'
import { country, styleOf } from './helpers'

const hasFocusRing = (container: HTMLElement, name: string) =>
  styleOf(container, name).includes('--rwme-focus-stroke')

// focus() and blur() change React state, so they run inside act()
const focus = (element: Element) => act(() => (element as HTMLElement).focus())
const blur = (element: Element) => act(() => (element as HTMLElement).blur())

const usingMouse = () => fireEvent.pointerDown(document.body)
const usingKeyboard = (init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.body, { key: 'Tab', ...init })

// The browser's own focus ring is a rectangle around the whole path (see the bug report: a big box
// around Russia, a box around Saudi Arabia after a click). The countries draw their own ring instead.
describe('keyboard focus ring on the countries', () => {
  beforeEach(usingMouse) // the modality is page-wide state: start every test from the mouse

  it('never lets the browser draw its own box around a country', () => {
    const { container } = render(<ExtendedWorldMap />)
    for (const path of container.querySelectorAll('path')) {
      expect(path.getAttribute('style')).toContain('outline: none')
    }
  })

  it('draws a ring that follows the shape when a country is reached with the keyboard', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard()
    focus(country(container, 'Russia'))
    expect(hasFocusRing(container, 'Russia')).toBe(true)
    expect(styleOf(container, 'Russia')).toContain('filter: drop-shadow(') // a glow along the outline

    blur(country(container, 'Russia'))
    expect(hasFocusRing(container, 'Russia')).toBe(false)
  })

  it('has one ring at a time: it moves with the focus', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard()
    focus(country(container, 'France'))
    focus(country(container, 'Germany'))
    expect(hasFocusRing(container, 'France')).toBe(false)
    expect(hasFocusRing(container, 'Germany')).toBe(true)
  })

  it('draws nothing for focus that came from the mouse', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingMouse()
    focus(country(container, 'Saudi Arabia'))
    expect(hasFocusRing(container, 'Saudi Arabia')).toBe(false)
  })

  it('follows what the user did last: keyboard, then mouse, then keyboard', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard()
    focus(country(container, 'France'))
    expect(hasFocusRing(container, 'France')).toBe(true)

    usingMouse()
    focus(country(container, 'Germany'))
    expect(hasFocusRing(container, 'Germany')).toBe(false)

    usingKeyboard()
    focus(country(container, 'Italy'))
    expect(hasFocusRing(container, 'Italy')).toBe(true)
  })

  it('ignores shortcut combinations such as Cmd+Tab when deciding that the keyboard is in use', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard({ metaKey: true })
    focus(country(container, 'France'))
    expect(hasFocusRing(container, 'France')).toBe(false)
  })

  it('does not draw a box after a mouse click, although the country is redrawn on top and refocused', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    const path = country(container, 'Saudi Arabia')
    usingMouse()
    focus(path) // a click focuses a focusable country
    fireEvent.click(path) // the selected country is moved to the end of the map, which refocuses it

    expect(document.activeElement).toBe(path) // focus is kept
    expect(hasFocusRing(container, 'Saudi Arabia')).toBe(false)
    expect(styleOf(container, 'Saudi Arabia')).toContain('outline: none')
    expect(styleOf(container, 'Saudi Arabia')).toContain('--rwme-selected-stroke') // still selected, in red
  })

  it('keeps the selection visible when the focused country is the selected one', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard()
    const path = country(container, 'France')
    focus(path)
    fireEvent.keyDown(path, { key: 'Enter' })

    expect(styleOf(container, 'France')).toContain('var(--rwme-selected-stroke') // red outline stays
    expect(styleOf(container, 'France')).toContain('stroke-dasharray: 6 3') // and shows the focus
    expect(styleOf(container, 'France')).toContain('stroke: var(--rwme-selected-stroke') // not replaced by the focus colour
    expect(document.activeElement).toBe(path)
  })

  it('draws nothing for focus on the controls', () => {
    const { container } = render(<ExtendedWorldMap />)
    usingKeyboard()
    focus(screen.getByLabelText('Capital'))
    expect(container.querySelectorAll('[style*="--rwme-focus-stroke"]')).toHaveLength(0)
  })

  it('renders on the server without touching the document', async () => {
    const { renderToString } = await import('react-dom/server')
    expect(() => renderToString(<ExtendedWorldMap />)).not.toThrow()
  })
})
