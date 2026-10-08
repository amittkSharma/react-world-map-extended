import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'
import { getPaletteColors, getPaletteLegend } from '../src/palettes'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const legend = () => document.querySelector('.rwme-legend') as HTMLElement | null

describe('getPaletteLegend', () => {
  it('explains the continent and region palettes with the colours actually used', () => {
    const continents = getPaletteLegend('continent')
    expect(continents?.title).toBe('Continents')
    expect(continents?.items.map((item) => item.label)).toEqual([
      'Africa',
      'Asia',
      'Europe',
      'North America',
      'South America',
      'Oceania',
    ])
    // the swatch colours are the ones the map paints with
    const used = new Set(Object.values(getPaletteColors('continent')))
    expect(continents?.items.every((item) => used.has(item.color))).toBe(true)

    const regions = getPaletteLegend('region')
    expect(regions?.title).toBe('Regions')
    expect(regions?.items).toHaveLength(9)
    expect(regions?.items.map((item) => item.label)).toContain('Asia & Pacific')
  })

  it('has nothing to say about the other palettes', () => {
    expect(getPaletteLegend('default')).toBeUndefined()
    expect(getPaletteLegend('monochrome')).toBeUndefined()
  })
})

describe('legend on the map', () => {
  const colorful = { defaultColorMode: 'Colorful' } as const

  it('lists what the colours mean, as an accessible list', () => {
    render(<ExtendedWorldMap {...colorful} palette="continent" />)
    const list = screen.getByRole('list', { name: 'Map legend' })
    expect(list.querySelectorAll('li')).toHaveLength(6)
    expect(list).toHaveTextContent('Oceania')
    expect(legend()).toHaveTextContent('Continents')
    // the swatches are decoration, not content
    expect(list.querySelector('span')).toHaveAttribute('aria-hidden', 'true')
  })

  it('switches with the palette, and with the colour mode (it follows the radio buttons)', () => {
    const { rerender } = render(<ExtendedWorldMap {...colorful} palette="region" />)
    expect(legend()).toHaveTextContent('Regions')
    expect(screen.getAllByRole('listitem')).toHaveLength(9)

    rerender(<ExtendedWorldMap {...colorful} palette="continent" />)
    expect(legend()).toHaveTextContent('Continents')

    fireEvent.click(screen.getByLabelText('Black and White'))
    expect(legend()).toBeNull()
    fireEvent.click(screen.getByLabelText('Colorful'))
    expect(legend()).not.toBeNull()
  })

  it.each([
    ['black and white mode', { palette: 'continent' }],
    ['the default palette', { ...colorful }],
    ['the monochrome palette', { ...colorful, palette: 'monochrome' }],
    ['custom colours (the legend could not describe them)', { ...colorful, palette: 'continent', colors: { FR: '#123456' } }],
    ['showLegend={false}', { ...colorful, palette: 'continent', showLegend: false }],
  ] as const)('is not shown for %s', (_name, props) => {
    render(<ExtendedWorldMap {...props} />)
    expect(legend()).toBeNull()
  })

  it('never takes clicks, so countries below it stay clickable', () => {
    render(<ExtendedWorldMap {...colorful} palette="continent" />)
    expect(legend()).toHaveStyle({ pointerEvents: 'none' })
  })

  it('does not get in the way of selecting, clearing or the details card', () => {
    const onCountryClick = vi.fn()
    const { container } = render(
      <ExtendedWorldMap {...colorful} palette="continent" showDetails onCountryClick={onCountryClick} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(onCountryClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('France')
    expect(legend()).not.toBeNull()
  })
})

describe('legend position', () => {
  afterEach(() => vi.restoreAllMocks())

  const withBoxes = () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.matches('.rwme-layout')) return rect(10, 10, 1000, 800)
      if (this.matches('svg')) return rect(20, 40, 600, 300) // 10px right of / 30px below the layout
      return rect(0, 0, 0, 0)
    })
  }

  it.each([
    ['bottom-left', { left: '18px', top: '322px', transform: 'translate(0, -100%)' }],
    ['bottom-right', { left: '602px', top: '322px', transform: 'translate(-100%, -100%)' }],
    ['top-left', { left: '18px', top: '38px', transform: 'translate(0, 0)' }],
    ['top-right', { left: '602px', top: '38px', transform: 'translate(-100%, 0)' }],
  ] as const)('%s hugs that corner of the measured map', (legendPosition, expected) => {
    withBoxes()
    render(<ExtendedWorldMap defaultColorMode="Colorful" palette="continent" legendPosition={legendPosition} />)
    expect(legend()).toHaveStyle(expected)
  })

  it('defaults to the bottom-left corner', () => {
    withBoxes()
    render(<ExtendedWorldMap defaultColorMode="Colorful" palette="continent" />)
    expect(legend()).toHaveStyle({ left: '18px', top: '322px' })
  })

  it('still has a place before the map has been measured', () => {
    render(<ExtendedWorldMap defaultColorMode="Colorful" palette="region" legendPosition="top-right" />)
    expect(legend()).toHaveStyle({ right: '8px', top: '8px' })
  })
})
