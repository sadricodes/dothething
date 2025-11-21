# Phase 5, Step 2: Accessibility Audit & Implementation

**Duration**: 1 day
**Prerequisite**: Step 1 (Animations) completed

## Overview

This step ensures the app is accessible to all users including those using:
- Screen readers
- Keyboard-only navigation
- High contrast modes
- Different zoom levels
- Assistive technologies

## Goals

- Add proper ARIA labels and roles
- Ensure full keyboard navigation
- Verify color contrast ratios
- Add skip links
- Test with screen readers
- Support focus management
- Ensure proper heading hierarchy
- Add error announcements

---

## Step 2.1: Install Accessibility Tools

```bash
npm install --save-dev @axe-core/react
npm install react-focus-lock
npm install react-aria-live
```

---

## Step 2.2: Setup Axe for Development

**Update `src/main.tsx`** to add axe in development:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Axe accessibility testing in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Step 2.3: Create Accessibility Utilities

**Create `src/lib/accessibility.ts`**:

```typescript
import { useEffect, useRef } from 'react'

// Announce to screen readers
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus trap for modals
export function useFocusTrap(isActive: boolean) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !elementRef.current) return

    const element = elementRef.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])

  return elementRef
}

// Manage focus restoration
export function useFocusReturn() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    previousActiveElement.current?.focus()
  }

  return { saveFocus, restoreFocus }
}

// Unique ID generator for ARIA
let idCounter = 0
export function useUniqueId(prefix: string = 'id') {
  const idRef = useRef<string>()

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`
  }

  return idRef.current
}
```

---

## Step 2.4: Add Screen Reader Only Styles

**Update `src/index.css`**:

```css
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible styles */
*:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #1890ff;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 10000;
}

