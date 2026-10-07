import { type CSSProperties, type MouseEvent, useId, useRef, useState } from 'react'
import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { CountryDetails } from './CountryDetails'
import {
  MapColorOptions,
  type MapColorMode,
  MapDataOptions,
  type MapInfoMode,
  mapColorOptions,
  mapDataOptions,
} from './constants'
import { type CountryColors, type MapPalette, getPaletteColors } from './palettes'
import { defaultMapData } from './rawData/defaultMapData'
import {
  type CountryDetail,
  type InfoLinkResolver,
  getCountryDetail,
} from './rawData/getDefaultMapData'
import { useControllableState } from './useControllableState'
import { useRaiseOnTop } from './useRaiseOnTop'
import { UserOptions } from './userOptions'

export { MapColorOptions, MapDataOptions } from './constants'
export type { MapColorMode, MapInfoMode } from './constants'
export type { CountryColors, MapPalette } from './palettes'
export { getCountryDetail, getWikipediaUrl } from './rawData/getDefaultMapData'
export type { CountryDetail, InfoLinkResolver } from './rawData/getDefaultMapData'

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

const selectedStyle: CSSProperties = {
  stroke: 'var(--rwme-selected-stroke, #d62828)',
  strokeWidth: 'var(--rwme-selected-stroke-width, 2.5)',
  strokeOpacity: 1,
}

export type CountryClickContext = CountryContext<string> & { event: MouseEvent<SVGElement, Event> }

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  /** @deprecated Use `onCountryClick`; this receives the details as a JSON string. */
  onClick?: (value: string) => void
  /** Called on country click. `info` holds the fields of the current `infoMode`; it is
   * `undefined` for areas without an ISO code (Northern Cyprus, Somaliland). */
  onCountryClick?: (info: CountryDetail | undefined, context: CountryClickContext) => void
  tooltipText?: (countryContext: CountryContext<string>) => string
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
  /** Highlight the clicked country. Default `true`. */
  highlightSelected?: boolean
  /** Show a panel with the clicked country's details below the map. Default `false`. */
  showDetails?: boolean
  /** Merged over the computed country style (applied last). */
  styleOverrides?:
    | CSSProperties
    | ((context: CountryContext<string>, state: { selected: boolean }) => CSSProperties)
  className?: string
  style?: CSSProperties
}

export const ExtendedWorldMap = ({
  title,
  size,
  onClick,
  onCountryClick,
  tooltipText,
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
  showDetails = false,
  styleOverrides,
  className,
  style,
}: ExtendedWorldMapProps) => {
  const groupId = useId()
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
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useRaiseOnTop(rootRef, highlightSelected ? selected?.name : undefined)

  const paletteColors = getPaletteColors(palette)

  const getFill = (context: CountryContext<string>) => {
    const code = context.countryCode.toUpperCase() as keyof CountryColors
    const custom = typeof colors === 'function' ? colors(context) : colors?.[code]
    return custom ?? paletteColors[code] ?? WHITE
  }

  const getStyle = (context: CountryContext<string>): CSSProperties => {
    const isSelected =
      highlightSelected && selected?.code === context.countryCode.toUpperCase()
    const computed: CSSProperties = {
      ...baseStyle,
      ...(colorOption === MapColorOptions.COLORFUL && { fill: getFill(context) }),
      ...(isSelected && selectedStyle),
    }
    const overrides =
      typeof styleOverrides === 'function'
        ? styleOverrides(context, { selected: isSelected })
        : styleOverrides
    return { ...computed, ...overrides }
  }

  return (
    <div ref={rootRef} className={className} style={style}>
      {showControls && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            marginLeft: '2.5em',
          }}
        >
          <UserOptions
            legend="Map colours"
            name={`${groupId}-color`}
            sources={mapColorOptions}
            selectedValue={colorOption}
            onChange={setColorOption}
          />
          <UserOptions
            legend="Information on click"
            name={`${groupId}-data`}
            sources={mapDataOptions}
            selectedValue={infoOption}
            onChange={setInfoOption}
          />
        </div>
      )}
      <WorldMap
        color={WHITE}
        size={size || 'xxl'}
        title={title || 'World Map'}
        data={defaultMapData}
        richInteraction={interaction}
        frame={mapFrame}
        onClickFunction={(context) => {
          setSelected({ code: context.countryCode.toUpperCase(), name: context.countryName })
          const info = getCountryDetail(context.countryCode, infoOption, getInfoLink)
          onCountryClick?.(info, context)
          onClick?.(JSON.stringify(info ?? {}, null, 2))
        }}
        tooltipTextFunction={(context) =>
          tooltipText ? tooltipText(context) : context.countryName
        }
        styleFunction={getStyle}
      />
      {showDetails && (
        <CountryDetails
          selection={
            selected && {
              name: selected.name,
              detail: getCountryDetail(selected.code, infoOption, getInfoLink),
            }
          }
        />
      )}
    </div>
  )
}
