import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CountryDetailsList, ExtendedWorldMap } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const list = () => document.querySelector('.rwme-details--list') as HTMLElement
// the entry of a country in the list (the country on the map is a button of the same name)
const header = (name: string) => within(list()).getByRole('button', { name })
const panel = (name: string) =>
  document.getElementById(header(name).getAttribute('aria-controls') as string) as HTMLElement
const isOpen = (name: string) => header(name).getAttribute('aria-expanded') === 'true'

const shiftClick = (element: Element) => fireEvent.click(element, { shiftKey: true })

const FRANCE = { code: 'FR', name: 'France', detail: { name: 'France', capital: 'Paris' } }
const GERMANY = { code: 'DE', name: 'Germany', detail: { name: 'Germany', capital: 'Berlin' } }
const ITALY = { code: 'IT', name: 'Italy', detail: { name: 'Italy', capital: 'Rome' } }

describe('details of several countries', () => {
  it('is a list with the country name as the header of each entry, and a counter', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultInfoMode="CountryCapital" />)
    fireEvent.click(country(container, 'France'))
    expect(screen.queryByRole('status', { name: 'Selected countries' })).not.toBeInTheDocument() // one country: the usual card

    shiftClick(country(container, 'Germany'))
    expect(screen.getByRole('status', { name: 'Selected countries' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Selected countries')
    expect(list()).toHaveTextContent('2 of 5')
    expect(header('France')).toBeInTheDocument()
    expect(header('Germany')).toBeInTheDocument()
  })

  it('opens the newest country by itself and closes the older ones, every time one is added', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultInfoMode="CountryCapital" />)
    const openOnes = () =>
      Array.from(document.querySelectorAll('.rwme-details__item'))
        .filter((item) => item.querySelector('button')?.getAttribute('aria-expanded') === 'true')
        .map((item) => item.getAttribute('data-code'))

    fireEvent.click(country(container, 'France'))
    shiftClick(country(container, 'Germany'))
    expect(openOnes()).toEqual(['DE'])
    expect(panel('Germany')).toBeVisible()
    expect(panel('Germany')).toHaveTextContent('Berlin')
    expect(panel('France')).not.toBeVisible()

    shiftClick(country(container, 'Italy'))
    expect(openOnes()).toEqual(['IT']) // Germany closed when Italy was added
    shiftClick(country(container, 'Spain'))
    expect(openOnes()).toEqual(['ES'])
    shiftClick(country(container, 'Poland'))
    expect(openOnes()).toEqual(['PL'])
  })

  it('still lets you open several by hand, and keeps them when one is removed', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE', 'IT']} />)
    fireEvent.click(header('France'))
    fireEvent.click(header('Germany'))
    expect(isOpen('France') && isOpen('Germany') && isOpen('Italy')).toBe(true)

    shiftClick(country(container, 'Italy')) // remove one: the others keep their state
    expect(isOpen('France')).toBe(true)
    expect(isOpen('Germany')).toBe(true)
  })

  it('opens and closes an entry from its header', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />)
    expect(container).toBeTruthy()
    fireEvent.click(header('France'))
    expect(isOpen('France')).toBe(true)
    fireEvent.click(header('France'))
    expect(isOpen('France')).toBe(false)
  })

  it('pops up a country in the details when it is clicked on the map, if it is already selected', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        defaultSelectedCountries={['FR', 'DE', 'IT']}
        onSelectionChange={onSelectionChange}
      />,
    )
    expect(isOpen('Germany')).toBe(false)
    fireEvent.click(country(container, 'Germany'))

    expect(isOpen('Germany')).toBe(true)
    expect(onSelectionChange).not.toHaveBeenCalled() // the selection is untouched

    fireEvent.click(header('Germany')) // closed by hand ...
    expect(isOpen('Germany')).toBe(false)
    fireEvent.click(country(container, 'Germany')) // ... and popped up again by the next click
    expect(isOpen('Germany')).toBe(true)
  })

  it('also reopens a hidden details card for that click', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(document.querySelector('.rwme-details--list')).toBeNull()
    expect(screen.getByRole('button', { name: 'Show details: 2 countries' })).toBeInTheDocument()

    fireEvent.click(country(container, 'France'))
    expect(isOpen('France')).toBe(true)
  })

  it('scrolls the popped-up entry into view inside a card that scrolls, never the page', () => {
    vi.useFakeTimers()
    const pageScroll = vi.fn()
    Element.prototype.scrollIntoView = pageScroll
    const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top }) as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.matches('.rwme-details')) return rect(0, 300) // the card's visible window
      if (this.matches('[data-code="FR"]')) return rect(420, 470) // the entry is below it
      return rect(0, 0)
    })
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        detailsOptions={{ position: 'left', stackBelow: 0 }}
        defaultSelectedCountries={['FR', 'DE']}
      />,
    )
    const card = document.querySelector('.rwme-details') as HTMLElement // the side card: overflow auto
    Object.defineProperty(card, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(card, 'clientHeight', { value: 300, configurable: true })

    fireEvent.click(country(container, 'France'))
    act(() => vi.advanceTimersByTime(50))
    expect(card.scrollTop).toBe(170) // 470 - 300
    expect(pageScroll).not.toHaveBeenCalled()

    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('leaves the page alone when no card scrolls', () => {
    const pageScroll = vi.fn()
    Element.prototype.scrollIntoView = pageScroll
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />)
    fireEvent.click(country(container, 'France'))
    expect(pageScroll).not.toHaveBeenCalled()
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  })

  it('removes one country with its ×, and goes back to the usual card at one', () => {
    const onSelectionChange = vi.fn()
    render(
      <ExtendedWorldMap
        showDetails
        defaultSelectedCountries={['FR', 'DE']}
        onSelectionChange={onSelectionChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove France from the selection' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['DE'])
    expect(document.querySelector('.rwme-details--list')).toBeNull()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Germany')
  })

  it('clears everything with "Clear all"', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap
        showDetails
        defaultSelectedCountries={['FR', 'DE', 'IT']}
        onSelectionChange={onSelectionChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
    expect(screen.getByRole('status')).toHaveTextContent('Click a country')
    expect(container.querySelector('[style*="--rwme-selected-stroke"]')).toBeNull()
  })

  it('shows what is known about an area without details', () => {
    render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'CYP']} />)
    fireEvent.click(header('Northern Cyprus'))
    expect(panel('Northern Cyprus')).toHaveTextContent('No details available for Northern Cyprus.')
  })

  it('follows the information mode for every country', () => {
    render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />)
    fireEvent.click(header('France'))
    expect(panel('France')).not.toHaveTextContent('Paris')
    fireEvent.click(screen.getByLabelText('Capital'))
    expect(panel('France')).toHaveTextContent('Paris')
    expect(panel('Germany')).toHaveTextContent('Berlin')
  })

  it('has accessible disclosure markup', () => {
    render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />)
    const button = header('France')
    expect(button).toHaveAttribute('aria-controls', panel('France').id)
    expect(panel('France')).toHaveAttribute('aria-labelledby', button.id)
    expect(button.closest('h4')).not.toBeNull() // entry headings sit one level below the list's heading
  })

  it('is announced as one dialog in the overlay position', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} />,
    )
    fireEvent.click(country(container, 'France'))
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    fireEvent.click(screen.getByRole('button', { name: /Show details/ }))
    expect(screen.getByRole('dialog', { name: 'Details: France' })).toBeInTheDocument()
  })

  it('names the overlay dialog by the number of countries', () => {
    render(
      <ExtendedWorldMap
        showDetails
        detailsOptions={{ position: 'overlay' }}
        defaultSelectedCountries={['FR', 'DE']}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Details: 2 selected countries' })
    expect(dialog.querySelector('[role="status"]')).toBeNull() // the list is a plain live area inside it
    expect(dialog.querySelector('.rwme-details--list')).toHaveAttribute('aria-live', 'polite')
  })

  it('tells people how to select more, on the empty card', () => {
    render(<ExtendedWorldMap showDetails />)
    expect(screen.getByRole('status')).toHaveTextContent('Shift+click')
    expect(screen.getByRole('status')).toHaveTextContent('up to 5 countries')
  })
})

