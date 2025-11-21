# Phase 3, Step 4: Habit Tracking

**Duration**: 3-4 days
**Prerequisite**: Step 3 (Recurring Tasks) completed

## Overview

This step implements comprehensive habit tracking:
- Daily habit completion tracking
- Streak calculation (current and longest)
- Grace period for missed days
- Habit heatmap visualization
- Habit statistics
- Habit completion history
- Flexible habit schedules (daily, specific days)

## Goals

- Extend task types to support habits
- Implement streak tracking logic
- Create habit completion interface
- Build habit statistics calculator
- Add grace period support
- Create habit heatmap component
- Track habit history

---

## Step 4.1: Extend Task and Completion Types

**Update `src/types/task.ts`**:

```typescript
// Add habit-specific fields to Task interface
export interface Task {
  // ... existing fields ...

  // Habit-specific fields
  habit_schedule: DayOfWeek[] | null // Which days habit should be done (null = daily)
  grace_period_days: number // Days allowed to miss before breaking streak
  current_streak: number
  longest_streak: number
}

// Add to TaskFormData
export interface TaskFormData {
  // ... existing fields ...
  habit_schedule?: DayOfWeek[]
  grace_period_days?: number
}
```

**Update `src/types/recurrence.ts`**:

```typescript
// Add habit stats interface
export interface HabitStats {
  taskId: string
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  completionRate: number // 0-100
  lastCompletedDate: string | null
  nextDueDate: string | null
  isCompletedToday: boolean
  daysInGracePeriod: number
}
```

---

## Step 4.2: Create Habit Tracking Utilities

**Create `src/lib/habit-utils.ts`**:

```typescript
import { Task, TaskWithTags } from '@/types/task'
import { TaskCompletion, HabitStats } from '@/types/recurrence'
import {
  startOfDay,
  differenceInDays,
  parseISO,
  isToday,
  addDays,
  getDay,
  isSameDay,
} from 'date-fns'

export function calculateStreak(
  completions: TaskCompletion[],
  gracePeriodDays: number = 1
): { currentStreak: number; longestStreak: number } {
  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  // Sort completions by date (newest first)
  const sortedCompletions = [...completions].sort(
    (a, b) => parseISO(b.completed_at).getTime() - parseISO(a.completed_at).getTime()
  )

  const today = startOfDay(new Date())
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let expectedDate = today

  // Calculate current streak
  for (const completion of sortedCompletions) {
    const completionDate = startOfDay(parseISO(completion.completed_at))
    const daysDiff = differenceInDays(expectedDate, completionDate)

    if (daysDiff <= gracePeriodDays) {
      currentStreak++
      tempStreak++
      expectedDate = addDays(completionDate, -1)
    } else {
      break
    }
  }

  // Calculate longest streak
  tempStreak = 1
  let prevDate = startOfDay(parseISO(sortedCompletions[0].completed_at))

  for (let i = 1; i < sortedCompletions.length; i++) {
    const currentDate = startOfDay(parseISO(sortedCompletions[i].completed_at))
    const daysDiff = differenceInDays(prevDate, currentDate)

    if (daysDiff <= gracePeriodDays + 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }

    prevDate = currentDate
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  return { currentStreak, longestStreak }
}

export function isHabitDueToday(task: Task): boolean {
  if (task.type !== 'habit') return false

  // If no specific schedule, it's due every day
  if (!task.habit_schedule || task.habit_schedule.length === 0) {
    return true
  }

  const today = getDay(new Date())
  return task.habit_schedule.includes(today as any)
}

export function isHabitCompletedToday(completions: TaskCompletion[]): boolean {
  if (completions.length === 0) return false

  const latestCompletion = completions[0]
  return isToday(parseISO(latestCompletion.completed_at))
}

export function calculateCompletionRate(
  completions: TaskCompletion[],
  createdAt: string,
  habitSchedule: number[] | null
): number {
  const createdDate = startOfDay(parseISO(createdAt))
  const today = startOfDay(new Date())
  const totalDays = differenceInDays(today, createdDate) + 1

  if (totalDays <= 0) return 0

  // Calculate expected completions based on schedule
  let expectedCompletions = 0

  if (!habitSchedule || habitSchedule.length === 0) {
    // Daily habit
    expectedCompletions = totalDays
  } else {
    // Specific days habit
    let checkDate = createdDate
    while (checkDate <= today) {
      if (habitSchedule.includes(getDay(checkDate))) {
        expectedCompletions++
      }
      checkDate = addDays(checkDate, 1)
    }
  }

  const actualCompletions = completions.length
  return expectedCompletions > 0 ? (actualCompletions / expectedCompletions) * 100 : 0
}

export function getHabitStats(
  task: Task,
  completions: TaskCompletion[]
): HabitStats {
  const { currentStreak, longestStreak } = calculateStreak(
    completions,
    task.grace_period_days || 1
  )

  const isCompletedToday = isHabitCompletedToday(completions)
  const completionRate = calculateCompletionRate(
    completions,
    task.created_at,
    task.habit_schedule
  )

  const lastCompletedDate = completions.length > 0 ? completions[0].completed_at : null

  // Calculate days in grace period
  let daysInGracePeriod = 0
  if (!isCompletedToday && lastCompletedDate) {
    const lastCompleted = startOfDay(parseISO(lastCompletedDate))
    const today = startOfDay(new Date())
    daysInGracePeriod = differenceInDays(today, lastCompleted)
  }

  return {
    taskId: task.id,
    currentStreak,
    longestStreak,
    totalCompletions: completions.length,
    completionRate,
    lastCompletedDate,
    nextDueDate: isCompletedToday ? addDays(new Date(), 1).toISOString() : new Date().toISOString(),
    isCompletedToday,
    daysInGracePeriod,
  }
}

export function getStreakColor(streak: number): string {
  if (streak === 0) return '#9CA3AF' // gray
  if (streak < 7) return '#3B82F6' // blue
  if (streak < 30) return '#10B981' // green
  if (streak < 100) return '#F59E0B' // orange
  return '#EF4444' // red (hot!)
}

export function getStreakEmoji(streak: number): string {
  if (streak === 0) return '⚪'
  if (streak < 7) return '🔵'
  if (streak < 30) return '🟢'
  if (streak < 100) return '🟠'
  return '🔥'
}
```

