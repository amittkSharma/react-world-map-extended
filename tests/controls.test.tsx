import { fireEvent, render, renderHook, screen, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ExtendedWorldMap,
  WorldMapControls,
  type WorldMapControlsProps,
  useWorldMapModes,
} from '../src'
import { countryColors } from '../src/rawData/defaultMapData'

const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

const isHighlighted = (container: HTMLElement, name: string) =>
  (country(container, name).getAttribute('style') ?? '').includes('var(--rwme-selected-stroke')

const props = (overrides: Partial<WorldMapControlsProps> = {}): WorldMapControlsProps => ({
  colorMode: 'BlackAndWhite',
  onColorModeChange: vi.fn(),
  infoMode: 'CountryName',
  onInfoModeChange: vi.fn(),
  ...overrides,
})

describe('<WorldMapControls>', () => {
  it('renders both radio groups, reflecting the given modes', () => {
    render(<WorldMapControls {...props({ colorMode: 'Colorful', infoMode: 'CountryCapital' })} />)
    expect(screen.getByRole('group', { name: 'Map colours' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Information on click' })).toBeInTheDocument()
    expect(screen.getByLabelText('Colorful')).toBeChecked()
    expect(screen.getByLabelText('Capital')).toBeChecked()
    expect(screen.getAllByRole('radio')).toHaveLength(8)
  })

  it('is controlled: it reports the choice and shows only what it is given', () => {
    const p = props()
    const { rerender } = render(<WorldMapControls {...p} />)
    fireEvent.click(screen.getByLabelText('Colorful'))
    fireEvent.click(screen.getByText('Currency Information')) // clicking the label works too
    expect(p.onColorModeChange).toHaveBeenCalledWith('Colorful')
    expect(p.onInfoModeChange).toHaveBeenCalledWith('CountryCurrencyInfo')
    expect(screen.getByLabelText('Black and White')).toBeChecked() // the parent has not accepted it

    rerender(<WorldMapControls {...p} colorMode="Colorful" />)
    expect(screen.getByLabelText('Colorful')).toBeChecked()
  })

  it('takes className and style, and keeps unique radio groups per instance', () => {
    const { container } = render(
      <>
        <WorldMapControls {...props()} className="side" style={{ gap: '4px' }} />
        <WorldMapControls {...props()} />
      </>,
    )
    expect(container.querySelector('.rwme-controls.side')).toHaveStyle({ display: 'flex', gap: '4px' })
    const names = screen.getAllByRole('radio').map((radio) => radio.getAttribute('name'))
    expect(new Set(names).size).toBe(4)
  })

  it('is what <ExtendedWorldMap> renders itself, so the two look the same', () => {
    const { container } = render(<ExtendedWorldMap />)
    expect(container.querySelector('.rwme-controls')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(8)
  })
})

describe('useWorldMapModes', () => {
  it('starts at the defaults, or at the given modes', () => {
    expect(renderHook(() => useWorldMapModes()).result.current).toMatchObject({
      colorMode: 'BlackAndWhite',
      infoMode: 'CountryName',
    })
    const custom = renderHook(() =>
      useWorldMapModes({ defaultColorMode: 'Colorful', defaultInfoMode: 'CountryCompleteInfo' }),
    )
    expect(custom.result.current).toMatchObject({
      colorMode: 'Colorful',
      infoMode: 'CountryCompleteInfo',
    })
  })

  it('updates through the change handlers, which keep their identity', () => {
    const { result } = renderHook(() => useWorldMapModes())
    const { onColorModeChange, onInfoModeChange } = result.current

    act(() => onColorModeChange('Colorful'))
    act(() => onInfoModeChange('CountryCapital'))
    expect(result.current).toMatchObject({ colorMode: 'Colorful', infoMode: 'CountryCapital' })
    expect(result.current.onColorModeChange).toBe(onColorModeChange)
    expect(result.current.onInfoModeChange).toBe(onInfoModeChange)
  })
})

describe('controls apart from the map', () => {
  const Page = ({ onCountryClick }: { onCountryClick?: () => void }) => {
    const modes = useWorldMapModes()
    return (
      <>
        <aside>
          <WorldMapControls {...modes} />
        </aside>
        <ExtendedWorldMap showControls={false} onCountryClick={onCountryClick} {...modes} />
      </>
    )
  }

  it('drive the map through one spread of the hook result', () => {
    const onCountryClick = vi.fn()
    const { container } = render(<Page onCountryClick={onCountryClick} />)
    expect(screen.getAllByRole('radio')).toHaveLength(8) // the map shows none of its own

    expect(country(container, 'France').getAttribute('style')).toContain('var(--rwme-fill')
    fireEvent.click(screen.getByLabelText('Colorful'))
    expect(country(container, 'France')).toHaveStyle({ fill: countryColors.FR as string })

    fireEvent.click(screen.getByLabelText('Capital'))
    fireEvent.click(country(container, 'France'))
    expect(onCountryClick.mock.calls[0][0]).toMatchObject({ name: 'France', capital: 'Paris' })
  })

  it('never clear the map’s selection when used, although they sit outside it', () => {
    const { container } = render(<Page />)
    fireEvent.click(country(container, 'France'))
    expect(isHighlighted(container, 'France')).toBe(true)

    fireEvent.click(screen.getByLabelText('Colorful'))
    fireEvent.click(screen.getByText('Capital'))
    expect(isHighlighted(container, 'France')).toBe(true)

    fireEvent.click(document.body) // while the page itself still clears it
    expect(isHighlighted(container, 'France')).toBe(false)
  })
})
