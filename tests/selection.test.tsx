import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const isHighlighted = (container: HTMLElement, name: string) =>
  (country(container, name).getAttribute('style') ?? '').includes('var(--rwme-selected-stroke')

const order = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('aria-label'))

describe('selection', () => {
  it('starts at defaultSelectedCountry and follows clicks', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountry="fr" />)
    expect(isHighlighted(container, 'France')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('France')

    fireEvent.click(country(container, 'Germany'))
    expect(isHighlighted(container, 'France')).toBe(false)
    expect(isHighlighted(container, 'Germany')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('Germany')
  })

  it('is controlled by selectedCountry: clicks only report, the parent decides', () => {
    const onSelectionChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails selectedCountry="DE" onSelectionChange={onSelectionChange} />,
    )
    expect(isHighlighted(container, 'Germany')).toBe(true)

    fireEvent.click(country(container, 'France'))
    expect(onSelectionChange).toHaveBeenCalledTimes(1)
    expect(onSelectionChange).toHaveBeenCalledWith('FR')
    expect(isHighlighted(container, 'Germany')).toBe(true) // the parent has not accepted it
    expect(isHighlighted(container, 'France')).toBe(false)

    rerender(<ExtendedWorldMap showDetails selectedCountry="FR" onSelectionChange={onSelectionChange} />)
    expect(isHighlighted(container, 'France')).toBe(true)
    expect(isHighlighted(container, 'Germany')).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('France')
  })

  it('can be changed and cleared from outside without any click', () => {
    const { container, rerender } = render(<ExtendedWorldMap showDetails selectedCountry="DE" />)
    rerender(<ExtendedWorldMap showDetails selectedCountry="JP" />)
    expect(isHighlighted(container, 'Japan')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('Japan')

    rerender(<ExtendedWorldMap showDetails selectedCountry={null} />) // null = controlled, nothing selected
    expect(isHighlighted(container, 'Japan')).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
  })

  it('treats null as "controlled, nothing selected", not as "not controlled"', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap showDetails selectedCountry={null} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(onSelectionChange).toHaveBeenCalledWith('FR')
    expect(isHighlighted(container, 'France')).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
  })

  it('does not report a click on the country that is already selected', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountry="FR" onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(onSelectionChange).not.toHaveBeenCalled()
    fireEvent.click(country(container, 'Germany'))
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('DE')
  })

  it('still reports every click through onCountryClick', () => {
    const onCountryClick = vi.fn()
    const { container } = render(
      <ExtendedWorldMap selectedCountry="FR" onCountryClick={onCountryClick} />,
    )
    fireEvent.click(country(container, 'France'))
    fireEvent.click(country(container, 'France'))
    expect(onCountryClick).toHaveBeenCalledTimes(2)
  })

  it('ignores unknown codes, and handles areas without an ISO code', () => {
    const { container, rerender } = render(<ExtendedWorldMap showDetails selectedCountry="ZZ" />)
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
    expect(container.querySelector('[style*="--rwme-selected-stroke"]')).toBeNull()

    rerender(<ExtendedWorldMap showDetails selectedCountry="CYP" />)
    expect(screen.getByRole('status')).toHaveTextContent('No details available for Northern Cyprus.')
    expect(isHighlighted(container, 'Northern Cyprus')).toBe(true)
  })

  it('draws the controlled country on top, like a clicked one', () => {
    const { container } = render(<ExtendedWorldMap selectedCountry="DE" />)
    expect(order(container)[order(container).length - 1]).toBe('Germany')
  })

  it('opens the overlay for a country selected from outside', () => {
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} selectedCountry={null} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} selectedCountry="FR" />,
    )
    expect(screen.getByRole('dialog', { name: 'Details: France' })).toBeInTheDocument()
    expect(container.querySelector('[inert]')).not.toBeNull()
  })
})
