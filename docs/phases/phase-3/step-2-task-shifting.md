# Phase 3, Step 2: Task Shifting & Rescheduling

**Duration**: 2 days
**Prerequisite**: Step 1 (Parent/Child Tasks) completed

## Overview

This step implements smart task rescheduling features:
- Shift task dates (postpone/advance)
- Bulk reschedule operations
- Smart date suggestions
- Recurring date patterns
- Date conflict warnings
- Quick reschedule shortcuts

## Goals

- Add date shifting utilities
- Create reschedule modal
- Implement bulk reschedule
- Add smart date suggestions
- Create quick reschedule actions
- Add keyboard shortcuts for date changes
- Implement date conflict detection

---

## Step 2.1: Create Date Utilities

**Create `src/lib/date-utils.ts`**:

```typescript
import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  startOfMonth,
  nextMonday,
  nextSaturday,
  setHours,
  setMinutes,
  isWeekend,
  format,
  parseISO,
} from 'date-fns'

export type DateShiftType =
  | 'tomorrow'
  | 'next_week'
  | 'next_month'
  | 'next_monday'
  | 'next_weekend'
  | 'custom'

export interface DateShiftOption {
  type: DateShiftType
  label: string
  description: string
  getDate: (from?: Date) => Date
}

export const dateShiftOptions: DateShiftOption[] = [
  {
    type: 'tomorrow',
    label: 'Tomorrow',
    description: 'Postpone to tomorrow',
    getDate: (from = new Date()) => addDays(from, 1),
  },
  {
    type: 'next_week',
    label: 'Next Week',
    description: 'Move to next week (same day)',
    getDate: (from = new Date()) => addWeeks(from, 1),
  },
  {
    type: 'next_monday',
    label: 'Next Monday',
    description: 'Move to next Monday',
    getDate: (from = new Date()) => nextMonday(from),
  },
  {
    type: 'next_weekend',
    label: 'Next Weekend',
    description: 'Move to next Saturday',
    getDate: (from = new Date()) => nextSaturday(from),
  },
  {
    type: 'next_month',
    label: 'Next Month',
    description: 'Move to next month (same day)',
    getDate: (from = new Date()) => addMonths(from, 1),
  },
]

export function shiftTaskDate(currentDate: string | null, shiftType: DateShiftType): string {
  const from = currentDate ? parseISO(currentDate) : new Date()
  const option = dateShiftOptions.find(o => o.type === shiftType)

  if (!option) {
    throw new Error(`Unknown shift type: ${shiftType}`)
  }

  return option.getDate(from).toISOString()
}

export function getSmartDateSuggestions(taskTitle: string): Date[] {
  const suggestions: Date[] = []
  const now = new Date()

  // Always include tomorrow
  suggestions.push(addDays(now, 1))

  // Check for day names in title
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const titleLower = taskTitle.toLowerCase()

  days.forEach((day, index) => {
    if (titleLower.includes(day)) {
      // Find next occurrence of that day
      let nextDay = new Date(now)
      while (nextDay.getDay() !== index) {
        nextDay = addDays(nextDay, 1)
      }
      suggestions.push(nextDay)
    }
  })

  // Check for "weekend"
  if (titleLower.includes('weekend')) {
    suggestions.push(nextSaturday(now))
  }

  // Check for "week"
  if (titleLower.includes('next week') || titleLower.includes('weekly')) {
    suggestions.push(nextMonday(now))
  }

  // Always include next Monday
  suggestions.push(nextMonday(now))

  // Remove duplicates and sort
  const uniqueDates = Array.from(
    new Set(suggestions.map(d => d.toDateString()))
  ).map(dateStr => new Date(dateStr))

  return uniqueDates.sort((a, b) => a.getTime() - b.getTime()).slice(0, 5)
}

export function getWorkdayDate(daysAhead: number): Date {
  let date = new Date()
  let workdaysAdded = 0

  while (workdaysAdded < daysAhead) {
    date = addDays(date, 1)
    if (!isWeekend(date)) {
      workdaysAdded++
    }
  }

  return date
}
```

---

## Step 2.2: Create Reschedule Modal

**Create `src/components/RescheduleModal.tsx`**:

