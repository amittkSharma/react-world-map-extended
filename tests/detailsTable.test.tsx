import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'
import { formatNumber } from '../src/lib/colorScale'
import { country, shiftClick } from './helpers'

const SIX = ['FR', 'DE', 'IT', 'ES', 'PL', 'PT']
const table = () => screen.getByRole('table')
const rowNames = () =>
  within(table())
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('rowheader')[0].textContent?.replace('×', '').trim())

const DATA = {
  properties: [{ name: 'Visitors', color: '#0969da' }],
  countries: [
    { country: 'FR', Visitors: 90 },
    { country: 'DE', Visitors: 40 },
    { country: 'IT', Visitors: 65 },
  ],
}

describe('maxSelected', () => {
  it('lets more than five countries be selected when raised', () => {
    const { container } = render(<ExtendedWorldMap maxSelected={7} showDetails />)
    for (const name of ['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Portugal', 'Norway']) {
      shiftClick(country(container, name))
    }
    expect(screen.getByRole('status', { name: 'Selected countries' })).toHaveTextContent('7 of 7')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('blocks the click over a custom limit and says what the limit is', () => {
    const onChange = vi.fn()
    const { container } = render(<ExtendedWorldMap maxSelected={2} onSelectionChange={onChange} />)
    shiftClick(country(container, 'France'))
    shiftClick(country(container, 'Germany'))
    shiftClick(country(container, 'Italy'))
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/up to 2 countries/)).toBeInTheDocument()
  })

  it('has no limit and no message with Infinity', () => {
    const { container } = render(<ExtendedWorldMap maxSelected={Infinity} showDetails />)
    for (const name of ['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Portugal']) {
      shiftClick(country(container, name))
    }
    expect(screen.getByRole('status', { name: 'Selected countries' })).toHaveTextContent(
      '6 selected',
    )
    expect(screen.queryByText(/up to/)).not.toBeInTheDocument()
  })

  it.each([0, -3, Number.NaN, '9' as unknown as number])('falls back to 5 for %s', (value) => {
    const { container } = render(<ExtendedWorldMap maxSelected={value} />)
    for (const name of ['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Portugal']) {
      shiftClick(country(container, name))
    }
    expect(screen.getByText(/up to 5 countries/)).toBeInTheDocument()
  })

  it('cuts a controlled array to the limit and says so', () => {
    render(<ExtendedWorldMap maxSelected={3} selectedCountries={SIX} showDetails />)
    expect(
      screen.getByText('Only the first 3 of 6 selected countries are shown.'),
    ).toBeInTheDocument()
  })

  it('keeps what is selected when the limit drops, and only blocks new ones', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap maxSelected={5} onSelectionChange={onChange} />,
    )
    for (const name of ['France', 'Germany', 'Italy', 'Spain']) shiftClick(country(container, name))
    rerender(<ExtendedWorldMap maxSelected={2} onSelectionChange={onChange} />)
    shiftClick(country(container, 'Poland'))
    expect(onChange).toHaveBeenCalledTimes(4) // no removal, and Poland was blocked
    expect(screen.getByText(/up to 2 countries/)).toBeInTheDocument()
  })
})

