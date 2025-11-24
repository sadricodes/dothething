import { ReactNode, useEffect, useState } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'
import { useUIStore } from '@/stores/uiStore'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useUIStore(state => state.theme)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      if (themeMode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(systemPrefersDark)
      } else {
        setIsDark(themeMode === 'dark')
      }
    }

    checkTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (themeMode === 'system') {
        checkTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          // Brand colors
          colorPrimary: '#3B82F6', // Blue-500
          colorSuccess: '#10B981', // Green-500
          colorWarning: '#F59E0B', // Amber-500
          colorError: '#EF4444', // Red-500
          colorInfo: '#3B82F6', // Blue-500

          // Typography
          fontSize: 14,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

          // Layout
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,

          // Spacing
          marginXS: 4,
          marginSM: 8,
          margin: 16,
          marginMD: 20,
          marginLG: 24,
          marginXL: 32,

          // Component-specific
          controlHeight: 40,
          controlHeightLG: 48,
          controlHeightSM: 32,
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 8,
            fontWeight: 500,
          },
          Input: {
            controlHeight: 40,
            borderRadius: 8,
          },
          Card: {
            borderRadiusLG: 12,
          },
          Modal: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
