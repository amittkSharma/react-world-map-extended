import {
  type DetailsPosition,
  type MapColorMode,
  MapColorOptions,
  MapDataOptions,
  type MapInfoMode,
} from '../src'

/**
 * Query-string hooks for repeatable visual checks (screenshots, demos). Example app only; not part
 * of the package.
 *
 *   ?position=overlay            where the details card sits (bottom|top|left|right|overlay)
 *   &select=Germany              click that country (by its map name) once the map has rendered
 *   &info=CountryCompleteInfo    information mode
 *   &color=BlackAndWhite         colour mode
 *   &controls=above|below|left|right   place the radio controls apart from the map, as a separate
 *                                <WorldMapControls> (default: built into the map)
 *   &boundaries=off              hide the dashed outlines that show which part is which component
 *   &then=background | escape    half a second later, clear the selection by clicking the empty
 *                                map / pressing Escape on the selected country
 *
 * e.g. chrome --headless=new --screenshot=out.png "http://localhost:3000/example?select=Germany&then=escape"
 */
export const detailsPositions: DetailsPosition[] = ['bottom', 'top', 'left', 'right', 'overlay']

const infoModes = Object.values(MapDataOptions) as MapInfoMode[]
const colorModes = Object.values(MapColorOptions) as MapColorMode[]
const followUps = ['background', 'escape'] as const

/** `inside`: part of `<ExtendedWorldMap>`; the others: a separate `<WorldMapControls>` placed apart. */
export const controlsPlacements = ['inside', 'above', 'below', 'left', 'right'] as const
export type ControlsPlacement = (typeof controlsPlacements)[number]

export interface Scenario {
  position: DetailsPosition
  info: MapInfoMode
  color: MapColorMode
  /** `?controls=`: where the radio controls are drawn */
  controls: ControlsPlacement
  /** `?boundaries=off` hides the labelled outlines */
  boundaries: boolean
  select?: string
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
    controls: pick(params.get('controls'), controlsPlacements) ?? 'inside',
    boundaries: params.get('boundaries') !== 'off',
    select: params.get('select') ?? undefined,
    followUp: pick(params.get('then'), followUps),
  }
}

/** Plays the scenario's clicks on the rendered map. Returns a cleanup that cancels pending steps. */
export const runScenario = ({ select, followUp }: Scenario): (() => void) => {
  if (!select) return () => {}

  const path = document.querySelector<SVGPathElement>(`path[aria-label="${CSS.escape(select)}"]`)
  if (!path) {
    console.warn(`scenario: no country named "${select}" on the map`)
    return () => {}
  }
  path.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  const timer = setTimeout(() => {
    if (followUp === 'background') {
      document
        .querySelector('.rwme-layout svg')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    } else if (followUp === 'escape') {
      path.focus()
      path.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }
  }, 500)
  return () => clearTimeout(timer)
}
