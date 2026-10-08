import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExtendedWorldMap, MAX_SELECTED_COUNTRIES } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const style = (container: HTMLElement, name: string) =>
  country(container, name).getAttribute('style') ?? ''

const selectedNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path'))
    .filter((path) => (path.getAttribute('style') ?? '').includes('var(--rwme-selected-stroke'))
    .map((path) => path.getAttribute('aria-label'))

const shiftClick = (element: Element) => fireEvent.click(element, { shiftKey: true })

const FIVE = ['France', 'Germany', 'Italy', 'Spain', 'Poland']
const addAll = (container: HTMLElement, names: string[]) => {
  fireEvent.click(country(container, names[0]))
  for (const name of names.slice(1)) shiftClick(country(container, name))
}

const toastText = () => document.querySelector('.rwme-toast span')?.textContent ?? null
const announcement = () => document.querySelector('.rwme-announcer')?.textContent ?? ''
// the entry of a country in the details list (the country on the map is a button of the same name)
const header = (name: string) =>
  within(document.querySelector('.rwme-details--list') as HTMLElement).getByRole('button', { name })

afterEach(() => vi.useRealTimers())

describe('selecting several countries', () => {
  it('shift+click adds a country, in the order they were selected', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(<ExtendedWorldMap onSelectionChange={onSelectionChange} />)
    fireEvent.click(country(container, 'France'))
    shiftClick(country(container, 'Germany'))
    shiftClick(country(container, 'Italy'))

    expect(selectedNames(container).sort()).toEqual(['France', 'Germany', 'Italy'])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['FR', 'DE', 'IT'])
  })

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
  ])('%s+click adds a country too', (_key, modifiers) => {
    const { container } = render(<ExtendedWorldMap />)
    fireEvent.click(country(container, 'France'))
    fireEvent.click(country(container, 'Germany'), modifiers)
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
  })

  it('shift+click on a selected country removes it', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR', 'DE', 'IT']} onSelectionChange={onSelectionChange} />,
    )
    shiftClick(country(container, 'Germany'))
    expect(selectedNames(container).sort()).toEqual(['France', 'Italy'])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['FR', 'IT'])
  })

  it('a plain click on a country that is not selected replaces the whole selection', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR', 'DE']} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(country(container, 'Japan'))
    expect(selectedNames(container)).toEqual(['Japan'])
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(['JP'])
  })

  it('a plain click on the only selected country changes nothing', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR']} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.click(country(container, 'France'))
    expect(selectedNames(container)).toEqual(['France'])
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('starts from defaultSelectedCountries, ignoring unknown codes and duplicates', () => {
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['fr', 'FR', 'ZZ', 'de']} />,
    )
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
  })

  it('still reports every click through onCountryClick', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<ExtendedWorldMap onCountryClick={onCountryClick} />)
    addAll(container, ['France', 'Germany'])
    fireEvent.click(country(container, 'France')) // pops it up, selection unchanged
    expect(onCountryClick).toHaveBeenCalledTimes(3)
  })

  it('keyboard: Shift+Enter adds the focused country, plain Enter replaces', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountries={['FR']} />)
    const germany = country(container, 'Germany')
    germany.focus()
    fireEvent.keyDown(germany, { key: 'Enter', shiftKey: true })
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])

    const italy = country(container, 'Italy')
    italy.focus()
    fireEvent.keyDown(italy, { key: 'Enter' })
    expect(selectedNames(container)).toEqual(['Italy'])
  })

  it('builds on the previous click even when several arrive before the next render', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(<ExtendedWorldMap onSelectionChange={onSelectionChange} />)
    act(() => {
      country(container, 'Germany').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      country(container, 'France').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
      country(container, 'Italy').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    })
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany', 'Italy'])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['DE', 'FR', 'IT'])
  })

  it('a controlled parent that refuses a batch of clicks still wins', () => {
    const { container } = render(<ExtendedWorldMap selectedCountries={['FR']} onSelectionChange={() => {}} />)
    act(() => {
      country(container, 'Germany').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
      country(container, 'Italy').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    })
    expect(selectedNames(container)).toEqual(['France'])
  })

  it('stops text being selected by Shift+click', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(container.querySelector('.rwme-map > div')).toHaveStyle({ userSelect: 'none' })
  })
})