---

## Step 4.3: Create Habit Card Component

**Create `src/components/HabitCard.tsx`**:

```typescript
import { Card, Space, Typography, Progress, Button, Statistic, Row, Col, Tag } from 'antd'
import {
  CheckCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { useTaskStore } from '@/stores/taskStore'
import { getHabitStats, getStreakColor, getStreakEmoji, isHabitDueToday } from '@/lib/habit-utils'
import { useEffect, useState } from 'react'

const { Text, Title } = Typography

interface HabitCardProps {
  task: TaskWithTags
  onComplete?: () => void
  onClick?: () => void
}

export function HabitCard({ task, onComplete, onClick }: HabitCardProps) {
  const { completions, fetchCompletions } = useRecurrenceStore()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchCompletions(task.id)
  }, [task.id, fetchCompletions])

  useEffect(() => {
    const taskCompletions = completions.filter(c => c.task_id === task.id)
    const habitStats = getHabitStats(task, taskCompletions)
    setStats(habitStats)
  }, [completions, task])

  if (!stats) return null

  const isDueToday = isHabitDueToday(task)
  const streakColor = getStreakColor(stats.currentStreak)
  const streakEmoji = getStreakEmoji(stats.currentStreak)

  const isInGracePeriod = stats.daysInGracePeriod > 0 && stats.daysInGracePeriod <= (task.grace_period_days || 1)
  const isStreakBroken = stats.daysInGracePeriod > (task.grace_period_days || 1)

  return (
    <Card
      className={`habit-card ${stats.isCompletedToday ? 'opacity-75' : ''}`}
      onClick={onClick}
      hoverable
      styles={{
        body: {
          borderLeft: `4px solid ${streakColor}`,
        },
      }}
    >
      <Space direction="vertical" className="w-full" size="middle">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Space direction="vertical" size={2}>
            <Space size="small">
              <Text className="text-2xl">{streakEmoji}</Text>
              <Title level={4} className="!mb-0">
                {task.title}
              </Title>
            </Space>
            {task.description && (
              <Text type="secondary" className="text-sm">
                {task.description}
              </Text>
            )}
          </Space>

          <Button
            type={stats.isCompletedToday ? 'default' : 'primary'}
            icon={<CheckCircleOutlined />}
            size="large"
            onClick={e => {
              e.stopPropagation()
              onComplete?.()
            }}
            disabled={stats.isCompletedToday}
            style={{
              backgroundColor: stats.isCompletedToday ? '#10B981' : undefined,
              borderColor: stats.isCompletedToday ? '#10B981' : undefined,
              color: stats.isCompletedToday ? '#FFFFFF' : undefined,
            }}
          >
            {stats.isCompletedToday ? 'Done Today' : 'Complete'}
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Current Streak"
              value={stats.currentStreak}
              prefix={<FireOutlined />}
              valueStyle={{ color: streakColor, fontSize: 24 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Longest Streak"
              value={stats.longestStreak}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total"
              value={stats.totalCompletions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Col>
        </Row>

        {/* Completion Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Text type="secondary" className="text-xs">
              Completion Rate
            </Text>
            <Text strong className="text-xs">
              {Math.round(stats.completionRate)}%
            </Text>
          </div>
          <Progress
            percent={stats.completionRate}
            size="small"
            strokeColor={streakColor}
            showInfo={false}
          />
        </div>

        {/* Status Tags */}
        <Space wrap>
          {!isDueToday && (
            <Tag color="default">
              <CalendarOutlined /> Not due today
            </Tag>
          )}
          {isInGracePeriod && !stats.isCompletedToday && (
            <Tag color="warning">
              Grace period: {stats.daysInGracePeriod}/{task.grace_period_days || 1} days
            </Tag>
          )}
          {isStreakBroken && stats.currentStreak > 0 && (
            <Tag color="error">Streak broken! Complete today to restart</Tag>
          )}
          {task.habit_schedule && task.habit_schedule.length > 0 && (
            <Tag color="blue">
              {task.habit_schedule.length}x per week
            </Tag>
          )}
        </Space>
      </Space>
    </Card>
  )
}
```

