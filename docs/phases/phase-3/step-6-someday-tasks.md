# Phase 3, Step 6: Someday Tasks

**Duration**: 2 days
**Prerequisite**: Step 5 (Habits View) completed

## Overview

This step implements the "Someday/Maybe" task system:
- Someday task type for future ideas
- Nudge system to periodically review someday tasks
- Nudge frequency configuration
- Nudge dashboard to review tasks
- Convert someday to regular task
- Archive someday tasks
- Someday task statistics

## Goals

- Implement someday task type
- Create nudge logic and scheduling
- Build nudge dashboard for review
- Add nudge frequency configuration
- Implement convert-to-task action
- Create someday tasks view
- Add someday statistics

---

## Step 6.1: Update Task Types for Someday

**Update `src/types/task.ts`**:

```typescript
// Task type already includes 'someday', but let's ensure nudge fields exist
export interface Task {
  // ... existing fields ...

  // Someday-specific fields (already in schema from Phase 1)
  last_nudge_date: string | null
  nudge_count: number
}

export interface SomedayTaskConfig {
  defaultNudgeInterval: number // days between nudges
  maxNudgeCount: number // max times to nudge before suggesting archive
}
```

---

## Step 6.2: Create Someday Utilities

**Create `src/lib/someday-utils.ts`**:

```typescript
import { Task } from '@/types/task'
import { differenceInDays, addDays, parseISO, startOfDay } from 'date-fns'

export const SOMEDAY_CONFIG = {
  defaultNudgeInterval: 30, // 30 days
  maxNudgeCount: 5, // After 5 nudges, suggest archiving
  nudgeIntervals: [
    { days: 7, label: 'Weekly' },
    { days: 14, label: 'Every 2 weeks' },
    { days: 30, label: 'Monthly' },
    { days: 90, label: 'Quarterly' },
    { days: 180, label: 'Semi-annually' },
  ],
}

export function shouldNudgeSomedayTask(
  task: Task,
  nudgeIntervalDays: number = SOMEDAY_CONFIG.defaultNudgeInterval
): boolean {
  if (task.type !== 'someday') return false

  // Never nudged before - nudge after interval from creation
  if (!task.last_nudge_date) {
    const createdDate = startOfDay(parseISO(task.created_at))
    const daysSinceCreation = differenceInDays(new Date(), createdDate)
    return daysSinceCreation >= nudgeIntervalDays
  }

  // Nudge if enough time has passed since last nudge
  const lastNudge = startOfDay(parseISO(task.last_nudge_date))
  const daysSinceNudge = differenceInDays(new Date(), lastNudge)
  return daysSinceNudge >= nudgeIntervalDays
}

export function getNextNudgeDate(
  task: Task,
  nudgeIntervalDays: number = SOMEDAY_CONFIG.defaultNudgeInterval
): Date | null {
  if (task.type !== 'someday') return null

  const baseDate = task.last_nudge_date
    ? parseISO(task.last_nudge_date)
    : parseISO(task.created_at)

  return addDays(baseDate, nudgeIntervalDays)
}

export function getSomedayTaskAge(task: Task): number {
  const createdDate = startOfDay(parseISO(task.created_at))
  return differenceInDays(new Date(), createdDate)
}

export function shouldSuggestArchive(task: Task): boolean {
  return task.nudge_count >= SOMEDAY_CONFIG.maxNudgeCount
}

export function getNudgeStatus(
  task: Task,
  nudgeIntervalDays: number = SOMEDAY_CONFIG.defaultNudgeInterval
): 'due' | 'upcoming' | 'snoozed' {
  if (shouldNudgeSomedayTask(task, nudgeIntervalDays)) {
    return 'due'
  }

  const nextNudge = getNextNudgeDate(task, nudgeIntervalDays)
  if (nextNudge) {
    const daysUntilNudge = differenceInDays(nextNudge, new Date())
    if (daysUntilNudge <= 7) {
      return 'upcoming'
    }
  }

  return 'snoozed'
}
```

---

