# Phase 4, Step 6: Notifications System

**Duration**: 1-2 days
**Prerequisite**: Step 5 (Saved Views) completed

## Overview

This step implements a comprehensive notifications system:
- Browser notifications for reminders
- In-app notification center
- Task due date reminders
- Pomodoro session notifications
- Habit streak notifications
- Custom notification preferences
- Notification history

## Goals

- Implement browser notification system
- Create in-app notification center
- Add notification preferences
- Build notification triggers
- Create notification history
- Add notification badges
- Implement notification actions

---

## Step 6.1: Create Notification Types

**Create `src/types/notification.ts`**:

```typescript
export type NotificationType =
  | 'task_due'
  | 'task_overdue'
  | 'pomodoro_complete'
  | 'habit_reminder'
  | 'someday_nudge'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null // URL to navigate to
  data: Record<string, any> | null // Additional data
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  enabled: boolean
  task_reminders: boolean
  pomodoro_alerts: boolean
  habit_reminders: boolean
  someday_nudges: boolean
  browser_notifications: boolean
  reminder_advance_minutes: number // How many minutes before due date
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  task_reminders: true,
  pomodoro_alerts: true,
  habit_reminders: true,
  someday_nudges: true,
  browser_notifications: true,
  reminder_advance_minutes: 30,
}
```

---

## Step 6.2: Create Notification Store

**Create `src/stores/notificationStore.ts`**:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import {
  Notification,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
} from '@/types/notification'
import { useAuthStore } from './authStore'

interface NotificationState {
  notifications: Notification[]
  preferences: NotificationPreferences
  loading: boolean
  unreadCount: number

  // Actions
  fetchNotifications: () => Promise<void>
  createNotification: (
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    data?: Record<string, any>
  ) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>

  // Preferences
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void

  // Browser notifications
  requestPermission: () => Promise<boolean>
  sendBrowserNotification: (title: string, body: string, link?: string) => void

  // Subscriptions
  subscribeToNotifications: () => void
  unsubscribeFromNotifications: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      loading: false,
      unreadCount: 0,

      fetchNotifications: async () => {
        set({ loading: true })

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Error fetching notifications:', error)
          set({ loading: false })
          return
        }

        const unreadCount = (data || []).filter(n => !n.read).length

        set({
          notifications: data || [],
          unreadCount,
          loading: false,
        })
      },

      createNotification: async (
        type: NotificationType,
        title: string,
        message: string,
        link?: string,
        data?: Record<string, any>
      ) => {
        const user = useAuthStore.getState().user
        if (!user) return

        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type,
            title,
            message,
            link: link || null,
            data: data || null,
            read: false,
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating notification:', error)
          return
        }

        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))

        // Send browser notification if enabled
        const { preferences } = get()
        if (preferences.browser_notifications && preferences.enabled) {
          get().sendBrowserNotification(title, message, link)
        }
      },

      markAsRead: async (id: string) => {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)

        if (error) {
          console.error('Error marking notification as read:', error)
          return
        }

        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      },

      markAllAsRead: async () => {
        const user = useAuthStore.getState().user
        if (!user) return

        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false)

        if (error) {
          console.error('Error marking all as read:', error)
          return
        }

        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      deleteNotification: async (id: string) => {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting notification:', error)
          return
        }

        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount,
          }
        })
      },

      clearAll: async () => {
        const user = useAuthStore.getState().user
        if (!user) return

        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)

        if (error) {
          console.error('Error clearing notifications:', error)
          return
        }

        set({ notifications: [], unreadCount: 0 })
      },

      updatePreferences: (prefs: Partial<NotificationPreferences>) => {
        set(state => ({
          preferences: { ...state.preferences, ...prefs },
        }))
      },

      requestPermission: async () => {
        if (!('Notification' in window)) {
          console.warn('Browser does not support notifications')
          return false
        }

        if (Notification.permission === 'granted') {
          return true
        }

        if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          return permission === 'granted'
        }

        return false
      },

      sendBrowserNotification: (title: string, body: string, link?: string) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
          return
        }

        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        })

        if (link) {
          notification.onclick = () => {
            window.focus()
            window.location.href = link
            notification.close()
          }
        }
      },

      subscribeToNotifications: () => {
        const user = useAuthStore.getState().user
        if (!user) return

        const channel = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            payload => {
              set(state => ({
                notifications: [payload.new as Notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
              }))
            }
          )
          .subscribe()

        ;(get() as any).channel = channel
      },

      unsubscribeFromNotifications: () => {
        const channel = (get() as any).channel
        if (channel) {
          supabase.removeChannel(channel)
        }
      },
    }),
    {
      name: 'notification-preferences',
      partialize: state => ({
        preferences: state.preferences,
      }),
    }
  )
)
```

---

## Step 6.3: Create Notification Center Component

**Create `src/components/NotificationCenter.tsx`**:

```typescript
import { Dropdown, Badge, Button, List, Typography, Empty, Space, Divider } from 'antd'
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNotificationStore } from '@/stores/notificationStore'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useState } from 'react'
import { NotificationSettingsModal } from './NotificationSettingsModal'

