# Phase 4, Step 7: Mobile Responsiveness

**Duration**: 2 days
**Prerequisite**: Step 6 (Notifications) completed

## Overview

This step ensures the application is fully responsive and mobile-friendly:
- Responsive layouts for all pages
- Mobile-optimized navigation
- Touch-friendly interactions
- Mobile task creation flow
- Swipe gestures for actions
- Bottom navigation for mobile
- Mobile-first components

## Goals

- Implement responsive breakpoints
- Create mobile navigation
- Optimize touch targets
- Add swipe gestures
- Create mobile modals
- Implement pull-to-refresh
- Add mobile-specific layouts
- Test on various screen sizes

---

## Step 7.1: Update Design Tokens for Breakpoints

**Create `src/lib/breakpoints.ts`**:

```typescript
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs}px)`,
  sm: `@media (max-width: ${breakpoints.sm}px)`,
  md: `@media (max-width: ${breakpoints.md}px)`,
  lg: `@media (max-width: ${breakpoints.lg}px)`,
  xl: `@media (max-width: ${breakpoints.xl}px)`,
  xxl: `@media (max-width: ${breakpoints.xxl}px)`,
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
```

---

## Step 7.2: Create Mobile Navigation

**Create `src/components/MobileNav.tsx`**:

```typescript
import { useState } from 'react'
import { Drawer, Menu, Button, Space, Typography } from 'antd'
import {
  MenuOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  TagOutlined,
  FireOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const { Text } = Typography

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuthStore()

  const menuItems = [
    {
      key: '/today',
      label: 'Today',
      icon: <CalendarOutlined />,
    },
    {
      key: '/tasks',
      label: 'All Tasks',
      icon: <UnorderedListOutlined />,
    },
    {
      key: '/matrix',
      label: 'Matrix',
      icon: <AppstoreOutlined />,
    },
    {
      key: '/kanban',
      label: 'Kanban',
      icon: <ProjectOutlined />,
    },
    {
      key: '/hierarchy',
      label: 'Hierarchy',
      icon: <ApartmentOutlined />,
    },
    {
      key: '/habits',
      label: 'Habits',
      icon: <FireOutlined />,
    },
    {
      key: '/someday',
      label: 'Someday',
      icon: <InboxOutlined />,
    },
    {
      key: '/pomodoro',
      label: 'Pomodoro',
      icon: <ClockCircleOutlined />,
    },
    {
      key: '/tags',
      label: 'Tags',
      icon: <TagOutlined />,
    },
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setDrawerOpen(true)}
        className="md:hidden"
      />

      <Drawer
        title="DoTheThing"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={280}
      >
        <Space direction="vertical" className="w-full h-full">
          <div className="flex-1">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems.map(item => ({
                ...item,
                onClick: () => handleMenuClick(item.key),
              }))}
            />
          </div>

          <div className="border-t pt-4">
            <Text type="secondary" className="block mb-2 px-4">
              {user?.email}
            </Text>
            <Button
              block
              danger
              icon={<LogoutOutlined />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </Space>
      </Drawer>
    </>
  )
}
```

---

## Step 7.3: Create Mobile Bottom Navigation

**Create `src/components/BottomNav.tsx`**:

```typescript
import { Badge } from 'antd'
import {
  CalendarOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  FireOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTaskStore } from '@/stores/taskStore'
