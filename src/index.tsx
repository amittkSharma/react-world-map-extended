import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from 'react'
import WorldMap, { regions } from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { CountryDetails, ShowDetailsButton } from './CountryDetails'
import {
  MapColorOptions,
  type MapColorMode,
  MapDataOptions,
  type MapInfoMode,
} from './constants'
import { type CountryColors, type MapPalette, getPaletteColors } from './palettes'
import { defaultMapData } from './rawData/defaultMapData'
import {
  type CountryDetail,
  type InfoLinkResolver,
  getCountryDetail,
} from './rawData/getDefaultMapData'
import type { DetailsOptions } from './detailsOptions'
import { useControllableState } from './useControllableState'
import { LAYOUT_GAP, useMapBox } from './useMapBox'
import { useInert, useModalDialog } from './useModalDialog'
import { WorldMapControls } from './WorldMapControls'
import { useRaiseOnTop } from './useRaiseOnTop'

export { MapColorOptions, MapDataOptions } from './constants'
export type { MapColorMode, MapInfoMode } from './constants'
export type { CountryColors, MapPalette } from './palettes'
export { getCountryDetail, getWikipediaUrl } from './rawData/getDefaultMapData'
export type { CountryDetail, InfoLinkResolver } from './rawData/getDefaultMapData'
export { CountryDetails } from './CountryDetails'
export type { CountryDetailsProps, HeadingLevel } from './CountryDetails'
export type { DetailsOptions, DetailsPosition } from './detailsOptions'
export { WorldMapControls } from './WorldMapControls'
export type { WorldMapControlsProps } from './WorldMapControls'
export { useWorldMapModes } from './useWorldMapModes'
export type { UseWorldMapModesOptions, WorldMapModes } from './useWorldMapModes'

const WHITE = '#ffffff'

// Every colour can be themed from outside with these CSS custom properties, e.g.
// `<ExtendedWorldMap style={{ '--rwme-stroke': '#336' }} />`.
const baseStyle: CSSProperties = {
  fill: `var(--rwme-fill, ${WHITE})`,
  fillOpacity: 1,
  stroke: 'var(--rwme-stroke, #000000)',
  strokeWidth: 'var(--rwme-stroke-width, 1.2)',
  strokeOpacity: 0.7,
  cursor: 'pointer',
  outline: 'none',
}

const DEFAULT_DIMMED_OPACITY = 0.35

// Non-selected countries while one is selected; the opacity can also be themed from outside
const dimmedStyle = (opacity: number): CSSProperties => ({
  fillOpacity: `var(--rwme-dimmed-opacity, ${opacity})`,
  strokeOpacity: `calc(var(--rwme-dimmed-opacity, ${opacity}) * 0.7)`,
})

const selectedStyle: CSSProperties = {
  stroke: 'var(--rwme-selected-stroke, #d62828)',
  strokeWidth: 'var(--rwme-selected-stroke-width, 2.5)',
  strokeOpacity: 1,
}

// The overlay card IS the dimmed layer: it covers the map exactly, translucent so the map shows through
const overlayCardStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'auto',
  padding: '1.5rem',
  border: 'none',
  borderLeft: 'none',
  borderRadius: 0,
  background: 'var(--rwme-overlay-bg, rgba(255, 255, 255, 0.82))',
  backdropFilter: 'blur(3px)',
}

// Widths react-svg-worldmap gives its size presets (the map is never wider than this). Mirrored here
// only to keep a side card next to the map; if the library changes them the map still fits.
const presetWidths: Record<SizeOption, number> = { sm: 240, md: 336, lg: 480, xl: 640, xxl: 1200 }

/** Widest the map can be, or undefined when it depends on the window (`'responsive'`). */
const getMapMaxWidth = (size: SizeOption | 'responsive' | number) =>
  typeof size === 'number' ? size : size === 'responsive' ? undefined : presetWidths[size]

const countryNames = new Map(regions.map((region) => [region.code.toUpperCase(), region.name]))

// `undefined` (not given) must stay distinct from `null` (given: nothing selected)
const toCode = (value: string | null | undefined) =>
  value === undefined ? undefined : (value?.toUpperCase() ?? null)

