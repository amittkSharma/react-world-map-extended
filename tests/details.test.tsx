import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CountryDetails, ExtendedWorldMap, type DetailsOptions } from '../src'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const renderMap = (detailsOptions?: DetailsOptions, props = {}) =>
  render(<ExtendedWorldMap showDetails detailsOptions={detailsOptions} {...props} />)

const FRANCE = { name: 'France', detail: { name: 'France', capital: 'Paris' } }

describe('CountryDetails is part of the public API', () => {
  it('renders on its own', () => {
    render(<CountryDetails selection={FRANCE} />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('France')
    expect(screen.getByRole('status')).toHaveTextContent('Paris')
    expect(screen.queryByRole('button', { name: /hide/i })).not.toBeInTheDocument() // no onClose
  })
})

describe('headings and fonts', () => {
  it('uses headingLevel for the name and the next level for the categories', () => {
    render(<CountryDetails selection={FRANCE} headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('France')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Geography')
  })

  it('stops category headings at h6', () => {
    render(<CountryDetails selection={FRANCE} headingLevel={6} />)
    expect(screen.getAllByRole('heading', { level: 6 })).toHaveLength(2)
  })

  it('applies fontFamily and fontStyle to the card, and inherits by default', () => {
    const { rerender } = render(<CountryDetails selection={FRANCE} />)
    expect(screen.getByRole('status').style.fontFamily).toBe('')
    expect(screen.getByRole('status').style.fontStyle).toBe('')

    rerender(<CountryDetails selection={FRANCE} fontFamily="Georgia, serif" fontStyle="italic" />)
    expect(screen.getByRole('status')).toHaveStyle({
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    })
  })

  it('passes headings and fonts through detailsOptions, also to the Show button', () => {
    const { container } = renderMap({
      headingLevel: 1,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    })
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('France')
    expect(screen.getByRole('status')).toHaveStyle({ fontFamily: 'Georgia, serif' })

    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(screen.getByRole('button', { name: /Show details/ })).toHaveStyle({
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    })
  })

  it('accepts className and style for the card', () => {
    renderMap({ className: 'host-card', style: { borderRadius: 0 } })
    expect(screen.getByRole('status')).toHaveClass('rwme-details', 'host-card')
    expect(screen.getByRole('status')).toHaveStyle({ borderRadius: '0px' })
  })
})

describe('show / hide', () => {
  it('hides with the Hide button and comes back with the Show button', () => {
    const { container } = renderMap()
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('status')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show details: France' }))
    expect(screen.getByRole('status')).toHaveTextContent('France')
  })

  it('shows nothing when hidden and no country is selected', () => {
    renderMap({ defaultOpen: false })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument()
  })

  it('reopens when a country is clicked while hidden', () => {
    const { container } = renderMap({ defaultOpen: false })
    fireEvent.click(country(container, 'Germany'))
    expect(screen.getByRole('status')).toHaveTextContent('Germany')
  })

  it('is controlled through open / onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { container, rerender } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ open: true, onOpenChange }} />,
    )
    fireEvent.click(country(container, 'France'))
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('status')).toBeInTheDocument() // the parent has not accepted it

    rerender(<ExtendedWorldMap showDetails detailsOptions={{ open: false, onOpenChange }} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Show details/ }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  it('renders nothing without showDetails', () => {
    const { container } = render(<ExtendedWorldMap detailsOptions={{ position: 'overlay' }} />)
    fireEvent.click(country(container, 'France'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('position', () => {
  const follows = (a: Node, b: Node) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

  it.each([
    ['bottom', 'column', false],
    ['top', 'column', true],
    ['right', 'row', false],
    ['left', 'row', true],
  ] as const)('%s: %s layout, card before the map: %s', (position, direction, cardFirst) => {
    const { container } = renderMap({ position })
    const card = screen.getByRole('status')
    const svg = container.querySelector('svg') as SVGElement
    expect(follows(card, svg)).toBe(cardFirst)
    expect(card.closest('.rwme-layout')).toHaveStyle({ display: 'flex', flexDirection: direction })
  })

  it('gives side cards a fixed width and top/bottom cards the full width', () => {
    const { unmount } = renderMap({ position: 'left' })
    expect(screen.getByRole('status').parentElement?.style.width).toContain('--rwme-panel-width')
    unmount()
    renderMap({ position: 'bottom' })
    expect(screen.getByRole('status').parentElement?.style.width).toBe('100%')
  })

  it.each(['bottom', 'top', 'left', 'right'] as const)(
    '%s: other countries stay clickable and update the card',
    (position) => {
      const onCountryClick = vi.fn()
      const { container } = renderMap({ position }, { onCountryClick })
      fireEvent.click(country(container, 'France'))
      fireEvent.click(country(container, 'Germany'))
      expect(onCountryClick).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('status')).toHaveTextContent('Germany')
      expect(container.querySelector('[inert]')).toBeNull()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    },
  )
})

describe('alignment with the map', () => {
  // jsdom has no layout: report fixed boxes for the layout container and the map's <svg>
  const withBoxes = () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
      }) as DOMRect
    return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this.matches('.rwme-layout')) return rect(10, 10, 1000, 800)
      if (this.matches('.rwme-map')) return rect(10, 10, 1000, 500)
      if (this.matches('svg')) return rect(20, 40, 600, 300) // 10px right of / 30px below the container
      return rect(0, 0, 0, 0)
    })
  }

  it.each(['bottom', 'top'] as const)(
    '%s: the card is as wide as the map and starts at its left edge',
    (position) => {
      const spy = withBoxes()
      renderMap({ position })
      const slot = screen.getByRole('status').parentElement as HTMLElement
      expect(slot).toHaveStyle({ width: '600px', marginLeft: '10px' })
      spy.mockRestore()
    },
  )

  it.each(['left', 'right'] as const)(
    '%s: the card is as tall as the map and starts at its top edge',
    (position) => {
      const spy = withBoxes()
      renderMap({ position })
      const slot = screen.getByRole('status').parentElement as HTMLElement
      expect(slot).toHaveStyle({ height: '300px', marginTop: '30px' })
      expect(screen.getByRole('status')).toHaveStyle({ height: '100%', overflow: 'auto' })
      spy.mockRestore()
    },
  )

  it('overlay: the layer covers the map exactly, and the card is translucent', () => {
    const spy = withBoxes()
    const { container } = renderMap({ position: 'overlay' })
    fireEvent.click(country(container, 'France'))
    expect(document.querySelector('.rwme-overlay')).toHaveStyle({
      left: '10px',
      top: '30px',
      width: '600px',
      height: '300px',
    })
    const card = screen.getByRole('dialog').querySelector('.rwme-details') as HTMLElement
    expect(card).toHaveStyle({ width: '100%', height: '100%' })
    expect(card.style.background).toContain('--rwme-overlay-bg')
    expect(card.style.background).toContain('rgba(')
    spy.mockRestore()
  })

  it('removes the default <figure> margin that pushes the map into a neighbouring card', () => {
    const { container } = renderMap({ position: 'right' })
    expect(container.querySelector('figure')).toHaveStyle({ margin: '0px' })
  })

  it.each([
    [undefined, '1200px'],
    ['xl', '640px'],
    [500, '500px'],
    ['responsive', ''],
  ] as const)(
    'beside the map, a size of %s caps its slot at %s so the card sits flush',
    (size, maxWidth) => {
      const { container } = renderMap({ position: 'right' }, { size })
      const slot = container.querySelector('.rwme-layout > div:first-child') as HTMLElement
      expect(slot.style.maxWidth).toBe(maxWidth)
    },
  )
})

