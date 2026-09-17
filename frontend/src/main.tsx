import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { RadarProvider } from './lib/radar/RadarProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RadarProvider>
        <App />
      </RadarProvider>
    </BrowserRouter>
  </StrictMode>,
)