export type CountryClickContext = CountryContext<string> & { event: MouseEvent<SVGElement, Event> }

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  /** Called on country click. `info` holds the fields of the current `infoMode`; it is
   * `undefined` for areas without an ISO code (Northern Cyprus, Somaliland). */
  onCountryClick?: (info: CountryDetail | undefined, context: CountryClickContext) => void
  tooltipText?: (countryContext: CountryContext<string>) => string
  /** The highlighted country and the one shown in the details card, as an ISO 3166-1 alpha-2 code
   * (any case). Controlled when set (`null` = none); otherwise it starts at `defaultSelectedCountry`
   * and follows the user's clicks. Unknown codes select nothing. */
  selectedCountry?: string | null
  defaultSelectedCountry?: string | null
  /** Called with the (upper-case) code when a click selects a different country. */
  onSelectionChange?: (countryCode: string | null) => void
  mapFrame?: boolean
  /** Where `infoLink` (a field of the country details) points. Default: the country's English Wikipedia
   * page. Return `undefined` for no link. */
  getInfoLink?: InfoLinkResolver
  interaction?: boolean

  /** Show the colour/information radio groups above the map. Default `true`. */
  showControls?: boolean
  /** Colour mode. Controlled when set; otherwise use `defaultColorMode`. */
  colorMode?: MapColorMode
  defaultColorMode?: MapColorMode
  onColorModeChange?: (mode: MapColorMode) => void
  /** Which fields a click reports. Controlled when set; otherwise use `defaultInfoMode`. */
  infoMode?: MapInfoMode
  defaultInfoMode?: MapInfoMode
  onInfoModeChange?: (mode: MapInfoMode) => void

  /** Built-in colour scheme for 'Colorful' mode. Default `'default'`. */
  palette?: MapPalette
  /** Colours for 'Colorful' mode, by ISO alpha-2 code (upper case) or per country; wins over `palette`. */
  colors?: CountryColors | ((context: CountryContext<string>) => string | undefined)
  /** Highlight the selected country. Default `true`. Turning it off also turns off `dimOthers`. */
  highlightSelected?: boolean
  /** When a click clears the selection (the map goes back to its original look):
   * - `'outside'` (default): a click on the map where there is no country, on the empty space
   *   around it, or anywhere outside the component. Clicks on a country, the controls and the
   *   details card never clear it.
   * - `'background'`: only a click on the map or the space around it inside the component.
   * - `'never'`: only `selectedCountry` / a click on another country changes the selection.
   * Not active while the `overlay` card is open (close it with Hide or Escape). */
  deselectOn?: 'outside' | 'background' | 'never'
  /** While a country is selected, fade all the others so it stands out. `true` (default) uses
   * opacity 0.35, a number sets the opacity (0–1), `false` turns it off. Themeable with
   * `--rwme-dimmed-opacity`. */
  dimOthers?: boolean | number
  /** Show a card with the clicked country's details. Default `false`; see `detailsOptions`. */
  showDetails?: boolean
  /** Position, visibility toggle, headings and fonts of the details card. */
  detailsOptions?: DetailsOptions
  /** Merged over the computed country style (applied last). */
  styleOverrides?:
    | CSSProperties
    | ((
        context: CountryContext<string>,
        state: { selected: boolean; dimmed: boolean },
      ) => CSSProperties)
  className?: string
  style?: CSSProperties
}

