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
          onCountryClick={(info, context) => console.log('Clicked', context.countryName, info)}
          size="xxl"
          mapFrame={true}
          showDetails
          palette="continent"
          defaultColorMode="Colorful"
        />
      </div>
    </>
  )
}
