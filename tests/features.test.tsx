import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap, MapColorOptions } from '../src'
import { getPaletteColors } from '../src/lib/palettes'
import { country } from './helpers'

describe('controls and modes', () => {
  it('hides the radio groups with showControls={false}', () => {
    render(<ExtendedWorldMap showControls={false} />)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('supports an uncontrolled start value and reports changes', () => {
    const onColorModeChange = vi.fn()
    render(<ExtendedWorldMap defaultColorMode="Colorful" onColorModeChange={onColorModeChange} />)
    expect(screen.getByLabelText('Colorful')).toBeChecked()
    fireEvent.click(screen.getByLabelText('Black and White'))
    expect(onColorModeChange).toHaveBeenCalledWith(MapColorOptions.BLACK_AND_WHITE)
    expect(screen.getByLabelText('Black and White')).toBeChecked()
  })

  it('is fully controlled when a mode prop is given', () => {
    const onInfoModeChange = vi.fn()
    const { rerender } = render(
      <ExtendedWorldMap infoMode="CountryCapital" onInfoModeChange={onInfoModeChange} />,
    )
    expect(screen.getByLabelText('Capital')).toBeChecked()

    fireEvent.click(screen.getByLabelText('Only Name'))
    expect(onInfoModeChange).toHaveBeenCalledWith('CountryName')
    expect(screen.getByLabelText('Capital')).toBeChecked() // parent has not accepted the change

    rerender(<ExtendedWorldMap infoMode="CountryName" onInfoModeChange={onInfoModeChange} />)
    expect(screen.getByLabelText('Only Name')).toBeChecked()
  })

  it('uses controlled modes without any visible controls', () => {
    const { container } = render(<ExtendedWorldMap showControls={false} colorMode="Colorful" />)
    expect(country(container, 'France')).not.toHaveStyle({ fill: '#ffffff' })
  })
})

describe('onCountryClick', () => {
  it('passes typed details and the click context', () => {
    const onCountryClick = vi.fn()
    const { container } = render(
      <ExtendedWorldMap infoMode="CountryCapital" onCountryClick={onCountryClick} />,
    )
    fireEvent.click(country(container, 'France'))
    const [info, context] = onCountryClick.mock.calls[0]
    expect(info).toEqual({
      name: 'France',
      capital: 'Paris',
      infoLink: 'https://en.wikipedia.org/wiki/France',
    })
    expect(context.countryCode.toUpperCase()).toBe('FR')
    expect(context.event).toBeDefined()
  })

  it('passes undefined for areas without an ISO code', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap onCountryClick={onCountryClick} />)
    fireEvent.click(country(container, 'Northern Cyprus'))
    expect(onCountryClick.mock.calls[0][0]).toBeUndefined()
  })
})

describe('colours', () => {
  const colourful = { colorMode: 'Colorful' } as const

  it('applies a built-in palette', () => {
    const { container } = render(<ExtendedWorldMap {...colourful} palette="continent" />)
    const continent = getPaletteColors('continent')
    expect(country(container, 'France')).toHaveStyle({ fill: continent.FR as string })
    expect(country(container, 'Germany')).toHaveStyle({ fill: continent.DE as string })
  })

  it('lets `colors` (record or function) win over the palette', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap {...colourful} palette="monochrome" colors={{ FR: '#123456' }} />,
    )
    expect(country(container, 'France')).toHaveStyle({ fill: '#123456' })
    expect(country(container, 'Germany')).toHaveStyle({
      fill: getPaletteColors('monochrome').DE as string,
    })

    rerender(
      <ExtendedWorldMap
        {...colourful}
        colors={(context) => (context.countryName === 'Germany' ? '#654321' : undefined)}
      />,
    )
    expect(country(container, 'Germany')).toHaveStyle({ fill: '#654321' })
  })

  it('ignores colours in black-and-white mode', () => {
    const { container } = render(<ExtendedWorldMap colors={{ FR: '#123456' }} palette="region" />)
    expect(country(container, 'France').getAttribute('style')).toContain('var(--rwme-fill')
  })
})

describe('styling', () => {
  it('puts className and style on the root element', () => {
    const { container } = render(
      <ExtendedWorldMap className="my-map" style={{ ['--rwme-stroke' as string]: '#336' }} />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveClass('my-map')
    expect(root.style.getPropertyValue('--rwme-stroke')).toBe('#336')
  })

  it('exposes CSS custom properties for fill and stroke', () => {
    const { container } = render(<ExtendedWorldMap />)
    const style = country(container, 'France').getAttribute('style')
    expect(style).toContain('var(--rwme-stroke')
    expect(style).toContain('var(--rwme-stroke-width')
  })

  it('merges styleOverrides last (object and function forms)', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap styleOverrides={{ fill: '#abcdef' }} />,
    )
    expect(country(container, 'France')).toHaveStyle({ fill: '#abcdef' })

    rerender(
      <ExtendedWorldMap
        styleOverrides={(_context, { selected }) => ({ fill: selected ? '#111111' : '#eeeeee' })}
      />,
    )
    expect(country(container, 'France')).toHaveStyle({ fill: '#eeeeee' })
    fireEvent.click(country(container, 'France'))
    expect(country(container, 'France')).toHaveStyle({ fill: '#111111' })
  })
})

