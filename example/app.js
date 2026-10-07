import { useEffect, useState } from 'react'
import { ExtendedWorldMap } from '../src'
import './style.css'

const positions = ['bottom', 'top', 'left', 'right', 'overlay']
const countries = ['FR', 'DE', 'JP', 'BR', 'NG']

// Optional query string for quick visual checks: ?position=overlay&select=Germany&info=CountryCompleteInfo&then=background
// (deselectOn="background" below keeps the selection while you use the header dropdowns)
const params = new URLSearchParams(window.location.search)

export const WorldMap = () => {
  const [position, setPosition] = useState(params.get('position') ?? 'bottom')
  const [country, setCountry] = useState(null)

  useEffect(() => {
    const name = params.get('select')
    if (!name) return
    document
      .querySelector(`path[aria-label="${name}"]`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // ?then=background clicks the empty map afterwards, to check the selection clears
    if (params.get('then') === 'background') {
      setTimeout(() => {
        document.querySelector('svg')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }, 500)
    }
  }, [])

  return (
    <>
      <header className="main-header">
        <h1 className="app-name">React World Map (Extended)</h1>
        <label style={{ color: 'white', whiteSpace: 'nowrap', lineHeight: '40px', marginRight: '1em' }}>
          Details position:{' '}
          <select value={position} onChange={(event) => setPosition(event.target.value)}>
            {positions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label style={{ color: 'white', whiteSpace: 'nowrap', lineHeight: '40px', marginRight: '1em' }}>
          Select:{' '}
          <select value={country ?? ''} onChange={(event) => setCountry(event.target.value || null)}>
            <option value="">none</option>
            {countries.map((code) => (
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
          mapFrame={true}
          showDetails
          deselectOn="background"
          selectedCountry={country}
          onSelectionChange={setCountry}
          detailsOptions={{ position }}
          palette="continent"
          defaultColorMode={params.get('color') ?? 'Colorful'}
          defaultInfoMode={params.get('info') ?? 'CountryName'}
        />
      </div>
    </>
  )
}
