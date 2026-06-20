import {} from 'react'
import { ExtendedWorldMap } from '../src'
import './style.css'

export const WorldMap = () => {
  return (
    <>
      <header className="main-header">
        <h1 className="app-name">React World Map (Extended)</h1>
      </header>
      <div className="container">
        <ExtendedWorldMap
          onClick={(countryContext) => console.log('Clicked country context:', countryContext)}
          infoLink={(countryContext) => undefined}
          size="responsive"
        />
      </div>
    </>
  )
}