import { useIsMobile } from '@/lib/breakpoints'
import { useState } from 'react'
import { TaskFormModal } from './TaskFormModal'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { filters } = useTaskStore()
  const isMobile = useIsMobile()
  const [isFormOpen, setIsFormOpen] = useState(false)

  if (!isMobile) return null

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== null && value !== ''
  }).length

  const navItems = [
    {
      key: '/today',
      icon: <CalendarOutlined />,
      label: 'Today',
    },
    {
      key: '/tasks',
      icon: (
        <Badge count={activeFilterCount} size="small">
          <UnorderedListOutlined />
        </Badge>
      ),
      label: 'Tasks',
    },
    {
      key: 'add',
      icon: <PlusCircleOutlined className="text-2xl" />,
      label: 'Add',
      onClick: () => setIsFormOpen(true),
    },
    {
      key: '/habits',
      icon: <FireOutlined />,
      label: 'Habits',
    },
    {
      key: '/matrix',
      icon: <AppstoreOutlined />,
      label: 'Matrix',
    },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const isActive = location.pathname === item.key
            return (
              <div
                key={item.key}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                  isActive ? 'text-blue-500' : 'text-gray-600'
                }`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick()
                  } else {
                    navigate(item.key)
                  }
                }}
              >
                <div className="text-xl">{item.icon}</div>
                <div className="text-xs mt-1">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add padding to content to account for fixed bottom nav */}
      <style>{`
        @media (max-width: 768px) {
          .ant-layout-content {
            padding-bottom: 80px !important;
          }
        }
      `}</style>

      <TaskFormModal
        open={isFormOpen}
        task={null}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  )
}
```

---

## Step 7.4: Update App Layout for Mobile

**Update `src/components/AppLayout.tsx`**:

```typescript
import { MobileNav } from './MobileNav'
import { BottomNav } from './BottomNav'
import { useIsMobile } from '@/lib/breakpoints'

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      {!isMobile && (
        <Sider
          // ... existing sider props
        >
          {/* existing sider content */}
        </Sider>
      )}

      <Layout>
        <Header className="bg-white border-b px-4 md:px-6 flex items-center justify-between">
          {/* Mobile menu button */}
          <MobileNav />

          {/* Logo/Title - centered on mobile */}
          <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
            <Text strong className="text-lg">
              DoTheThing
            </Text>
          </div>

          <Space>
            <NotificationCenter />
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              {/* On mobile, show just icon, on desktop show email */}
              {isMobile ? (
                <Button type="text" icon={<SettingOutlined />} />
              ) : (
                <Button type="text">
                  <Space>
                    <Text>{user?.email}</Text>
                    <SettingOutlined />
                  </Space>
                </Button>
              )}
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-4 md:p-6">{children}</Content>
      </Layout>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </Layout>
  )
}
```

---

## Step 7.5: Make Task Cards Touch-Friendly

**Update `src/components/TaskCard.tsx`** for better mobile experience:

```typescript
// Add mobile-optimized styling
const isMobile = useIsMobile()

return (
  <Card
    className={`task-card hover:shadow-md transition-shadow cursor-pointer ${
      isMobile ? 'active:bg-gray-50' : ''
    }`}
    size={isMobile ? 'small' : 'default'}
    // ... rest of props
  >
    {/* Make checkboxes larger on mobile */}
    <Checkbox
      checked={isCompleted}
      onChange={onComplete}
      onClick={e => e.stopPropagation()}
      className={isMobile ? 'scale-125' : ''}
    />

    {/* Rest of card content */}
  </Card>
)
```

---

## Step 7.6: Create Mobile-Optimized Modals

**Create `src/components/MobileModal.tsx`**:

```typescript
import { Modal, ModalProps } from 'antd'
import { useIsMobile } from '@/lib/breakpoints'

interface MobileModalProps extends ModalProps {
  children: React.ReactNode
}

export function MobileModal({ children, ...props }: MobileModalProps) {
  const isMobile = useIsMobile()

  return (
    <Modal
      {...props}
      // On mobile, make modals full screen
      width={isMobile ? '100%' : props.width}
      style={
        isMobile
          ? {
              top: 0,
              maxWidth: '100%',
              padding: 0,
              margin: 0,
            }
          : props.style
      }
      styles={{
        ...props.styles,
        body: isMobile
          ? {
              height: 'calc(100vh - 110px)',
              overflow: 'auto',
              ...props.styles?.body,
            }
          : props.styles?.body,
      }}
    >
      {children}
    </Modal>
  )
}
```

**Update existing modals to use MobileModal**:

```typescript
// In TaskFormModal.tsx, TaskDetailModal.tsx, etc.
import { MobileModal as Modal } from './MobileModal'

// Use Modal component as before, it will automatically adapt
```

---

## Step 7.7: Add Swipe Gestures for Tasks

**Install dependency**:

```bash
npm install react-swipeable
```

**Create `src/components/SwipeableTaskCard.tsx`**:

```typescript
import { useSwipeable } from 'react-swipeable'
import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { TaskWithTags } from '@/types/task'
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useIsMobile } from '@/lib/breakpoints'

interface SwipeableTaskCardProps {
  task: TaskWithTags
  onComplete?: () => void
  onDelete?: () => void
  // ... other TaskCard props
}

export function SwipeableTaskCard({
  task,
  onComplete,
  onDelete,
  ...props
}: SwipeableTaskCardProps) {
  const isMobile = useIsMobile()
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)

  const handlers = useSwipeable({
    onSwiping: eventData => {
      if (!isMobile) return
      setSwiping(true)
      const offset = Math.max(-80, Math.min(80, eventData.deltaX))
      setSwipeOffset(offset)
    },
    onSwiped: () => {
      setSwiping(false)
      if (swipeOffset > 40) {
        // Swipe right = complete
        onComplete?.()
      } else if (swipeOffset < -40) {
        // Swipe left = delete
        onDelete?.()
      }
      setSwipeOffset(0)
    },
    trackMouse: false,
  })

  if (!isMobile) {
    return <TaskCard task={task} onComplete={onComplete} onDelete={onDelete} {...props} />
  }

  return (
    <div className="relative overflow-hidden" {...handlers}>
      {/* Background actions */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-start bg-green-500 text-white px-4">
        <CheckOutlined className="text-xl" />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 text-white px-4">
        <DeleteOutlined className="text-xl" />
      </div>

      {/* Task card - slides with swipe */}
      <div
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease',
        }}
      >
        <TaskCard task={task} onComplete={onComplete} onDelete={onDelete} {...props} />
      </div>
    </div>
  )
}
```

---

## Step 7.8: Add Pull-to-Refresh

**Create `src/hooks/usePullToRefresh.ts`**:

```typescript
import { useEffect, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  useEffect(() => {
    let touchStart = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStart = e.touches[0].clientY
        setStartY(touchStart)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0) {
        const currentY = e.touches[0].clientY
        const pullDistance = currentY - startY

        if (pullDistance > 0) {
          setPulling(true)
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pulling) {
        await onRefresh()
        setPulling(false)
      }
      setStartY(0)
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pulling, startY, onRefresh])

  return pulling
}
```

**Use in pages**:

```typescript
// In TodayPage.tsx
const pulling = usePullToRefresh(async () => {
  await fetchTasks()
  message.success('Refreshed')
})

return (
  <AppLayout>
    {pulling && (
      <div className="fixed top-16 left-0 right-0 text-center py-2 bg-blue-100 z-50">
        <Text>Pull to refresh...</Text>
      </div>
    )}
    {/* rest of page */}
  </AppLayout>
)
```

---

## Step 7.9: Optimize Matrix and Kanban for Mobile

**Update `src/components/EisenhowerMatrix.tsx`**:

```typescript
const isMobile = useIsMobile()

return (
  <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} h-auto md:h-[calc(100vh-250px)]`}>
    {/* Quadrants */}
  </div>
)
```

**Update `src/components/KanbanBoard.tsx`**:

```typescript
const isMobile = useIsMobile()

