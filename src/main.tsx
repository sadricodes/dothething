import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { ThemeProvider } from './components/ThemeProvider'
import { router } from './lib/router'
import { useAuthStore } from './stores/authStore'
import './index.css'

function AppInitializer() {
  const initialize = useAuthStore(state => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return null
}

function Root() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <AntApp>
          <AppInitializer />
          <RouterProvider router={router} />
        </AntApp>
      </ThemeProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
