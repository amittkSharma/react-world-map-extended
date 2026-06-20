import React from 'react'

import WorldMap from 'react-svg-worldmap'

import type { CountryContext, Data, SizeOption } from 'react-svg-worldmap'
import { defaultData } from './rawData/getDefaultMapData'

const populationData: Data<string> = [
  { country: 'cn', value: JSON.stringify({ iso: 'CN' }) }, // China
  { country: 'in', value: JSON.stringify({ iso: 'IN' }) }, // India
  { country: 'us', value: JSON.stringify({ iso: 'US' }) }, // United States
  { country: 'id', value: JSON.stringify({ iso: 'ID' }) }, // Indonesia
  { country: 'br', value: JSON.stringify({ iso: 'BR' }) }, // Brazil
  { country: 'ng', value: JSON.stringify({ iso: 'NG' }) }, // Nigeria
  { country: 'ru', value: JSON.stringify({ iso: 'RU' }) }, // Russia
  { country: 'mx', value: JSON.stringify({ iso: 'MX' }) }, // Mexico
  { country: 'au', value: JSON.stringify({ iso: 'AU' }) }, // Australia
]

const getStyle = () => {
  return {
    fill: 'red',
    fillOpacity: 0,
    stroke: 'green',
    strokeWidth: 1,
    strokeOpacity: 0.2,
    cursor: 'pointer',
    outline: 'none',
  }
}

// const createTextLabels = (width: number) => {
//   const labels: ({ label: string } & ComponentProps<'text'>)[] = [
//     { label: 'Atlantic Ocean', x: 0.37 * width, y: 0.39 * width },
//     { label: 'Indian Ocean', x: 0.69 * width, y: 0.57 * width },
//     { label: 'Pacific Ocean', x: 0.083 * width, y: 0.48 * width },
//     {
//       label: 'Arctic Ocean',
//       x: 0.75 * width,
//       y: 0.058 * width,
//       style: { fill: 'blue' },
//     },
//   ]
//   if (width < 550) {
//     return labels.map((label) => ({
//       ...label,
//       style: { ...label.style, fontSize: '30%' },
//     }))
//   }
//   return labels
// }

export interface ExtendedWorldMapProps {
  title?: string
  size?: SizeOption | 'responsive' | number
  onClick?: (countryContext: CountryContext<string>) => void
  infoLink?: (countryContext: CountryContext<string>) => string
}

export const ExtendedWorldMap = ({ title, size, onClick, infoLink }: ExtendedWorldMapProps) => {
  return (
    <WorldMap
      color="#ffffff"
      size={size || 'xxl'}
      title={title || 'World Map'}
      data={defaultData}
      richInteraction={true}
      frame={true}
      valuePrefix="people"
      onClickFunction={(countryContext: CountryContext<string>) => {
        onClick && onClick(countryContext)
      }}
      // tooltipTextFunction={(countryContext: CountryContext<string>) => {
      //   const populationInfo = JSON.parse(countryContext.countryValue || '{}')
      //   return `${countryContext.countryName} - ${populationInfo.iso}`
      // }}
      // hrefFunction={(countryContext: CountryContext<string>) => {
      //   return infoLink
      //     ? infoLink(countryContext)
      //     : `https://en.wikipedia.org/wiki/${countryContext.countryName}`
      // }}
      styleFunction={getStyle}
      // textLabelFunction={undefined}
    />
  )
}
