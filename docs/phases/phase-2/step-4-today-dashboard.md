# Phase 2, Step 4: Today Dashboard

**Duration**: 2-3 days
**Prerequisite**: Step 3 (Basic Task UI) completed

## Overview

This step implements the Today dashboard - the main landing page that shows:
- Tasks scheduled for today
- Overdue tasks
- Quick task creation
- Task stats overview
- Upcoming tasks (next 7 days)
- Completed today section

## Goals

- Create Today dashboard page
- Display tasks scheduled for today
- Show overdue tasks prominently
- Add quick task creation
- Display task statistics
- Show upcoming tasks section
- Implement "completed today" section
- Add date navigation (previous/next day)

---

## Step 4.1: Create Dashboard Stats Component

**Create `src/components/DashboardStats.tsx`**:

```typescript
import { Card, Statistic, Row, Col } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { isTaskOverdue } from '@/lib/task-utils'

export function DashboardStats() {
  const { tasks } = useTaskStore()

  const activeTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived'
  )
  const completedToday = tasks.filter(
    t => t.status === 'completed' &&
    t.completed_at &&
    new Date(t.completed_at).toDateString() === new Date().toDateString()
  )
  const overdueTasks = tasks.filter(t => isTaskOverdue(t))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')

  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={12} md={6}>
        <Card>
          <Statistic
            title="Active Tasks"
            value={activeTasks.length}
            prefix={<InboxOutlined />}
            valueStyle={{ color: '#3B82F6' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6}>
        <Card>
          <Statistic
            title="In Progress"
            value={inProgressTasks.length}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#F59E0B' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6}>
        <Card>
          <Statistic
            title="Overdue"
            value={overdueTasks.length}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#EF4444' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6}>
        <Card>
          <Statistic
            title="Completed Today"
            value={completedToday.length}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#10B981' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
```

---

## Step 4.2: Create Quick Add Task Component

**Create `src/components/QuickAddTask.tsx`**:

```typescript
import { useState } from 'react'
import { Input, Button, Space, message, Select } from 'antd'
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { TaskFormData } from '@/types/task'

export function QuickAddTask() {
  const { createTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickPriority, setQuickPriority] = useState<'none' | 'urgent' | 'important' | 'both'>(
    'none'
  )

  const handleQuickAdd = async () => {
    if (!title.trim()) {
      message.warning('Please enter a task title')
      return
    }

    setLoading(true)

    const taskData: TaskFormData = {
      title: title.trim(),
      status: 'ready',
      type: 'task',
      scheduled_date: new Date().toISOString(),
      is_urgent: quickPriority === 'urgent' || quickPriority === 'both',
      is_important: quickPriority === 'important' || quickPriority === 'both',
    }

    const { error } = await createTask(taskData)

    if (error) {
      message.error(error.message)
    } else {
      message.success('Task added to today!')
      setTitle('')
      setQuickPriority('none')
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  return (
    <Space.Compact className="w-full">
      <Select
        value={quickPriority}
        onChange={setQuickPriority}
        style={{ width: 140 }}
        options={[
          { label: 'Normal', value: 'none' },
          { label: '🔥 Urgent', value: 'urgent' },
          { label: '⭐ Important', value: 'important' },
          { label: '🔥⭐ Both', value: 'both' },
        ]}
      />
      <Input
        placeholder="Add a task for today... (Press Enter)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyPress={handleKeyPress}
        size="large"
        prefix={<ThunderboltOutlined />}
        disabled={loading}
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        size="large"
        onClick={handleQuickAdd}
        loading={loading}
      >
        Add
      </Button>
    </Space.Compact>
  )
}
```

---

## Step 4.3: Create Upcoming Tasks Component

**Create `src/components/UpcomingTasks.tsx`**:

```typescript
import { Card, Typography, Empty, Space, Tag } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { TaskCard } from './TaskCard'
import { parseISO, isWithinInterval, startOfDay, addDays, format } from 'date-fns'

const { Title, Text } = Typography

export function UpcomingTasks() {
  const { tasks } = useTaskStore()

  const today = startOfDay(new Date())
  const nextWeek = addDays(today, 7)

  const upcomingTasks = tasks.filter(task => {
    if (task.status === 'completed' || task.status === 'archived') return false
    if (!task.scheduled_date) return false

    const scheduledDate = parseISO(task.scheduled_date)
    return isWithinInterval(scheduledDate, {
      start: addDays(today, 1), // Tomorrow
      end: nextWeek,
    })
  })

  // Group by date
  const tasksByDate = upcomingTasks.reduce((acc, task) => {
    const dateKey = format(parseISO(task.scheduled_date!), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(task)
    return acc
  }, {} as Record<string, typeof upcomingTasks>)

  const sortedDates = Object.keys(tasksByDate).sort()

  if (sortedDates.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">No upcoming tasks in the next 7 days</Text>}
        />
      </Card>
    )
  }

  return (
    <Space direction="vertical" className="w-full" size="large">
      {sortedDates.map(dateKey => {
        const dateTasks = tasksByDate[dateKey]
        const dateObj = parseISO(dateKey)

        return (
          <Card key={dateKey} size="small">
            <div className="mb-3">
              <Space size="small">
                <CalendarOutlined className="text-blue-500" />
                <Text strong>{format(dateObj, 'EEEE, MMM d')}</Text>
                <Tag>{dateTasks.length}</Tag>
              </Space>
            </div>

            <Space direction="vertical" className="w-full" size="small">
              {dateTasks.map(task => (
                <TaskCard key={task.id} task={task} compact showDescription={false} />
              ))}
            </Space>
          </Card>
        )
      })}
    </Space>
  )
}
```

