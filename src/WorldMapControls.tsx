import { type CSSProperties, useId } from 'react'
import { type MapColorMode, type MapInfoMode, mapColorOptions, mapDataOptions } from './constants'
import { UserOptions } from './userOptions'

export interface WorldMapControlsProps {
  /** What colours the map: black and white, or colourful. */
  colorMode: MapColorMode
  onColorModeChange: (mode: MapColorMode) => void
  /** Which details a click reports (name, capital, region, language, currency, complete). */
  infoMode: MapInfoMode
  onInfoModeChange: (mode: MapInfoMode) => void
  className?: string
  /** Merged over the bar's own style (a row of two radio groups), last. */
  style?: CSSProperties
}

/**
 * The map's two radio groups as a standalone, always-controlled component, to place anywhere in
 * your page next to `<ExtendedWorldMap showControls={false} />`. Pair it with `useWorldMapModes()`:
 *
 * ```tsx
 * const modes = useWorldMapModes()
 * <WorldMapControls {...modes} />
 * <ExtendedWorldMap showControls={false} {...modes} />
 * ```
 *
 * Clicking it never clears the map's selection.
 */
export const WorldMapControls = ({
  colorMode,
  onColorModeChange,
  infoMode,
  onInfoModeChange,
  className,
  style,
}: WorldMapControlsProps) => {
  const groupId = useId() // radio group names must be unique per instance on the page

  return (
    <div
      data-rwme-keep
      className={['rwme-controls', className].filter(Boolean).join(' ')}
      style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', ...style }}
    >
      <UserOptions
        legend="Map colours"
        name={`${groupId}-color`}
        sources={mapColorOptions}
        selectedValue={colorMode}
        onChange={onColorModeChange}
      />
      <UserOptions
        legend="Information on click"
        name={`${groupId}-data`}
        sources={mapDataOptions}
        selectedValue={infoMode}
        onChange={onInfoModeChange}
      />
    </div>
  )
}
