import {
  type DetailsPosition,
  type MapColorMode,
  MapColorOptions,
  MapDataOptions,
  type MapInfoMode,
  type MapPalette,
  type ScaleKind,
} from '../src'

/**
 * Query-string hooks for repeatable visual checks (screenshots, demos). Example app only; not part
 * of the package.
 *
 *   ?position=overlay            where the details card sits (bottom|top|left|right|overlay)
 *   &select=Germany              click that country (by its map name) once the map has rendered; a comma-
 *                                separated list (Germany,France,Italy) clicks the first, then Shift+clicks the rest
 *   &toggle=on                   show the "Select multiple" switch (it is meant for touch screens)
 *   &info=CountryCompleteInfo    information mode
 *   &color=BlackAndWhite         colour mode
 *   &palette=region              colour palette (default|continent|region|monochrome; the example starts with continent)
 *   &data=custom | both | invalid  show your own data (example/sample-data.json) instead of the built-in
 *                                facts / next to them / a data set with mistakes, to see them reported
 *   &property=Population%20(millions)   which property of the sample data colours the map (default: the first)
 *   &scale=linear | quantile | log   force one scale on every property of the sample data (default: as the file says)
 *   &controls=above|below|left|right   place the radio controls apart from the map, as a separate
 *                                <WorldMapControls> (default: built into the map)
 *   &boundaries=off              hide the dashed outlines that show which part is which component
 *   &then=background | escape | focusclick | keyboard | reveal
 *                                half a second later, clear the selection by clicking the empty
 *                                map / pressing Escape on the selected country; `focusclick` focuses the country and
 *                                clicks it (a mouse click on a focusable country); `keyboard` presses Tab and
 *                                focuses it (keyboard focus)
 *
 * e.g. chrome --headless=new --screenshot=out.png "http://localhost:3000/example?select=Germany&then=escape"
 */
export const dataModes = ['default', 'custom', 'both', 'invalid'] as const
export type DataMode = (typeof dataModes)[number]

export const detailsPositions: DetailsPosition[] = ['bottom', 'top', 'left', 'right', 'overlay']

const infoModes = Object.values(MapDataOptions) as MapInfoMode[]
const colorModes = Object.values(MapColorOptions) as MapColorMode[]
const palettes: MapPalette[] = ['default', 'continent', 'region', 'monochrome']
const scales: ScaleKind[] = ['linear', 'quantile', 'log']
const followUps = ['background', 'escape', 'focusclick', 'keyboard', 'reveal'] as const

/** `inside`: part of `<ExtendedWorldMap>`; the others: a separate `<WorldMapControls>` placed apart. */
export const controlsPlacements = ['inside', 'above', 'below', 'left', 'right'] as const
export type ControlsPlacement = (typeof controlsPlacements)[number]

export interface Scenario {
  position: DetailsPosition
  info: MapInfoMode
  color: MapColorMode
  palette: MapPalette
  /** `?data=`: which details the example shows */
  data: DataMode
  /** `?property=`: the property of the data that colours the map */
  property?: string
  /** `?scale=`: a scale for every property of the sample data */
  scale?: ScaleKind
  /** `?controls=`: where the radio controls are drawn */
  controls: ControlsPlacement
  /** `?boundaries=off` hides the labelled outlines */
  boundaries: boolean
  /** `?select=`: map names, the first plain click, the others Shift+click */
  select: string[]
  /** `?toggle=on` */
  multiToggle: boolean
  /** from `?then=` */
  followUp?: (typeof followUps)[number]
}

// unknown or missing values fall back instead of breaking the page
const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.find((candidate) => candidate === value)

export const readScenario = (search: string = window.location.search): Scenario => {
  const params = new URLSearchParams(search)
  return {
    position: pick(params.get('position'), detailsPositions) ?? 'bottom',
    info: pick(params.get('info'), infoModes) ?? MapDataOptions.COUNTRY_NAME,
    color: pick(params.get('color'), colorModes) ?? MapColorOptions.COLORFUL,
    data: pick(params.get('data'), dataModes) ?? 'default',
    property: params.get('property') ?? undefined,
    scale: pick(params.get('scale'), scales),
    controls: pick(params.get('controls'), controlsPlacements) ?? 'inside',
    boundaries: params.get('boundaries') !== 'off',
    palette: pick(params.get('palette'), palettes) ?? 'continent',
    select: (params.get('select') ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
    multiToggle: params.get('toggle') === 'on',
    followUp: pick(params.get('then'), followUps),
  }
}

/** Plays the scenario's clicks on the rendered map. Returns a cleanup that cancels pending steps. */
export const runScenario = ({ select, followUp }: Scenario): (() => void) => {
  const paths: SVGPathElement[] = []
  select.forEach((name, index) => {
    const path = document.querySelector<SVGPathElement>(`path[aria-label="${CSS.escape(name)}"]`)
    if (!path) {
      console.warn(`scenario: no country named "${name}" on the map`)
      return
    }
    paths.push(path)
    // the first country is a plain click, the others are Shift+clicks: they add to the selection
    path.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: index > 0 }))
  })
  const [path] = paths
  if (!path) return () => {}

  const timer = setTimeout(() => {
    if (followUp === 'background') {
      document
        .querySelector('.rwme-layout svg')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    } else if (followUp === 'escape') {
      path.focus()
      path.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    } else if (followUp === 'focusclick') {
      // what a mouse click does to a focusable country: it takes focus, then the click handler runs
      path.focus()
      path.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    } else if (followUp === 'reveal') {
      // a plain click on a country that is already selected pops it up in the details
      path.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    } else if (followUp === 'keyboard') {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      path.focus()
    }
  }, 500)
  return () => clearTimeout(timer)
}
