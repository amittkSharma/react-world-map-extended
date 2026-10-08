import { useState } from 'react'
import { MapColorOptions, type MapColorMode, MapDataOptions, type MapInfoMode } from './constants'

export interface UseWorldMapModesOptions {
  /** Default `'BlackAndWhite'`. */
  defaultColorMode?: MapColorMode
  /** Default `'CountryName'`. */
  defaultInfoMode?: MapInfoMode
  /** The property of your own data the map starts with. Default: the first one. */
  defaultDataProperty?: string
}

/** The props shared by `<WorldMapControls>` and `<ExtendedWorldMap>`, so one spread wires both. */
export interface WorldMapModes {
  colorMode: MapColorMode
  onColorModeChange: (mode: MapColorMode) => void
  infoMode: MapInfoMode
  onInfoModeChange: (mode: MapInfoMode) => void
  /** The property of your own data the map shows; `undefined` until one is chosen (the map then uses the first). */
  dataProperty: string | undefined
  onDataPropertyChange: (name: string) => void
}

/** Keeps the colour mode, information mode and data property in your own component, so controls and map can live apart. */
export const useWorldMapModes = ({
  defaultColorMode = MapColorOptions.BLACK_AND_WHITE,
  defaultInfoMode = MapDataOptions.COUNTRY_NAME,
  defaultDataProperty,
}: UseWorldMapModesOptions = {}): WorldMapModes => {
  const [colorMode, onColorModeChange] = useState<MapColorMode>(defaultColorMode)
  const [infoMode, onInfoModeChange] = useState<MapInfoMode>(defaultInfoMode)
  const [dataProperty, onDataPropertyChange] = useState<string | undefined>(defaultDataProperty)
  return {
    colorMode,
    onColorModeChange,
    infoMode,
    onInfoModeChange,
    dataProperty,
    onDataPropertyChange,
  }
}
