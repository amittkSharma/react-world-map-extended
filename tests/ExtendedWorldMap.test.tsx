import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'
import { countryColors } from '../src/data/defaultMapData'
import { country } from './helpers'

describe('ExtendedWorldMap', () => {
  it('renders two radio groups with their own legends', () => {
    render(<ExtendedWorldMap />)
    expect(screen.getByRole('group', { name: 'Map colours' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    expect(screen.getByLabelText('Black and White')).toBeChecked()
    expect(screen.getByLabelText('Only Name')).toBeChecked()
  })

  it('selects the matching radio when its label is clicked', () => {
    render(<ExtendedWorldMap />)
    fireEvent.click(screen.getByText('Capital'))
    expect(screen.getByLabelText('Capital')).toBeChecked()
    expect(screen.getByLabelText('Only Name')).not.toBeChecked()
  })

  it('keeps radio group names unique per group and per instance', () => {
    render(
      <>
        <ExtendedWorldMap />
        <ExtendedWorldMap />
      </>,
    )
    const names = screen.getAllByRole('radio').map((radio) => radio.getAttribute('name'))
    expect(new Set(names).size).toBe(4)
  })

  it('switches fills between black-and-white and colourful', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(country(container, 'France').getAttribute('style')).toContain(
      'fill: var(--rwme-fill, #ffffff)',
    )
    fireEvent.click(screen.getByLabelText('Colorful'))
    expect(country(container, 'France')).toHaveStyle({ fill: countryColors.FR as string })
  })

  it('reports details for the clicked country, as chosen in the selector', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap onCountryClick={onCountryClick} />)
    fireEvent.click(country(container, 'France'))
    expect(onCountryClick.mock.calls[0][0]).toEqual({
      name: 'France',
      infoLink: 'https://en.wikipedia.org/wiki/France',
    })

    fireEvent.click(screen.getByLabelText('Capital'))
    fireEvent.click(country(container, 'France'))
    expect(onCountryClick.mock.calls[1][0]).toEqual({
      name: 'France',
      capital: 'Paris',
      infoLink: 'https://en.wikipedia.org/wiki/France',
    })
  })

  it('finds details for countries whose map name differs from the data source', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap onCountryClick={onCountryClick} />)
    fireEvent.click(country(container, 'Democratic Republic of the Congo'))
    expect(onCountryClick.mock.calls[0][0].name).toBe('Democratic Republic of the Congo')
  })
})