describe('screen-reader semantics of the details card', () => {
  it('is a named status region when it sits in the page', () => {
    const { container } = renderMap({ position: 'bottom' })
    fireEvent.click(country(container, 'France'))
    const card = screen.getByRole('status', { name: 'Country details' })
    expect(card).toHaveTextContent('France')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a status region when used on its own', () => {
    render(<CountryDetails selection={null} />)
    expect(screen.getByRole('status', { name: 'Country details' })).toBeInTheDocument()
  })

  it('in the overlay, the dialog is the only named container: no second status region inside it', () => {
    const { container } = renderMap({ position: 'overlay' })
    fireEvent.click(country(container, 'France'))

    const dialog = screen.getByRole('dialog', { name: 'Details: France' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(dialog.querySelector('[role], [aria-label="Country details"]')).toBeNull() // no nested region role or duplicate name
    expect(dialog.querySelectorAll('[aria-live]')).toHaveLength(1) // updates are still announced, politely
    expect(dialog.querySelector('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('in the overlay, a change made from outside is still announced through the live area', () => {
    const { rerender } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} selectedCountry="FR" />,
    )
    rerender(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} selectedCountry="DE" />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Details: Germany' })
    expect(dialog.querySelector('[aria-live="polite"]')).toHaveTextContent('Germany')
  })

  it('leaves the standalone card a status region unless told it is inside a dialog', () => {
    const { rerender } = render(<CountryDetails selection={null} inDialog />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    rerender(<CountryDetails selection={null} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('narrow components', () => {
  const layoutWidth = (width: number) => {
    const rect = (left: number, top: number, w: number, h: number) =>
      ({ left, top, width: w, height: h, right: left + w, bottom: top + h, x: left, y: top }) as DOMRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.matches('.rwme-layout')) return rect(0, 0, width, 800)
      if (this.matches('.rwme-map')) return rect(0, 0, width, 500)
      if (this.matches('svg')) return rect(0, 0, Math.min(width, 600), 300)
      return rect(0, 0, 0, 0)
    })
  }
  const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['left', 'column', true],
    ['right', 'column', false],
  ] as const)('%s falls back to above/below the map when there is no room beside it', (position, direction, cardFirst) => {
    layoutWidth(600) // below the default 720
    const { container } = renderMap({ position })
    const card = screen.getByRole('status')
    expect(card.closest('.rwme-layout')).toHaveStyle({ flexDirection: direction })
    expect(follows(card, container.querySelector('svg') as SVGElement)).toBe(cardFirst)
    expect(card.parentElement?.style.width).not.toContain('--rwme-panel-width') // full map width, not a side column
  })

  it('keeps the side layout when the component is wide enough', () => {
    layoutWidth(900)
    renderMap({ position: 'right' })
    expect(screen.getByRole('status').closest('.rwme-layout')).toHaveStyle({ flexDirection: 'row' })
  })

  it('lets `stackBelow` move that threshold', () => {
    layoutWidth(600)
    const { unmount } = renderMap({ position: 'right', stackBelow: 400 })
    expect(screen.getByRole('status').closest('.rwme-layout')).toHaveStyle({ flexDirection: 'row' })
    unmount()
    renderMap({ position: 'right', stackBelow: 800 })
    expect(screen.getByRole('status').closest('.rwme-layout')).toHaveStyle({ flexDirection: 'column' })
  })

  it('never touches top, bottom or overlay', () => {
    layoutWidth(300)
    const { unmount } = renderMap({ position: 'top' })
    expect(screen.getByRole('status').closest('.rwme-layout')).toHaveStyle({ flexDirection: 'column' })
    unmount()
    const { container } = renderMap({ position: 'overlay' })
    fireEvent.click(country(container, 'France'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('overlay', () => {
  const open = (props = {}) => {
    const onCountryClick = vi.fn()
    const view = renderMap({ position: 'overlay' }, { onCountryClick, ...props })
    fireEvent.click(country(view.container, 'France'))
    return { ...view, onCountryClick }
  }

  it('opens a modal dialog over the map once a country is selected', () => {
    const { container } = render(
      <ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument() // nothing selected yet
    fireEvent.click(country(container, 'France'))
    const dialog = screen.getByRole('dialog', { name: 'Details: France' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('France')
  })

  it('blocks the map while open: inert, and no other country can be clicked', () => {
    const { container, onCountryClick } = open()
    expect(container.querySelector('[inert]')).toContainElement(container.querySelector('svg'))
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull() // the dialog itself stays usable

    fireEvent.click(country(container, 'Germany'))
    expect(onCountryClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toHaveTextContent('France')
  })

  it.each([
    [
      'the Hide button',
      () => fireEvent.click(screen.getByRole('button', { name: 'Hide details' })),
    ],
    ['Escape', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
  ])('closes with %s and unblocks the map', (_name, close) => {
    const { container, onCountryClick } = open()
    close()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(container.querySelector('[inert]')).toBeNull()

    fireEvent.click(country(container, 'Germany'))
    expect(onCountryClick).toHaveBeenCalledTimes(2)
  })

  it('does not close when the card itself is clicked', () => {
    open()
    fireEvent.click(screen.getByRole('dialog').querySelector('.rwme-details') as Element)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('moves focus into the dialog, keeps Tab inside it, and restores focus on close', async () => {
    const { container } = renderMap({ position: 'overlay' })
    const path = country(container, 'France')
    path.focus()
    fireEvent.keyDown(path, { key: 'Enter' })

    const dialog = screen.getByRole('dialog')
    expect(document.activeElement).toBe(dialog)

    const hide = screen.getByRole('button', { name: 'Hide details' })
    const link = screen.getByRole('link')
    hide.focus()
    fireEvent.keyDown(hide, { key: 'Tab' }) // Hide is first: Tab moves to the next, which the browser does
    link.focus()
    fireEvent.keyDown(link, { key: 'Tab' }) // last element: wraps to the first
    expect(document.activeElement).toBe(hide)
    fireEvent.keyDown(hide, { key: 'Tab', shiftKey: true }) // first element: wraps to the last
    expect(document.activeElement).toBe(link)

    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(document.activeElement).toBe(path))
  })

  it('stays closed after hiding until a country is clicked or Show is pressed', () => {
    const { container } = open()
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show details: France' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(container.querySelector('[inert]')).not.toBeNull()
  })

  it('does not warn when rendered on the server', async () => {
    const { renderToString } = await import('react-dom/server')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderToString(<ExtendedWorldMap showDetails detailsOptions={{ position: 'overlay' }} />)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
