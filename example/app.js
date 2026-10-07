import { useEffect, useState } from 'react'
import { ExtendedWorldMap } from '../src'
import './style.css'

const positions = ['bottom', 'top', 'left', 'right', 'overlay']

// Optional query string for quick visual checks: ?position=overlay&select=Germany&info=CountryCompleteInfo
const params = new URLSearchParams(window.location.search)

export const WorldMap = () => {
  const [position, setPosition] = useState(params.get('position') ?? 'bottom')

  useEffect(() => {
    const name = params.get('select')
    if (!name) return
    document
      .querySelector(`path[aria-label="${name}"]`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
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
      </header>
      <div className="container">
        <ExtendedWorldMap
          onCountryClick={(info, context) => console.log('Clicked', context.countryName, info)}
          size="xxl"
          mapFrame={true}
          showDetails
          detailsOptions={{ position }}
          palette="continent"
          defaultColorMode="Colorful"
          defaultInfoMode={params.get('info') ?? 'CountryName'}
        />
      </div>
    </>
  )
}
