import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type CountryData, type CountryDataIssue, ExtendedWorldMap, WorldMapControls } from '../src'
import { formatNumber, shade } from '../src/lib/colorScale'
import { country, shiftClick, styleOf } from './helpers'

const LITERACY = { name: 'Literacy rate (%)', color: '#1a73e8' }
const POPULATION = { name: 'Population (millions)', color: '#d55e00' }

// Literacy: France 99, Germany 80, Switzerland 99; Japan has none. Population: Japan has the most.
const DATA: CountryData = {
  properties: [LITERACY, POPULATION],
  countries: [
    { country: 'FR', 'Literacy rate (%)': 99, 'Population (millions)': 68.2 },
    { country: 'DEU', 'Literacy rate (%)': 80, 'Population (millions)': 20 },
    { country: 'jp', 'Population (millions)': 124.5, infoLink: 'https://example.org/jp' },
    { country: 'CH', 'Literacy rate (%)': 99, 'Population (millions)': null },
  ],
}
const ONE_PROPERTY: CountryData = {
  properties: [LITERACY],
  countries: [
    { country: 'FR', 'Literacy rate (%)': 99 },
    { country: 'DE', 'Literacy rate (%)': 80 },
  ],
}

const labels = () =>
  Array.from(document.querySelectorAll('.rwme-details__custom dt')).map((dt) => dt.textContent)
const values = () =>
  Array.from(document.querySelectorAll('.rwme-details__custom dd')).map((dd) => dd.textContent)

// the browser's own spelling of a colour, so `#1a73e8` and `rgb(26, 115, 232)` compare equal
const normal = (color: string) => {
  const probe = document.createElement('div')
  probe.style.color = color
  return probe.style.color
}
const fill = (container: HTMLElement, name: string) => normal(country(container, name).style.fill)
const dropdown = () =>
  screen.queryByRole('combobox', { name: 'Show on map' }) as HTMLSelectElement | null
const legend = () => document.querySelector('.rwme-legend')

afterEach(() => vi.restoreAllMocks())

describe('showing your own data in the details', () => {
  it('shows your values instead of the built-in facts, labelled exactly as the properties', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('France')
    expect(labels()).toEqual(['Literacy rate (%)', 'Population (millions)'])
    expect(values()).toEqual(['99', '68.2'])
    const card = screen.getByRole('status')
    expect(card).not.toHaveTextContent('Geography')
    expect(card).not.toHaveTextContent('Currency')
  })

  it('puts the property that colours the map first', () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        defaultDataProperty="Population (millions)"
      />,
    )
    fireEvent.click(country(container, 'France'))
    expect(labels()).toEqual(['Population (millions)', 'Literacy rate (%)'])
    expect(values()).toEqual(['68.2', '99'])
  })

  it('finds a country by its alpha-3 code, in any case', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Germany'))
    expect(values()).toEqual(['80', '20'])

    fireEvent.click(country(container, 'Japan')) // 'jp'
    expect(labels()).toEqual(['Population (millions)'])
  })

  it('shows "—" for a country that has no value for a property', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Switzerland'))
    expect(labels()).toEqual(['Literacy rate (%)', 'Population (millions)'])
    expect(values()).toEqual(['99', '—'])
  })

  it('hides the "Information on click" radio buttons, which describe the built-in facts', () => {
    render(<ExtendedWorldMap countryData={DATA} />)
    expect(screen.getByRole('group', { name: 'Map colours' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Information on click' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Capital')).not.toBeInTheDocument()
  })

  it('uses the built-in facts when there is no data, whatever detailsSource says', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails detailsSource="custom" defaultInfoMode="CountryCapital" />,
    )
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(dropdown()).toBeNull()
  })
})

