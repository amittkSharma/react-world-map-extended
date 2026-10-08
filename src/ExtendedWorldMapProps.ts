import type { CSSProperties, MouseEvent } from 'react'
import type { CountryContext } from 'react-svg-worldmap'
import type { LegendPosition } from './components/MapLegend'
import type { MapColorMode, MapInfoMode } from './constants'
import type { DeselectMode } from './hooks/useDeselect'
import type { CountryClickInfo, DetailsSource } from './lib/cardSelections'
import type { CountryData, CountryDataIssue } from './lib/countryData'
import type { InfoLinkResolver } from './lib/countryDetail'
import type { ColorsOption, StyleOverrides } from './lib/countryStyle'
import type { DetailsPosition } from './lib/detailsLayout'
import type { MapSize } from './lib/mapSize'
import type { MapPalette } from './lib/palettes'
import type { CardAppearance } from './types'

export type { DetailsPosition }

export interface DetailsOptions extends CardAppearance {
  /** Default `'bottom'`. With `'overlay'` the map cannot be clicked while the card is open; in every
   * other position other countries stay clickable and update the card. */
  position?: DetailsPosition
  /** Component width, in px, below which `'left'` and `'right'` fall back to `'top'` and `'bottom'`
   * (a side card needs room; on a narrow screen it would squeeze the map). Default `720`. */
  stackBelow?: number
  /** Whether the card is shown. Controlled when set; otherwise starts at `defaultOpen` (default `true`).
   * The card has a "Hide" button; a "Show details" button brings it back, and clicking a country reopens it. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export type CountryClickContext = CountryContext<string> & { event: MouseEvent<SVGElement, Event> }

export interface ExtendedWorldMapProps {
  title?: string
  size?: MapSize
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
  /** Your own data: `{ properties: [{ name, color }], countries: [{ country: 'FR', [name]: number }] }`.
   * Each property gets its own colour scale (the highest number has its colour, the lowest a light tint
   * of it) and is shown in the details, labelled with its name. `country` is an ISO 3166-1 alpha-2 or
   * alpha-3 code (not a name). With two or more properties a dropdown lets the visitor choose which one
   * colours the map. The data is validated (`validateCountryData`, `schema/country-data.schema.json`):
   * bad parts are left out and reported to `onDataIssues`. */
  countryData?: CountryData
  /** The property of `countryData` that colours the map. Controlled when set; otherwise use
   * `defaultDataProperty` (default: the first property). An unknown name means the first one. */
  dataProperty?: string
  defaultDataProperty?: string
  onDataPropertyChange?: (name: string) => void
  /** What the details show. `'custom'`: only your data; `'both'`: your data, then the built-in facts;
   * `'default'`: the built-in facts only. Default: `'custom'` when `countryData` is given, else `'default'`. */
  detailsSource?: DetailsSource
  /** Called with what was wrong in `countryData` (once per array). Without it the problems are
   * printed as a console warning. */
  onDataIssues?: (issues: CountryDataIssue[]) => void
  /** With your own data shown, paint countries without a value for the chosen property grey
   * (`--rwme-no-data-fill`) and add "No data" to the legend. Default `true`. */
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
  colors?: ColorsOption
  /** Show a legend over a corner of the map saying what the colours mean. Default `true`. With the
   * built-in data it appears only for the `continent` and `region` palettes, in Colorful mode, without
   * custom `colors`. With your own data it is the colour scale of the chosen property, in Colorful mode;
   * the built-in legend is never shown next to it. */
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
  deselectOn?: DeselectMode
  /** While a country is selected, fade all the others so it stands out. `true` uses opacity 0.35, a
   * number sets the opacity (0–1), `false` turns it off. Default `true`, but `false` while your own data
   * colours the map (fading changes the shades, which carry the meaning). Themeable with
   * `--rwme-dimmed-opacity`. */
  dimOthers?: boolean | number
  /** Show a card with the clicked country's details. Default `false`; see `detailsOptions`. */
  showDetails?: boolean
  /** Position, visibility toggle, headings and fonts of the details card. */
  detailsOptions?: DetailsOptions
  /** Merged over the computed country style (applied last). */
  styleOverrides?: StyleOverrides
  className?: string
  style?: CSSProperties
}
