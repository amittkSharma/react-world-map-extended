import { useId, useState } from 'react'
import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { MapColorOptions, MapDataOptions, mapColorOptions, mapDataOptions } from './constants'
import { countryColors, defaultMapData } from './rawData/defaultMapData'
import { getCountryDetail } from './rawData/getDefaultMapData'
import { UserOptions } from './userOptions'

const baseStyle = {
  fill: '#ffffff',
  fillOpacity: 1,
  stroke: '#000000',
  strokeWidth: 1.2,
  strokeOpacity: 0.7,
  cursor: 'pointer',
  outline: 'none',
}

const getCountryColor = (countryCode: string) =>
  countryColors[countryCode.toUpperCase() as keyof typeof countryColors] ?? baseStyle.fill

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  onClick?: (value: string) => void
  tooltipText?: (countryContext: CountryContext<string>) => string
  infoLink?: boolean
  mapFrame?: boolean
  interaction?: boolean
}

export const ExtendedWorldMap = ({
  title,
  size,
  onClick,
  tooltipText,
  infoLink = false,
  mapFrame = false,
  interaction = true,
}: ExtendedWorldMapProps) => {
  const groupId = useId()
  const [mapColorOption, setMapColorOption] = useState<MapColorOptions>(
    MapColorOptions.BLACK_AND_WHITE,
  )
  const [mapDataOption, setMapDataOption] = useState<MapDataOptions>(MapDataOptions.COUNTRY_NAME)

  return (
    <>
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
          selectedValue={mapColorOption}
          onChange={setMapColorOption}
        />
        <UserOptions
          legend="Information on click"
          name={`${groupId}-data`}
          sources={mapDataOptions}
          selectedValue={mapDataOption}
          onChange={setMapDataOption}
        />
      </div>
      <WorldMap
        color="#ffffff"
        size={size || 'xxl'}
        title={title || 'World Map'}
        data={defaultMapData}
        richInteraction={interaction}
        frame={mapFrame}
        onClickFunction={({ countryCode }) => {
          const info = getCountryDetail(countryCode, mapDataOption) ?? {}
          onClick?.(JSON.stringify(info, null, 2))
        }}
        tooltipTextFunction={(countryContext) =>
          tooltipText ? tooltipText(countryContext) : countryContext.countryName
        }
        hrefFunction={({ countryName }) =>
          infoLink
            ? `https://en.wikipedia.org/wiki/${encodeURIComponent(countryName.replace(/ /g, '_'))}`
            : undefined
        }
        styleFunction={({ countryCode }) =>
          mapColorOption === MapColorOptions.COLORFUL
            ? { ...baseStyle, fill: getCountryColor(countryCode) }
            : baseStyle
        }
      />
    </>
  )
}