.skip-link:focus {
  top: 0;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  * {
    border-width: 2px !important;
  }

  button,
  a {
    text-decoration: underline;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Step 2.5: Add Skip Links

**Update `src/App.tsx`**:

```typescript
export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <main id="main-content" tabIndex={-1}>
                    <Routes>
                      {/* Your routes */}
                    </Routes>
                  </main>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  )
}
```

---

## Step 2.6: Enhance TaskCard Accessibility

**Update `src/components/TaskCard.tsx`**:

```typescript
import { useUniqueId } from '@/lib/accessibility'

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const titleId = useUniqueId('task-title')
  const descId = useUniqueId('task-desc')

  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Title
            id={titleId}
            level={4}
            className="!mb-2"
          >
            {task.title}
          </Title>

          {task.description && (
            <Text id={descId} type="secondary">
              {task.description}
            </Text>
          )}
        </div>

        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label={`More options for ${task.title}`}
          />
        </Dropdown>
      </div>

      <Space className="mt-3">
        <Select
          value={task.status}
          onChange={handleStatusChange}
          style={{ width: 140 }}
          aria-label="Task status"
        >
          {Object.entries(taskStatusConfig).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              <Space>
                {config.icon}
                {config.label}
              </Space>
            </Select.Option>
          ))}
        </Select>

        {task.due_date && (
          <Tag
            color={isOverdue ? 'red' : 'blue'}
            aria-label={`Due date: ${format(parseISO(task.due_date), 'PPP')}`}
          >
            <CalendarOutlined />
            <span className="ml-1">
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          </Tag>
        )}

        {task.is_urgent && (
          <Tag color="red" aria-label="Urgent task">
            <ThunderboltOutlined /> Urgent
          </Tag>
        )}

        {task.is_important && (
          <Tag color="orange" aria-label="Important task">
            <StarOutlined /> Important
          </Tag>
        )}
      </Space>
    </Card>
  )
}
```

---

## Step 2.7: Enhance Modal Accessibility

**Update `src/components/TaskFormModal.tsx`**:

```typescript
import { useFocusTrap, announce } from '@/lib/accessibility'

export function TaskFormModal({ open, task, onClose, onSave }: TaskFormModalProps) {
  const [form] = Form.useForm()
  const modalRef = useFocusTrap(open)

  const handleSave = async (values: any) => {
    try {
      await onSave(values)
      announce(
        task ? 'Task updated successfully' : 'Task created successfully',
        'polite'
      )
      onClose()
    } catch (error) {
      announce('Failed to save task. Please try again.', 'assertive')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      footer={null}
      destroyOnClose
      aria-labelledby="task-form-title"
    >
      <div ref={modalRef}>
        <h2 id="task-form-title" className="sr-only">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={task || {}}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a task title' }]}
          >
            <Input
              placeholder="Enter task title"
              aria-required="true"
              aria-invalid={!!form.getFieldError('title').length}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={4}
              placeholder="Enter task description (optional)"
              aria-label="Task description"
            />
          </Form.Item>

          <Form.Item name="due_date" label="Due Date">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              aria-label="Select due date"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                aria-label={task ? 'Save task changes' : 'Create task'}
              >
                {task ? 'Save Changes' : 'Create Task'}
              </Button>
              <Button onClick={onClose} aria-label="Cancel">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
```

---

## Step 2.8: Add Keyboard Shortcuts Documentation

**Create `src/components/KeyboardShortcutsModal.tsx`**:

```typescript
import { Modal, Typography, Space, Divider } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Cmd/Ctrl + K', description: 'Quick view switcher' },
    { key: 'N', description: 'Create new task' },
    { key: 'T', description: 'Go to Today view' },
    { key: 'A', description: 'Go to All Tasks view' },
    { key: 'H', description: 'Go to Habits view' },
    { key: 'K', description: 'Go to Kanban view' },
    { key: 'M', description: 'Go to Eisenhower Matrix' },
    { key: '/', description: 'Focus search' },
    { key: 'Esc', description: 'Close modal or clear search' },
    { key: 'Tab', description: 'Navigate forward' },
    { key: 'Shift + Tab', description: 'Navigate backward' },
    { key: 'Enter', description: 'Activate focused element' },
    { key: 'Space', description: 'Toggle checkbox or button' },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <QuestionCircleOutlined />
          Keyboard Shortcuts
        </Space>
      }
      footer={null}
      width={600}
    >
      <Space direction="vertical" className="w-full" size="middle">
        {shortcuts.map((shortcut, index) => (
          <div key={index}>
            <div className="flex justify-between items-center">
              <Text>{shortcut.description}</Text>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
            {index < shortcuts.length - 1 && <Divider className="!my-2" />}
          </div>
        ))}
      </Space>
    </Modal>
  )
}
```

**Add shortcut trigger in AppLayout**:

```typescript
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'

export function AppLayout() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcuts(true)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [])

  return (
    <>
      {/* Layout content */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  )
}
```

---

## Step 2.9: Add Live Region for Announcements

**Create `src/components/LiveRegion.tsx`**:

```typescript
import { useEffect, useRef } from 'react'
import { create } from 'zustand'

interface LiveRegionStore {
  message: string
  priority: 'polite' | 'assertive'
  setMessage: (message: string, priority?: 'polite' | 'assertive') => void
}

export const useLiveRegion = create<LiveRegionStore>((set) => ({
  message: '',
  priority: 'polite',
  setMessage: (message, priority = 'polite') => set({ message, priority }),
}))

export function LiveRegion() {
  const { message, priority } = useLiveRegion()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (message) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        useLiveRegion.setState({ message: '' })
      }, 1000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message])

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

// Add to App.tsx
export default function App() {
  return (
    <>
      <LiveRegion />
      {/* Rest of app */}
    </>
  )
}
```

---

## Step 2.10: Enhance Navigation Accessibility

**Update `src/components/AppLayout.tsx`**:

```typescript
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Update document title for screen readers
  useEffect(() => {
    const titles: Record<string, string> = {
      '/today': 'Today - DoTheThing',
      '/tasks': 'All Tasks - DoTheThing',
      '/habits': 'Habits - DoTheThing',
      '/kanban': 'Kanban Board - DoTheThing',
      '/matrix': 'Eisenhower Matrix - DoTheThing',
    }

    document.title = titles[location.pathname] || 'DoTheThing'
  }, [location.pathname])

  const menuItems = [
    {
      key: '/today',
      label: 'Today',
      icon: <CalendarOutlined aria-hidden="true" />,
      onClick: () => navigate('/today'),
    },
    // ... other items
  ]

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={theme === 'dark' ? 'dark' : 'light'}
      >
        <div className="p-4">
          <Title level={4} className="!mb-0 !text-white">
            DoTheThing
          </Title>
        </div>

        <nav aria-label="Main navigation">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
        </nav>
      </Sider>

      <Layout>
        <Header className="bg-white dark:bg-gray-800 px-6 flex items-center justify-between">
          <div>
            {/* Header content */}
          </div>

          <Space>
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setShowShortcuts(true)}
              aria-label="Show keyboard shortcuts"
            >
              Shortcuts (?)
            </Button>

            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              aria-label="Log out"
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content className="p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
```

---

## Step 2.11: Add Form Error Announcements

**Create `src/components/AccessibleForm.tsx`**:

```typescript
import { Form, FormProps } from 'antd'
import { useEffect, useRef } from 'react'
import { useLiveRegion } from './LiveRegion'

export function AccessibleForm(props: FormProps) {
  const [form] = Form.useForm(props.form)
  const { setMessage } = useLiveRegion()
  const previousErrorsRef = useRef<string[]>([])

  useEffect(() => {
    const fields = form.getFieldsError()
    const errors = fields
      .filter(field => field.errors.length > 0)
      .flatMap(field => field.errors)

    // Only announce new errors
    const newErrors = errors.filter(
      error => !previousErrorsRef.current.includes(error)
    )

    if (newErrors.length > 0) {
      setMessage(
        `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${newErrors.join(', ')}`,
        'assertive'
      )
    }

    previousErrorsRef.current = errors
  }, [form, setMessage])

  return <Form {...props} form={form} />
}
```

---

## Step 2.12: Test with Screen Readers

### MacOS VoiceOver Testing

1. Enable VoiceOver: `Cmd + F5`
2. Navigate the app using:
   - `VO + Right Arrow`: Next item
   - `VO + Left Arrow`: Previous item
   - `VO + Space`: Activate
3. **Expected**: All interactive elements announced
4. **Expected**: Proper context for each element
5. **Expected**: Form errors announced

### Windows NVDA Testing

1. Install and launch NVDA
2. Navigate using:
   - `Tab`: Next interactive element
   - `Shift + Tab`: Previous interactive element
   - `H`: Next heading
   - `Enter`: Activate
3. **Expected**: All elements properly announced
4. **Expected**: Heading hierarchy makes sense

---

## Step 2.13: Keyboard Navigation Testing

### Test All Interactive Elements

1. Press `Tab` to navigate through all elements
2. **Expected**: Visible focus indicator on all items
3. **Expected**: Logical tab order
4. **Expected**: No keyboard traps

### Test Modal Navigation

1. Open task form modal
2. Press `Tab` to navigate
3. **Expected**: Focus trapped in modal
4. **Expected**: First input focused automatically
5. Press `Esc`
6. **Expected**: Modal closes, focus returns to trigger

### Test Shortcuts

1. Press `?`
2. **Expected**: Shortcuts modal opens
3. Press `Cmd/Ctrl + K`
4. **Expected**: View switcher opens
5. Press `N`
6. **Expected**: New task modal opens
7. Press `/`
8. **Expected**: Search input focused

---

## Step 2.14: Color Contrast Testing

### Test with Browser DevTools

1. Open DevTools
2. Select Elements tab
3. Inspect text elements
4. Check contrast ratio in Styles panel
5. **Expected**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)

### Test in High Contrast Mode

1. **Windows**: Enable high contrast mode
2. **MacOS**: Enable Increase Contrast in Accessibility
3. Navigate the app
4. **Expected**: All elements still visible
5. **Expected**: Borders and outlines enhanced

---

## Step 2.15: Test with Zoom

1. Set browser zoom to 200%
2. **Expected**: No horizontal scrolling
3. **Expected**: Text doesn't overflow
4. **Expected**: All features still accessible
5. Set zoom to 400%
6. **Expected**: App still usable

---

## Verification Checklist

Before proceeding to Step 3, verify:

- [ ] Axe runs in development with no critical issues
- [ ] All interactive elements have ARIA labels
- [ ] Skip link works
- [ ] Full keyboard navigation supported
- [ ] Focus visible on all interactive elements
- [ ] Focus trapped in modals
- [ ] Focus restored when modals close
- [ ] Screen reader announces all elements properly
- [ ] Form errors announced
- [ ] Task updates announced
- [ ] Color contrast meets WCAG AA
- [ ] Works at 200% zoom
- [ ] High contrast mode supported
- [ ] Heading hierarchy logical
- [ ] Keyboard shortcuts documented
- [ ] No keyboard traps
- [ ] Reduced motion respected

---

## Common Accessibility Issues to Fix

### Issue: Missing ARIA Labels

```typescript
// ❌ Bad
<Button icon={<DeleteOutlined />} />

// ✅ Good
<Button icon={<DeleteOutlined />} aria-label="Delete task" />
```

### Issue: Non-Semantic HTML

```typescript
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

### Issue: Poor Color Contrast

```css
/* ❌ Bad */
.text-gray-400 { color: #9CA3AF; } /* 2.5:1 on white */

/* ✅ Good */
.text-gray-700 { color: #374151; } /* 8.6:1 on white */
```

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 3: Performance Optimization](./step-3-performance.md)**

This will optimize the app for speed and efficiency.

---

## Summary

You've successfully:
- ✅ Added comprehensive ARIA labels
- ✅ Implemented full keyboard navigation
- ✅ Added skip links
- ✅ Created focus management utilities
- ✅ Added screen reader announcements
- ✅ Verified color contrast
- ✅ Tested with screen readers
- ✅ Documented keyboard shortcuts
- ✅ Supported high contrast mode
- ✅ Ensured zoom compatibility

**The app is now accessible to all users!**
