import { useEffect, useState } from 'react'
import {
  type DetailsPosition,
  ExtendedWorldMap,
  WorldMapControls,
  useWorldMapModes,
} from '../src'
import {
  type ControlsPlacement,
  controlsPlacements,
  detailsPositions,
  readScenario,
  runScenario,
} from './scenario'
import './style.css'

const scenario = readScenario()
const quickCountries = ['FR', 'DE', 'JP', 'BR', 'NG']

const placementLabels: Record<ControlsPlacement, string> = {
  inside: 'built into the map',
  above: 'separate: above the map',
  below: 'separate: below the map',
  left: 'separate: left of the map',
  right: 'separate: right of the map',
}

const toPosition = (value: string): DetailsPosition =>
  detailsPositions.find((position) => position === value) ?? 'bottom'

const toPlacement = (value: string): ControlsPlacement =>
  controlsPlacements.find((placement) => placement === value) ?? 'inside'

const snippets = {
  inside: `<ExtendedWorldMap />`,
  apart: `const modes = useWorldMapModes()

<WorldMapControls {...modes} />                        // a separate component: put it anywhere
<ExtendedWorldMap showControls={false} {...modes} />   // the map no longer draws the radio buttons`,
}

export const ExampleApp = () => {
  const [position, setPosition] = useState(scenario.position)
  const [placement, setPlacement] = useState(scenario.controls)
  const [boundaries, setBoundaries] = useState(scenario.boundaries)
  const [country, setCountry] = useState<string | null>(null)
  // one state for the colour/information modes, shared by the map and (optionally) separate controls
  const modes = useWorldMapModes({
    defaultColorMode: scenario.color,
    defaultInfoMode: scenario.info,
  })

  useEffect(() => runScenario(scenario), [])

  const apart = placement !== 'inside'
  const sideways = placement === 'left' || placement === 'right'
  const controls = apart && (
    <div className="demo-controls">
      <WorldMapControls {...modes} orientation={sideways ? 'vertical' : 'horizontal'} />
    </div>
  )

  return (
    <>
      <header className="main-header">
        <h1 className="app-name">React World Map (Extended)</h1>
        <label className="header-control">
          Radio controls:{' '}
          <select
            value={placement}
            onChange={(event) => setPlacement(toPlacement(event.target.value))}
          >
            {controlsPlacements.map((value) => (
              <option key={value} value={value}>
                {placementLabels[value]}
              </option>
            ))}
          </select>
        </label>
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
          <input
            type="checkbox"
            checked={boundaries}
            onChange={(event) => setBoundaries(event.target.checked)}
          />{' '}
          Show component outlines
        </label>
        <label className="header-control">
          Select:{' '}
          <select
            value={country ?? ''}
            onChange={(event) => setCountry(event.target.value || null)}
          >
            <option value="">none</option>
            {(country && !quickCountries.includes(country)
              ? [...quickCountries, country]
              : quickCountries
            ).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="demo-info">
        <p>
          {apart ? (
            <>
              The radio buttons are a <b className="tag-controls">separate component</b> here, drawn{' '}
              {placement} the map. Because they are not part of{' '}
              <b className="tag-map">&lt;ExtendedWorldMap&gt;</b>, you can put them anywhere in your
              page; the two stay in sync through shared state.
            </>
          ) : (
            <>
              The radio buttons are <b>part of</b> <b className="tag-map">&lt;ExtendedWorldMap&gt;</b>{' '}
              (the default). Pick a "separate" option above to see them as an independent{' '}
              <b className="tag-controls">&lt;WorldMapControls&gt;</b> you can place anywhere.
            </>
          )}
        </p>
        <pre>{apart ? snippets.apart : snippets.inside}</pre>
      </section>

      <div className={`container${boundaries ? ' show-boundaries' : ''}`}>
        <div className={`demo-stage demo-stage-${placement}`}>
          {(placement === 'above' || placement === 'left') && controls}
          <ExtendedWorldMap
            className="demo-map"
            onCountryClick={(info, context) => console.log('Clicked', context.countryName, info)}
            size="xxl"
            mapFrame
            showControls={!apart}
            showDetails
            // keeps the selection while you use controls outside the map component
            deselectOn="background"
            selectedCountry={country}
            onSelectionChange={setCountry}
            detailsOptions={{ position }}
            palette={scenario.palette}
            {...modes}
          />
          {(placement === 'below' || placement === 'right') && controls}
        </div>
      </div>
    </>
  )
}