```typescript
import { useState } from 'react'
import { Modal, Space, Button, DatePicker, Typography, Radio, message, Alert } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Task } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { dateShiftOptions, getSmartDateSuggestions, shiftTaskDate } from '@/lib/date-utils'
import { format } from 'date-fns'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface RescheduleModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
  dateField: 'scheduled_date' | 'due_date'
}

export function RescheduleModal({
  task,
  open,
  onClose,
  dateField,
}: RescheduleModalProps) {
  const { updateTask } = useTaskStore()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  if (!task) return null

  const currentDate = task[dateField]
  const fieldLabel = dateField === 'scheduled_date' ? 'Scheduled Date' : 'Due Date'
  const smartSuggestions = getSmartDateSuggestions(task.title)

  const handleQuickShift = async (shiftType: string) => {
    setLoading(true)

    const newDate = shiftTaskDate(currentDate, shiftType as any)

    const { error } = await updateTask(task.id, {
      [dateField]: newDate,
    })

    if (error) {
      message.error(error.message)
    } else {
      message.success(`${fieldLabel} updated to ${format(new Date(newDate), 'MMM d, yyyy')}`)
      onClose()
    }

    setLoading(false)
  }

  const handleCustomDate = async () => {
    if (!selectedDate) {
      message.warning('Please select a date')
      return
    }

    setLoading(true)

    const { error } = await updateTask(task.id, {
      [dateField]: selectedDate.toISOString(),
    })

    if (error) {
      message.error(error.message)
    } else {
      message.success(`${fieldLabel} updated to ${format(selectedDate, 'MMM d, yyyy')}`)
      onClose()
    }

    setLoading(false)
  }

  const handleClearDate = async () => {
    setLoading(true)

    const { error } = await updateTask(task.id, {
      [dateField]: null,
    })

    if (error) {
      message.error(error.message)
    } else {
      message.success(`${fieldLabel} cleared`)
      onClose()
    }

    setLoading(false)
  }

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Reschedule: {task.title}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Current Date */}
        {currentDate && (
          <Alert
            message={`Current ${fieldLabel}`}
            description={format(new Date(currentDate), 'EEEE, MMMM d, yyyy')}
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
          />
        )}

        {/* Quick Shift Options */}
        <div>
          <Text strong className="block mb-2">
            Quick Reschedule
          </Text>
          <Space direction="vertical" className="w-full">
            {dateShiftOptions.map(option => (
              <Button
                key={option.type}
                block
                onClick={() => handleQuickShift(option.type)}
                loading={loading}
                className="text-left"
              >
                <Space className="w-full justify-between">
                  <span>{option.label}</span>
                  <Text type="secondary" className="text-xs">
                    {format(option.getDate(currentDate ? new Date(currentDate) : undefined), 'MMM d')}
                  </Text>
                </Space>
              </Button>
            ))}
          </Space>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div>
            <Text strong className="block mb-2">
              <ThunderboltOutlined /> Smart Suggestions
            </Text>
            <Space wrap>
              {smartSuggestions.map((date, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => setSelectedDate(date)}
                  type={
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'primary'
                      : 'default'
                  }
                >
                  {format(date, 'MMM d (EEE)')}
                </Button>
              ))}
            </Space>
          </div>
        )}

        {/* Custom Date Picker */}
        <div>
          <Text strong className="block mb-2">
            Choose Custom Date
          </Text>
          <Space.Compact className="w-full">
            <DatePicker
              className="flex-1"
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={date => setSelectedDate(date ? date.toDate() : null)}
              format="MMM D, YYYY"
            />
            <Button
              type="primary"
              onClick={handleCustomDate}
              loading={loading}
              disabled={!selectedDate}
            >
              Set Date
            </Button>
          </Space.Compact>
        </div>

        {/* Clear Date */}
        {currentDate && (
          <Button
            danger
            block
            onClick={handleClearDate}
            loading={loading}
          >
            Clear {fieldLabel}
          </Button>
        )}
      </Space>
    </Modal>
  )
}
```

---

## Step 2.3: Add Quick Reschedule Actions to Task Card

**Update `src/components/TaskCard.tsx`** to add reschedule actions:

```typescript
// Add to menuItems in TaskCard component
import { CalendarOutlined } from '@ant-design/icons'

const menuItems: MenuProps['items'] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    onClick: onEdit,
  },
  {
    key: 'reschedule',
    label: 'Reschedule',
    icon: <CalendarOutlined />,
    children: [
      {
        key: 'reschedule-scheduled',
        label: 'Scheduled Date',
        onClick: () => onReschedule?.('scheduled_date'),
      },
      {
        key: 'reschedule-due',
        label: 'Due Date',
        onClick: () => onReschedule?.('due_date'),
      },
    ],
  },
  {
    key: 'create-subtask',
    label: 'Create Subtask',
    icon: <PlusOutlined />,
    onClick: onCreateSubtask,
  },
  {
    type: 'divider',
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <DeleteOutlined />,
    danger: true,
    onClick: onDelete,
  },
]

// Add to TaskCardProps
interface TaskCardProps {
  // ... existing props
  onReschedule?: (dateField: 'scheduled_date' | 'due_date') => void
}
```

