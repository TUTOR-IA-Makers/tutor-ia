import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app'
import { createServices } from '@/services'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@/styles/tokens.css'
import '@/styles/base.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root ausente em index.html')

// Not a top-level await: with one, Rolldown moves the code shared with the lazy mock chunk
// out of the entry into an extra chunk, which the size budget on index-*.js does not see.
void createServices().then((services) => {
  createRoot(container).render(
    <StrictMode>
      <App services={services} />
    </StrictMode>,
  )
})
