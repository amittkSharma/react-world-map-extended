import { useEffect, useState } from 'react'
import {
  type CountryData,
  type CountryDataIssue,
  type DetailsPosition,
  ExtendedWorldMap,
  WorldMapControls,
  useWorldMapModes,
} from '../src'
import sampleData from './sample-data.json'
import {
  type ControlsPlacement,
  type DataMode,
  controlsPlacements,
  dataModes,
  detailsPositions,
  readScenario,
  runScenario,
} from './scenario'
import './style.css'

const scenario = readScenario()
// the same arrays on every render: the data is checked once per array
const SAMPLE: CountryData = sampleData
const WITH_MISTAKES = {
  properties: [
    { name: 'Literacy rate (%)', color: '#1a73e8' },
    { name: 'Population (millions)', color: 'blue' },
    { name: 'Notes', color: '#009e73' },
  ],
  countries: [
    { country: 'FR', 'Literacy rate (%)': 99 },
    { country: 'France', 'Literacy rate (%)': 90 },
    { country: 'DE', 'Literacy rate (%)': 'a word, not a number' },
    { country: 'ZZ', 'Literacy rate (%)': 1 },
    { country: 'FR', 'Literacy rate (%)': 50 },
    { country: 'BR', 'Literacy rate (%)': 94 },
    'not an object',
  ],
} as unknown as CountryData
const dataLabels: Record<DataMode, string> = {
  default: 'built-in facts',
  custom: 'my data (sample-data.json)',
  both: 'my data + built-in facts',
  invalid: 'my data with mistakes',
}

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

const toDataMode = (value: string): DataMode =>
  dataModes.find((mode) => mode === value) ?? 'default'

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
  const [dataMode, setDataMode] = useState(scenario.data)
  const [issues, setIssues] = useState<CountryDataIssue[]>([])
  const [countries, setCountries] = useState<string[]>([])
  // one state for the colour/information modes, shared by the map and (optionally) separate controls
  const modes = useWorldMapModes({
    defaultColorMode: scenario.color,
    defaultInfoMode: scenario.info,
    defaultDataProperty: scenario.property,
  })

  useEffect(() => runScenario(scenario), [])

  const countryData =
    dataMode === 'default' ? undefined : dataMode === 'invalid' ? WITH_MISTAKES : SAMPLE
  const propertyNames = (dataMode === 'invalid' ? [] : SAMPLE.properties.map(({ name }) => name)) // for separate controls
  const ownDataOnly = dataMode === 'custom' || dataMode === 'invalid'
  const apart = placement !== 'inside'
  const sideways = placement === 'left' || placement === 'right'
  const controls = apart && (
    <div className="demo-controls">
      <WorldMapControls
        {...modes}
        showInfoModes={!ownDataOnly}
        properties={ownDataOnly || dataMode === 'both' ? propertyNames : undefined}
        orientation={sideways ? 'vertical' : 'horizontal'}
      />
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
          Details:{' '}
          <select
            value={dataMode}
            onChange={(event) => {
              setIssues([])
              setDataMode(toDataMode(event.target.value))
            }}
          >
            {dataModes.map((value) => (
              <option key={value} value={value}>
                {dataLabels[value]}
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
            value={countries.length === 1 ? countries[0] : ''}
            onChange={(event) => setCountries(event.target.value ? [event.target.value] : [])}
          >
            <option value="">{countries.length > 1 ? `${countries.length} selected` : 'none'}</option>
            {(countries.length === 1 && !quickCountries.includes(countries[0])
              ? [...quickCountries, countries[0]]
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

      {issues.length > 0 && (
        <section className="demo-issues" aria-label="Problems found in the data">
          <b>onDataIssues</b> reported {issues.length} problem(s); the valid rows are still used:
          <ul>
            {issues.map(({ row, property, message }) => (
              <li key={`${row}-${property}-${message}`}>
                {row === null ? 'data' : `row ${row}`}
                {property ? ` (${property})` : ''}: {message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={`container${boundaries ? ' show-boundaries' : ''}`}>
        <div className={`demo-stage demo-stage-${placement}`}>
          {(placement === 'above' || placement === 'left') && controls}
          <ExtendedWorldMap
            className="demo-map"
            onCountryClick={(info, context) => console.log('Clicked', context.countryName, info)}
            size="xxl"
            mapFrame
            showControls={!apart}
            countryData={countryData}
            detailsSource={dataMode === 'both' ? 'both' : undefined}
            onDataIssues={setIssues}
            showDetails
            // keeps the selection while you use controls outside the map component
            deselectOn="background"
            selectedCountries={countries}
            onSelectionChange={setCountries}
            showMultiSelectToggle={scenario.multiToggle || 'auto'}
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