describe('<CountryDetailsList> on its own', () => {
  const selections = [FRANCE, GERMANY, ITALY]

  it('lists the countries and opens the last one', () => {
    render(<CountryDetailsList selections={selections} />)
    expect(screen.getByRole('status', { name: 'Selected countries' })).toBeInTheDocument()
    expect(list()).toHaveTextContent('3 of 5')
    expect(isOpen('Italy')).toBe(true)
    expect(isOpen('France')).toBe(false)
  })

  it('shows a button only when it is given something to call', () => {
    const { rerender } = render(<CountryDetailsList selections={selections} />)
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hide details' })).not.toBeInTheDocument()

    const onRemove = vi.fn()
    const onClear = vi.fn()
    const onClose = vi.fn()
    rerender(<CountryDetailsList selections={selections} onRemove={onRemove} onClear={onClear} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Italy from the selection' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(onRemove).toHaveBeenCalledWith('IT')
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('opens a country when asked to, and again for a new request', () => {
    const { rerender } = render(<CountryDetailsList selections={selections} reveal={null} />)
    rerender(<CountryDetailsList selections={selections} reveal={{ code: 'FR', key: 1 }} />)
    expect(isOpen('France')).toBe(true)
    fireEvent.click(header('France'))
    expect(isOpen('France')).toBe(false)
    rerender(<CountryDetailsList selections={selections} reveal={{ code: 'FR', key: 2 }} />)
    expect(isOpen('France')).toBe(true)
  })

  it('reports the entry the pointer or keyboard is on', () => {
    const onLink = vi.fn()
    render(<CountryDetailsList selections={selections} onLink={onLink} />)
    fireEvent.mouseEnter(header('France'))
    expect(onLink).toHaveBeenLastCalledWith('FR')
    fireEvent.mouseLeave(header('France'))
    expect(onLink).toHaveBeenLastCalledWith(null)
    fireEvent.focus(header('Italy'))
    expect(onLink).toHaveBeenLastCalledWith('IT')
  })

  it('marks the highlighted country', () => {
    render(<CountryDetailsList selections={selections} highlightCode="DE" />)
    expect(document.querySelector('[data-code="DE"]')).toHaveStyle({ background: 'var(--rwme-panel-highlight, #eef4ff)' })
    expect((document.querySelector('[data-code="FR"]') as HTMLElement).style.background).toBe('')
  })

  it('takes heading levels, fonts and styling like the single card', () => {
    render(
      <CountryDetailsList
        selections={selections}
        headingLevel={2}
        fontFamily="Georgia, serif"
        fontStyle="italic"
        className="mine"
        style={{ borderRadius: 0 }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Selected countries')
    expect(header('France').closest('h3')).not.toBeNull()
    expect(list()).toHaveClass('rwme-details', 'mine')
    expect(list()).toHaveStyle({ fontFamily: 'Georgia, serif', fontStyle: 'italic', borderRadius: '0px' })
  })

  it('drops its own status role inside a dialog', () => {
    render(<CountryDetailsList selections={selections} inDialog />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(list()).toHaveAttribute('aria-live', 'polite')
  })

  it('closes the others when a country is added, and opens every country added together', () => {
    const { rerender } = render(<CountryDetailsList selections={[FRANCE, GERMANY]} />)
    fireEvent.click(header('France')) // France opened by hand next to Germany
    expect(isOpen('France') && isOpen('Germany')).toBe(true)

    rerender(<CountryDetailsList selections={[FRANCE, GERMANY, ITALY]} />)
    expect(isOpen('Italy')).toBe(true)
    expect(isOpen('France') || isOpen('Germany')).toBe(false)

    rerender(<CountryDetailsList selections={[FRANCE, GERMANY, ITALY, { code: 'ES', name: 'Spain', detail: undefined }, { code: 'PL', name: 'Poland', detail: undefined }]} />)
    expect(isOpen('Spain') && isOpen('Poland')).toBe(true) // two added at once: both open
    expect(isOpen('Italy')).toBe(false)
  })

  it('forgets removed countries and opens added ones', () => {
    const { rerender } = render(<CountryDetailsList selections={[FRANCE, GERMANY]} />)
    rerender(<CountryDetailsList selections={[FRANCE, GERMANY, ITALY]} />)
    expect(isOpen('Italy')).toBe(true)
    rerender(<CountryDetailsList selections={[FRANCE, ITALY]} />)
    expect(screen.queryByRole('button', { name: 'Germany' })).not.toBeInTheDocument()
    expect(isOpen('Italy')).toBe(true)
  })
})
