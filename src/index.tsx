import React from 'react'

import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { mapColorOptions, mapDataOptions, MapDataOptions } from './constants'
import { defaultMapData } from './rawData/defaultMapData'
import { defaultData, getCountryDetail } from './rawData/getDefaultMapData'
import { UserOptions } from './userOptions'

const getBwStyle = () => {
  return {
    fill: '#ffffff',
    fillOpacity: 2,
    stroke: '#000000',
    strokeWidth: 1.2,
    strokeOpacity: 0.7,
    cursor: 'pointer',
    outline: 'none',
  }
}

const getColorStyle = (countryContext: CountryContext<string>) => {
  const result = defaultMapData.find(
    (v) => v.country.toLocaleUpperCase() === countryContext.countryCode,
  )

  let color = '#ffffff'

  if (result) {
    color = JSON.parse(result.value).color
  }

  return {
    fill: color,
    fillOpacity: 2,
    stroke: '#000000',
    strokeWidth: 1.2,
    strokeOpacity: 0.7,
    cursor: 'pointer',
    outline: 'none',
  }
}

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  onClick?: (value: string) => void
  tooltipText?: (countryContext: CountryContext<string>) => string
  infoLink: boolean
  mapFrame: boolean
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
  const [mapColorOption, setMapColorOption] = React.useState<string>('BlackAndWhite')
  const [mapDataOption, setMapDataOption] = React.useState<MapDataOptions>(
    MapDataOptions.COUNTRY_NAME,
  )

  const onMapColorOptionChange = (value: string) => {
    setMapColorOption(value)
  }

  const onMapDataOptionChange = (value: string) => {
    setMapDataOption(value as MapDataOptions)
  }

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
          sources={mapColorOptions}
          selectedValue={mapColorOption}
          onChange={onMapColorOptionChange}
        />
        <UserOptions
          sources={mapDataOptions}
          selectedValue={mapDataOption}
          onChange={onMapDataOptionChange}
        />
      </div>
      <WorldMap
        color="#ffffff"
        size={size || 'xxl'}
        title={title || 'World Map'}
        data={defaultData}
        richInteraction={interaction}
        frame={mapFrame}
        valuePrefix="people"
        onClickFunction={(countryContext: CountryContext<string>) => {
          const { countryName } = countryContext
          const info = getCountryDetail(countryName, mapDataOption) || {}
          onClick && onClick(JSON.stringify(info, null, 2))
        }}
        tooltipTextFunction={(countryContext: CountryContext<string>) => {
          return tooltipText ? tooltipText(countryContext) : `${countryContext.countryName}`
        }}
        hrefFunction={(countryContext: CountryContext<string>) => {
          return infoLink
            ? `https://en.wikipedia.org/wiki/${countryContext.countryName}`
            : undefined
        }}
        styleFunction={(countryContext: CountryContext<string>) =>
          mapColorOption === 'BlackAndWhite' ? getBwStyle() : getColorStyle(countryContext)
        }
      />
    </>
  )
}