const { Text } = Typography

const notificationIcons = {
  task_due: '📅',
  task_overdue: '⚠️',
  pomodoro_complete: '🍅',
  habit_reminder: '🔥',
  someday_nudge: '💭',
  system: '📢',
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const dropdownContent = (
    <div className="w-96 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Text strong className="text-lg">Notifications</Text>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            />
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <Empty
            description="No notifications"
            className="py-8"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={notification => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={e => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                  />,
                ]}
              >
                <Space className="w-full" direction="vertical" size={2}>
                  <Space size="small">
                    <Text className="text-xl">
                      {notificationIcons[notification.type as keyof typeof notificationIcons]}
                    </Text>
                    <Text strong={!notification.read}>{notification.title}</Text>
                  </Space>
                  <Text type="secondary" className="text-sm">
                    {notification.message}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t">
          <Button
            type="text"
            size="small"
            danger
            block
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <Dropdown
        trigger={['click']}
        dropdownRender={() => dropdownContent}
        placement="bottomRight"
      >
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
      </Dropdown>

      <NotificationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
```

---

## Step 6.4: Create Notification Settings Modal

**Create `src/components/NotificationSettingsModal.tsx`**:

```typescript
import { Modal, Form, Switch, InputNumber, Typography, Space, Button, message } from 'antd'
import { SettingOutlined, BellOutlined } from '@ant-design/icons'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'

const { Text } = Typography

interface NotificationSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function NotificationSettingsModal({ open, onClose }: NotificationSettingsModalProps) {
  const { preferences, updatePreferences, requestPermission } = useNotificationStore()
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(preferences)
    }
  }, [open, preferences, form])

  const handleSave = () => {
    const values = form.getFieldsValue()
    updatePreferences(values)
    message.success('Notification preferences saved')
    onClose()
  }

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      message.success('Browser notifications enabled')
      form.setFieldValue('browser_notifications', true)
    } else {
      message.error('Browser notifications denied')
      form.setFieldValue('browser_notifications', false)
    }
  }

  return (
    <Modal
      title={
        <Space>
          <BellOutlined />
          <span>Notification Settings</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={500}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Enable Notifications"
          name="enabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Task Reminders"
          name="task_reminders"
          valuePropName="checked"
          help="Get notified before tasks are due"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Reminder Advance Time (minutes)"
          name="reminder_advance_minutes"
          help="How many minutes before a task's due time to send a reminder"
        >
          <InputNumber min={5} max={1440} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Pomodoro Alerts"
          name="pomodoro_alerts"
          valuePropName="checked"
          help="Get notified when pomodoro sessions complete"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Habit Reminders"
          name="habit_reminders"
          valuePropName="checked"
          help="Daily reminders for habits"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Someday Nudges"
          name="someday_nudges"
          valuePropName="checked"
          help="Periodic reminders to review someday tasks"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Browser Notifications"
          name="browser_notifications"
          valuePropName="checked"
          help="Show desktop notifications"
        >
          <Switch />
        </Form.Item>

        {!('Notification' in window) ? (
          <Text type="warning" className="block mb-4">
            Browser notifications are not supported in your browser
          </Text>
        ) : Notification.permission === 'denied' ? (
          <Text type="danger" className="block mb-4">
            Browser notifications are blocked. Please enable them in your browser settings.
          </Text>
        ) : Notification.permission !== 'granted' ? (
          <Button onClick={handleRequestPermission} block className="mb-4">
            Enable Browser Notifications
          </Button>
        ) : null}
      </Form>
    </Modal>
  )
}
```

---

## Step 6.5: Add Notification Center to App Layout

**Update `src/components/AppLayout.tsx`**:

```typescript
import { NotificationCenter } from './NotificationCenter'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'