---

## Step 4.4: Create Today Dashboard Page

**Create `src/pages/TodayPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Typography,
  Space,
  Card,
  Divider,
  Button,
  Tabs,
  Empty,
  Segmented,
} from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { DashboardStats } from '@/components/DashboardStats'
import { QuickAddTask } from '@/components/QuickAddTask'
import { TaskList } from '@/components/TaskList'
import { UpcomingTasks } from '@/components/UpcomingTasks'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { isTaskScheduledToday, isTaskOverdue } from '@/lib/task-utils'
import { format, startOfDay, addDays, subDays } from 'date-fns'

const { Title, Text } = Typography

export function TodayPage() {
  const {
    tasks,
    fetchTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
    setFilters,
    getFilteredTasks,
  } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'today' | 'overdue' | 'upcoming'>('today')

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  // Filter tasks for today
  const todayTasks = tasks.filter(
    task =>
      task.status !== 'archived' &&
      task.status !== 'completed' &&
      isTaskScheduledToday(task)
  )

  const overdueTasks = tasks.filter(task => isTaskOverdue(task))

  const completedToday = tasks.filter(
    task =>
      task.status === 'completed' &&
      task.completed_at &&
      startOfDay(new Date(task.completed_at)).getTime() === startOfDay(currentDate).getTime()
  )

  const handlePreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1))
  }

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = startOfDay(currentDate).getTime() === startOfDay(new Date()).getTime()

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header with Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center" size="middle">
              <CalendarOutlined className="text-2xl text-blue-500" />
              <div>
                <Title level={2} className="!mb-0">
                  {isToday ? 'Today' : format(currentDate, 'EEEE')}
                </Title>
                <Text type="secondary">{format(currentDate, 'MMMM d, yyyy')}</Text>
              </div>
            </Space>
          </div>

          <Space>
            <Button icon={<LeftOutlined />} onClick={handlePreviousDay} />
            <Button onClick={handleToday} disabled={isToday}>
              Today
            </Button>
            <Button icon={<RightOutlined />} onClick={handleNextDay} />
          </Space>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <DashboardStats />
        </div>

        {/* Quick Add */}
        {isToday && (
          <Card className="mb-6">
            <QuickAddTask />
          </Card>
        )}

        {/* Main Content */}
        <div className="mb-4">
          <Segmented
            value={viewMode}
            onChange={value => setViewMode(value as typeof viewMode)}
            options={[
              {
                label: (
                  <Space>
                    <CalendarOutlined />
                    <span>Today ({todayTasks.length})</span>
                  </Space>
                ),
                value: 'today',
              },
              {
                label: (
                  <Space>
                    <FireOutlined />
                    <span>Overdue ({overdueTasks.length})</span>
                  </Space>
                ),
                value: 'overdue',
              },
              {
                label: (
                  <Space>
                    <CalendarOutlined />
                    <span>Upcoming</span>
                  </Space>
                ),
                value: 'upcoming',
              },
            ]}
            block
          />
        </div>

        {/* Today's Tasks */}
        {viewMode === 'today' && (
          <Space direction="vertical" className="w-full" size="large">
            <Card
              title={
                <Space>
                  <CalendarOutlined className="text-blue-500" />
                  <span>Today's Tasks</span>
                </Space>
              }
            >
              <TaskList
                tasks={todayTasks}
                emptyMessage="No tasks scheduled for today. Add one above!"
              />
            </Card>

            {completedToday.length > 0 && (
              <>
                <Divider />
                <Card
                  title={
                    <Space>
                      <CheckCircleOutlined className="text-green-500" />
                      <span>Completed Today ({completedToday.length})</span>
                    </Space>
                  }
                >
                  <TaskList tasks={completedToday} compact />
                </Card>
              </>
            )}
          </Space>
        )}

        {/* Overdue Tasks */}
        {viewMode === 'overdue' && (
          <Card
            title={
              <Space>
                <FireOutlined className="text-red-500" />
                <span>Overdue Tasks</span>
              </Space>
            }
          >
            <TaskList
              tasks={overdueTasks}
              emptyMessage="No overdue tasks. Great job staying on top of things!"
            />
          </Card>
        )}

        {/* Upcoming Tasks */}
        {viewMode === 'upcoming' && (
          <div>
            <Title level={4} className="mb-4">
              Next 7 Days
            </Title>
            <UpcomingTasks />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
```

