# Phase 1, Step 4: Design System Foundation

**Duration**: 2-3 days
**Prerequisite**: Step 3 (Authentication) completed

## Overview

This step establishes the design system foundation including:
- Ant Design theme customization
- Dark/Light mode implementation
- UIStore for app-level state
- Reusable layout components
- Design tokens and brand colors

## Goals

- Configure Ant Design theme with brand colors
- Implement dark/light mode toggle
- Create UIStore for theme state
- Build main application layout
- Create reusable components
- Establish consistent spacing and typography

---

## Step 4.1: Create UIStore

**Create `src/stores/uiStore.ts`**:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  selectedTask: string | null
  showCompletedTasks: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  selectTask: (id: string | null) => void
  toggleShowCompleted: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      theme: 'system',
      sidebarCollapsed: false,
      selectedTask: null,
      showCompletedTasks: false,

      setTheme: theme => set({ theme }),

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      selectTask: id => set({ selectedTask: id }),

      toggleShowCompleted: () => set(state => ({ showCompletedTasks: !state.showCompletedTasks })),
    }),
    {
      name: 'ui-storage',
      partialize: state => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        showCompletedTasks: state.showCompletedTasks,
      }),
    }
  )
)
```

---

## Step 4.2: Create Theme Provider

**Create `src/components/ThemeProvider.tsx`**:

```typescript
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
```

---

## Step 4.3: Create App Layout Component

**Create `src/components/AppLayout.tsx`**:

```typescript
import { ReactNode } from 'react'
import { Layout, Button, Dropdown, Space, Typography, MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const { Header, Content, Sider } = Layout
const { Text } = Typography

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUIStore()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const themeMenuItems: MenuProps['items'] = [
    {
      key: 'light',
      label: 'Light',
      icon: <SunOutlined />,
      onClick: () => setTheme('light'),
    },
    {
      key: 'dark',
      label: 'Dark',
      icon: <MoonOutlined />,
      onClick: () => setTheme('dark'),
    },
    {
      key: 'system',
      label: 'System',
      icon: <DesktopOutlined />,
      onClick: () => setTheme('system'),
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'theme',
      label: 'Theme',
      icon: theme === 'dark' ? <MoonOutlined /> : <SunOutlined />,
      children: themeMenuItems,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleSignOut,
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* Sidebar - Will be enhanced in Phase 2 */}
      <Sider
        theme="light"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        width={240}
        className="border-r"
      >
        <div className="h-16 flex items-center justify-center px-4">
          <Text strong className="text-lg">
            {sidebarCollapsed ? 'DT' : 'DoTheThing'}
          </Text>
        </div>

        {/* Navigation will be added in Phase 2 */}
      </Sider>

      <Layout>
        {/* Header */}
        <Header className="bg-white border-b px-6 flex items-center justify-between">
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="lg:hidden"
          />

          <div className="flex-1" />

          <Space>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Button type="text">
                <Space>
                  <Text>{user?.email}</Text>
                  <SettingOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  )
}
```

---

## Step 4.4: Update Dashboard to Use Layout

**Update `src/pages/DashboardPage.tsx`**:

```typescript
import { Typography, Space, Card, Alert } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text, Paragraph } = Typography

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={2}>Welcome to DoTheThing! 👋</Title>
            <Text type="secondary">Logged in as {user?.email}</Text>
          </div>

          <Alert
            message="Phase 1 Complete!"
            description="Authentication and design system are set up. Task management features will be added in Phase 2."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />

          <Card title="What's Next?">
            <Space direction="vertical" size="middle" className="w-full">
              <div>
                <Text strong>Phase 2: Core Task Management</Text>
                <Paragraph type="secondary" className="!mb-0 !mt-1">
                  • Create and manage tasks
                  <br />
                  • Organize with tags
                  <br />
                  • Parent/child task relationships
                  <br />• Today dashboard
                </Paragraph>
              </div>

              <div>
                <Text strong>Phase 3: Advanced Features</Text>
                <Paragraph type="secondary" className="!mb-0 !mt-1">
                  • Recurring tasks
                  <br />
                  • Habit tracking with streaks
                  <br />• Someday tasks
                </Paragraph>
              </div>
            </Space>
          </Card>

          <Card title="Current Features" className="bg-blue-50 border-blue-200">
            <Space direction="vertical" size="small">
              <Text>✅ User authentication (sign up, login, logout)</Text>
              <Text>✅ Protected routes</Text>
              <Text>✅ Dark/Light mode toggle</Text>
              <Text>✅ Responsive layout</Text>
              <Text>✅ Ant Design theming</Text>
            </Space>
          </Card>
        </Space>
      </div>
    </AppLayout>
  )
}
```

---

## Step 4.5: Update Main Entry Point

**Update `src/main.tsx`**:

```typescript
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
```

---

## Step 4.6: Create Design Tokens Reference

**Create `src/lib/design-tokens.ts`**:

```typescript
/**
 * Design tokens for DoTheThing
 * These are used throughout the app for consistency
 */