## Step 6.3: Add Someday Actions to Task Store

**Update `src/stores/taskStore.ts`**:

```typescript
// Add someday-specific actions
nudgeSomedayTask: async (id: string) => {
  const task = get().getTaskById(id)
  if (!task || task.type !== 'someday') {
    return { error: new Error('Task is not a someday task') }
  }

  const now = new Date().toISOString()
  const newNudgeCount = (task.nudge_count || 0) + 1

  const { error } = await supabase
    .from('tasks')
    .update({
      last_nudge_date: now,
      nudge_count: newNudgeCount,
    })
    .eq('id', id)

  if (error) {
    return { error: new Error(error.message) }
  }

  // Optimistic update
  set(state => ({
    tasks: state.tasks.map(t =>
      t.id === id
        ? { ...t, last_nudge_date: now, nudge_count: newNudgeCount }
        : t
    ),
  }))

  return { error: null }
},

convertSomedayToTask: async (id: string) => {
  const task = get().getTaskById(id)
  if (!task || task.type !== 'someday') {
    return { error: new Error('Task is not a someday task') }
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      type: 'task',
      status: 'ready',
      scheduled_date: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: new Error(error.message) }
  }

  // Optimistic update
  set(state => ({
    tasks: state.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            type: 'task' as const,
            status: 'ready' as const,
            scheduled_date: new Date().toISOString(),
          }
        : t
    ),
  }))

  return { error: null }
},

getSomedayTasksForNudge: (nudgeIntervalDays: number = 30): TaskWithTags[] => {
  return get().tasks.filter(task => {
    if (task.type !== 'someday' || task.status === 'archived') return false
    return shouldNudgeSomedayTask(task, nudgeIntervalDays)
  })
},
```

---

## Step 6.4: Create Someday Card Component

**Create `src/components/SomedayCard.tsx`**:

```typescript
import { Card, Space, Typography, Button, Dropdown, Tag, Badge } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  BellOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { Tag as TagComponent } from './Tag'
import { useTagStore } from '@/stores/tagStore'
import {
  getSomedayTaskAge,
  shouldSuggestArchive,
  getNextNudgeDate,
  getNudgeStatus,
} from '@/lib/someday-utils'
import { format, formatDistanceToNow } from 'date-fns'

const { Text, Paragraph } = Typography

interface SomedayCardProps {
  task: TaskWithTags
  onConvert?: () => void
  onNudge?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
  nudgeIntervalDays?: number
}

export function SomedayCard({
  task,
  onConvert,
  onNudge,
  onEdit,
  onDelete,
  onClick,
  nudgeIntervalDays = 30,
}: SomedayCardProps) {
  const { getTagById } = useTagStore()

  const age = getSomedayTaskAge(task)
  const suggestArchive = shouldSuggestArchive(task)
  const nextNudge = getNextNudgeDate(task, nudgeIntervalDays)
  const nudgeStatus = getNudgeStatus(task, nudgeIntervalDays)

  const menuItems: MenuProps['items'] = [
    {
      key: 'convert',
      label: 'Convert to Task',
      icon: <CheckOutlined />,
      onClick: onConvert,
    },
    {
      key: 'nudge',
      label: 'Snooze (Reset Nudge)',
      icon: <BellOutlined />,
      onClick: onNudge,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: onEdit,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Archive',
      icon: <InboxOutlined />,
      onClick: onDelete,
    },
  ]

  return (
    <Card
      className="someday-card hover:shadow-md transition-shadow"
      onClick={onClick}
      hoverable
    >
      <Space direction="vertical" className="w-full" size="small">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Space direction="vertical" size={2} className="flex-1">
            <Text strong className="text-base">
              {task.title}
            </Text>
            {task.description && (
              <Paragraph
                type="secondary"
                className="!mb-0 text-sm"
                ellipsis={{ rows: 2 }}
              >
                {task.description}
              </Paragraph>
            )}
          </Space>

          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>

        {/* Metadata */}
        <Space size="small" wrap>
          <Tag color={nudgeStatus === 'due' ? 'error' : 'default'}>
            <BellOutlined /> {task.nudge_count || 0} nudges
          </Tag>

          <Tag color="blue">{age} days old</Tag>

          {nextNudge && (
            <Tag color={nudgeStatus === 'due' ? 'error' : 'default'}>
              {nudgeStatus === 'due'
                ? 'Ready to review'
                : `Next nudge ${formatDistanceToNow(nextNudge, { addSuffix: true })}`}
            </Tag>
          )}

          {suggestArchive && (
            <Tag color="warning">Consider archiving</Tag>
          )}
        </Space>

        {/* Tags */}
        {task.tags.length > 0 && (
          <Space size="small" wrap>
            {task.tags.map(tagId => {
              const tag = getTagById(tagId)
              return tag ? <TagComponent key={tag.id} tag={tag} /> : null
            })}
          </Space>
        )}

        {/* Action Buttons */}
        <Space className="w-full justify-end">
          <Button
            size="small"
            icon={<BellOutlined />}
            onClick={e => {
              e.stopPropagation()
              onNudge?.()
            }}
          >
            Snooze
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={e => {
              e.stopPropagation()
              onConvert?.()
            }}
          >
            Do It Now
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
```

