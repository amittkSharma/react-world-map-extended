import { createRoot } from 'react-dom/client'
import { WorldMap } from './app'

const container = document.querySelector('#content')
if (!container) throw new Error('Root container not found')

const root = createRoot(container)
root.render(<WorldMap />)