---

## Step 4.4: Create Habit Heatmap Component

**Create `src/components/HabitHeatmap.tsx`**:

```typescript
import { useMemo } from 'react'
import { Typography, Tooltip } from 'antd'
import { TaskCompletion } from '@/types/recurrence'
import { startOfDay, subDays, format, parseISO, isSameDay } from 'date-fns'

const { Text } = Typography

interface HabitHeatmapProps {
  completions: TaskCompletion[]
  daysToShow?: number
}

export function HabitHeatmap({ completions, daysToShow = 90 }: HabitHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date())
    const data: { date: Date; count: number; completed: boolean }[] = []

    // Generate last N days
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dayCompletions = completions.filter(c =>
        isSameDay(parseISO(c.completed_at), date)
      )

      data.push({
        date,
        count: dayCompletions.length,
        completed: dayCompletions.length > 0,
      })
    }

    return data
  }, [completions, daysToShow])

  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = []
    let currentWeek: typeof heatmapData = []

    heatmapData.forEach((day, index) => {
      currentWeek.push(day)

      if (currentWeek.length === 7 || index === heatmapData.length - 1) {
        result.push([...currentWeek])
        currentWeek = []
      }
    })

    return result
  }, [heatmapData])

  const getCellColor = (completed: boolean, count: number): string => {
    if (!completed) return '#F3F4F6' // gray-100
    if (count === 1) return '#BFDBFE' // blue-200
    if (count === 2) return '#60A5FA' // blue-400
    return '#2563EB' // blue-600
  }

  return (
    <div>
      <Text type="secondary" className="text-xs block mb-2">
        Last {daysToShow} days
      </Text>
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <Tooltip
                key={dayIndex}
                title={
                  day.completed
                    ? `${format(day.date, 'MMM d, yyyy')} - Completed ${day.count} time${day.count > 1 ? 's' : ''}`
                    : `${format(day.date, 'MMM d, yyyy')} - Not completed`
                }
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: getCellColor(day.completed, day.count),
                  }}
                />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <Text type="secondary" className="text-xs">
          Less
        </Text>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(level => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: getCellColor(level > 0, level),
              }}
            />
          ))}
        </div>
        <Text type="secondary" className="text-xs">
          More
        </Text>
      </div>
    </div>
  )
}
```