return (
  <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'overflow-x-auto'} pb-4`}>
    {/* Columns */}
  </div>
)
```

---

## Step 7.10: Test Mobile Responsiveness

### Test Navigation

1. Resize browser to mobile width (< 768px)
2. **Expected**: Sidebar hides, mobile menu button appears
3. Click menu button
4. **Expected**: Drawer opens with navigation
5. Bottom navigation appears

### Test Bottom Nav

1. On mobile view
2. **Expected**: Bottom nav shows 5 items
3. Click each nav item
4. **Expected**: Navigates correctly
5. Click "+" button
6. **Expected**: Task form modal opens

### Test Touch Interactions

1. On mobile device or dev tools mobile emulation
2. Tap task card
3. **Expected**: Larger touch target, visible tap feedback
4. Swipe task right
5. **Expected**: Completes task
6. Swipe task left
7. **Expected**: Deletes task

### Test Modals

1. Open task form on mobile
2. **Expected**: Modal is full screen
3. Can scroll within modal
4. All form fields accessible

### Test Pull to Refresh

1. On Today page (mobile)
2. Pull down from top
3. **Expected**: "Pull to refresh" indicator appears
4. Release
5. **Expected**: Page refreshes, data reloads

### Test Responsive Layouts

Test on:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

**Expected**: All layouts adapt appropriately

---

## Verification Checklist

Before proceeding to Phase 5, verify:

- [ ] Mobile navigation works
- [ ] Bottom navigation displays on mobile
- [ ] Sidebar hides on mobile
- [ ] Touch targets are large enough (44x44px minimum)
- [ ] Swipe gestures work for task actions
- [ ] Modals are full screen on mobile
- [ ] Pull to refresh works
- [ ] All pages responsive
- [ ] Matrix stacks vertically on mobile
- [ ] Kanban scrolls or stacks on mobile
- [ ] Forms are usable on mobile
- [ ] No horizontal scroll issues
- [ ] Performance good on mobile

---

## Next Steps

**🎉 Phase 4 Complete!**

All verification checks should pass. You now have:
- ✅ Pomodoro timer
- ✅ Eisenhower Matrix
- ✅ Kanban board
- ✅ Advanced filters
- ✅ Saved views
- ✅ Notifications
- ✅ Mobile responsiveness

**Proceed to Phase 5**:
- **[Phase 5: Polish & Launch](../phase-5/step-1-animations.md)**

This will add animations, accessibility, performance optimization, edge functions, testing, and deployment.

---

## Summary

You've successfully:
- ✅ Created mobile navigation
- ✅ Built bottom navigation bar
- ✅ Optimized touch targets
- ✅ Added swipe gestures
- ✅ Implemented pull-to-refresh
- ✅ Made all layouts responsive
- ✅ Created mobile-optimized modals

**Phase 4 is complete! The app is now fully responsive and mobile-friendly.**