describe('detailsSource', () => {
  it("'default' ignores the data: no colour scale, no grey, no dropdown, the built-in legend", () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="default"
        defaultInfoMode="CountryCapital"
        defaultColorMode="Colorful"
        palette="continent"
      />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(document.querySelector('.rwme-details__custom')).toBeNull()
    expect(styleOf(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
    expect(fill(container, 'France')).toBe(normal('#0072B2')) // the continent colour, not the scale
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    expect(dropdown()).toBeNull()
    expect(legend()).toHaveTextContent('Continents')
  })

  it("'both' shows your data first, then the built-in facts, and keeps the radio buttons", () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="both"
        defaultInfoMode="CountryCapital"
      />,
    )
    fireEvent.click(country(container, 'France'))
    const card = screen.getByRole('status')
    expect(card).toHaveTextContent('Literacy rate (%)') // yours
    expect(card).toHaveTextContent('Geography') // the built-in facts
    const headings = Array.from(card.querySelectorAll('h4')).map((heading) => heading.textContent)
    expect(headings.slice(0, 2)).toEqual(['Data', 'Geography']) // yours come first
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    expect(dropdown()).not.toBeNull() // and still colours the map by your data
  })

  it('says when a country has no data of your own', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails countryData={DATA} defaultInfoMode="CountryCapital" />,
    )
    fireEvent.click(country(container, 'Brazil'))
    expect(screen.getByRole('status')).toHaveTextContent('No data for Brazil.')

    rerender(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="both"
        defaultInfoMode="CountryCapital"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('No custom data for Brazil.')
    expect(screen.getByRole('status')).toHaveTextContent('Brasília') // the built-in facts are still there
  })

  it('says it for an area that has no ISO code and so no data', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Northern Cyprus'))
    expect(screen.getByRole('status')).toHaveTextContent('No data for Northern Cyprus.')
  })
})

describe('colouring the map with your data', () => {
  it('starts colourful, the highest value in the property’s colour and the lowest in a light tint of it', () => {
    const { container } = render(<ExtendedWorldMap countryData={DATA} />)
    expect(screen.getByRole('radio', { name: 'Colorful' })).toBeChecked()
    expect(fill(container, 'France')).toBe(normal('#1a73e8')) // 99: the highest
    expect(fill(container, 'Switzerland')).toBe(normal('#1a73e8'))
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0))) // 80: the lowest
  })

  it('shades the values in between', () => {
    const data: CountryData = {
      properties: [LITERACY],
      countries: [
        { country: 'FR', 'Literacy rate (%)': 0 },
        { country: 'DE', 'Literacy rate (%)': 50 },
        { country: 'IT', 'Literacy rate (%)': 100 },
      ],
    }
    const { container } = render(<ExtendedWorldMap countryData={data} />)
    expect(fill(container, 'France')).toBe(normal(shade('#1a73e8', 0)))
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0.5)))
    expect(fill(container, 'Italy')).toBe(normal('#1a73e8'))
  })

  it('paints countries without a value for the chosen property grey, and the others keep their shade', () => {
    const { container } = render(<ExtendedWorldMap countryData={DATA} />)
    for (const name of ['Brazil', 'Japan', 'Northern Cyprus']) {
      expect(styleOf(container, name)).toContain('var(--rwme-no-data-fill, #e5e7eb)') // Japan has no literacy
    }
    for (const name of ['France', 'Germany', 'Switzerland']) {
      expect(styleOf(container, name)).not.toContain('--rwme-no-data-fill')
    }
  })

  it('can leave countries without data as they are', () => {
    const { container } = render(
      <ExtendedWorldMap countryData={DATA} greyOutCountriesWithoutData={false} />,
    )
    expect(styleOf(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
  })

  it('does not colour the map in Black and White mode (countries without data stay grey)', () => {
    const { container } = render(<ExtendedWorldMap countryData={DATA} colorMode="BlackAndWhite" />)
    expect(fill(container, 'France')).toBe('var(--rwme-fill, #ffffff)')
    expect(styleOf(container, 'Brazil')).toContain('--rwme-no-data-fill')
    expect(legend()).toBeNull()
  })

  it('starts colourful only when the visitor has not chosen: defaultColorMode is respected', () => {
    render(<ExtendedWorldMap countryData={DATA} defaultColorMode="BlackAndWhite" />)
    expect(screen.getByRole('radio', { name: 'Black and White' })).toBeChecked()
  })

  it('becomes colourful when the data arrives later, until the visitor chooses', () => {
    const { container, rerender } = render(<ExtendedWorldMap />)
    expect(fill(container, 'France')).toBe('var(--rwme-fill, #ffffff)')
    rerender(<ExtendedWorldMap countryData={DATA} />)
    expect(fill(container, 'France')).toBe(normal('#1a73e8'))
    fireEvent.click(screen.getByRole('radio', { name: 'Black and White' }))
    expect(fill(container, 'France')).toBe('var(--rwme-fill, #ffffff)')
    fireEvent.click(screen.getByRole('radio', { name: 'Colorful' }))
    expect(fill(container, 'France')).toBe(normal('#1a73e8'))
  })

  it('gives every country the middle shade when all values are the same', () => {
    const data: CountryData = {
      properties: [LITERACY],
      countries: [
        { country: 'FR', 'Literacy rate (%)': 7 },
        { country: 'DE', 'Literacy rate (%)': 7 },
      ],
    }
    const { container } = render(<ExtendedWorldMap countryData={data} />)
    expect(fill(container, 'France')).toBe(normal(shade('#1a73e8', 0.5)))
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0.5)))
  })

  it('wins over `colors` and `palette` for countries that have a value', () => {
    const { container } = render(
      <ExtendedWorldMap countryData={DATA} palette="continent" colors={{ FR: '#ff00ff' }} />,
    )
    expect(fill(container, 'France')).toBe(normal('#1a73e8'))
  })

  it('does not fade the other countries when one is selected (the shades carry the meaning), unless asked to', () => {
    const first = render(<ExtendedWorldMap countryData={DATA} />)
    fireEvent.click(country(first.container, 'France'))
    expect(styleOf(first.container, 'Germany')).not.toContain('--rwme-dimmed-opacity')
    first.unmount()

    const { container } = render(<ExtendedWorldMap countryData={DATA} dimOthers />)
    fireEvent.click(country(container, 'France'))
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity')
  })

  it('still fades the others with the built-in data, as before', () => {
    const { container } = render(<ExtendedWorldMap />)
    fireEvent.click(country(container, 'France'))
    expect(styleOf(container, 'Germany')).toContain('--rwme-dimmed-opacity')
  })
})