// In component:
const { fetchNotifications, subscribeToNotifications, unsubscribeFromNotifications, requestPermission } =
  useNotificationStore()

useEffect(() => {
  fetchNotifications()
  subscribeToNotifications()
  requestPermission()
  return () => unsubscribeFromNotifications()
}, [])

// Add to header actions (next to user menu):
<Space>
  <NotificationCenter />
  <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
    {/* existing user dropdown */}
  </Dropdown>
</Space>
```

---

## Step 6.6: Create Notification Database Migration

**Add to Supabase**:

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Step 6.7: Add Notification Triggers

**Update relevant stores to create notifications**:

```typescript
// In taskStore.ts - when task becomes overdue
if (isTaskOverdue(task) && !task.notified_overdue) {
  await useNotificationStore.getState().createNotification(
    'task_overdue',
    'Task Overdue',
    `"${task.title}" is overdue!`,
    `/tasks/${task.id}`
  )
}

// In pomodoroStore.ts - when session completes
completeSession: async () => {
  // ... existing code ...
  await useNotificationStore.getState().createNotification(
    'pomodoro_complete',
    'Pomodoro Complete',
    'Great work! Take a break.',
    '/pomodoro'
  )
}

// In habitStore.ts - daily habit reminder
// (This would be implemented via Edge Functions or cron job)
```

---

## Step 6.8: Test Notifications

### Test Notification Creation

1. Complete a pomodoro session
2. **Expected**: Notification appears in center with badge count
3. Browser notification shows (if enabled)

### Test Notification Center

1. Click bell icon
2. **Expected**: Dropdown shows all notifications
3. Unread notifications highlighted
4. Click notification
5. **Expected**: Marks as read, navigates to link

### Test Settings

1. Open notification settings
2. Disable task reminders
3. **Expected**: Setting persists, no more task reminders

### Test Browser Permissions

1. Click "Enable Browser Notifications"
2. **Expected**: Browser permission dialog appears
3. Grant permission
4. **Expected**: Future notifications show in browser

---

## Verification Checklist

Before proceeding to Step 7, verify:

- [ ] Notification center displays in header
- [ ] Badge count shows unread notifications
- [ ] Notifications can be marked as read
- [ ] Browser notifications work (if enabled)
- [ ] Notification settings persist
- [ ] Real-time notifications work
- [ ] Notification links navigate correctly
- [ ] Clear all works
- [ ] Different notification types display correctly
- [ ] No console errors

---

## Next Steps

Once verified, proceed to:
- **[Step 7: Mobile Responsiveness](./step-7-mobile-responsive.md)**

---

## Summary

You've successfully:
- ✅ Created notification system with types
- ✅ Built in-app notification center
- ✅ Implemented browser notifications
- ✅ Added notification preferences
- ✅ Created notification triggers
- ✅ Added real-time notification updates

**The notification system keeps users informed of important events!**
