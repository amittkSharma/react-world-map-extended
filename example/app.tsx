import { useEffect, useState } from 'react'
import { type DetailsPosition, ExtendedWorldMap } from '../src'
import { detailsPositions, readScenario, runScenario } from './scenario'
import './style.css'

const scenario = readScenario()
const quickCountries = ['FR', 'DE', 'JP', 'BR', 'NG']

const toPosition = (value: string): DetailsPosition =>
  detailsPositions.find((position) => position === value) ?? 'bottom'

export const ExampleApp = () => {
  const [position, setPosition] = useState(scenario.position)
  const [country, setCountry] = useState<string | null>(null)

  useEffect(() => runScenario(scenario), [])

  return (
    <>
      <header className="main-header">
        <h1 className="app-name">React World Map (Extended)</h1>
        <label className="header-control">
          Details position:{' '}
          <select value={position} onChange={(event) => setPosition(toPosition(event.target.value))}>
            {detailsPositions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="header-control">
          Select:{' '}
          <select
            value={country ?? ''}
            onChange={(event) => setCountry(event.target.value || null)}
          >
            <option value="">none</option>
            {quickCountries.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="container">
        <ExtendedWorldMap
          onCountryClick={(info, context) => console.log('Clicked', context.countryName, info)}
          size="xxl"
          mapFrame
          showDetails
          // keeps the selection while you use the header dropdowns, which are outside the map
          deselectOn="background"
          selectedCountry={country}
          onSelectionChange={setCountry}
          detailsOptions={{ position }}
          palette="continent"
          defaultColorMode={scenario.color}
          defaultInfoMode={scenario.info}
        />
      </div>
    </>
  )
}