---

## Step 4.5: Update Task Store for Habits

**Update `src/stores/taskStore.ts`**:

```typescript
// Add habit-specific completion handler
completeHabit: async (id: string, notes?: string) => {
  const task = get().getTaskById(id)
  if (!task || task.type !== 'habit') {
    return { error: new Error('Task is not a habit') }
  }

  // Log completion in completions table
  const { error: completionError } = await useRecurrenceStore.getState().logCompletion(id, notes)

  if (completionError) {
    return { error: completionError }
  }

  // Fetch updated completions to recalculate streak
  await useRecurrenceStore.getState().fetchCompletions(id)

  // Calculate new streak
  const completions = useRecurrenceStore
    .getState()
    .completions.filter(c => c.task_id === id)

  const { currentStreak, longestStreak } = calculateStreak(
    completions,
    task.grace_period_days || 1
  )

  // Update task with new streak values
  await supabase
    .from('tasks')
    .update({
      current_streak: currentStreak,
      longest_streak: Math.max(longestStreak, task.longest_streak || 0),
    })
    .eq('id', id)

  // Optimistic update
  set(state => ({
    tasks: state.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            current_streak: currentStreak,
            longest_streak: Math.max(longestStreak, t.longest_streak || 0),
          }
        : t
    ),
  }))

  return { error: null }
},
```

---

## Step 4.6: Create Habit Detail Modal

**Create `src/components/HabitDetailModal.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Modal,
  Descriptions,
  Space,
  Button,
  Typography,
  Divider,
  List,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { HabitHeatmap } from './HabitHeatmap'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { getHabitStats, getStreakColor } from '@/lib/habit-utils'
import { format, parseISO } from 'date-fns'

const { Title, Text } = Typography

interface HabitDetailModalProps {
  task: TaskWithTags | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
}

export function HabitDetailModal({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}: HabitDetailModalProps) {
  const { completions, fetchCompletions } = useRecurrenceStore()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (task) {
      fetchCompletions(task.id)
    }
  }, [task, fetchCompletions])

  useEffect(() => {
    if (task) {
      const taskCompletions = completions.filter(c => c.task_id === task.id)
      const habitStats = getHabitStats(task, taskCompletions)
      setStats(habitStats)
    }
  }, [completions, task])

  if (!task || !stats) return null

  const taskCompletions = completions.filter(c => c.task_id === task.id)
  const streakColor = getStreakColor(stats.currentStreak)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const scheduleText =
    task.habit_schedule && task.habit_schedule.length > 0
      ? task.habit_schedule.map(d => dayNames[d]).join(', ')
      : 'Daily'

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Title level={3} className="!mb-0">
              {task.title}
            </Title>
            <Space>
              <Button icon={<EditOutlined />} onClick={onEdit}>
                Edit
              </Button>
              <Button
                type={stats.isCompletedToday ? 'default' : 'primary'}
                icon={<CheckCircleOutlined />}
                onClick={onComplete}
                disabled={stats.isCompletedToday}
              >
                {stats.isCompletedToday ? 'Completed Today' : 'Complete'}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                Delete
              </Button>
            </Space>
          </div>

          {task.description && (
            <Text type="secondary" className="block mb-3">
              {task.description}
            </Text>
          )}
        </div>

        {/* Stats Cards */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Current Streak"
              value={stats.currentStreak}
              prefix={<FireOutlined />}
              valueStyle={{ color: streakColor }}
              suffix="days"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Longest Streak"
              value={stats.longestStreak}
              prefix={<TrophyOutlined />}
              suffix="days"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Completions"
              value={stats.totalCompletions}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Completion Rate"
              value={Math.round(stats.completionRate)}
              prefix={<BarChartOutlined />}
              suffix="%"
            />
          </Col>
        </Row>

        <Divider />

        {/* Heatmap */}
        <div>
          <Title level={5}>Activity</Title>
          <HabitHeatmap completions={taskCompletions} daysToShow={90} />
        </div>

        <Divider />

        {/* Details */}
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Schedule" span={1}>
            {scheduleText}
          </Descriptions.Item>
          <Descriptions.Item label="Grace Period" span={1}>
            {task.grace_period_days || 1} day{(task.grace_period_days || 1) > 1 ? 's' : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Created" span={2}>
            {format(parseISO(task.created_at), 'MMM d, yyyy')}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Completion History */}
        <div>
          <Title level={5}>Recent Completions</Title>
          {taskCompletions.length === 0 ? (
            <Empty description="No completions yet" className="py-4" />
          ) : (
            <List
              dataSource={taskCompletions.slice(0, 10)}
              renderItem={completion => (
                <List.Item>
                  <Space>
                    <CheckCircleOutlined className="text-green-500" />
                    <Text>{format(parseISO(completion.completed_at), 'EEEE, MMM d, yyyy h:mm a')}</Text>
                  </Space>
                  {completion.notes && (
                    <Text type="secondary" className="text-sm">
                      {completion.notes}
                    </Text>
                  )}
                </List.Item>
              )}
              size="small"
            />
          )}
        </div>
      </Space>
    </Modal>
  )
}
```