describe('the limit of five', () => {
  it('is five', () => {
    expect(MAX_SELECTED_COUNTRIES).toBe(5)
  })

  it('blocks a sixth country with a message on the map, and does not report it', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(<ExtendedWorldMap onSelectionChange={onSelectionChange} />)
    addAll(container, FIVE)
    onSelectionChange.mockClear()

    shiftClick(country(container, 'Japan'))
    expect(selectedNames(container).sort()).toEqual([...FIVE].sort())
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(toastText()).toContain('up to 5 countries')
    expect(announcement()).not.toContain('up to 5') // the toast is read out; saying it twice would be noise
  })

  it('shows the message in the map’s top-right corner, as a polite status', () => {
    const { container } = render(<ExtendedWorldMap />)
    addAll(container, FIVE)
    shiftClick(country(container, 'Japan'))
    const toast = document.querySelector('.rwme-toast') as HTMLElement
    expect(toast).toHaveAttribute('role', 'status')
    expect(toast).toHaveAttribute('aria-live', 'polite')
    expect(toast).toHaveStyle({ position: 'absolute', right: '8px', top: '8px' }) // before the map is measured
    expect(toast.closest('.rwme-map')).not.toBeNull() // on the map itself
  })

  it('has one message at a time and can be dismissed', () => {
    const { container } = render(<ExtendedWorldMap />)
    addAll(container, FIVE)
    shiftClick(country(container, 'Japan'))
    shiftClick(country(container, 'Brazil'))
    expect(document.querySelectorAll('.rwme-toast')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }))
    expect(toastText()).toBeNull()
  })

  it('closes itself after a while, but not while the pointer is on it', () => {
    vi.useFakeTimers()
    const { container } = render(<ExtendedWorldMap />)
    addAll(container, FIVE)
    shiftClick(country(container, 'Japan'))

    const toast = document.querySelector('.rwme-toast') as HTMLElement
    fireEvent.mouseEnter(toast)
    act(() => vi.advanceTimersByTime(20000))
    expect(toastText()).not.toBeNull()

    fireEvent.mouseLeave(toast)
    act(() => vi.advanceTimersByTime(5900))
    expect(toastText()).not.toBeNull()
    act(() => vi.advanceTimersByTime(200))
    expect(toastText()).toBeNull()
  })

  it('a longer controlled array shows its first five, says so, and is never written back', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap
        selectedCountries={['FR', 'DE', 'IT', 'ES', 'PL', 'JP', 'BR']}
        onSelectionChange={onSelectionChange}
      />,
    )
    expect(selectedNames(container).sort()).toEqual([...FIVE].sort())
    expect(toastText()).toBe('Only the first 5 of 7 selected countries are shown.')
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('does not count duplicates or unknown codes towards it', () => {
    const { container } = render(
      <ExtendedWorldMap selectedCountries={['FR', 'fr', 'ZZ', 'DE', 'IT', 'ES', 'PL']} />,
    )
    expect(selectedNames(container)).toHaveLength(5)
    expect(toastText()).toBeNull()
  })
})

describe('controlled selection', () => {
  it('reports a shift+click but lets the parent decide', () => {
    const onSelectionChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap selectedCountries={['FR']} onSelectionChange={onSelectionChange} />,
    )
    shiftClick(country(container, 'Germany'))
    expect(onSelectionChange).toHaveBeenCalledWith(['FR', 'DE'])
    expect(selectedNames(container)).toEqual(['France'])

    rerender(<ExtendedWorldMap selectedCountries={['FR', 'DE']} onSelectionChange={onSelectionChange} />)
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
  })
})

describe('clearing', () => {
  it('does not treat dismissing the message as a click away from the selection', () => {
    const { container } = render(<ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE', 'IT', 'ES', 'PL']} />)
    shiftClick(country(container, 'Japan')) // the limit: a message appears
    for (const name of ['Germany', 'Italy', 'Spain', 'Poland']) {
      fireEvent.click(screen.getByRole('button', { name: `Remove ${name} from the selection` }))
    }
    expect(selectedNames(container)).toEqual(['France']) // a single country: clicking away would clear it
    expect(toastText()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }))
    expect(toastText()).toBeNull()
    expect(selectedNames(container)).toEqual(['France'])
  })

  it('Escape clears every selected country', () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR', 'DE', 'IT']} onSelectionChange={onSelectionChange} />,
    )
    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(selectedNames(container)).toEqual([])
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith([])
  })

  it('a click on the empty map, or outside, does not clear two or more countries', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountries={['FR', 'DE']} />)
    fireEvent.click(container.querySelector('svg') as SVGElement)
    fireEvent.click(document.body)
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
  })

  it('but still clears a single country, as before', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountries={['FR']} />)
    fireEvent.click(container.querySelector('svg') as SVGElement)
    expect(selectedNames(container)).toEqual([])
  })

  it("Escape does nothing with deselectOn='never'", () => {
    const { container } = render(
      <ExtendedWorldMap defaultSelectedCountries={['FR', 'DE']} deselectOn="never" />,
    )
    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(selectedNames(container)).toHaveLength(2)
  })
})

