import React from 'react'

import WorldMap from 'react-svg-worldmap'

import type { CountryContext, SizeOption } from 'react-svg-worldmap'
import { defaultData } from './rawData/getDefaultMapData'

const getStyle = () => {
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
  return (
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
        return infoLink ? `https://en.wikipedia.org/wiki/${countryContext.countryName}` : undefined
      }}
      styleFunction={getStyle}
    />
  )
}
