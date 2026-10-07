import { fireEvent, render, screen } from '@testing-library/react'
import { flushSync } from 'react-dom'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const dimmedCount = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path')).filter((path) =>
    (path.getAttribute('style') ?? '').includes('--rwme-dimmed-opacity'),
  ).length

const isHighlighted = (container: HTMLElement, name: string) =>
  (country(container, name).getAttribute('style') ?? '').includes('var(--rwme-selected-stroke')

const backdrop = (container: HTMLElement) => container.querySelector('svg') as SVGElement

describe('clearing the selection by clicking away', () => {
  it('goes back to the original map when a click lands on the map where there is no country', () => {
    const { container } = render(<ExtendedWorldMap />)
    fireEvent.click(country(container, 'France'))
    expect(dimmedCount(container)).toBeGreaterThan(0)

    fireEvent.click(backdrop(container))
    expect(dimmedCount(container)).toBe(0)
    expect(isHighlighted(container, 'France')).toBe(false)
  })

  it('also clears on the empty space around the map inside the component, and anywhere outside it', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'France'))
    fireEvent.click(container.firstElementChild as Element) // the component's own empty space
    expect(dimmedCount(container)).toBe(0)

    fireEvent.click(country(container, 'France'))
    expect(dimmedCount(container)).toBeGreaterThan(0)
    fireEvent.click(document.body) // the host page
    expect(dimmedCount(container)).toBe(0)
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
  })

  it('does not clear when a country, the controls or the details card is clicked', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'France'))

    fireEvent.click(screen.getByLabelText('Capital')) // controls
    fireEvent.click(screen.getByRole('status')) // the card
    fireEvent.click(country(container, 'France')) // the same country again
    expect(isHighlighted(container, 'France')).toBe(true)

    fireEvent.click(country(container, 'Germany')) // another country moves the selection
    expect(isHighlighted(container, 'Germany')).toBe(true)
    expect(isHighlighted(container, 'France')).toBe(false)
  })

  it('keeps the selection when Hide or Show are used (their buttons vanish with the click)', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'France'))
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(isHighlighted(container, 'France')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Show details: France' }))
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('is not fooled by a target that the same click already removed (real browsers flush before bubbling)', async () => {
    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'France'))

    // In a browser, the microtask checkpoint between listeners lets React update the DOM before the
    // click reaches `document`; a scripted dispatch has no such checkpoint, so do the flush by hand
    const flushLikeABrowser = () => flushSync(() => {})
    container.addEventListener('click', flushLikeABrowser)
    env.IS_REACT_ACT_ENVIRONMENT = false
    try {
      const hide = screen.getByRole('button', { name: 'Hide details' })
      hide.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(hide.isConnected).toBe(false) // the card is gone by the time the click reaches document
      await new Promise((resolve) => setTimeout(resolve, 0)) // let any (wrong) state update land
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = true
      container.removeEventListener('click', flushLikeABrowser)
    }
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('reports the clear to the parent, which decides, when the selection is controlled', () => {
    const onSelectionChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap selectedCountry="FR" onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(backdrop(container))
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(null)
    expect(isHighlighted(container, 'France')).toBe(true) // the parent has not accepted it

    rerender(<ExtendedWorldMap selectedCountry={null} onSelectionChange={onSelectionChange} />)
    expect(dimmedCount(container)).toBe(0)
  })

  it('does nothing, and reports nothing, when no country is selected', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(<ExtendedWorldMap onSelectionChange={onSelectionChange} />)
    fireEvent.click(backdrop(container))
    fireEvent.click(document.body)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it("'background' ignores clicks outside the component", () => {
    const { container } = render(<ExtendedWorldMap deselectOn="background" />)
    fireEvent.click(country(container, 'France'))
    fireEvent.click(document.body)
    expect(isHighlighted(container, 'France')).toBe(true)
    fireEvent.click(backdrop(container))
    expect(isHighlighted(container, 'France')).toBe(false)
  })

  it("'never' leaves the selection alone", () => {
    const { container } = render(<ExtendedWorldMap deselectOn="never" />)
    fireEvent.click(country(container, 'France'))
    fireEvent.click(backdrop(container))
    fireEvent.click(document.body)
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('does not clear while the overlay card is open', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(document.body)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('stops listening when the component unmounts', () => {
    const onSelectionChange = vi.fn()
    const { container, unmount } = render(
      <ExtendedWorldMap selectedCountry="FR" onSelectionChange={onSelectionChange} />,
    )
    unmount()
    fireEvent.click(document.body)
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(container).toBeEmptyDOMElement()
  })
})