---

## Step 6.5: Create Someday Review Modal

**Create `src/components/SomedayReviewModal.tsx`**:

```typescript
import { Modal, Space, Typography, Button, Input, message } from 'antd'
import {
  CheckOutlined,
  BellOutlined,
  InboxOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { SomedayCard } from './SomedayCard'
import { useTaskStore } from '@/stores/taskStore'
import { useState } from 'react'

const { Title, Text } = Typography
const { TextArea } = Input

interface SomedayReviewModalProps {
  task: TaskWithTags | null
  open: boolean
  onClose: () => void
}

export function SomedayReviewModal({ task, open, onClose }: SomedayReviewModalProps) {
  const { convertSomedayToTask, nudgeSomedayTask, archiveTask } = useTaskStore()
  const [notes, setNotes] = useState('')

  if (!task) return null

  const handleConvert = async () => {
    const { error } = await convertSomedayToTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task converted and added to your schedule!')
      onClose()
    }
  }

  const handleSnooze = async () => {
    const { error } = await nudgeSomedayTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task snoozed. Will remind you later.')
      onClose()
    }
  }

  const handleArchive = async () => {
    const { error } = await archiveTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task archived')
      onClose()
    }
  }

  return (
    <Modal
      title={
        <Space>
          <BellOutlined />
          <span>Review Someday Task</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" className="w-full" size="large">
        <div>
          <Title level={4}>{task.title}</Title>
          {task.description && (
            <Text type="secondary">{task.description}</Text>
          )}
        </div>

        <div>
          <Text strong className="block mb-2">
            What would you like to do?
          </Text>
          <Space direction="vertical" className="w-full">
            <Button
              type="primary"
              size="large"
              block
              icon={<CheckOutlined />}
              onClick={handleConvert}
            >
              Do It Now - Convert to Task
            </Button>

            <Button
              size="large"
              block
              icon={<BellOutlined />}
              onClick={handleSnooze}
            >
              Remind Me Later - Snooze
            </Button>

            <Button
              size="large"
              block
              icon={<InboxOutlined />}
              onClick={handleArchive}
            >
              Archive - Not Interested Anymore
            </Button>
          </Space>
        </div>

        <div>
          <Text type="secondary" className="text-xs">
            This task has been reviewed {task.nudge_count || 0} time
            {task.nudge_count !== 1 ? 's' : ''}
          </Text>
        </div>
      </Space>
    </Modal>
  )
}
```

---

## Step 6.6: Create Someday Page