describe('the property dropdown', () => {
  it('lists the properties when there are two or more, with the first chosen', () => {
    render(<ExtendedWorldMap countryData={DATA} />)
    const select = dropdown()
    expect(select).not.toBeNull()
    expect(
      within(select as HTMLElement)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Literacy rate (%)', 'Population (millions)'])
    expect(select?.value).toBe('Literacy rate (%)')
  })

  it('is not there for a single property, or without own data', () => {
    const { rerender } = render(<ExtendedWorldMap countryData={ONE_PROPERTY} />)
    expect(dropdown()).toBeNull()
    rerender(<ExtendedWorldMap />)
    expect(dropdown()).toBeNull()
  })

  it('recolours the map, the legend and the card straight away when another property is chosen', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Germany'))
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0)))
    expect(fill(container, 'Japan')).toBe('var(--rwme-no-data-fill, #e5e7eb)') // no literacy: grey
    expect(legend()).toHaveTextContent('Literacy rate (%)')
    expect(labels()[0]).toBe('Literacy rate (%)')

    fireEvent.change(dropdown() as HTMLSelectElement, {
      target: { value: 'Population (millions)' },
    })
    expect(fill(container, 'Japan')).toBe(normal('#d55e00')) // 124.5: the highest
    expect(fill(container, 'Germany')).toBe(normal(shade('#d55e00', 0))) // 20: the lowest
    expect(styleOf(container, 'Switzerland')).toContain('--rwme-no-data-fill') // null: no value
    expect(legend()).toHaveTextContent('Population (millions)')
    expect(legend()).toHaveTextContent('20')
    expect(legend()).toHaveTextContent('124.5')
    expect(labels()[0]).toBe('Population (millions)')
    expect(dropdown()?.value).toBe('Population (millions)')
  })

  it('keeps the selected country and the card when the property changes', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Germany'))
    fireEvent.change(dropdown() as HTMLSelectElement, {
      target: { value: 'Population (millions)' },
    })
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Germany')
    expect(styleOf(container, 'Germany')).toContain('--rwme-selected-stroke')
  })

  it('can be controlled with dataProperty, and tells you about a change', () => {
    const onDataPropertyChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap
        countryData={DATA}
        dataProperty="Population (millions)"
        onDataPropertyChange={onDataPropertyChange}
      />,
    )
    expect(dropdown()?.value).toBe('Population (millions)')
    fireEvent.change(dropdown() as HTMLSelectElement, { target: { value: 'Literacy rate (%)' } })
    expect(onDataPropertyChange).toHaveBeenCalledWith('Literacy rate (%)')
    expect(dropdown()?.value).toBe('Population (millions)') // the parent decides
    expect(fill(container, 'Japan')).toBe(normal('#d55e00'))

    rerender(
      <ExtendedWorldMap
        countryData={DATA}
        dataProperty="Literacy rate (%)"
        onDataPropertyChange={onDataPropertyChange}
      />,
    )
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0)))
  })

  it('starts at defaultDataProperty and then follows the visitor', () => {
    const onDataPropertyChange = vi.fn()
    render(
      <ExtendedWorldMap
        countryData={DATA}
        defaultDataProperty="Population (millions)"
        onDataPropertyChange={onDataPropertyChange}
      />,
    )
    expect(dropdown()?.value).toBe('Population (millions)')
    fireEvent.change(dropdown() as HTMLSelectElement, { target: { value: 'Literacy rate (%)' } })
    expect(dropdown()?.value).toBe('Literacy rate (%)')
    expect(onDataPropertyChange).toHaveBeenCalledTimes(1)
  })

  it('falls back to the first property for a name that is not one', () => {
    render(<ExtendedWorldMap countryData={DATA} dataProperty="Nothing" />)
    expect(dropdown()?.value).toBe('Literacy rate (%)')
    expect(legend()).toHaveTextContent('Literacy rate (%)')
  })

  it('works from a separate <WorldMapControls> too', () => {
    const Page = () => {
      const [property, setProperty] = useState<string | undefined>()
      const [colorMode, setColorMode] = useState<'Colorful' | 'BlackAndWhite'>('Colorful')
      return (
        <>
          <WorldMapControls
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            infoMode="CountryName"
            onInfoModeChange={() => {}}
            showInfoModes={false}
            properties={DATA.properties.map(({ name }) => name)}
            dataProperty={property}
            onDataPropertyChange={setProperty}
          />
          <ExtendedWorldMap
            showControls={false}
            countryData={DATA}
            colorMode={colorMode}
            dataProperty={property}
            onDataPropertyChange={setProperty}
          />
        </>
      )
    }
    const { container } = render(<Page />)
    expect(fill(container, 'Germany')).toBe(normal(shade('#1a73e8', 0)))
    fireEvent.change(dropdown() as HTMLSelectElement, {
      target: { value: 'Population (millions)' },
    })
    expect(fill(container, 'Japan')).toBe(normal('#d55e00'))
  })
})

