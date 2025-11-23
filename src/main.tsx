import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme, App as AntApp } from 'antd'
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
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#3B82F6',
            borderRadius: 8,
            fontSize: 14,
          },
        }}
      >
        <AntApp>
          <AppInitializer />
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
