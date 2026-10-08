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
  /** `'horizontal'` (default): the two groups side by side, each with its options in a row.
   * `'vertical'`: the groups stacked, each with its options in a column (for a sidebar). */
  orientation?: 'horizontal' | 'vertical'
  /** Show the "Information on click" group. Default `true`. It describes the built-in facts, so
   * `<ExtendedWorldMap>` hides it while only your own data (`detailsSource="custom"`) is shown. */
  showInfoModes?: boolean
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
  orientation = 'horizontal',
  showInfoModes = true,
  className,
  style,
}: WorldMapControlsProps) => {
  const groupId = useId() // radio group names must be unique per instance on the page
  const direction = orientation === 'vertical' ? 'column' : 'row'

  return (
    <div
      data-rwme-keep
      className={['rwme-controls', className].filter(Boolean).join(' ')}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        flexWrap: 'wrap', // on a narrow screen the groups wrap instead of overflowing
        justifyContent: 'flex-start',
        ...style,
      }}
    >
      <UserOptions
        legend="Map colours"
        name={`${groupId}-color`}
        sources={mapColorOptions}
        selectedValue={colorMode}
        onChange={onColorModeChange}
        direction={direction}
      />
      {showInfoModes && (
        <UserOptions
          legend="Information on click"
          name={`${groupId}-data`}
          sources={mapDataOptions}
          selectedValue={infoMode}
          onChange={onInfoModeChange}
          direction={direction}
        />
      )}
    </div>
  )
}