export const ExtendedWorldMap = ({
  title,
  size,
  onCountryClick,
  tooltipText,
  selectedCountry,
  defaultSelectedCountry,
  onSelectionChange,
  mapFrame = false,
  getInfoLink,
  interaction = true,
  showControls = true,
  colorMode,
  defaultColorMode = MapColorOptions.BLACK_AND_WHITE,
  onColorModeChange,
  infoMode,
  defaultInfoMode = MapDataOptions.COUNTRY_NAME,
  onInfoModeChange,
  palette = 'default',
  colors,
  highlightSelected = true,
  dimOthers = true,
  deselectOn = 'outside',
  showDetails = false,
  detailsOptions,
  styleOverrides,
  className,
  style,
}: ExtendedWorldMapProps) => {
  const [colorOption, setColorOption] = useControllableState<MapColorMode>(
    colorMode,
    defaultColorMode,
    onColorModeChange,
  )
  const [infoOption, setInfoOption] = useControllableState<MapInfoMode>(
    infoMode,
    defaultInfoMode,
    onInfoModeChange,
  )
  const [selectedCode, setSelectedCode] = useControllableState<string | null>(
    toCode(selectedCountry),
    toCode(defaultSelectedCountry) ?? null,
    onSelectionChange,
  )
  const selectedName = selectedCode ? countryNames.get(selectedCode) : undefined
  const selected = selectedCode && selectedName ? { code: selectedCode, name: selectedName } : null
  const rootRef = useRef<HTMLDivElement>(null)
  useRaiseOnTop(rootRef, highlightSelected ? selected?.name : undefined)

  const {
    position = 'bottom',
    open,
    defaultOpen = true,
    onOpenChange,
    headingLevel,
    fontFamily,
    fontStyle,
    className: detailsClassName,
    style: detailsStyle,
  } = detailsOptions ?? {}
  const [detailsOpen, setDetailsOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  )
  const layoutRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const isOverlay = position === 'overlay'
  // The overlay covers the map: while it is open nothing behind it may be operated
  const overlayActive = showDetails && isOverlay && detailsOpen && selected !== null
  const closeDetails = () => setDetailsOpen(false)
  useInert(mapRef, overlayActive)
  useModalDialog(dialogRef, overlayActive, closeDetails)

  // A click that is not on a country, the controls or the card clears the selection
  const clearSelection = () => {
    if (selectedCode !== null) setSelectedCode(null)
  }

  // Keyboard equivalent: Escape with focus on the map or the card (the overlay dialog handles its
  // own Escape and stops it here, so there it only closes the card)
  const onLayoutKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (deselectOn === 'never' || selected === null) return
    const fromCard = (event.target as Element).closest('[data-rwme-keep]') !== null
    clearSelection()
    if (fromCard) {
      // the card's content changes; keep keyboard users in the map, on the country they cleared
      Array.from(mapRef.current?.querySelectorAll('path') ?? [])
        .find((path) => path.getAttribute('aria-label') === selected.name)
        ?.focus({ preventScroll: true })
    }
  }
  const clearRef = useRef(clearSelection)
  clearRef.current = clearSelection
  useEffect(() => {
    if (deselectOn === 'never' || overlayActive || selectedCode === null) return

    const onDocumentClick = (event: globalThis.MouseEvent) => {
      const root = rootRef.current
      const target = event.target as Element | null
      // a handler of this very click may have removed its target (e.g. the Hide button)
      if (!root || !target?.isConnected) return
      const inside = root.contains(target)
      if (inside && target.closest('path')) return // a country: its own click handler decides
      // controls and details card, including a <WorldMapControls> placed elsewhere on the page
      if (target.closest('[data-rwme-keep]')) return
      if (!inside && deselectOn === 'background') return
      clearRef.current()
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [deselectOn, overlayActive, selectedCode])

  const paletteColors = getPaletteColors(palette)

  const getFill = (context: CountryContext<string>) => {
    const code = context.countryCode.toUpperCase() as keyof CountryColors
    const custom = typeof colors === 'function' ? colors(context) : colors?.[code]
    return custom ?? paletteColors[code] ?? WHITE
  }

  const dimmedOpacity =
    dimOthers === false
      ? undefined
      : dimOthers === true
        ? DEFAULT_DIMMED_OPACITY
        : Math.min(1, Math.max(0, dimOthers))
  const spotlight = highlightSelected && selected !== null && dimmedOpacity !== undefined

  const getStyle = (context: CountryContext<string>): CSSProperties => {
    const isSelected = highlightSelected && selected?.code === context.countryCode.toUpperCase()
    const isDimmed = spotlight && !isSelected
    const computed: CSSProperties = {
      ...baseStyle,
      ...(colorOption === MapColorOptions.COLORFUL && { fill: getFill(context) }),
      ...(isSelected && selectedStyle),
      ...(isDimmed && dimmedStyle(dimmedOpacity)),
    }
    const overrides =
      typeof styleOverrides === 'function'
        ? styleOverrides(context, { selected: isSelected, dimmed: isDimmed })
        : styleOverrides
    return { ...computed, ...overrides }
  }

  const box = useMapBox(layoutRef, mapRef, showDetails)
  const sideways = position === 'left' || position === 'right'
  const detailsFirst = position === 'top' || position === 'left'
  const selection = selected && {
    name: selected.name,
    detail: getCountryDetail(selected.code, infoOption, getInfoLink),
  }
  const card = (
    <CountryDetails
      selection={selection}
      headingLevel={headingLevel}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      className={detailsClassName}
      style={{
        ...(isOverlay
          ? overlayCardStyle
          : sideways
            ? { height: '100%', overflow: 'auto' }
            : undefined),
        ...detailsStyle,
      }}
      onClose={closeDetails}
    />
  )

  // The slot positions the card against the map's real <svg> box: same width above/below it,
  // same height (and top edge) beside it
  const slotStyle: CSSProperties = sideways
    ? {
        flex: '0 0 var(--rwme-panel-width, 20rem)',
        width: 'var(--rwme-panel-width, 20rem)',
        marginTop: box?.top,
        height: box?.height,
      }
    : { width: box?.width ?? '100%', marginLeft: box?.left }

  let detailsSlot: ReactNode = null
  if (showDetails && !overlayActive) {
    if (!detailsOpen) {
      detailsSlot = selection && (
        <div data-rwme-keep style={slotStyle}>
          <ShowDetailsButton
            name={selection.name}
            onClick={() => setDetailsOpen(true)}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
          />
        </div>
      )
    } else if (!isOverlay) {
      detailsSlot = (
        <div data-rwme-keep style={slotStyle}>
          {card}
        </div>
      )
    }
  }

  return (
    <div ref={rootRef} className={className} style={style}>
      {showControls && (
        <WorldMapControls
          colorMode={colorOption}
          onColorModeChange={setColorOption}
          infoMode={infoOption}
          onInfoModeChange={setInfoOption}
        />
      )}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: delegates Escape from the focusable countries and card controls inside; the wrapper itself is not interactive */}
      <div
        ref={layoutRef}
        className="rwme-layout"
        onKeyDown={onLayoutKeyDown}
        style={{
          display: 'flex',
          flexDirection: sideways ? 'row' : 'column',
          alignItems: 'flex-start',
          gap: LAYOUT_GAP,
          marginTop: showControls ? LAYOUT_GAP / 2 : undefined,
        }}
      >
        {detailsFirst && detailsSlot}
        <div
          style={{
            position: 'relative',
            // beside the map: take the remaining width, but no more than the map can use, so a card
            // on its right sits flush against it
            ...(sideways
              ? { flex: '1 1 0', minWidth: 0, maxWidth: getMapMaxWidth(size || 'xxl') }
              : { width: '100%' }),
          }}
        >
          <div ref={mapRef}>
            <WorldMap
              color={WHITE}
              size={size || 'xxl'}
              title={title || 'World Map'}
              data={defaultMapData}
              richInteraction={interaction}
              frame={mapFrame}
              onClickFunction={(context) => {
                if (overlayActive) return
                if (showDetails && !detailsOpen) setDetailsOpen(true)
                const code = context.countryCode.toUpperCase()
                if (code !== selectedCode) setSelectedCode(code)
                onCountryClick?.(getCountryDetail(code, infoOption, getInfoLink), context)
              }}
              tooltipTextFunction={(context) =>
                tooltipText ? tooltipText(context) : context.countryName
              }
              styleFunction={getStyle}
            />
          </div>
          {overlayActive && selection && (
            <div
              className="rwme-overlay"
              style={{
                position: 'absolute',
                zIndex: 10,
                ...(box
                  ? { left: box.left, top: box.top, width: box.width, height: box.height }
                  : { inset: 0 }),
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Details: ${selection.name}`}
                tabIndex={-1}
                style={{ width: '100%', height: '100%', outline: 'none' }}
              >
                {card}
              </div>
            </div>
          )}
        </div>
        {!detailsFirst && detailsSlot}
      </div>
    </div>
  )
}