---

## Step 2.4: Create Bulk Reschedule Component

**Create `src/components/BulkRescheduleModal.tsx`**:

```typescript
import { useState } from 'react'
import { Modal, Space, Button, DatePicker, Typography, message, Alert, Checkbox } from 'antd'
import { CalendarOutlined, WarningOutlined } from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { dateShiftOptions } from '@/lib/date-utils'
import { format } from 'date-fns'
import dayjs from 'dayjs'

const { Text } = Typography

interface BulkRescheduleModalProps {
  tasks: TaskWithTags[]
  open: boolean
  onClose: () => void
}

export function BulkRescheduleModal({
  tasks,
  open,
  onClose,
}: BulkRescheduleModalProps) {
  const { updateTask } = useTaskStore()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [updateScheduled, setUpdateScheduled] = useState(true)
  const [updateDue, setUpdateDue] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleBulkReschedule = async () => {
    if (!selectedDate) {
      message.warning('Please select a date')
      return
    }

    if (!updateScheduled && !updateDue) {
      message.warning('Please select at least one date field to update')
      return
    }

    setLoading(true)

    const updates = tasks.map(task => {
      const updateData: any = {}
      if (updateScheduled) updateData.scheduled_date = selectedDate.toISOString()
      if (updateDue) updateData.due_date = selectedDate.toISOString()

      return updateTask(task.id, updateData)
    })

    try {
      await Promise.all(updates)
      message.success(`${tasks.length} tasks rescheduled to ${format(selectedDate, 'MMM d, yyyy')}`)
      onClose()
    } catch (error: any) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickShift = async (shiftType: string) => {
    const option = dateShiftOptions.find(o => o.type === shiftType)
    if (!option) return

    setSelectedDate(option.getDate())
  }

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Bulk Reschedule ({tasks.length} tasks)</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Space direction="vertical" className="w-full" size="large">
        <Alert
          message={`Rescheduling ${tasks.length} task${tasks.length > 1 ? 's' : ''}`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
        />

        {/* Quick Shift Options */}
        <div>
          <Text strong className="block mb-2">
            Quick Reschedule
          </Text>
          <Space wrap>
            {dateShiftOptions.map(option => (
              <Button
                key={option.type}
                size="small"
                onClick={() => handleQuickShift(option.type)}
              >
                {option.label}
              </Button>
            ))}
          </Space>
        </div>

        {/* Custom Date Picker */}
        <div>
          <Text strong className="block mb-2">
            Choose Date
          </Text>
          <DatePicker
            className="w-full"
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={date => setSelectedDate(date ? date.toDate() : null)}
            format="MMM D, YYYY"
            size="large"
          />
        </div>

        {/* Date Field Selection */}
        <div>
          <Text strong className="block mb-2">
            Update
          </Text>
          <Space direction="vertical">
            <Checkbox
              checked={updateScheduled}
              onChange={e => setUpdateScheduled(e.target.checked)}
            >
              Scheduled Date
            </Checkbox>
            <Checkbox
              checked={updateDue}
              onChange={e => setUpdateDue(e.target.checked)}
            >
              Due Date
            </Checkbox>
          </Space>
        </div>

        {/* Actions */}
        <Space className="w-full justify-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleBulkReschedule}
            loading={loading}
            disabled={!selectedDate}
          >
            Reschedule {tasks.length} Task{tasks.length > 1 ? 's' : ''}
          </Button>
        </Space>
      </Space>
    </Modal>
  )
}
```

---

## Step 2.5: Add Keyboard Shortcuts for Dates

**Create `src/hooks/useTaskKeyboardShortcuts.ts`**:

```typescript
import { useEffect } from 'react'
import { message } from 'antd'
import { Task } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { shiftTaskDate } from '@/lib/date-utils'

export function useTaskKeyboardShortcuts(task: Task | null, enabled: boolean = true) {
  const { updateTask } = useTaskStore()

  useEffect(() => {
    if (!enabled || !task) return

    const handleKeyPress = async (e: KeyboardEvent) => {
      // Only handle if Ctrl/Cmd is pressed
      if (!(e.ctrlKey || e.metaKey)) return

      // Shift+D: Postpone to tomorrow
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault()
        const newDate = shiftTaskDate(task.scheduled_date, 'tomorrow')
        await updateTask(task.id, { scheduled_date: newDate })
        message.success('Rescheduled to tomorrow')
      }

      // Shift+W: Postpone to next week
      if (e.shiftKey && e.key === 'W') {
        e.preventDefault()
        const newDate = shiftTaskDate(task.scheduled_date, 'next_week')
        await updateTask(task.id, { scheduled_date: newDate })
        message.success('Rescheduled to next week')
      }

      // Shift+M: Postpone to next Monday
      if (e.shiftKey && e.key === 'M') {
        e.preventDefault()
        const newDate = shiftTaskDate(task.scheduled_date, 'next_monday')
        await updateTask(task.id, { scheduled_date: newDate })
        message.success('Rescheduled to next Monday')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [task, enabled, updateTask])
}
```

