import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type CountryDataIssue, type CountryDataRow, ExtendedWorldMap, WorldMapControls } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const shiftClick = (element: Element) => fireEvent.click(element, { shiftKey: true })

const DATA: CountryDataRow[] = [
  { country: 'FR', 'Literacy rate (%)': 99, capital_city: 'Paris', hasCoast: true, notes: null },
  { country: 'DEU', Population: 83000000 },
  { country: 'jp', Label: 'Tokyo', infoLink: 'https://example.org/jp' },
]

const labels = () =>
  Array.from(document.querySelectorAll('.rwme-details__custom dt')).map((dt) => dt.textContent)
const values = () =>
  Array.from(document.querySelectorAll('.rwme-details__custom dd')).map((dd) => dd.textContent)
const style = (container: HTMLElement, name: string) =>
  country(container, name).getAttribute('style') ?? ''

afterEach(() => vi.restoreAllMocks())

describe('showing your own data in the details', () => {
  it('shows your values instead of the built-in facts, labelled exactly as the properties', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('France')
    expect(labels()).toEqual(['Literacy rate (%)', 'capital_city', 'hasCoast', 'notes'])
    expect(values()).toEqual(['99', 'Paris', 'true', '—'])
    const card = screen.getByRole('status')
    expect(card).not.toHaveTextContent('Geography')
    expect(card).not.toHaveTextContent('Currency')
  })

  it('finds a country by its alpha-3 code, in any case', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Germany'))
    expect(labels()).toEqual(['Population'])
    expect(values()).toEqual(['83000000'])

    fireEvent.click(country(container, 'Japan')) // 'jp'
    expect(labels()).toEqual(['Label'])
  })

  it('shows numbers, text and true / false as they are, and never as markup', () => {
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        countryData={[{ country: 'FR', int: 1234567, float: 0.5, no: false, text: '<img src=x onerror=alert(1)>' }]}
      />,
    )
    fireEvent.click(country(container, 'France'))
    expect(values()).toEqual(['1234567', '0.5', 'false', '<img src=x onerror=alert(1)>'])
    expect(document.querySelector('.rwme-details img')).toBeNull()
  })

  it('hides the "Information on click" radio buttons, which describe the built-in facts', () => {
    render(<ExtendedWorldMap countryData={DATA} />)
    expect(screen.getByRole('group', { name: 'Map colours' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Information on click' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Capital')).not.toBeInTheDocument()
  })

  it('uses the built-in facts when there is no data, whatever detailsSource says', () => {
    const { container } = render(<ExtendedWorldMap showDetails detailsSource="custom" defaultInfoMode="CountryCapital" />)
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
  })
})

describe('detailsSource', () => {
  it("'default' ignores the data (and keeps every country coloured)", () => {
    const { container } = render(
      <ExtendedWorldMap showDetails countryData={DATA} detailsSource="default" defaultInfoMode="CountryCapital" />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(document.querySelector('.rwme-details__custom')).toBeNull()
    expect(style(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
  })

  it("'both' shows your data first, then the built-in facts, and keeps the radio buttons", () => {
    const { container } = render(
      <ExtendedWorldMap showDetails countryData={DATA} detailsSource="both" defaultInfoMode="CountryCapital" />,
    )
    fireEvent.click(country(container, 'France'))
    const card = screen.getByRole('status')
    expect(card).toHaveTextContent('capital_city') // yours
    expect(card).toHaveTextContent('Geography') // the built-in facts
    const headings = Array.from(card.querySelectorAll('h4')).map((heading) => heading.textContent)
    expect(headings.slice(0, 2)).toEqual(['Data', 'Geography']) // yours come first
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
  })

  it('says when a country has no data of your own', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails countryData={DATA} defaultInfoMode="CountryCapital" />,
    )
    fireEvent.click(country(container, 'Brazil'))
    expect(screen.getByRole('status')).toHaveTextContent('No data for Brazil.')

    rerender(<ExtendedWorldMap showDetails countryData={DATA} detailsSource="both" defaultInfoMode="CountryCapital" />)
    expect(screen.getByRole('status')).toHaveTextContent('No custom data for Brazil.')
    expect(screen.getByRole('status')).toHaveTextContent('Brasília') // the built-in facts are still there
  })

  it('says it for an area that has no ISO code and so no data', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Northern Cyprus'))
    expect(screen.getByRole('status')).toHaveTextContent('No data for Northern Cyprus.')
  })
})

