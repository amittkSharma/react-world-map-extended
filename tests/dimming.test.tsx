import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'
import { country, styleOf } from './helpers'

const isDimmed = (container: HTMLElement, name: string) =>
  styleOf(container, name).includes('--rwme-dimmed-opacity')

const dimmedCount = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path')).filter((path) =>
    (path.getAttribute('style') ?? '').includes('--rwme-dimmed-opacity'),
  ).length

describe('dimOthers', () => {
  it('dims nothing until a country is selected', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(dimmedCount(container)).toBe(0)
  })

  it('fades every other country once one is clicked, and moves with the selection', () => {
    const { container } = render(<ExtendedWorldMap />)
    const total = container.querySelectorAll('path').length

    fireEvent.click(country(container, 'France'))
    expect(isDimmed(container, 'France')).toBe(false)
    expect(isDimmed(container, 'Germany')).toBe(true)
    expect(dimmedCount(container)).toBe(total - 1)

    fireEvent.click(country(container, 'Germany'))
    expect(isDimmed(container, 'Germany')).toBe(false)
    expect(isDimmed(container, 'France')).toBe(true)
    expect(dimmedCount(container)).toBe(total - 1)
  })

  it('fades fill and border, with the default opacity of 0.35 and a CSS variable to theme it', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountries={['FR']} />)
    expect(styleOf(container, 'Germany')).toContain(
      'fill-opacity: var(--rwme-dimmed-opacity, 0.35)',
    )
    expect(styleOf(container, 'Germany')).toContain(
      'stroke-opacity: calc(var(--rwme-dimmed-opacity, 0.35) * 0.7)',
    )
  })

  it('also works for a country selected from outside, and clears when it is cleared', () => {
    const { container, rerender } = render(<ExtendedWorldMap selectedCountries={['DE']} />)
    expect(isDimmed(container, 'France')).toBe(true)
    expect(isDimmed(container, 'Germany')).toBe(false)

    rerender(<ExtendedWorldMap selectedCountries={[]} />)
    expect(dimmedCount(container)).toBe(0)
  })

  it('works in both colour modes', () => {
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR']} defaultColorMode="Colorful" />,
    )
    expect(isDimmed(container, 'Germany')).toBe(true)
    expect(styleOf(container, 'France')).not.toContain('--rwme-dimmed-opacity')
  })

  it('can be switched off, or set to another opacity (clamped to 0–1)', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR']} dimOthers={false} />,
    )
    expect(dimmedCount(container)).toBe(0)

    rerender(<ExtendedWorldMap defaultSelectedCountries={['FR']} dimOthers={0.6} />)
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity, 0.6)')

    rerender(<ExtendedWorldMap defaultSelectedCountries={['FR']} dimOthers={5} />)
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity, 1)')
    rerender(<ExtendedWorldMap defaultSelectedCountries={['FR']} dimOthers={-1} />)
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity, 0)')

    rerender(<ExtendedWorldMap defaultSelectedCountries={['FR']} dimOthers />)
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity, 0.35)')
  })

  it('is off with highlightSelected={false}, and for unknown codes', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR']} highlightSelected={false} />,
    )
    expect(dimmedCount(container)).toBe(0)

    rerender(<ExtendedWorldMap selectedCountries={['ZZ']} />)
    expect(dimmedCount(container)).toBe(0)
  })

  it('leaves dimmed countries clickable, and the spotlight moves', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR']} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(country(container, 'Germany'))
    expect(onSelectionChange).toHaveBeenCalledWith(['DE'])
  })

  it('tells styleOverrides which countries are dimmed', () => {
    const { container } = render(
      <ExtendedWorldMap
        defaultSelectedCountries={['FR']}
        styleOverrides={(_context, { dimmed }) =>
          dimmed ? { fill: '#eeeeee' } : { fill: '#111111' }
        }
      />,
    )
    expect(country(container, 'Germany')).toHaveStyle({ fill: '#eeeeee' })
    expect(country(container, 'France')).toHaveStyle({ fill: '#111111' })
  })

  it('stacks with the details card without hiding the selected country', () => {
    render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR']} />)
    expect(screen.getByRole('status')).toHaveTextContent('France')
  })
})