**Create `src/pages/SomedayPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Typography,
  Space,
  Button,
  Card,
  Empty,
  Badge,
  Tabs,
  Select,
  message,
} from 'antd'
import {
  PlusOutlined,
  InboxOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { SomedayCard } from '@/components/SomedayCard'
import { SomedayReviewModal } from '@/components/SomedayReviewModal'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { TaskWithTags } from '@/types/task'
import { SOMEDAY_CONFIG, shouldNudgeSomedayTask } from '@/lib/someday-utils'

const { Title, Text } = Typography

export function SomedayPage() {
  const {
    tasks,
    fetchTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
    convertSomedayToTask,
    nudgeSomedayTask,
    archiveTask,
  } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [reviewTask, setReviewTask] = useState<TaskWithTags | null>(null)
  const [nudgeInterval, setNudgeInterval] = useState(SOMEDAY_CONFIG.defaultNudgeInterval)

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  const somedayTasks = tasks.filter(t => t.type === 'someday' && t.status !== 'archived')

  const tasksForNudge = somedayTasks.filter(task =>
    shouldNudgeSomedayTask(task, nudgeInterval)
  )

  const allSomeday = somedayTasks

  const handleConvert = async (task: TaskWithTags) => {
    const { error } = await convertSomedayToTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task converted and scheduled for today!')
    }
  }

  const handleNudge = async (task: TaskWithTags) => {
    const { error } = await nudgeSomedayTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task snoozed')
    }
  }

  const handleArchive = async (task: TaskWithTags) => {
    const { error } = await archiveTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task archived')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center">
              <InboxOutlined className="text-2xl text-purple-500" />
              <div>
                <Title level={2} className="!mb-0">
                  Someday / Maybe
                </Title>
                <Text type="secondary">Ideas and tasks for the future</Text>
              </div>
            </Space>
          </div>
          <Space>
            <Select
              value={nudgeInterval}
              onChange={setNudgeInterval}
              options={SOMEDAY_CONFIG.nudgeIntervals.map(i => ({
                label: i.label,
                value: i.days,
              }))}
              style={{ width: 150 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsFormOpen(true)}
              size="large"
            >
              New Someday Task
            </Button>
          </Space>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Total Someday Tasks</Text>
              <Text className="text-3xl font-bold">{allSomeday.length}</Text>
            </Space>
          </Card>
          <Card>
            <Space direction="vertical">
              <Text type="secondary">Ready to Review</Text>
              <Badge count={tasksForNudge.length} showZero>
                <Text className="text-3xl font-bold">{tasksForNudge.length}</Text>
              </Badge>
            </Space>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="nudge"
          items={[
            {
              key: 'nudge',
              label: (
                <Badge count={tasksForNudge.length} offset={[10, 0]}>
                  <Space>
                    <BellOutlined />
                    <span>Ready to Review</span>
                  </Space>
                </Badge>
              ),
              children: (
                <Card>
                  {tasksForNudge.length === 0 ? (
                    <Empty
                      description="No tasks ready for review"
                      className="py-12"
                    />
                  ) : (
                    <Space direction="vertical" className="w-full" size="middle">
                      {tasksForNudge.map(task => (
                        <SomedayCard
                          key={task.id}
                          task={task}
                          onConvert={() => handleConvert(task)}
                          onNudge={() => handleNudge(task)}
                          onDelete={() => handleArchive(task)}
                          onClick={() => setReviewTask(task)}
                          nudgeIntervalDays={nudgeInterval}
                        />
                      ))}
                    </Space>
                  )}
                </Card>
              ),
            },
            {
              key: 'all',
              label: (
                <Space>
                  <InboxOutlined />
                  <span>All Someday Tasks</span>
                </Space>
              ),
              children: (
                <Card>
                  {allSomeday.length === 0 ? (
                    <div className="text-center py-12">
                      <Empty description="No someday tasks yet" />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsFormOpen(true)}
                        className="mt-4"
                      >
                        Add Your First Someday Task
                      </Button>
                    </div>
                  ) : (
                    <Space direction="vertical" className="w-full" size="middle">
                      {allSomeday.map(task => (
                        <SomedayCard
                          key={task.id}
                          task={task}
                          onConvert={() => handleConvert(task)}
                          onNudge={() => handleNudge(task)}
                          onDelete={() => handleArchive(task)}
                          onClick={() => setReviewTask(task)}
                          nudgeIntervalDays={nudgeInterval}
                        />
                      ))}
                    </Space>
                  )}
                </Card>
              ),
            },
          ]}
        />

        {/* Task Form Modal - preset to someday type */}
        <TaskFormModal
          open={isFormOpen}
          task={
            {
              type: 'someday',
              status: 'ready',
            } as any
          }
          onClose={() => setIsFormOpen(false)}
        />

        {/* Review Modal */}
        <SomedayReviewModal
          task={reviewTask}
          open={!!reviewTask}
          onClose={() => setReviewTask(null)}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 6.7: Update Router and Navigation

**Update `src/lib/router.tsx`**:

```typescript
import { SomedayPage } from '@/pages/SomedayPage'