describe('<WorldMapControls> properties', () => {
  const controls = (properties?: string[]) => (
    <WorldMapControls
      colorMode="BlackAndWhite"
      infoMode="CountryName"
      onColorModeChange={() => {}}
      onInfoModeChange={() => {}}
      properties={properties}
    />
  )

  it('shows the dropdown for two or more, and not for none or one', () => {
    const { rerender } = render(controls(['a', 'b']))
    expect(dropdown()).not.toBeNull()
    rerender(controls(['a']))
    expect(dropdown()).toBeNull()
    rerender(controls())
    expect(dropdown()).toBeNull()
  })

  it('shows the first property when dataProperty is not one of them', () => {
    render(
      <WorldMapControls
        colorMode="Colorful"
        infoMode="CountryName"
        onColorModeChange={() => {}}
        onInfoModeChange={() => {}}
        properties={['a', 'b']}
        dataProperty="zzz"
      />,
    )
    expect(dropdown()?.value).toBe('a')
  })
})

describe('the legend', () => {
  it('is the colour scale of the chosen property: its name, both ends, and "No data"', () => {
    render(<ExtendedWorldMap countryData={DATA} />)
    const box = legend() as HTMLElement
    expect(box).toHaveTextContent('Literacy rate (%)')
    expect(box).toHaveTextContent(formatNumber(80))
    expect(box).toHaveTextContent(formatNumber(99))
    expect(within(box).getByRole('img')).toHaveAttribute(
      'aria-label',
      `Literacy rate (%): from ${formatNumber(80)} to ${formatNumber(99)}, light to dark`,
    )
    expect(
      within(box)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['No data'])
    const bar = box.querySelector('[style*="linear-gradient"]') as HTMLElement
    expect(bar.style.background).toContain('linear-gradient')
  })

  it('is never the built-in continent or region legend when your data is shown', () => {
    for (const source of [undefined, 'both'] as const) {
      const { unmount } = render(
        <ExtendedWorldMap countryData={DATA} detailsSource={source} palette="continent" />,
      )
      expect(screen.queryByText('Continents')).not.toBeInTheDocument()
      expect(screen.queryByText('Africa')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('is still the built-in legend for the built-in data', () => {
    render(<ExtendedWorldMap defaultColorMode="Colorful" palette="continent" />)
    expect(legend()).toHaveTextContent('Continents')
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })

  it('can be turned off, and has no "No data" entry when grey is turned off', () => {
    const { rerender } = render(
      <ExtendedWorldMap countryData={DATA} greyOutCountriesWithoutData={false} />,
    )
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
    expect(legend()).toHaveTextContent('Literacy rate (%)') // the scale is still explained
    rerender(<ExtendedWorldMap countryData={DATA} showLegend={false} />)
    expect(legend()).toBeNull()
  })

  it('shows the same number at both ends when all values are the same', () => {
    const data: CountryData = {
      properties: [LITERACY],
      countries: [{ country: 'FR', 'Literacy rate (%)': 7 }],
    }
    render(<ExtendedWorldMap countryData={data} />)
    expect(within(legend() as HTMLElement).getByRole('img')).toHaveAttribute(
      'aria-label',
      'Literacy rate (%): from 7 to 7, light to dark',
    )
  })
})

describe('checking the data', () => {
  const BAD = {
    properties: [LITERACY, { name: 'Bad colour', color: 'blue' }],
    countries: [
      { country: 'FR', 'Literacy rate (%)': 99 },
      { country: 'France', 'Literacy rate (%)': 1 },
      { country: 'DE', 'Literacy rate (%)': 'text' },
      'nope',
    ],
  } as unknown as CountryData

  it('reports the problems once, and uses what is valid', () => {
    const onDataIssues = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails countryData={BAD} onDataIssues={onDataIssues} />,
    )
    expect(onDataIssues).toHaveBeenCalledTimes(1)
    expect(onDataIssues.mock.calls[0][0]).toEqual([
      { row: null, property: 'Bad colour', message: expect.stringContaining('hex colour') },
      { row: 1, property: 'country', message: expect.stringContaining('names are not accepted') },
      {
        row: 2,
        property: 'Literacy rate (%)',
        message: expect.stringContaining('must be a finite number'),
      },
      { row: 2, message: 'DE has no number for any listed property.' },
      { row: 3, message: 'Each row must be an object.' },
    ])

    rerender(<ExtendedWorldMap showDetails countryData={BAD} onDataIssues={onDataIssues} />) // same data: not again
    expect(onDataIssues).toHaveBeenCalledTimes(1)

    fireEvent.click(country(container, 'France')) // the valid row works
    expect(labels()).toEqual(['Literacy rate (%)'])
    fireEvent.click(country(container, 'Germany')) // the invalid one has no data
    expect(screen.getByRole('status')).toHaveTextContent('No data for Germany.')
  })

  it('reports again for new content, and not at all for valid data', () => {
    const onDataIssues = vi.fn()
    const { rerender } = render(<ExtendedWorldMap countryData={DATA} onDataIssues={onDataIssues} />)
    expect(onDataIssues).not.toHaveBeenCalled()
    rerender(<ExtendedWorldMap countryData={BAD} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(1)
  })

  it('prints a warning when nobody asked for the problems', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ExtendedWorldMap countryData={BAD} />)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('5 problem(s) in countryData')
    expect(String(warn.mock.calls[0][0])).toContain('row 1 (country)')
  })

  it('keeps the built-in facts when the data is not usable, and says so', () => {
    const onDataIssues = vi.fn()
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        defaultInfoMode="CountryCapital"
        countryData={[{ country: 'FR', a: 1 }] as unknown as CountryData}
        onDataIssues={onDataIssues}
      />,
    )
    expect(onDataIssues).toHaveBeenCalledWith([
      { row: null, message: 'The data must be an object with "properties" and "countries".' },
    ])
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(styleOf(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
  })

  it('keeps the built-in facts when no property has a number', () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        defaultInfoMode="CountryCapital"
        countryData={{ properties: [LITERACY], countries: [] }}
        onDataIssues={() => {}}
      />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
  })

  it('follows new data', () => {
    const { container, rerender } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    expect(labels()).toContain('Literacy rate (%)')
    rerender(
      <ExtendedWorldMap
        showDetails
        countryData={{
          properties: [{ name: 'Different', color: '#336' }],
          countries: [{ country: 'FR', Different: 5 }],
        }}
      />,
    )
    expect(labels()).toEqual(['Different'])
  })
})

describe('data written inline in a component', () => {
  it('is checked and reported once, even though every render makes a new object (no render loop)', () => {
    let renders = 0
    const Page = () => {
      const [issues, setIssues] = useState<CountryDataIssue[]>([])
      renders += 1
      return (
        <>
          <output>{issues.length}</output>
          <ExtendedWorldMap
            showDetails
            countryData={{
              properties: [{ name: 'a', color: '#336' }],
              countries: [
                { country: 'FR', a: 1 },
                { country: 'nope', a: 2 },
              ],
            }} // a new object each time
            onDataIssues={setIssues}
          />
        </>
      )
    }
    render(<Page />)
    expect(document.querySelector('output')).toHaveTextContent('1')
    expect(renders).toBeLessThan(5) // a handful of renders, not an endless loop
  })

  it('is checked again when its content changes, and not when only the object does', () => {
    const onDataIssues = vi.fn()
    const bad = (country: string) => ({
      properties: [{ name: 'a', color: '#336' }],
      countries: [{ country, a: 1 }],
    })
    const { rerender } = render(
      <ExtendedWorldMap countryData={bad('France')} onDataIssues={onDataIssues} />,
    )
    rerender(<ExtendedWorldMap countryData={bad('France')} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(1)
    rerender(<ExtendedWorldMap countryData={bad('Spain')} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(2)
  })

  it('keeps working when the data cannot be turned into JSON', () => {
    const circular: Record<string, unknown> = {
      properties: [{ name: 'a', color: '#336' }],
      countries: [],
    }
    circular.self = circular
    const onDataIssues = vi.fn()
    expect(() =>
      render(
        <ExtendedWorldMap
          countryData={circular as unknown as CountryData}
          onDataIssues={onDataIssues}
        />,
      ),
    ).not.toThrow()
    expect(onDataIssues).toHaveBeenCalledTimes(1) // no property has a number
  })
})

describe('infoLink in your data', () => {
  it('is the link of the details when it is a web address, and is not shown as a value', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Japan'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.org/jp')
    expect(labels()).toEqual(['Population (millions)'])
  })

  it('falls back to the default link for an address that is not http(s)', () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        countryData={{
          ...ONE_PROPERTY,
          countries: [{ country: 'FR', 'Literacy rate (%)': 1, infoLink: 'javascript:alert(1)' }],
        }}
      />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/France')
  })

  it('is the default link when a row has none', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/France')
  })
})