describe('selection', () => {
  it('highlights the clicked country, one at a time', () => {
    const { container } = render(<ExtendedWorldMap />)
    const selectedStroke = 'var(--rwme-selected-stroke'
    expect(country(container, 'France').getAttribute('style')).not.toContain(selectedStroke)

    fireEvent.click(country(container, 'France'))
    expect(country(container, 'France').getAttribute('style')).toContain(selectedStroke)

    fireEvent.click(country(container, 'Germany'))
    expect(country(container, 'France').getAttribute('style')).not.toContain(selectedStroke)
    expect(country(container, 'Germany').getAttribute('style')).toContain(selectedStroke)
  })

  it('can turn the highlight off', () => {
    const { container } = render(<ExtendedWorldMap highlightSelected={false} />)
    fireEvent.click(country(container, 'France'))
    expect(country(container, 'France').getAttribute('style')).not.toContain(
      'var(--rwme-selected-stroke',
    )
  })
})

describe('selected country is drawn on top', () => {
  const order = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('aria-label'))

  it('moves the selected country last and puts the previous one back', () => {
    const { container } = render(<ExtendedWorldMap />)
    const original = order(container)

    fireEvent.click(country(container, 'Germany'))
    const afterGermany = order(container)
    expect(afterGermany[afterGermany.length - 1]).toBe('Germany')
    expect(afterGermany.filter((name) => name !== 'Germany')).toEqual(
      original.filter((name) => name !== 'Germany'),
    )

    fireEvent.click(country(container, 'France'))
    const afterFrance = order(container)
    expect(afterFrance[afterFrance.length - 1]).toBe('France')
    expect(afterFrance.filter((name) => name !== 'France')).toEqual(
      original.filter((name) => name !== 'France'),
    ) // Germany is back at its original position
  })

  it('keeps keyboard focus on the country it moves', () => {
    const { container } = render(<ExtendedWorldMap />)
    const germany = country(container, 'Germany')
    germany.focus()
    expect(document.activeElement).toBe(germany)

    fireEvent.keyDown(germany, { key: 'Enter' }) // activates it, which moves it to the end
    expect(order(container)[order(container).length - 1]).toBe('Germany')
    expect(document.activeElement).toBe(germany)

    country(container, 'France').focus()
    fireEvent.keyDown(country(container, 'France'), { key: 'Enter' }) // Germany is put back
    expect(document.activeElement).toBe(country(container, 'France'))
  })

  it('leaves the drawing order alone without highlight, and restores it on unmount', () => {
    const { container, unmount } = render(<ExtendedWorldMap highlightSelected={false} />)
    const original = order(container)
    fireEvent.click(country(container, 'Germany'))
    expect(order(container)).toEqual(original)
    expect(() => unmount()).not.toThrow()
  })
})

describe('infoLink', () => {
  it('does not turn the map into links', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'France'))
    expect(container.querySelectorAll('svg a')).toHaveLength(0)
  })

  it("shows the country's link in the details, opening in a new tab", () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    fireEvent.click(country(container, 'France'))
    const link = screen.getByRole('link', { name: /France on en\.wikipedia\.org/ })
    expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/France')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses getInfoLink and can omit the link', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails getInfoLink={(code) => `https://example.org/${code}`} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.org/FR')

    rerender(<ExtendedWorldMap showDetails getInfoLink={() => undefined} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('never renders non-http(s) links', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails getInfoLink={() => 'javascript:alert(1)'} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('is part of the details passed to onCountryClick in every mode', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap onCountryClick={onCountryClick} />)
    fireEvent.click(country(container, 'Germany'))
    expect(onCountryClick.mock.calls[0][0].infoLink).toBe('https://en.wikipedia.org/wiki/Germany')
  })
})

describe('details panel', () => {
  it('is not rendered by default', () => {
    render(<ExtendedWorldMap />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a hint, then the clicked country, and follows the information mode', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    const panel = screen.getByRole('status')
    expect(panel).toHaveTextContent('Click a country')

    fireEvent.click(country(container, 'France'))
    expect(panel).toHaveTextContent('France')
    expect(panel).not.toHaveTextContent('Paris')

    fireEvent.click(screen.getByLabelText('Complete Information'))
    expect(panel).toHaveTextContent('Paris')
    expect(panel).toHaveTextContent('EUR')
    expect(panel).toHaveTextContent('French (fr)')
  })

  it('groups the details by category and formats dialling prefixes', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails defaultInfoMode="CountryCompleteInfo" />,
    )
    fireEvent.click(country(container, 'France'))
    const panel = screen.getByRole('status')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('France')
    expect(
      screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent),
    ).toEqual(['Geography', 'Currency', 'Language', 'Calling codes'])
    expect(panel).toHaveTextContent('+33')
    expect(panel).toHaveTextContent('Euro')
  })

  it('shows only the groups that have data for the current mode', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultInfoMode="CountryCapital" />)
    fireEvent.click(country(container, 'France'))
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([
      'Geography',
    ])
  })

  it('says so when a country has no details', () => {
    const { container } = render(<ExtendedWorldMap showDetails />)
    fireEvent.click(country(container, 'Northern Cyprus'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'No details available for Northern Cyprus.',
    )
  })
})
