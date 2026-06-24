import React from 'react'

import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { DefaultMapOptions } from './defaultMapOptions'
import { defaultMapData } from './rawData/defaultMapData'
import { defaultData } from './rawData/getDefaultMapData'

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
  if (countryContext.countryCode === 'NO') {
    console.log(`context: ${JSON.stringify(countryContext, null, 2)}`)
  }

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
  onClick?: (countryContext: CountryContext<string>) => void
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

  const onMapColorOptionChange = (value: string) => {
    setMapColorOption(value)
  }

  return (
    <span>
      <DefaultMapOptions selectedValue={mapColorOption} onChange={onMapColorOptionChange} />
      <WorldMap
        color="#ffffff"
        size={size || 'xxl'}
        title={title || 'World Map'}
        data={defaultData}
        richInteraction={interaction}
        frame={mapFrame}
        valuePrefix="people"
        onClickFunction={(countryContext: CountryContext<string>) => {
          onClick && onClick(countryContext)
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
    </span>
  )
}
