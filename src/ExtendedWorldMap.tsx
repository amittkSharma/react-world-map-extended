import { useEffect, useRef, useState } from 'react'
import WorldMap from 'react-svg-worldmap'
import { CountryDetails } from './components/CountryDetails'
import { CountryDetailsList } from './components/CountryDetailsList'
import { CountryDetailsTable, type TableSort } from './components/CountryDetailsTable'
import { DetailsSlot } from './components/DetailsSlot'
import { MapLegend } from './components/MapLegend'
import { MapToast } from './components/MapToast'
import { MultiSelectToggle } from './components/MultiSelectToggle'
import { OverlayDialog } from './components/OverlayDialog'
import { WorldMapControls } from './components/WorldMapControls'
import { type MapColorMode, MapColorOptions, MapDataOptions, type MapInfoMode } from './constants'
import { defaultMapData } from './data/defaultMapData'
import type { CountryClickContext, ExtendedWorldMapProps } from './ExtendedWorldMapProps'
import { useCoarsePointer } from './hooks/useCoarsePointer'
import { useControllableState } from './hooks/useControllableState'
import { useCountryPointer } from './hooks/useCountryPointer'
import { useCountrySelection } from './hooks/useCountrySelection'
import { useDeselect } from './hooks/useDeselect'
import { LAYOUT_GAP, useMapBox } from './hooks/useMapBox'
import { useInert, useModalDialog } from './hooks/useModalDialog'
import { useOwnData } from './hooks/useOwnData'
import { useRaiseOnTop } from './hooks/useRaiseOnTop'
import { useSingleTooltip } from './hooks/useSingleTooltip'
import { buildSelections, clickInfo } from './lib/cardSelections'
import { countryNames, styledTooltipNames } from './lib/countries'
import { createCountryStyle, dimmedOpacityFor } from './lib/countryStyle'
import { resolvePosition, slotStyle } from './lib/detailsLayout'
import { trackInputModality } from './lib/inputModality'
import { buildMapLegend } from './lib/mapLegend'
import { getMapMaxWidth } from './lib/mapSize'
import { MAX_SELECTED_COUNTRIES, resolveCount, TABLE_FROM } from './lib/selectionLimit'
import { overlayCardStyle, visuallyHidden, WHITE } from './styles/mapStyles'