describe('onCountryClick with your data', () => {
  const click = (props: Record<string, unknown>, name: string) => {
    const onCountryClick = vi.fn()
    const { container } = render(
      <ExtendedWorldMap countryData={DATA} onCountryClick={onCountryClick} {...props} />,
    )
    fireEvent.click(country(container, name))
    return onCountryClick.mock.calls[0][0]
  }

  it('gets your values (without `country`)', () => {
    expect(click({}, 'France')).toEqual({ 'Literacy rate (%)': 99, 'Population (millions)': 68.2 })
  })

  it('gets undefined for a country without data', () => {
    expect(click({}, 'Brazil')).toBeUndefined()
  })

  it("merges the built-in facts and your values for 'both', yours winning", () => {
    const info = click({ detailsSource: 'both', defaultInfoMode: 'CountryCapital' }, 'France')
    expect(info).toMatchObject({ name: 'France', capital: 'Paris', 'Literacy rate (%)': 99 })
    const other = click({ detailsSource: 'both', defaultInfoMode: 'CountryCapital' }, 'Brazil')
    expect(other).toMatchObject({ name: 'Brazil', capital: 'Brasília' })
  })

  it("still gets the built-in facts for 'default'", () => {
    expect(
      click({ detailsSource: 'default', defaultInfoMode: 'CountryCapital' }, 'France'),
    ).toMatchObject({ capital: 'Paris' })
  })
})

