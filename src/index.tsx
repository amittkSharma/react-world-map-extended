import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { countryCodes, countryNames } from './countries'
import type { CountryDataIssue, CountryDataRow, CountryDataValues } from './countryData'
import { CountryDetails, type DetailsSource, ShowDetailsButton } from './CountryDetails'
import { CountryDetailsList } from './CountryDetailsList'
import { MapColorOptions, type MapColorMode, MapDataOptions, type MapInfoMode } from './constants'
import { MapLegend, type LegendPosition } from './MapLegend'
import { MapToast } from './MapToast'
import { MultiSelectToggle } from './MultiSelectToggle'
import { type CountryColors, type MapPalette, getPaletteColors, getPaletteLegend } from './palettes'
import { defaultMapData } from './rawData/defaultMapData'
import {
  type CountryDetail,
  type InfoLinkResolver,
  getCountryDetail,
} from './rawData/getDefaultMapData'
import type { DetailsOptions, DetailsPosition } from './detailsOptions'
import { trackInputModality, usedKeyboardLast } from './inputModality'
import { useControllableState } from './useControllableState'
import { useCountryData } from './useCountryData'
import { useCountrySelection } from './useCountrySelection'
import { LAYOUT_GAP, useMapBox } from './useMapBox'
import { useInert, useModalDialog } from './useModalDialog'
import { useSingleTooltip } from './useSingleTooltip'
import { WorldMapControls } from './WorldMapControls'
import { useRaiseOnTop } from './useRaiseOnTop'

export { MapColorOptions, MapDataOptions } from './constants'
export type { MapColorMode, MapInfoMode } from './constants'
export type { CountryColors, MapPalette } from './palettes'
export type { LegendPosition } from './MapLegend'
export { getCountryDetail, getWikipediaUrl } from './rawData/getDefaultMapData'
export type { CountryDetail, InfoLinkResolver } from './rawData/getDefaultMapData'
export { CountryDetails } from './CountryDetails'
export type { DetailsSource } from './CountryDetails'
export { COUNTRY_DATA_LIMITS, resolveCountryCode, validateCountryData } from './countryData'
export type {
  CountryDataIssue,
  CountryDataRow,
  CountryDataValue,
  CountryDataValues,
  ValidatedCountryData,
} from './countryData'
export { CountryDetailsList } from './CountryDetailsList'
export type { CountryDetailsListProps, CountrySelection } from './CountryDetailsList'
export { MAX_SELECTED_COUNTRIES } from './selectionLimit'
export type { CountryDetailsProps, HeadingLevel } from './CountryDetails'
export type { DetailsOptions, DetailsPosition } from './detailsOptions'
export { WorldMapControls } from './WorldMapControls'
export type { WorldMapControlsProps } from './WorldMapControls'
export { useWorldMapModes } from './useWorldMapModes'
export type { UseWorldMapModesOptions, WorldMapModes } from './useWorldMapModes'

const WHITE = '#ffffff'

// for text that only screen readers should get
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// Every colour can be themed from outside with these CSS custom properties, e.g.
// `<ExtendedWorldMap style={{ '--rwme-stroke': '#336' }} />`.
const baseStyle: CSSProperties = {
  fill: `var(--rwme-fill, ${WHITE})`,
  fillOpacity: 1,
  stroke: 'var(--rwme-stroke, #000000)',
  strokeWidth: 'var(--rwme-stroke-width, 1.2)',
  strokeOpacity: 0.7,
  cursor: 'pointer',
  // the browser's focus ring is a box around the whole path; keyboard focus is drawn by `focusStyle`
  outline: 'none',
}

const DEFAULT_DIMMED_OPACITY = 0.35

// Non-selected countries while one is selected; the opacity can also be themed from outside
const dimmedStyle = (opacity: number): CSSProperties => ({
  fillOpacity: `var(--rwme-dimmed-opacity, ${opacity})`,
  strokeOpacity: `calc(var(--rwme-dimmed-opacity, ${opacity}) * 0.7)`,
})