export const colors = {
  // Primary brand colors
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Task status colors
  ready: '#6B7280',
  inProgress: '#3B82F6',
  blocked: '#F59E0B',
  completed: '#10B981',
  archived: '#9CA3AF',

  // Priority colors (Eisenhower Matrix)
  urgentImportant: '#EF4444',
  notUrgentImportant: '#3B82F6',
  urgentNotImportant: '#F59E0B',
  notUrgentNotImportant: '#6B7280',

  // Gradients for tags
  gradients: {
    sunset: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    ocean: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)',
    forest: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
    twilight: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    rose: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
    candy: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
    sky: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    fire: 'linear-gradient(135deg, #EAB308 0%, #EF4444 100%)',
  },
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
}

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
```

---

## Step 4.7: Test Theme Toggle

### Test Light/Dark Mode

1. Start dev server: `npm run dev`
2. Login to the application
3. Click on your email in the header
4. Hover over "Theme" → Select "Dark"
5. **Expected**: App switches to dark mode, preference persists on refresh
6. Select "Light" → **Expected**: Switches back to light mode
7. Select "System" → **Expected**: Follows system preference

### Test Sidebar Toggle

1. Click the menu icon (hamburger/collapse icon)
2. **Expected**: Sidebar collapses to icons only
3. Click again → **Expected**: Sidebar expands

### Test Responsive Design

1. Resize browser window to mobile size (<768px)
2. **Expected**: Sidebar becomes collapsible drawer
3. Layout adjusts for mobile view

---

## Verification Checklist

Before proceeding to Phase 2, verify:

- [ ] UIStore is created and working
- [ ] ThemeProvider wraps the app
- [ ] Dark mode toggle works correctly
- [ ] Light mode toggle works correctly
- [ ] System theme detection works
- [ ] Theme preference persists across refreshes
- [ ] AppLayout renders with sidebar and header
- [ ] Sidebar collapse/expand works
- [ ] User menu dropdown works
- [ ] Sign out from dropdown works
- [ ] Dashboard displays with new layout
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] All Ant Design components use consistent theming

---

## Troubleshooting

### Issue: Theme doesn't change

**Solution**:
1. Verify UIStore is properly initialized
2. Check `zustand/middleware` persist is working
3. Clear browser localStorage and try again
4. Check ThemeProvider is wrapping the app

### Issue: Sidebar doesn't collapse

**Solution**:
1. Verify `toggleSidebar` is called from UIStore
2. Check Ant Design Sider `collapsed` prop is bound correctly
3. Ensure state is updating in React DevTools

### Issue: Dark mode colors look wrong

**Solution**:
1. Verify `antTheme.darkAlgorithm` is applied
2. Check Ant Design ConfigProvider theme object
3. Ensure no conflicting TailwindCSS classes

---

## Next Steps

✅ **Phase 1 is Complete!**

All verification checks should pass. You now have:
- ✅ Complete project setup
- ✅ Database with RLS
- ✅ User authentication
- ✅ Theme system
- ✅ Reusable layouts

**Proceed to Phase 2**:
- **[Phase 2: Core Task Management](../phase-2/step-1-task-data-layer.md)**

This will implement the core task CRUD operations, tag system, and basic UI.

---

## Summary

You've successfully:
- ✅ Created UIStore for app-level state
- ✅ Implemented ThemeProvider with dark/light/system modes
- ✅ Built AppLayout with sidebar and header
- ✅ Integrated theme toggle in user menu
- ✅ Established design tokens and brand colors
- ✅ Created responsive, accessible layout
- ✅ Tested theme persistence
- ✅ Verified responsive design

**Phase 1 Complete! 🎉**

The foundation is solid. The app has authentication, theming, and a professional layout ready for task management features in Phase 2.