describe('countries without data', () => {
  it('are painted grey, the others keep their normal look', () => {
    const { container } = render(<ExtendedWorldMap countryData={DATA} defaultColorMode="Colorful" />)
    expect(style(container, 'Brazil')).toContain('var(--rwme-no-data-fill, #e5e7eb)')
    expect(style(container, 'Northern Cyprus')).toContain('--rwme-no-data-fill')
    for (const name of ['France', 'Germany', 'Japan']) {
      expect(style(container, name)).not.toContain('--rwme-no-data-fill')
    }
  })

  it('can be left as they are', () => {
    const { container } = render(<ExtendedWorldMap countryData={DATA} greyOutCountriesWithoutData={false} />)
    expect(style(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
    expect(document.querySelector('.rwme-legend')).toBeNull()
  })

  it('get a "No data" entry in the legend, next to the colour entries when there are some', () => {
    const first = render(<ExtendedWorldMap countryData={DATA} />)
    expect(document.querySelector('.rwme-legend')).toHaveTextContent('Data')
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['No data'])
    first.unmount()

    const { rerender } = render(
      <ExtendedWorldMap countryData={DATA} defaultColorMode="Colorful" palette="continent" />,
    )
    const entries = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(entries).toContain('Africa')
    expect(entries[entries.length - 1]).toBe('No data')

    rerender(<ExtendedWorldMap countryData={DATA} showLegend={false} />)
    expect(document.querySelector('.rwme-legend')).toBeNull()
  })

  it('stay as they were without data of your own', () => {
    const { container } = render(<ExtendedWorldMap defaultColorMode="Colorful" palette="continent" />)
    expect(style(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })
})

describe('checking the data', () => {
  const BAD = [
    { country: 'FR', fine: 1 },
    { country: 'France', name: 'not a code' },
    { country: 'DE', nested: { a: 1 } },
    'nope',
  ] as unknown as CountryDataRow[]

  it('reports the problems once, with the row and the property, and uses the valid rows', () => {
    const onDataIssues = vi.fn()
    const { container, rerender } = render(<ExtendedWorldMap showDetails countryData={BAD} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(1)
    expect(onDataIssues.mock.calls[0][0]).toEqual([
      { row: 1, property: 'country', message: expect.stringContaining('names are not accepted') },
      { row: 2, property: 'nested', message: expect.stringContaining('must be text, a number') },
      { row: 2, message: expect.stringContaining('no usable values') },
      { row: 3, message: 'Each row must be an object.' },
    ])

    rerender(<ExtendedWorldMap showDetails countryData={BAD} onDataIssues={onDataIssues} />) // same array: not again
    expect(onDataIssues).toHaveBeenCalledTimes(1)

    fireEvent.click(country(container, 'France')) // the valid row works
    expect(labels()).toEqual(['fine'])
    fireEvent.click(country(container, 'Germany')) // the invalid one has no data
    expect(screen.getByRole('status')).toHaveTextContent('No data for Germany.')
  })

  it('reports again for a new array, and not at all for valid data', () => {
    const onDataIssues = vi.fn()
    const { rerender } = render(<ExtendedWorldMap countryData={DATA} onDataIssues={onDataIssues} />)
    expect(onDataIssues).not.toHaveBeenCalled()
    rerender(<ExtendedWorldMap countryData={[...BAD]} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(1)
  })

  it('prints a warning when nobody asked for the problems', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ExtendedWorldMap countryData={BAD} />)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('4 problem(s) in countryData')
    expect(String(warn.mock.calls[0][0])).toContain('row 1 (country)')
  })

  it('keeps the built-in facts when the data is not even an array, and says so', () => {
    const onDataIssues = vi.fn()
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        defaultInfoMode="CountryCapital"
        countryData={{ country: 'FR', a: 1 } as unknown as CountryDataRow[]}
        onDataIssues={onDataIssues}
      />,
    )
    expect(onDataIssues).toHaveBeenCalledWith([{ row: null, message: 'The data must be an array of objects.' }])
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(style(container, 'Brazil')).not.toContain('--rwme-no-data-fill')
  })

  it('treats an empty array as "no country has data"', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={[]} />)
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toHaveTextContent('No data for France.')
  })

  it('follows a new array of data', () => {
    const { container, rerender } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    expect(labels()).toContain('capital_city')
    rerender(<ExtendedWorldMap showDetails countryData={[{ country: 'FR', Different: 'yes' }]} />)
    expect(labels()).toEqual(['Different'])
  })
})