describe('details table', () => {
  it('is a list below tableFrom and a table from it', () => {
    const { rerender } = render(
      <ExtendedWorldMap showDetails selectedCountries={SIX.slice(0, 5)} maxSelected={10} />,
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    rerender(<ExtendedWorldMap showDetails selectedCountries={SIX} maxSelected={10} />)
    expect(table()).toBeInTheDocument()
    expect(rowNames()).toEqual(['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Portugal'])
  })

  it('keeps the sort when the table goes away and comes back', () => {
    const element = (codes: string[]) => (
      <ExtendedWorldMap showDetails selectedCountries={codes} maxSelected={10} tableFrom={3} />
    )
    const { rerender } = render(element(['FR', 'DE', 'IT']))
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /Country/ })).getByRole('button'),
    )
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /Country/ })).getByRole('button'),
    )
    expect(rowNames()).toEqual(['Italy', 'Germany', 'France']) // descending by name
    rerender(element(['FR', 'DE'])) // fewer than tableFrom: a list, no table
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    rerender(element(['FR', 'DE', 'IT']))
    expect(rowNames()).toEqual(['Italy', 'Germany', 'France'])
  })

  it('moves the switch with tableFrom', () => {
    render(<ExtendedWorldMap showDetails selectedCountries={['FR', 'DE']} tableFrom={2} />)
    expect(table()).toBeInTheDocument()
  })

  it('has a column per fact and one per property of your own data', () => {
    render(
      <ExtendedWorldMap
        showDetails
        defaultInfoMode="CountryCapital"
        detailsSource="both"
        countryData={DATA}
        selectedCountries={['FR', 'DE', 'IT']}
        tableFrom={2}
      />,
    )
    const headers = within(table())
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(headers.map((text) => text?.trim().replace(/ [▲▼]$/, ''))).toEqual([
      'Country',
      'Capital',
      'Visitors',
      'Remove',
    ])
    expect(within(table()).getByText('Paris')).toBeInTheDocument()
  })

  it('sorts by a header: ascending, descending, then back to the selection order', () => {
    render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="custom"
        selectedCountries={['FR', 'DE', 'IT']}
        tableFrom={2}
      />,
    )
    const header = () => screen.getByRole('columnheader', { name: /Visitors/ })
    const sortButton = () => within(header()).getByRole('button')
    expect(header()).not.toHaveAttribute('aria-sort')
    fireEvent.click(sortButton())
    expect(header()).toHaveAttribute('aria-sort', 'ascending')
    expect(rowNames()).toEqual(['Germany', 'Italy', 'France'])
    fireEvent.click(sortButton())
    expect(header()).toHaveAttribute('aria-sort', 'descending')
    expect(rowNames()).toEqual(['France', 'Italy', 'Germany'])
    fireEvent.click(sortButton())
    expect(header()).not.toHaveAttribute('aria-sort')
    expect(rowNames()).toEqual(['France', 'Germany', 'Italy'])
  })

  it('marks the highest and lowest value of a numeric column, in words too', () => {
    render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="custom"
        selectedCountries={['FR', 'DE', 'IT']}
        tableFrom={2}
      />,
    )
    const rows = within(table()).getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent(/90.*highest in this column/)
    expect(rows[1]).toHaveTextContent(/40.*lowest in this column/)
    expect(rows[2]).not.toHaveTextContent('in this column')
  })

  it('writes large numbers with separators, as the legend does', () => {
    const data = {
      properties: [{ name: 'Population', color: '#0969da' }],
      countries: [
        { country: 'FR', Population: 83000000 },
        { country: 'DE', Population: 1234.5678 },
      ],
    }
    render(
      <ExtendedWorldMap
        showDetails
        countryData={data}
        detailsSource="custom"
        selectedCountries={['FR', 'DE']}
        tableFrom={2}
      />,
    )
    expect(within(table()).getByText(new RegExp(`^${formatNumber(83000000)}`))).toBeInTheDocument()
    expect(table()).toHaveTextContent(formatNumber(1234.5678))
    expect(table()).not.toHaveTextContent('83000000')
  })

  it('lights the row of the country the pointer is over on the map', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails selectedCountries={SIX} maxSelected={10} />,
    )
    const row = () => table().querySelector('tr[data-code="FR"]') as HTMLElement
    expect(row().style.background).not.toContain('highlight')
    fireEvent.mouseOver(country(container, 'France'))
    expect(row().style.background).toContain('--rwme-panel-highlight')
  })

  it('puts the remove button in the last cell of its row, after every column', () => {
    render(
      <ExtendedWorldMap
        showDetails
        countryData={DATA}
        detailsSource="both"
        selectedCountries={['FR', 'DE']}
        tableFrom={2}
      />,
    )
    for (const row of within(table()).getAllByRole('row').slice(1)) {
      const cells = within(row).getAllByRole('cell')
      expect(within(cells[cells.length - 1]).getByRole('button')).toHaveAccessibleName(/^Remove /)
      expect(within(row.querySelector('th') as HTMLElement).queryByRole('button')).toBeNull()
    }
  })

  it('removes a country from its row and clears all', () => {
    const onChange = vi.fn()
    render(
      <ExtendedWorldMap
        showDetails
        defaultSelectedCountries={[...SIX, 'NO']}
        maxSelected={10}
        onSelectionChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove France from the selection' }))
    expect(onChange).toHaveBeenLastCalledWith(['DE', 'IT', 'ES', 'PL', 'PT', 'NO'])
    expect(rowNames()).not.toContain('France')
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
