import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const isHighlighted = (container: HTMLElement, name: string) =>
  (country(container, name).getAttribute('style') ?? '').includes('var(--rwme-selected-stroke')

const dimmedCount = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path')).filter((path) =>
    (path.getAttribute('style') ?? '').includes('--rwme-dimmed-opacity'),
  ).length

describe('Escape clears the selection', () => {
  it('with focus on a country of the map', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountry="FR" />)
    const path = country(container, 'France')
    path.focus()
    fireEvent.keyDown(path, { key: 'Escape' })

    expect(isHighlighted(container, 'France')).toBe(false)
    expect(dimmedCount(container)).toBe(0)
  })

  it('works for a selection made with the keyboard (Enter) and for any focused country', () => {
    const { container } = render(<ExtendedWorldMap />)
    const france = country(container, 'France')
    france.focus()
    fireEvent.keyDown(france, { key: 'Enter' })
    expect(isHighlighted(container, 'France')).toBe(true)

    const germany = country(container, 'Germany') // focus elsewhere on the map
    germany.focus()
    fireEvent.keyDown(germany, { key: 'Escape' })
    expect(isHighlighted(container, 'France')).toBe(false)
  })

  it('with focus in the details card, and then returns focus to the cleared country', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountry="FR" />)
    const link = screen.getByRole('link')
    link.focus()
    fireEvent.keyDown(link, { key: 'Escape' })

    expect(dimmedCount(container)).toBe(0)
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
    expect(document.activeElement).toBe(country(container, 'France'))
  })

  it('reports it to the parent when the selection is controlled, which decides', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap selectedCountry="FR" onSelectionChange={onSelectionChange} />,
    )
    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(null)
    expect(isHighlighted(container, 'France')).toBe(true) // the parent has not accepted it
  })

  it('does nothing when no country is selected, so the key stays free for the host page', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(<ExtendedWorldMap onSelectionChange={onSelectionChange} />)
    const path = country(container, 'France')
    const notPrevented = fireEvent.keyDown(path, { key: 'Escape' })
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(notPrevented).toBe(true)
  })

  it('ignores other keys', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountry="FR" />)
    const path = country(container, 'France')
    fireEvent.keyDown(path, { key: 'Enter' })
    fireEvent.keyDown(path, { key: 'a' })
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('leaves the controls alone: Escape on a radio button keeps the selection', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountry="FR" />)
    fireEvent.keyDown(screen.getByLabelText('Capital'), { key: 'Escape' })
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it("is off with deselectOn='never'", () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountry="FR" deselectOn="never" />)
    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('still clears with deselectOn=background (it is about the map and card, not the page)', () => {
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountry="FR" deselectOn="background" />,
    )
    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(isHighlighted(container, 'France')).toBe(false)
  })

  it('in the overlay only closes the card; the selection stays', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} />,
    )
    fireEvent.click(country(container, 'France'))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(isHighlighted(container, 'France')).toBe(true)
  })

  it('does not clear when another handler already took the key', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountry="FR" />)
    const path = country(container, 'France')
    path.addEventListener('keydown', (event) => event.preventDefault())
    fireEvent.keyDown(path, { key: 'Escape' })
    expect(isHighlighted(container, 'France')).toBe(true)
  })
})
