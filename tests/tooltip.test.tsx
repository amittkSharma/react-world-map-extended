import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const titles = (container: HTMLElement) => container.querySelectorAll('path > title')

const svgText = (container: HTMLElement) => container.querySelector('svg')?.textContent ?? ''

// the library's styled tooltip lives inside the <svg>; the native one comes from <title> children
describe('one tooltip per country', () => {
  it('removes the browser-native <title> tooltip from every country the map draws', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(container.querySelectorAll('path')).toHaveLength(175)
    expect(titles(container)).toHaveLength(0)
  })

  it('keeps the accessible name of every country (aria-label)', () => {
    const { container } = render(<ExtendedWorldMap />)
    const unnamed = Array.from(container.querySelectorAll('path')).filter(
      (path) => !path.getAttribute('aria-label'),
    )
    expect(unnamed).toHaveLength(0)
  })

  it('still has the library’s styled tooltip, with the text from `tooltipText`', () => {
    const { container } = render(
      <ExtendedWorldMap tooltipText={(context) => `Tip for ${context.countryName}`} />,
    )
    expect(svgText(container)).toContain('Tip for France')
    expect(svgText(container)).toContain('Tip for Germany')
  })

  it('gives Northern Cyprus and Somaliland (no ISO code) the same styled tooltip as the rest', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(svgText(container)).toContain('Northern Cyprus')
    expect(svgText(container)).toContain('Somaliland')
    expect(titles(container)).toHaveLength(0) // so removing their <title> leaves them one tooltip
  })

  it('stays that way through hovering, selecting and a changing `tooltipText`', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap tooltipText={(context) => `A ${context.countryName}`} />,
    )
    const france = country(container, 'France')
    fireEvent.mouseOver(france)
    fireEvent.mouseOut(france)
    fireEvent.click(france)
    expect(titles(container)).toHaveLength(0)

    rerender(<ExtendedWorldMap tooltipText={(context) => `B ${context.countryName}`} />)
    expect(titles(container)).toHaveLength(0) // React updates the detached <title>, not a visible one
    expect(svgText(container)).toContain('B France')
  })

  it('removes a <title> the library adds later, but only where the styled tooltip exists', async () => {
    const { container } = render(<ExtendedWorldMap />)
    const add = (name: string) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('aria-label', name)
      path.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'title'))
      container.querySelector('svg g')?.appendChild(path)
      return path
    }
    const known = add('France')
    const unknown = add('Atlantis') // no styled tooltip: its <title> is all it would have

    await vi.waitFor(() => expect(known.querySelector('title')).toBeNull())
    expect(unknown.querySelector('title')).not.toBeNull()
  })

  it('unmounts cleanly', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(<ExtendedWorldMap />)
    expect(() => unmount()).not.toThrow()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