// Keyboard focus on a country: follows the country's shape, unlike the browser's focus ring.
// react-svg-worldmap restyles a focused country's border width and opacity (as it does on hover) over
// whatever is set here, so the ring is mostly a glow, which that restyling leaves alone.
const FOCUS_GLOW =
  'drop-shadow(0 0 2px var(--rwme-focus-stroke, #1a73e8)) drop-shadow(0 0 1px var(--rwme-focus-stroke, #1a73e8))'
const focusStyle: CSSProperties = {
  stroke: 'var(--rwme-focus-stroke, #1a73e8)',
  strokeWidth: 'var(--rwme-focus-stroke-width, 3)',
  strokeOpacity: 1,
  filter: FOCUS_GLOW,
}

// Keyboard focus on the selected country: its red outline stays (it is what marks the selection),
// dashed so the focus is visible too
const focusOnSelectedStyle: CSSProperties = { strokeDasharray: '6 3', filter: FOCUS_GLOW }

// Countries without data when only your own data is shown (themeable: `--rwme-no-data-fill`)
const NO_DATA_FILL = 'var(--rwme-no-data-fill, #e5e7eb)'
const noDataStyle: CSSProperties = { fill: NO_DATA_FILL, fillOpacity: 1 }

// The country whose entry in the details list is being pointed at (or the reverse)
const linkedStyle: CSSProperties = {
  strokeOpacity: 1,
  filter: 'drop-shadow(0 0 4px var(--rwme-linked-glow, #f59e0b))',
}

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

// areas that get the library's styled tooltip (every area that has an entry in the map data)
const styledTooltipNames: ReadonlySet<string> = new Set(
  defaultMapData.flatMap(({ country }) => countryNames.get(country.toUpperCase()) ?? []),
)

/** What `onCountryClick` gets: the built-in facts, or your own values (or both merged, yours win). */
export type CountryClickInfo = CountryDetail | CountryDataValues