---

## Step 2.6: Update Task List to Support Reschedule

**Update `src/components/TaskList.tsx`**:

```typescript
import { RescheduleModal } from './RescheduleModal'

export function TaskList({ tasks, emptyMessage, showDescription, compact }: TaskListProps) {
  // ... existing state
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null)
  const [rescheduleDateField, setRescheduleDateField] = useState<'scheduled_date' | 'due_date'>(
    'scheduled_date'
  )

  // ... existing handlers

  const handleReschedule = (task: TaskWithTags, dateField: 'scheduled_date' | 'due_date') => {
    setRescheduleTask(task)
    setRescheduleDateField(dateField)
  }

  return (
    <>
      <Space direction="vertical" className="w-full" size="middle">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onEdit={() => setEditingTask(task)}
            onDelete={() => handleDelete(task)}
            onCreateSubtask={() => setSubtaskParent(task)}
            onReschedule={(dateField) => handleReschedule(task, dateField)}
            onClick={() => setSelectedTask(task)}
            showDescription={showDescription}
            compact={compact}
          />
        ))}
      </Space>

      {/* Existing modals */}

      {/* Reschedule Modal */}
      <RescheduleModal
        task={rescheduleTask}
        open={!!rescheduleTask}
        onClose={() => setRescheduleTask(null)}
        dateField={rescheduleDateField}
      />
    </>
  )
}
```

---

## Step 2.7: Test Task Shifting & Rescheduling

### Test Quick Reschedule

1. Open task context menu → Reschedule → Scheduled Date
2. Click "Tomorrow"
3. **Expected**: Task rescheduled to tomorrow, success message shown
4. Open reschedule again
5. Click "Next Monday"
6. **Expected**: Task moved to next Monday

### Test Smart Suggestions

1. Create task titled "Meeting on Friday"
2. Open reschedule modal
3. **Expected**: Smart suggestions include next Friday
4. Create task titled "Weekend project"
5. **Expected**: Smart suggestions include next Saturday

### Test Custom Date

1. Open reschedule modal
2. Click date picker
3. Select date 2 weeks from now
4. Click "Set Date"
5. **Expected**: Task rescheduled to selected date

### Test Clear Date

1. Open reschedule modal for task with scheduled date
2. Click "Clear Scheduled Date"
3. **Expected**: Date removed, task no longer scheduled

### Test Bulk Reschedule

1. Select 5 tasks (implementation needed in UI)
2. Open bulk reschedule
3. Select "Tomorrow"
4. Check both "Scheduled Date" and "Due Date"
5. Click "Reschedule 5 Tasks"
6. **Expected**: All 5 tasks updated to tomorrow

### Test Keyboard Shortcuts

1. Select a task
2. Press Ctrl+Shift+D (or Cmd+Shift+D on Mac)
3. **Expected**: Task postponed to tomorrow
4. Press Ctrl+Shift+W
5. **Expected**: Task postponed to next week

---

## Verification Checklist

Before proceeding to Step 3, verify:

- [ ] Reschedule modal opens and works
- [ ] Quick shift options work (tomorrow, next week, etc.)
- [ ] Smart suggestions appear based on task title
- [ ] Custom date picker works
- [ ] Clear date works
- [ ] Bulk reschedule works
- [ ] Keyboard shortcuts work
- [ ] Date changes reflect immediately
- [ ] Success messages display
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 3: Recurring Tasks](./step-3-recurring-tasks.md)**

This will implement recurring task functionality with multiple recurrence patterns.

---

## Summary

You've successfully:
- ✅ Created date shifting utilities
- ✅ Implemented reschedule modal with quick options
- ✅ Added smart date suggestions
- ✅ Built bulk reschedule feature
- ✅ Created keyboard shortcuts for rescheduling
- ✅ Integrated reschedule into task cards
- ✅ Added custom date picker

**Task rescheduling is now fast and intuitive!**