describe('with several countries selected', () => {
  it('shows each country’s own values in its entry', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    shiftClick(country(container, 'Germany'))
    const list = document.querySelector('.rwme-details--list') as HTMLElement
    expect(within(list).getByRole('button', { name: 'Germany' })).toBeInTheDocument()
    expect(labels()).toEqual([
      'Literacy rate (%)',
      'Population (millions)',
      'Literacy rate (%)',
      'Population (millions)',
    ])
    expect(values()).toEqual(['99', '68.2', '80', '20'])
    shiftClick(country(container, 'Brazil'))
    expect(list).toHaveTextContent('No data for Brazil.')
  })
})

describe('<WorldMapControls showInfoModes={false}>', () => {
  it('leaves out the "Information on click" group', () => {
    render(
      <WorldMapControls
        colorMode="BlackAndWhite"
        infoMode="CountryName"
        onColorModeChange={() => {}}
        onInfoModeChange={() => {}}
        showInfoModes={false}
      />,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByRole('group', { name: 'Information on click' })).not.toBeInTheDocument()
  })
})

describe('scales for skewed data', () => {
  const COLOR = '#d55e00'
  // one very large number (India): on a linear scale it leaves everyone else almost white
  const withScale = (options: Record<string, unknown>): CountryData => ({
    properties: [{ name: 'Population', color: COLOR, ...options }],
    countries: [
      { country: 'FR', Population: 60 },
      { country: 'DE', Population: 80 },
      { country: 'JP', Population: 120 },
      { country: 'BR', Population: 200 },
      { country: 'NG', Population: 210 },
      { country: 'IN', Population: 1400 },
    ],
  })
  const entries = () => screen.getAllByRole('listitem').map((item) => item.textContent)

  it('a linear scale leaves the countries below the outlier almost alike', () => {
    const { container } = render(<ExtendedWorldMap countryData={withScale({})} />)
    expect(fill(container, 'India')).toBe(normal(COLOR))
    expect(fill(container, 'Brazil')).not.toBe(normal(shade(COLOR, 0.5))) // 200 of 60–1400
    expect(fill(container, 'Brazil')).not.toBe(fill(container, 'India'))
  })

  it('a quantile scale spreads the shades over the classes, outlier or not', () => {
    const { container } = render(
      <ExtendedWorldMap countryData={withScale({ scale: 'quantile', classes: 3 })} />,
    )
    expect(fill(container, 'France')).toBe(normal(shade(COLOR, 0)))
    expect(fill(container, 'Germany')).toBe(normal(shade(COLOR, 0)))
    expect(fill(container, 'Japan')).toBe(normal(shade(COLOR, 0.5)))
    expect(fill(container, 'Brazil')).toBe(normal(shade(COLOR, 0.5)))
    expect(fill(container, 'Nigeria')).toBe(normal(COLOR))
    expect(fill(container, 'India')).toBe(normal(COLOR))
  })

  it('a log scale spaces the numbers by their powers', () => {
    const data: CountryData = {
      properties: [{ name: 'P', color: COLOR, scale: 'log' }],
      countries: [
        { country: 'FR', P: 1 },
        { country: 'DE', P: 10 },
        { country: 'IT', P: 100 },
      ],
    }
    const { container } = render(<ExtendedWorldMap countryData={data} />)
    expect(fill(container, 'France')).toBe(normal(shade(COLOR, 0)))
    expect(fill(container, 'Germany')).toBe(normal(shade(COLOR, 0.5)))
    expect(fill(container, 'Italy')).toBe(normal(COLOR))
  })

  it('min and max show the numbers beyond them at the ends of the scale', () => {
    const { container } = render(
      <ExtendedWorldMap countryData={withScale({ min: 100, max: 200 })} />,
    )
    expect(fill(container, 'France')).toBe(normal(shade(COLOR, 0))) // 60, below min
    expect(fill(container, 'Brazil')).toBe(normal(COLOR)) // 200
    expect(fill(container, 'India')).toBe(normal(COLOR)) // 1400, above max
    expect(fill(container, 'Japan')).toBe(normal(shade(COLOR, 0.2))) // 120
  })

  it('a quantile legend lists the classes with their ranges, then "No data"', () => {
    render(<ExtendedWorldMap countryData={withScale({ scale: 'quantile', classes: 3 })} />)
    const box = legend() as HTMLElement
    expect(box).toHaveTextContent('Population')
    expect(box).toHaveTextContent('Classes with equal numbers of countries')
    expect(entries()).toEqual([
      `${formatNumber(60)} – ${formatNumber(120)}`,
      `${formatNumber(120)} – ${formatNumber(210)}`,
      `${formatNumber(210)} – ${formatNumber(1400)}`,
      'No data',
    ])
    expect(within(box).queryByRole('img')).toBeNull() // no gradient bar
    // each swatch has the shade its countries have on the map
    const swatches = within(box)
      .getAllByRole('listitem')
      .map((item) => normal((item.firstElementChild as HTMLElement).style.background))
    expect(swatches.slice(0, 3)).toEqual([
      normal(shade(COLOR, 0)),
      normal(shade(COLOR, 0.5)),
      normal(COLOR),
    ])
  })

  it('a log legend is a bar that says it is logarithmic', () => {
    render(<ExtendedWorldMap countryData={withScale({ scale: 'log' })} />)
    const box = legend() as HTMLElement
    expect(box).toHaveTextContent('Logarithmic scale')
    expect(within(box).getByRole('img')).toBeInTheDocument()
  })

  it('a legend says which ends are cut off by min and max', () => {
    const first = render(<ExtendedWorldMap countryData={withScale({ min: 100, max: 500 })} />)
    expect(within(legend() as HTMLElement).getByRole('img')).toHaveAttribute(
      'aria-label',
      `Population: from ≤ ${formatNumber(100)} to ≥ ${formatNumber(500)}, light to dark`,
    )
    first.unmount()

    render(
      <ExtendedWorldMap countryData={withScale({ scale: 'quantile', classes: 3, max: 500 })} />,
    )
    expect(entries()[entries().length - 2]).toBe(`≥ ${formatNumber(210)}`)
  })

  it('a legend does not say it when no number is cut off', () => {
    render(<ExtendedWorldMap countryData={withScale({ min: 0, max: 5000 })} />)
    expect(within(legend() as HTMLElement).getByRole('img')).toHaveAttribute(
      'aria-label',
      `Population: from ${formatNumber(0)} to ${formatNumber(5000)}, light to dark`,
    )
  })

  it('shows the real numbers in the card, whatever the scale does with them', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails countryData={withScale({ scale: 'quantile', max: 500 })} />,
    )
    fireEvent.click(country(container, 'India'))
    expect(values()).toEqual(['1400'])
  })

  it('each property has its own scale, and the legend follows the dropdown', () => {
    const data: CountryData = {
      properties: [
        { name: 'A', color: '#1a73e8' },
        { name: 'B', color: '#d55e00', scale: 'quantile', classes: 2 },
      ],
      countries: [
        { country: 'FR', A: 1, B: 1 },
        { country: 'DE', A: 2, B: 2 },
        { country: 'IT', A: 3, B: 1000 },
      ],
    }
    render(<ExtendedWorldMap countryData={data} />)
    expect(within(legend() as HTMLElement).getByRole('img')).toBeInTheDocument()
    fireEvent.change(dropdown() as HTMLSelectElement, { target: { value: 'B' } })
    expect(legend()).toHaveTextContent('Classes with equal numbers of countries')
    expect(within(legend() as HTMLElement).queryByRole('img')).toBeNull()
    fireEvent.change(dropdown() as HTMLSelectElement, { target: { value: 'A' } })
    expect(within(legend() as HTMLElement).getByRole('img')).toBeInTheDocument()
  })

  it('reports an option it cannot use, and keeps the map working with a linear scale', () => {
    const onDataIssues = vi.fn()
    const { container } = render(
      <ExtendedWorldMap countryData={withScale({ scale: 'cubic' })} onDataIssues={onDataIssues} />,
    )
    expect(onDataIssues).toHaveBeenCalledWith([
      expect.objectContaining({
        property: 'Population',
        message: expect.stringContaining('"scale" must be'),
      }),
    ])
    expect(fill(container, 'India')).toBe(normal(COLOR))
  })
})