export const ExtendedWorldMap = ({
  title,
  size,
  onCountryClick,
  tooltipText,
  selectedCountries,
  defaultSelectedCountries,
  onSelectionChange,
  maxSelected,
  tableFrom,
  showMultiSelectToggle = 'auto',
  countryData,
  dataProperty,
  defaultDataProperty,
  onDataPropertyChange,
  detailsSource,
  onDataIssues,
  greyOutCountriesWithoutData = true,
  mapFrame = false,
  getInfoLink,
  interaction = true,
  showControls = true,
  colorMode,
  defaultColorMode,
  onColorModeChange,
  infoMode,
  defaultInfoMode = MapDataOptions.COUNTRY_NAME,
  onInfoModeChange,
  palette = 'default',
  colors,
  showLegend = true,
  legendPosition = 'bottom-left',
  highlightSelected = true,
  dimOthers,
  deselectOn = 'outside',
  showDetails = false,
  detailsOptions,
  styleOverrides,
  className,
  style,
}: ExtendedWorldMapProps) => {
  const max = resolveCount(maxSelected, MAX_SELECTED_COUNTRIES)
  const selection = useCountrySelection({
    max,
    selectedCountries,
    defaultSelectedCountries,
    onSelectionChange,
  })
  const selectedCodes = selection.codes
  const hasSelection = selectedCodes.length > 0
  const selectedNames = selectedCodes.map((code) => countryNames.get(code) ?? code)
  const own = useOwnData({
    countryData,
    detailsSource,
    dataProperty,
    defaultDataProperty,
    onDataPropertyChange,
    onDataIssues,
  })

  // Until the visitor (or `colorMode`) chooses, the map is colourful when your own data colours it
  const [colorChoice, setColorChoice] = useControllableState<MapColorMode | undefined>(
    colorMode,
    defaultColorMode,
    (mode) => mode && onColorModeChange?.(mode),
  )
  const colorOption =
    colorChoice ?? (own.property ? MapColorOptions.COLORFUL : MapColorOptions.BLACK_AND_WHITE)
  const colorful = colorOption === MapColorOptions.COLORFUL
  const [infoOption, setInfoOption] = useControllableState<MapInfoMode>(
    infoMode,
    defaultInfoMode,
    onInfoModeChange,
  )

  const {
    position: requestedPosition = 'bottom',
    stackBelow = 720,
    open,
    defaultOpen = true,
    onOpenChange,
    ...appearance
  } = detailsOptions ?? {}
  const [detailsOpen, setDetailsOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  )
  const closeDetails = () => setDetailsOpen(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const isOverlay = requestedPosition === 'overlay'
  // The overlay covers the map: while it is open nothing behind it may be operated
  const overlayActive = showDetails && isOverlay && detailsOpen && hasSelection
  useInert(mapRef, overlayActive)
  useModalDialog(dialogRef, overlayActive, closeDetails)
  useEffect(trackInputModality, [])
  useRaiseOnTop(rootRef, highlightSelected ? selectedNames : [])
  useSingleTooltip(rootRef, styledTooltipNames)
  const onLayoutKeyDown = useDeselect({
    rootRef,
    mapRef,
    mode: deselectOn,
    overlayActive,
    selectedCodes,
    selectedNames,
    clear: selection.clear,
  })

  const coarsePointer = useCoarsePointer()
  const [multiMode, setMultiMode] = useState(false)
  // kept here, not in the table, so the order is still there when the table comes back
  const [tableSort, setTableSort] = useState<TableSort | null>(null)
  // pointing at a country's entry in the details list lights it on the map, and the reverse
  const [linkedCode, setLinkedCode] = useState<string | null>(null)
  const { focusedCode, hoveredCode, handlers: pointerHandlers } = useCountryPointer(selectedCodes)

  const getStyle = createCountryStyle({
    colorful,
    palette,
    colors,
    property: own.property,
    numberFor: own.numberFor,
    greyOutCountriesWithoutData,
    selectedCodes,
    highlightSelected,
    // fading changes the shades, which carry the meaning when your own data colours the map
    dimmedOpacity: dimmedOpacityFor(dimOthers ?? !own.property),
    focusedCode,
    linkedCode,
    styleOverrides,
  })
  const legend = buildMapLegend({
    showLegend,
    colorful,
    hasCustomColors: Boolean(colors),
    palette,
    activeProperty: own.property,
    greyOutCountriesWithoutData,
  })
  const toggleVisible =
    showMultiSelectToggle === true || (showMultiSelectToggle === 'auto' && coarsePointer)
  const box = useMapBox(
    layoutRef,
    mapRef,
    showDetails || legend !== undefined || selection.toast !== null || toggleVisible,
  )

  const mapSize = size || 'xxl'
  const position = resolvePosition(requestedPosition, box?.layoutWidth, stackBelow)
  const sideways = position === 'left' || position === 'right'
  const detailsFirst = position === 'top' || position === 'left'

  const selections = buildSelections(selectedCodes, {
    source: own.source,
    rows: own.rows,
    infoMode: infoOption,
    getInfoLink,
    firstProperty: own.property?.name,
  })
  const several = selections.length > 1
  const cardProps = {
    ...appearance,
    style: {
      ...(isOverlay ? overlayCardStyle : sideways && { height: '100%', overflow: 'auto' }),
      ...appearance.style,
    },
    onClose: closeDetails,
    inDialog: isOverlay,
  }
  const manyProps = {
    ...cardProps,
    selections,
    max,
    reveal: selection.reveal,
    highlightCode: hoveredCode,
    onLink: setLinkedCode,
    onRemove: selection.remove,
    onClear: selection.clear,
  }
  const asTable = selections.length >= resolveCount(tableFrom, TABLE_FROM, 2)
  const card = !several ? (
    <CountryDetails {...cardProps} selection={selections[0] ?? null} max={max} />
  ) : asTable ? (
    <CountryDetailsTable {...manyProps} sort={tableSort} onSortChange={setTableSort} />
  ) : (
    <CountryDetailsList {...manyProps} />
  )
  const cardLabel = several ? `${selections.length} countries` : (selections[0]?.name ?? '')

  const showSlot = showDetails && !overlayActive && !(isOverlay && detailsOpen)
  const detailsSlot = showSlot && (
    <DetailsSlot
      open={detailsOpen}
      hasSelection={hasSelection}
      hiddenLabel={cardLabel}
      onShow={() => setDetailsOpen(true)}
      style={slotStyle(sideways, box)}
      fontFamily={appearance.fontFamily}
      fontStyle={appearance.fontStyle}
    >
      {card}
    </DetailsSlot>
  )

  const onMapClick = (context: CountryClickContext) => {
    if (overlayActive) return
    if (showDetails && !detailsOpen) setDetailsOpen(true)
    const code = context.countryCode.toUpperCase()
    const { shiftKey, metaKey, ctrlKey } = context.event
    selection.click(code, multiMode || shiftKey || metaKey || ctrlKey)
    onCountryClick?.(
      clickInfo(code, { source: own.source, rows: own.rows, infoMode: infoOption, getInfoLink }),
      context,
    )
  }

  return (
    <div ref={rootRef} className={className} style={style}>
      {showControls && (
        <WorldMapControls
          showInfoModes={own.source !== 'custom'}
          properties={own.properties.map(({ name }) => name)}
          dataProperty={own.property?.name}
          onDataPropertyChange={own.chooseProperty}
          colorMode={colorOption}
          onColorModeChange={setColorChoice}
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
              ? { flex: '1 1 0', minWidth: 0, maxWidth: getMapMaxWidth(mapSize) }
              : { width: '100%' }),
          }}
        >
          <div
            ref={mapRef}
            {...pointerHandlers}
            // Shift+click would otherwise select the text of the page
            style={{ userSelect: 'none' }}
          >
            <WorldMap
              color={WHITE}
              size={mapSize}
              title={title || 'World Map'}
              data={defaultMapData}
              richInteraction={interaction}
              frame={mapFrame}
              onClickFunction={onMapClick}
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
          {overlayActive && (
            <OverlayDialog
              dialogRef={dialogRef}
              box={box}
              label={
                several
                  ? `Details: ${selections.length} selected countries`
                  : `Details: ${cardLabel}`
              }
            >
              {card}
            </OverlayDialog>
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