---

## Step 4.5: Update Router

**Update `src/lib/router.tsx`**:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { TodayPage } from '@/pages/TodayPage'
import { TagsPage } from '@/pages/TagsPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/today" replace />,
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
    path: '/today',
    element: (
      <ProtectedRoute>
        <TodayPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: <Navigate to="/today" replace />,
  },
  {
    path: '/tags',
    element: (
      <ProtectedRoute>
        <TagsPage />
      </ProtectedRoute>
    ),
  },
])
```

---

## Step 4.6: Update Sidebar Navigation

**Update `src/components/AppLayout.tsx`** to include Today navigation:

```typescript
// ... (previous imports remain the same)
import {
  // ... previous icons
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons'

// ... (in the component)

const navMenuItems: MenuProps['items'] = [
  {
    key: '/today',
    label: 'Today',
    icon: <CalendarOutlined />,
    onClick: () => navigate('/today'),
  },
  {
    key: '/tags',
    label: 'Tags',
    icon: <TagOutlined />,
    onClick: () => navigate('/tags'),
  },
]

// ... (rest of component remains the same)
```

---

## Step 4.7: Test Today Dashboard

### Test Today View

1. Navigate to `/today` (should be default landing page)
2. **Expected**: Dashboard loads with:
   - Current date displayed
   - Stats cards showing correct counts
   - Quick add task input
   - Today's tasks section
   - Navigation buttons

### Test Quick Add

1. Type task title in quick add input
2. Select priority (e.g., "🔥 Urgent")
3. Press Enter or click "Add"
4. **Expected**:
   - Task appears in today's tasks
   - Input clears
   - Success message shown
   - Task has correct priority set

### Test Stats Cards

1. Create several tasks with different statuses
2. Complete some tasks
3. Create overdue tasks (due date in past)
4. **Expected**:
   - "Active Tasks" counts all non-completed tasks
   - "In Progress" counts tasks with that status
   - "Overdue" counts overdue tasks
   - "Completed Today" updates when completing tasks

### Test Date Navigation

1. Click right arrow (next day)
2. **Expected**: Date changes, "Today" button becomes enabled
3. Click "Today" button
4. **Expected**: Returns to current date
5. Click left arrow (previous day)
6. **Expected**: Date changes to yesterday

### Test View Modes

1. Click "Overdue" tab
2. **Expected**: Shows only overdue tasks
3. Click "Upcoming" tab
4. **Expected**: Shows tasks grouped by date for next 7 days
5. Click "Today" tab
6. **Expected**: Returns to today's view

### Test Completed Today Section

1. Complete a task today
2. **Expected**:
   - Task moves to "Completed Today" section
   - Completed count increments
   - Task shows with strikethrough and opacity

### Test Upcoming Tasks

1. Create tasks with scheduled dates over the next week
2. Switch to "Upcoming" view
3. **Expected**:
   - Tasks grouped by date
   - Each day shows correct tasks
   - Dates in chronological order

---

## Verification Checklist

Before proceeding to Step 5, verify:

- [ ] Today page loads correctly
- [ ] Stats display accurate counts
- [ ] Quick add creates tasks for today
- [ ] Today's tasks filter works
- [ ] Overdue tasks display correctly
- [ ] Upcoming tasks grouped by date
- [ ] Completed today section works
- [ ] Date navigation works (prev/next/today)
- [ ] View mode tabs switch correctly
- [ ] Priority selection in quick add works
- [ ] Keyboard shortcuts work (Enter to add)
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] No console errors

---

## Troubleshooting

### Issue: Tasks not appearing in "Today" section

**Solution**:
1. Verify task has scheduled_date set to today
2. Check isTaskScheduledToday logic
3. Ensure task status is not completed or archived

### Issue: Overdue count wrong

**Solution**:
1. Check isTaskOverdue function logic
2. Verify due_date is in the past
3. Ensure task is not completed or archived

### Issue: Quick add not working

**Solution**:
1. Check createTask function in store
2. Verify scheduled_date is being set
3. Check for validation errors

### Issue: Upcoming tasks not grouped correctly

**Solution**:
1. Verify date-fns functions are working
2. Check scheduled_date format
3. Ensure tasks have future scheduled dates

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 5: All Tasks View](./step-5-all-tasks-view.md)**

This will implement a comprehensive view of all tasks with advanced filtering and sorting.

---

## Summary

You've successfully:
- ✅ Created dashboard stats component
- ✅ Implemented quick task creation
- ✅ Built today's tasks view
- ✅ Added overdue tasks section
- ✅ Implemented upcoming tasks with date grouping
- ✅ Created completed today section
- ✅ Added date navigation
- ✅ Implemented view mode tabs
- ✅ Made Today the default landing page
- ✅ Added Today to sidebar navigation

**The Today dashboard is complete and provides a comprehensive daily task management view!**
