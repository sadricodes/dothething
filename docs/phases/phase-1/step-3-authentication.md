# Phase 1, Step 3: Authentication

**Duration**: 2-3 days
**Prerequisite**: Step 2 (Supabase Setup) completed

## Overview

This step implements complete user authentication using Supabase Auth, including:
- AuthStore with Zustand for state management
- Login and Signup pages with Ant Design forms
- Protected routes
- Session management
- Password reset functionality

## Goals

- Create AuthStore for authentication state
- Build Login page with form validation
- Build Signup page with form validation
- Implement session persistence
- Set up protected routes with React Router
- Handle authentication errors gracefully

---

## Step 3.1: Set Up React Router

### Install React Router (if not already installed)

```bash
npm install react-router-dom
```

### Create Router Configuration

**Create `src/lib/router.tsx`**:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
])
```

---

## Step 3.2: Create AuthStore

**Create `src/stores/authStore.ts`**:

```typescript
import { create } from 'zustand'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ loading: false })
      return { error }
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    })

    return { error: null }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      set({ loading: false })
      return { error }
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    })

    return { error: null }
  },

  signOut: async () => {
    set({ loading: true })

    await supabase.auth.signOut()

    set({
      user: null,
      session: null,
      loading: false,
    })
  },

  initialize: async () => {
    set({ loading: true })

    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    set({
      user: session?.user ?? null,
      session,
      loading: false,
      initialized: true,
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
      })
    })
  },
}))
```

---

## Step 3.3: Create Login Page

**Create `src/pages/LoginPage.tsx`**:

```typescript
import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, signIn } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null)

    const { error } = await signIn(values.email, values.password)

    if (error) {
      setError(error.message)
      return
    }

    // Navigate to dashboard on success
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              Welcome Back
            </Title>
            <Text type="secondary">Sign in to your DoTheThing account</Text>
          </div>

          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-500 hover:text-blue-600">
                Sign up
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
```

---

## Step 3.4: Create Signup Page

**Create `src/pages/SignupPage.tsx`**:

```typescript
import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

interface SignupFormValues {
  email: string
  password: string
  confirmPassword: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const { user, loading, signUp } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (values: SignupFormValues) => {
    setError(null)

    const { error } = await signUp(values.email, values.password)

    if (error) {
      setError(error.message)
      return
    }

    // Navigate to dashboard on success
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              Create Account
            </Title>
            <Text type="secondary">Start organizing your tasks with DoTheThing</Text>
          </div>

          {error && (
            <Alert
              message="Signup Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            name="signup"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a password (min. 8 characters)"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type="secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600">
                Sign in
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
```

---

## Step 3.5: Create Protected Route Component

**Create `src/components/ProtectedRoute.tsx`**:

```typescript
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore()

  // Show loading while checking authentication
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Render protected content
  return <>{children}</>
}
```

---

## Step 3.6: Create Temporary Dashboard Page

**Create `src/pages/DashboardPage.tsx`**:

```typescript
import { Button, Typography, Space, Card } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export function DashboardPage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Title level={2}>Dashboard</Title>
              <Text type="secondary">Welcome to DoTheThing!</Text>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text strong>Logged in as: </Text>
              <Text>{user?.email}</Text>
            </div>

            <div>
              <Text type="secondary">
                Authentication is working! The task management features will be added in Phase 2.
              </Text>
            </div>

            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleSignOut}
              danger
            >
              Sign Out
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  )
}
```

---

## Step 3.7: Update Main App

**Update `src/main.tsx`**:

```typescript
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
```

**Remove old `src/App.tsx`** (no longer needed):

```bash
rm src/App.tsx
```

---

## Step 3.8: Test Authentication Flow

### Test Signup

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173` (should redirect to `/dashboard` → `/login`)
3. Click "Sign up" link
4. Fill in the signup form:
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click "Create Account"

**Expected**:
- Redirects to `/dashboard`
- Shows welcome message with email
- User is authenticated

### Test Signout

1. Click "Sign Out" button
2. **Expected**: Redirects to `/login`

### Test Login

1. Fill in the login form with credentials from signup
2. Click "Sign In"
3. **Expected**: Redirects to `/dashboard`, shows welcome message

### Test Protected Route

1. Sign out
2. Manually navigate to `http://localhost:5173/dashboard`
3. **Expected**: Automatically redirects to `/login`

### Test Session Persistence

1. Sign in
2. Refresh the page
3. **Expected**: Still signed in, stays on dashboard

---

## Step 3.9: Verify Database User

### Check Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. **Expected**: Your test user appears in the list

---

## Verification Checklist

Before proceeding to Step 4, verify:

- [ ] AuthStore is created and working
- [ ] Login page renders and accepts credentials
- [ ] Signup page renders and creates new users
- [ ] Validation works (password min length, email format, password match)
- [ ] Successful login redirects to dashboard
- [ ] Successful signup redirects to dashboard
- [ ] Sign out works and redirects to login
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Session persists across page refreshes
- [ ] User appears in Supabase Auth dashboard
- [ ] No console errors
- [ ] Error messages display for invalid credentials

---

## Troubleshooting

### Issue: "Invalid login credentials"

**Solution**:
1. Verify email/password are correct
2. Check Supabase Auth settings (email confirmation may be required)
3. Check Supabase Auth logs for details

### Issue: Page doesn't redirect after login

**Solution**:
1. Verify `navigate('/dashboard')` is called after successful login
2. Check browser console for router errors
3. Ensure router is set up correctly in `main.tsx`

### Issue: User logged out on page refresh

**Solution**:
1. Verify `initialize()` is called in `AppInitializer`
2. Check Supabase client has `persistSession: true`
3. Check browser localStorage for `supabase.auth.token`

### Issue: RLS policy errors

**Solution**:
- This is normal! RLS is working correctly
- Users can only access their own data
- Will be utilized fully in Phase 2

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 4: Design System Foundation](./step-4-design-system.md)**

This will implement theming, dark mode, and reusable UI components.

---

## Summary

You've successfully:
- ✅ Created AuthStore with Zustand
- ✅ Built Login page with validation
- ✅ Built Signup page with validation
- ✅ Implemented protected routes
- ✅ Set up session persistence
- ✅ Integrated React Router
- ✅ Tested complete auth flow
- ✅ Verified users in Supabase Dashboard

Authentication is complete! Users can now sign up, log in, and access protected content.