// Add route
{
  path: '/someday',
  element: (
    <ProtectedRoute>
      <SomedayPage />
    </ProtectedRoute>
  ),
},
```

**Update `src/components/AppLayout.tsx`**:

```typescript
import { InboxOutlined } from '@ant-design/icons'

// Add to navMenuItems
{
  key: '/someday',
  label: 'Someday',
  icon: <InboxOutlined />,
  onClick: () => navigate('/someday'),
},
```

---

## Step 6.8: Test Someday Tasks

### Test Someday Task Creation

1. Navigate to `/someday`
2. Click "New Someday Task"
3. Create task "Learn Spanish"
4. **Expected**: Task appears in "All Someday Tasks"

### Test Nudge System

1. Manually set `last_nudge_date` to 31 days ago in database
2. Refresh page
3. **Expected**: Task appears in "Ready to Review" tab with badge count

### Test Convert to Task

1. Open review modal for a someday task
2. Click "Do It Now - Convert to Task"
3. **Expected**: Task converts to regular task, scheduled for today
4. Check Today page
5. **Expected**: Task appears in today's tasks

### Test Snooze

1. Review a someday task
2. Click "Remind Me Later - Snooze"
3. **Expected**: `last_nudge_date` updates, `nudge_count` increments
4. Task moves out of "Ready to Review"

### Test Archive Suggestion

1. Create someday task
2. Nudge it 5 times
3. **Expected**: "Consider archiving" tag appears

### Test Nudge Interval Configuration

1. Change nudge interval to "Weekly" (7 days)
2. **Expected**: Tasks with last nudge > 7 days ago appear for review

---

## Verification Checklist

Before proceeding to Phase 4, verify:

- [ ] Someday tasks can be created
- [ ] Nudge logic calculates correctly
- [ ] Ready to Review tab shows correct tasks
- [ ] Convert to task works
- [ ] Snooze updates nudge date and count
- [ ] Archive works
- [ ] Badge count accurate
- [ ] Nudge interval selector works
- [ ] Archive suggestion appears after max nudges
- [ ] Stats display correctly
- [ ] Task age calculated correctly
- [ ] No console errors

---

## Next Steps

**🎉 Phase 3 Complete!**

All verification checks should pass. You now have:
- ✅ Parent/child tasks with progress tracking
- ✅ Smart task rescheduling
- ✅ Recurring tasks with multiple patterns
- ✅ Comprehensive habit tracking with streaks
- ✅ Habits dashboard and leaderboard
- ✅ Someday/maybe system with nudges

**Proceed to Phase 4**:
- **[Phase 4: Views & Productivity Features](../phase-4/step-1-pomodoro-timer.md)**

This will implement the Pomodoro timer, Eisenhower Matrix, Kanban boards, filters, saved views, notifications, and mobile responsiveness.

---

## Summary

You've successfully:
- ✅ Implemented someday task type
- ✅ Created nudge logic and scheduling
- ✅ Built someday review workflow
- ✅ Added convert-to-task functionality
- ✅ Created someday page with tabs
- ✅ Implemented nudge interval configuration
- ✅ Added archive suggestions
- ✅ Built someday statistics

**Phase 3 is complete! Advanced task features are fully implemented.**
