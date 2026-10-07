import { useState } from 'react'
import { MapColorOptions, type MapColorMode, MapDataOptions, type MapInfoMode } from './constants'

export interface UseWorldMapModesOptions {
  /** Default `'BlackAndWhite'`. */
  defaultColorMode?: MapColorMode
  /** Default `'CountryName'`. */
  defaultInfoMode?: MapInfoMode
}

/** The four props shared by `<WorldMapControls>` and `<ExtendedWorldMap>`, so one spread wires both. */
export interface WorldMapModes {
  colorMode: MapColorMode
  onColorModeChange: (mode: MapColorMode) => void
  infoMode: MapInfoMode
  onInfoModeChange: (mode: MapInfoMode) => void
}

/** Keeps the colour and information modes in your own component, so controls and map can live apart. */
export const useWorldMapModes = ({
  defaultColorMode = MapColorOptions.BLACK_AND_WHITE,
  defaultInfoMode = MapDataOptions.COUNTRY_NAME,
}: UseWorldMapModesOptions = {}): WorldMapModes => {
  const [colorMode, onColorModeChange] = useState<MapColorMode>(defaultColorMode)
  const [infoMode, onInfoModeChange] = useState<MapInfoMode>(defaultInfoMode)
  return { colorMode, onColorModeChange, infoMode, onInfoModeChange }
}