describe('looks of a larger selection', () => {
  it('outlines every selected country and fades all the others', () => {
    const { container } = render(<ExtendedWorldMap defaultSelectedCountries={['FR', 'DE']} />)
    const total = container.querySelectorAll('path').length
    const dimmed = Array.from(container.querySelectorAll('path')).filter((path) =>
      (path.getAttribute('style') ?? '').includes('--rwme-dimmed-opacity'),
    )
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
    expect(dimmed).toHaveLength(total - 2)
  })

  it('draws the selected countries last, in selection order, and puts them back', () => {
    const order = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('aria-label'))
    const { container } = render(<ExtendedWorldMap />)
    const original = order(container)

    addAll(container, ['Germany', 'France', 'Italy'])
    expect(order(container).slice(-3)).toEqual(['Germany', 'France', 'Italy'])

    fireEvent.keyDown(country(container, 'France'), { key: 'Escape' })
    expect(order(container)).toEqual(original)
  })

  it('puts neighbours back where they were, whichever order they were selected in', () => {
    const order = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('aria-label') as string)
    const { container } = render(<ExtendedWorldMap />)
    const original = order(container)
    const [first, second, third] = original.slice(40, 43) // three neighbours in the drawing order

    for (const picked of [
      [first, second],
      [second, first],
      [first, second, third],
      [third, first, second],
    ]) {
      addAll(container, picked)
      fireEvent.keyDown(country(container, picked[0]), { key: 'Escape' })
      expect(order(container)).toEqual(original)
    }
  })

  it('lights a country on the map while its entry in the details list is pointed at, and the reverse', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails defaultSelectedCountries={['FR', 'DE']} />,
    )
    expect(style(container, 'France')).not.toContain('--rwme-linked-glow')
    fireEvent.mouseEnter(header('France'))
    expect(style(container, 'France')).toContain('--rwme-linked-glow')
    expect(style(container, 'Germany')).not.toContain('--rwme-linked-glow')
    fireEvent.mouseLeave(header('France'))
    expect(style(container, 'France')).not.toContain('--rwme-linked-glow')

    const item = document.querySelector('.rwme-details__item[data-code="DE"]') as HTMLElement
    expect(item.style.background).toBe('')
    fireEvent.mouseOver(country(container, 'Germany'))
    expect(item.style.background).toContain('--rwme-panel-highlight')
    fireEvent.mouseOut(country(container, 'Germany'))
    expect(item.style.background).toBe('')

    fireEvent.mouseOver(country(container, 'Japan')) // not selected: nothing to light
    expect(document.querySelectorAll('.rwme-details__item[style*="highlight"]')).toHaveLength(0)
  })
})

describe('the switch for devices without a Shift key', () => {
  const coarse = (matches: boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: matches && query.includes('coarse') }))
  afterEach(() => vi.unstubAllGlobals())

  it('is not shown without a touch screen, unless asked for', () => {
    const { rerender } = render(<ExtendedWorldMap />)
    expect(screen.queryByRole('button', { name: /Select multiple/ })).not.toBeInTheDocument()
    rerender(<ExtendedWorldMap showMultiSelectToggle />)
    expect(screen.getByRole('button', { name: /Select multiple/ })).toBeInTheDocument()
  })

  it('is shown on a touch screen, and not when switched off', () => {
    coarse(true)
    const { rerender } = render(<ExtendedWorldMap />)
    expect(screen.getByRole('button', { name: /Select multiple/ })).toBeInTheDocument()
    rerender(<ExtendedWorldMap showMultiSelectToggle={false} />)
    expect(screen.queryByRole('button', { name: /Select multiple/ })).not.toBeInTheDocument()
  })

  it('makes a plain click add and remove countries while it is on', () => {
    const { container } = render(<ExtendedWorldMap showMultiSelectToggle />)
    const toggle = screen.getByRole('button', { name: /Select multiple/ })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(country(container, 'France'))
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(country(container, 'Germany'))
    expect(selectedNames(container).sort()).toEqual(['France', 'Germany'])
    fireEvent.click(country(container, 'France'))
    expect(selectedNames(container)).toEqual(['Germany'])

    fireEvent.click(toggle) // off again: a plain click replaces
    fireEvent.click(country(container, 'Japan'))
    expect(selectedNames(container)).toEqual(['Japan'])
  })

  it('moves out of the way of a legend in the top-left corner', () => {
    render(<ExtendedWorldMap showMultiSelectToggle legendPosition="top-left" />)
    expect(screen.getByRole('button', { name: /Select multiple/ })).toHaveStyle({ right: '8px', bottom: '8px' })
  })
})

describe('announcements for screen readers', () => {
  it('say what changed and how many are selected', () => {
    const { container } = render(<ExtendedWorldMap />)
    fireEvent.click(country(container, 'France'))
    expect(announcement()).toBe('France selected')
    shiftClick(country(container, 'Germany'))
    expect(announcement()).toBe('Germany added, 2 of 5 selected')
    shiftClick(country(container, 'France'))
    expect(announcement()).toBe('France removed, 1 of 5 selected')
    shiftClick(country(container, 'Germany'))
    expect(announcement()).toBe('Germany removed, nothing selected')
  })

  it('uses a polite live area that is not another status region', () => {
    render(<ExtendedWorldMap showDetails />)
    const live = document.querySelector('.rwme-announcer') as HTMLElement
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live).not.toHaveAttribute('role')
  })
})