---

## Step 4.7: Add Habit Schedule to Task Form

**Update `src/components/TaskFormModal.tsx`**:

```typescript
// Add to imports
import { Checkbox } from 'antd'

// Add day options
const dayOptions = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

// Add to form (after type selection, show only when type === 'habit')
{form.getFieldValue('type') === 'habit' && (
  <>
    <Divider />
    <Form.Item label="Habit Schedule" name="habit_schedule">
      <Checkbox.Group options={dayOptions}>
        <Space wrap>
          {dayOptions.map(day => (
            <Checkbox key={day.value} value={day.value}>
              {day.label}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
      <Text type="secondary" className="text-xs block mt-1">
        Leave empty for daily habit
      </Text>
    </Form.Item>

    <Form.Item
      label="Grace Period (days)"
      name="grace_period_days"
      initialValue={1}
    >
      <InputNumber min={0} max={7} />
      <Text type="secondary" className="text-xs block mt-1">
        Days allowed to miss before breaking streak
      </Text>
    </Form.Item>
  </>
)}
```

---

## Step 4.8: Test Habit Tracking

### Test Habit Creation

1. Create task with type "Habit"
2. Set schedule to Mon, Wed, Fri
3. Set grace period to 2 days
4. **Expected**: Habit created with schedule

### Test Habit Completion

1. Complete habit on Monday
2. **Expected**:
   - "Done Today" button appears
   - Current streak = 1
   - Completion logged in history

### Test Streak Calculation

1. Complete habit Monday
2. Skip Tuesday (not scheduled)
3. Complete Wednesday
4. **Expected**: Streak = 2
5. Skip Friday
6. Complete Saturday
7. **Expected**: Streak = 2 (grace period active)
8. Skip Sunday, Monday
9. **Expected**: Streak breaks to 0

### Test Heatmap

1. Complete habit multiple times over 2 weeks
2. View habit detail modal
3. **Expected**: Heatmap shows completion pattern with colored squares

### Test Stats

1. Complete habit 10 times over 15 days
2. **Expected**:
   - Total completions = 10
   - Completion rate calculated correctly
   - Current streak shown
   - Longest streak shown

---

## Verification Checklist

Before proceeding to Step 5, verify:

- [ ] Habits can be created with custom schedules
- [ ] Grace period works correctly
- [ ] Streak calculation is accurate
- [ ] Habit completion marks "Done Today"
- [ ] Heatmap displays correctly
- [ ] Stats show accurate numbers
- [ ] Completion history logs correctly
- [ ] Habit cards show all relevant info
- [ ] Schedule validation works (specific days vs daily)
- [ ] Longest streak tracks correctly
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 5: Habits View Page](./step-5-habits-view.md)**

This will create a dedicated habits dashboard with overview and management.

---

## Summary

You've successfully:
- ✅ Extended task types for habit tracking
- ✅ Implemented streak calculation logic
- ✅ Created habit card component
- ✅ Built habit heatmap visualization
- ✅ Added habit detail modal with stats
- ✅ Integrated habit completion tracking
- ✅ Added habit schedule configuration
- ✅ Created grace period support

**Habit tracking is now fully functional with streaks, heatmaps, and detailed statistics!**