export type CountryClickContext = CountryContext<string> & { event: MouseEvent<SVGElement, Event> }

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  /** Called on country click. `info` holds the fields of the current `infoMode`; it is
   * `undefined` for areas without an ISO code (Northern Cyprus, Somaliland). */
  onCountryClick?: (info: CountryClickInfo | undefined, context: CountryClickContext) => void
  tooltipText?: (countryContext: CountryContext<string>) => string
  /** The selected countries, as ISO 3166-1 alpha-2 codes (any case), in the order they were selected;
   * at most 5 (`MAX_SELECTED_COUNTRIES`), unknown codes and duplicates are ignored. Controlled when set
   * (`[]` = none); otherwise it starts at `defaultSelectedCountries` and follows the user. A longer
   * array shows its first 5 and a message on the map; it is never changed on your behalf. */
  selectedCountries?: string[]
  defaultSelectedCountries?: string[]
  /** Called with the new list (upper-case codes) when the user changes the selection. Not called for a
   * click that the limit blocks. */
  onSelectionChange?: (countryCodes: string[]) => void
  /** Shows a switch on the map for devices without a Shift key: while it is on, a plain click adds or
   * removes a country. `'auto'` (default) shows it on touch screens only. */
  showMultiSelectToggle?: boolean | 'auto'
  /** Your own values to show in the details: rows of `{ country: 'FR', 'Any label': value, ... }` where
   * `country` is an ISO 3166-1 alpha-2 or alpha-3 code (not a name) and a value is text, a number,
   * true / false or null. The property names are shown as the labels. The data is validated
   * (`validateCountryData`, `schema/country-data.schema.json`): bad rows are left out and reported to
   * `onDataIssues`. Pass the same array between renders. */
  countryData?: readonly CountryDataRow[]
  /** What the details show. `'custom'`: only your data; `'both'`: your data, then the built-in facts;
   * `'default'`: the built-in facts only. Default: `'custom'` when `countryData` is given, else `'default'`. */
  detailsSource?: DetailsSource
  /** Called with what was wrong in `countryData` (once per array). Without it the problems are
   * printed as a console warning. */
  onDataIssues?: (issues: CountryDataIssue[]) => void
  /** With your own data shown, paint countries that have none grey (`--rwme-no-data-fill`) and add
   * "No data" to the legend. Default `true`. */
  greyOutCountriesWithoutData?: boolean
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
  /** Show a legend over a corner of the map saying what the colours mean. Default `true`; it appears
   * only for the `continent` and `region` palettes, in Colorful mode, without custom `colors`
   * (the other schemes have nothing to explain). */
  showLegend?: boolean
  /** Which corner of the map the legend sits in. Default `'bottom-left'`. */
  legendPosition?: LegendPosition
  /** Highlight the selected country. Default `true`. Turning it off also turns off `dimOthers`. */
  highlightSelected?: boolean
  /** When a click clears the selection (the map goes back to its original look):
   * - `'outside'` (default): a click on the map where there is no country, on the empty space
   *   around it, or anywhere outside the component. Clicks on a country, the controls and the
   *   details card never clear it.
   * - `'background'`: only a click on the map or the space around it inside the component.
   * - `'never'`: only `selectedCountries` / clicks on countries change the selection.
   * With two or more countries selected, nothing here clears them (that would be too easy to do by
   * accident): use Escape, "Clear all" or the × of each country.
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
  selectedCountries,
  defaultSelectedCountries,
  onSelectionChange,
  showMultiSelectToggle = 'auto',
  countryData,
  detailsSource,
  onDataIssues,
  greyOutCountriesWithoutData = true,
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
  showLegend = true,
  legendPosition = 'bottom-left',
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
  const selection = useCountrySelection({
    selectedCountries,
    defaultSelectedCountries,
    onSelectionChange,
  })
  const selectedCodes = selection.codes
  const validatedData = useCountryData(countryData, onDataIssues)
  // a `countryData` that is not even an array is ignored (and reported): the built-in facts stay
  const customRows = Array.isArray(countryData) ? validatedData?.rows : undefined
  const source: DetailsSource = customRows ? (detailsSource ?? 'custom') : 'default'
  const showsOwnData = source !== 'default'
  const selectedNames = selectedCodes.map((code) => countryNames.get(code) ?? code)
  const hasSelection = selectedCodes.length > 0
  // pointing at a country's entry in the details list lights it on the map, and the reverse
  const [linkedCode, setLinkedCode] = useState<string | null>(null)
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const [multiMode, setMultiMode] = useState(false)
  const [coarsePointer, setCoarsePointer] = useState(false)
  useEffect(() => {
    setCoarsePointer(window.matchMedia?.('(pointer: coarse)').matches ?? false)
  }, [])
  const rootRef = useRef<HTMLDivElement>(null)
  // the country that has keyboard focus (not mouse focus), to draw its focus ring
  const [focusedCode, setFocusedCode] = useState<string | null>(null)
  useEffect(trackInputModality, [])
  useRaiseOnTop(rootRef, highlightSelected ? selectedNames : [])
  useSingleTooltip(rootRef, styledTooltipNames)

  const {
    position: requestedPosition = 'bottom',
    stackBelow = 720,
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
  const isOverlay = requestedPosition === 'overlay'
  // The overlay covers the map: while it is open nothing behind it may be operated
  const overlayActive = showDetails && isOverlay && detailsOpen && hasSelection
  const closeDetails = () => setDetailsOpen(false)
  useInert(mapRef, overlayActive)
  useModalDialog(dialogRef, overlayActive, closeDetails)

  // Keyboard equivalent of clicking away: Escape with focus on the map or the card (the overlay dialog
  // handles its own Escape and stops it here, so there it only closes the card). Unlike clicking away,
  // it also clears a selection of several countries.
  const onLayoutKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (deselectOn === 'never' || !hasSelection) return
    const fromCard = (event.target as Element).closest('[data-rwme-keep]') !== null
    const first = selectedNames[0]
    selection.clear()
    if (fromCard) {
      // the card's content changes; keep keyboard users in the map, on a country they cleared
      Array.from(mapRef.current?.querySelectorAll('path') ?? [])
        .find((path) => path.getAttribute('aria-label') === first)
        ?.focus({ preventScroll: true })
    }
  }

  // A click that is not on a country, the controls or the card clears a selection of one country.
  // A larger selection is not cleared this way: one stray click would throw it away.
  const clearRef = useRef(selection.clear)
  clearRef.current = selection.clear
  useEffect(() => {
    if (deselectOn === 'never' || overlayActive || selectedCodes.length !== 1) return

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
  }, [deselectOn, overlayActive, selectedCodes.length])

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
  const spotlight = highlightSelected && hasSelection && dimmedOpacity !== undefined

  const getStyle = (context: CountryContext<string>): CSSProperties => {
    const code = context.countryCode.toUpperCase()
    const isSelected = highlightSelected && selectedCodes.includes(code)
    const isDimmed = spotlight && !isSelected
    const computed: CSSProperties = {
      ...baseStyle,
      ...(colorOption === MapColorOptions.COLORFUL && { fill: getFill(context) }),
      ...(showsOwnData && greyOutCountriesWithoutData && !customRows?.has(code) && noDataStyle),
      ...(isSelected && selectedStyle),
      ...(isDimmed && dimmedStyle(dimmedOpacity)),
      ...(focusedCode === code && (isSelected ? focusOnSelectedStyle : focusStyle)),
      ...(linkedCode === code && linkedStyle),
    }
    const overrides =
      typeof styleOverrides === 'function'
        ? styleOverrides(context, { selected: isSelected, dimmed: isDimmed })
        : styleOverrides
    return { ...computed, ...overrides }
  }

  const paletteLegend =
    showLegend && colorOption === MapColorOptions.COLORFUL && !colors
      ? getPaletteLegend(palette)
      : undefined
  const legend =
    showLegend && showsOwnData && greyOutCountriesWithoutData
      ? {
          title: paletteLegend?.title ?? 'Data',
          items: [...(paletteLegend?.items ?? []), { label: 'No data', color: NO_DATA_FILL }],
        }
      : paletteLegend
  const toggleVisible =
    showMultiSelectToggle === true || (showMultiSelectToggle === 'auto' && coarsePointer)
  const box = useMapBox(
    layoutRef,
    mapRef,
    showDetails || legend !== undefined || selection.toast !== null || toggleVisible,
  )
  // A side card needs room: on a narrow component it moves above / below the map instead
  const narrow = box !== null && box.layoutWidth < stackBelow
  const position: DetailsPosition =
    narrow && requestedPosition === 'left'
      ? 'top'
      : narrow && requestedPosition === 'right'
        ? 'bottom'
        : requestedPosition
  const sideways = position === 'left' || position === 'right'
  const detailsFirst = position === 'top' || position === 'left'
  const selections = selectedCodes.map((code) => {
    const custom = customRows?.get(code) ?? null
    const detail = getCountryDetail(
      code,
      source === 'custom' ? MapDataOptions.COUNTRY_NAME : infoOption, // only the name and the link
      getInfoLink,
    )
    // a link of your own wins over the default one, if it is a web address
    const ownLink = typeof custom?.infoLink === 'string' ? custom.infoLink : undefined
    return {
      code,
      name: countryNames.get(code) ?? code,
      detail:
        detail && ownLink && /^https?:\/\//i.test(ownLink.trim())
          ? { ...detail, infoLink: ownLink }
          : detail,
      custom,
      source,
    }
  })
  const cardProps = {
    headingLevel,
    fontFamily,
    fontStyle,
    className: detailsClassName,
    style: {
      ...(isOverlay
        ? overlayCardStyle
        : sideways
          ? { height: '100%', overflow: 'auto' }
          : undefined),
      ...detailsStyle,
    },
    onClose: closeDetails,
    inDialog: isOverlay,
  }
  const card =
    selections.length >= 2 ? (
      <CountryDetailsList
        {...cardProps}
        selections={selections}
        reveal={selection.reveal}
        highlightCode={hoveredCode}
        onLink={setLinkedCode}
        onRemove={selection.remove}
        onClear={selection.clear}
      />
    ) : (
      <CountryDetails
        {...cardProps}
        selection={selections[0] ?? null}
      />
    )
  const selectionLabel =
    selections.length > 1 ? `${selections.length} countries` : (selections[0]?.name ?? '')

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
      detailsSlot = hasSelection && (
        <div data-rwme-keep style={slotStyle}>
          <ShowDetailsButton
            name={selectionLabel}
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
          showInfoModes={source !== 'custom'}
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
          className="rwme-map"
          style={{
            position: 'relative',
            // beside the map: take the remaining width, but no more than the map can use, so a card
            // on its right sits flush against it
            ...(sideways
              ? { flex: '1 1 0', minWidth: 0, maxWidth: getMapMaxWidth(size || 'xxl') }
              : { width: '100%' }),
          }}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: delegates focus events from the focusable countries inside; the wrapper itself is not interactive */}
          <div
            ref={mapRef}
            onFocus={(event: FocusEvent) => {
              const name = (event.target as Element).closest('path')?.getAttribute('aria-label')
              setFocusedCode((name && usedKeyboardLast() && countryCodes.get(name)) || null)
            }}
            onBlur={() => setFocusedCode(null)}
            onMouseOver={(event: MouseEvent) => {
              const name = (event.target as Element).closest('path')?.getAttribute('aria-label')
              const code = name ? countryCodes.get(name) : undefined
              setHoveredCode(code && selectedCodes.includes(code) ? code : null)
            }}
            onMouseOut={() => setHoveredCode(null)}
            // Shift+click would otherwise select the text of the page
            style={{ userSelect: 'none' }}
          >
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
                const { shiftKey, metaKey, ctrlKey } = context.event
                selection.click(code, multiMode || shiftKey || metaKey || ctrlKey)
                const facts = getCountryDetail(code, infoOption, getInfoLink)
                const own = customRows?.get(code)
                onCountryClick?.(
                  source === 'custom'
                    ? own
                    : source === 'both'
                      ? facts || own
                        ? { ...facts, ...own }
                        : undefined
                      : facts,
                  context,
                )
              }}
              tooltipTextFunction={(context) =>
                tooltipText ? tooltipText(context) : context.countryName
              }
              styleFunction={getStyle}
            />
          </div>
          {legend && !overlayActive && (
            // under the translucent overlay card it would only show through as clutter
            <MapLegend {...legend} position={legendPosition} box={box} />
          )}
          {toggleVisible && !overlayActive && (
            <MultiSelectToggle
              on={multiMode}
              onToggle={() => setMultiMode((current) => !current)}
              corner={legendPosition === 'top-left' ? 'bottom-right' : 'top-left'}
              box={box}
            />
          )}
          {selection.toast && (
            <MapToast
              key={selection.toast.id}
              text={selection.toast.text}
              box={box}
              onDismiss={selection.dismissToast}
            />
          )}
          {overlayActive && hasSelection && (
            <div
              className="rwme-overlay"
              style={{
                position: 'absolute',
                zIndex: 10,
                ...(box
                  ? {
                      left: box.inMap.left,
                      top: box.inMap.top,
                      width: box.width,
                      height: box.height,
                    }
                  : { inset: 0 }),
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={
                  selections.length > 1
                    ? `Details: ${selections.length} selected countries`
                    : `Details: ${selectionLabel}`
                }
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
      <div className="rwme-announcer" aria-live="polite" style={visuallyHidden}>
        {selection.announcement}
      </div>
    </div>
  )
}