describe('data written inline in a component', () => {
  it('is checked and reported once, even though every render makes a new array (no render loop)', () => {
    let renders = 0
    const Page = () => {
      const [issues, setIssues] = useState<CountryDataIssue[]>([])
      renders += 1
      return (
        <>
          <output>{issues.length}</output>
          <ExtendedWorldMap
            showDetails
            countryData={[{ country: 'FR', a: 1 }, { country: 'nope', a: 2 }]} // a new array each time
            onDataIssues={setIssues}
          />
        </>
      )
    }
    render(<Page />)
    expect(document.querySelector('output')).toHaveTextContent('1')
    expect(renders).toBeLessThan(5) // a handful of renders, not an endless loop
  })

  it('is checked again when its content changes, and not when only the array does', () => {
    const onDataIssues = vi.fn()
    const bad = () => [{ country: 'France', a: 1 }]
    const { rerender } = render(<ExtendedWorldMap countryData={bad()} onDataIssues={onDataIssues} />)
    rerender(<ExtendedWorldMap countryData={bad()} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(1)
    rerender(<ExtendedWorldMap countryData={[{ country: 'Spain', a: 1 }]} onDataIssues={onDataIssues} />)
    expect(onDataIssues).toHaveBeenCalledTimes(2)
  })

  it('keeps working when the data cannot be turned into JSON', () => {
    const circular: Record<string, unknown> = { country: 'FR', a: 1 }
    circular.self = circular
    const onDataIssues = vi.fn()
    expect(() => render(<ExtendedWorldMap countryData={[circular] as unknown as CountryDataRow[]} onDataIssues={onDataIssues} />)).not.toThrow()
    expect(onDataIssues).toHaveBeenCalledTimes(1) // the circular property is reported
  })
})

describe('infoLink in your data', () => {
  it('is the link of the details when it is a web address, and is not shown as a value', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'Japan'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.org/jp')
    expect(labels()).toEqual(['Label'])
  })

  it('falls back to the default link for an address that is not http(s)', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails countryData={[{ country: 'FR', a: 1, infoLink: 'javascript:alert(1)' }]} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/France')
  })

  it('is kept next to the built-in link default when a row has none', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/France')
  })
})

describe('onCountryClick with your data', () => {
  const click = (props: Record<string, unknown>, name: string) => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap countryData={DATA} onCountryClick={onCountryClick} {...props} />)
    fireEvent.click(country(container, name))
    return onCountryClick.mock.calls[0][0]
  }

  it('gets your values (without `country`)', () => {
    expect(click({}, 'France')).toEqual({ 'Literacy rate (%)': 99, capital_city: 'Paris', hasCoast: true, notes: null })
  })

  it('gets undefined for a country without data', () => {
    expect(click({}, 'Brazil')).toBeUndefined()
  })

  it("merges the built-in facts and your values for 'both', yours winning", () => {
    const info = click({ detailsSource: 'both', defaultInfoMode: 'CountryCapital' }, 'France')
    expect(info).toMatchObject({ name: 'France', capital: 'Paris', hasCoast: true })
    const other = click({ detailsSource: 'both', defaultInfoMode: 'CountryCapital' }, 'Brazil')
    expect(other).toMatchObject({ name: 'Brazil', capital: 'Brasília' })
  })

  it("still gets the built-in facts for 'default'", () => {
    expect(click({ detailsSource: 'default', defaultInfoMode: 'CountryCapital' }, 'France')).toMatchObject({ capital: 'Paris' })
  })
})

describe('with several countries selected', () => {
  it('shows each country’s own values in its entry', () => {
    const { container } = render(<ExtendedWorldMap showDetails countryData={DATA} />)
    fireEvent.click(country(container, 'France'))
    shiftClick(country(container, 'Germany'))
    const list = document.querySelector('.rwme-details--list') as HTMLElement
    expect(within(list).getByRole('button', { name: 'Germany' })).toBeInTheDocument()
    expect(labels()).toEqual(['Literacy rate (%)', 'capital_city', 'hasCoast', 'notes', 'Population'])
    fireEvent.click(country(container, 'Brazil'), { shiftKey: true })
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
