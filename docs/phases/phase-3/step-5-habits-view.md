# Phase 3, Step 5: Habits View Page

**Duration**: 2 days
**Prerequisite**: Step 4 (Habit Tracking) completed

## Overview

This step creates a dedicated Habits page:
- Habits dashboard with overview
- Today's habits quick view
- All habits list with stats
- Habit streak leaderboard
- Quick habit completion
- Habit creation and management
- Filter by schedule type

## Goals

- Create Habits page
- Build habits overview dashboard
- Display today's habits prominently
- Show all habits with key stats
- Create habit streak leaderboard
- Add quick completion interface
- Implement habit filters
- Add habit creation shortcut

---

## Step 5.1: Create Habits Overview Component

**Create `src/components/HabitsOverview.tsx`**:

```typescript
import { Card, Row, Col, Statistic, Space, Typography } from 'antd'
import {
  FireOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { getHabitStats, isHabitDueToday } from '@/lib/habit-utils'
import { useMemo } from 'react'

const { Text } = Typography

export function HabitsOverview() {
  const { tasks } = useTaskStore()
  const { completions } = useRecurrenceStore()

  const habits = tasks.filter(t => t.type === 'habit' && t.status !== 'archived')

  const stats = useMemo(() => {
    let totalActiveStreaks = 0
    let longestActiveStreak = 0
    let totalCompletionsToday = 0
    let habitsDueToday = 0
    let totalCompletions = 0
    let averageCompletionRate = 0

    habits.forEach(habit => {
      const habitCompletions = completions.filter(c => c.task_id === habit.id)
      const habitStats = getHabitStats(habit, habitCompletions)

      if (habitStats.currentStreak > 0) {
        totalActiveStreaks++
        longestActiveStreak = Math.max(longestActiveStreak, habitStats.currentStreak)
      }

      if (habitStats.isCompletedToday) {
        totalCompletionsToday++
      }

      if (isHabitDueToday(habit)) {
        habitsDueToday++
      }

      totalCompletions += habitStats.totalCompletions
      averageCompletionRate += habitStats.completionRate
    })

    if (habits.length > 0) {
      averageCompletionRate = averageCompletionRate / habits.length
    }

    return {
      totalHabits: habits.length,
      totalActiveStreaks,
      longestActiveStreak,
      totalCompletionsToday,
      habitsDueToday,
      totalCompletions,
      averageCompletionRate,
    }
  }, [habits, completions])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Active Habits"
            value={stats.totalHabits}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#3B82F6' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Completed Today"
            value={`${stats.totalCompletionsToday}/${stats.habitsDueToday}`}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#10B981' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Active Streaks"
            value={stats.totalActiveStreaks}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#F59E0B' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Longest Active Streak"
            value={stats.longestActiveStreak}
            suffix="days"
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#EF4444' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Total Completions"
            value={stats.totalCompletions}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#8B5CF6' }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic
            title="Avg Completion Rate"
            value={Math.round(stats.averageCompletionRate)}
            suffix="%"
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#06B6D4' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
```

---

## Step 5.2: Create Today's Habits Component

**Create `src/components/TodaysHabits.tsx`**:

```typescript
import { Space, Typography, Empty, message } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { HabitCard } from './HabitCard'
import { HabitDetailModal } from './HabitDetailModal'
import { isHabitDueToday } from '@/lib/habit-utils'
import { useState } from 'react'
import { TaskWithTags } from '@/types/task'

const { Title, Text } = Typography

export function TodaysHabits() {
  const { tasks, completeHabit } = useTaskStore()
  const [selectedHabit, setSelectedHabit] = useState<TaskWithTags | null>(null)

  const todaysHabits = tasks.filter(
    t => t.type === 'habit' && t.status !== 'archived' && isHabitDueToday(t)
  )

  const handleComplete = async (habit: TaskWithTags) => {
    const { error } = await completeHabit(habit.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success(`${habit.title} completed! 🎉`)
    }
  }

  if (todaysHabits.length === 0) {
    return (
      <Empty
        description="No habits scheduled for today"
        className="py-8"
      />
    )
  }

  return (
    <>
      <Space direction="vertical" className="w-full" size="middle">
        {todaysHabits.map(habit => (
          <HabitCard
            key={habit.id}
            task={habit}
            onComplete={() => handleComplete(habit)}
            onClick={() => setSelectedHabit(habit)}
          />
        ))}
      </Space>

      <HabitDetailModal
        task={selectedHabit}
        open={!!selectedHabit}
        onClose={() => setSelectedHabit(null)}
        onComplete={() => {
          if (selectedHabit) {
            handleComplete(selectedHabit)
            setSelectedHabit(null)
          }
        }}
      />
    </>
  )
}
```

---

## Step 5.3: Create Habit Leaderboard Component

**Create `src/components/HabitLeaderboard.tsx`**:

```typescript
import { Card, List, Space, Typography, Tag, Empty } from 'antd'
import { FireOutlined, TrophyOutlined } from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { getHabitStats, getStreakColor, getStreakEmoji } from '@/lib/habit-utils'
import { useMemo } from 'react'

const { Text, Title } = Typography

interface HabitWithStats {
  task: any
  stats: any
}

export function HabitLeaderboard() {
  const { tasks } = useTaskStore()
  const { completions } = useRecurrenceStore()

  const habitsWithStats: HabitWithStats[] = useMemo(() => {
    const habits = tasks.filter(t => t.type === 'habit' && t.status !== 'archived')

    return habits
      .map(habit => {
        const habitCompletions = completions.filter(c => c.task_id === habit.id)
        const stats = getHabitStats(habit, habitCompletions)
        return { task: habit, stats }
      })
      .sort((a, b) => b.stats.currentStreak - a.stats.currentStreak)
      .slice(0, 10)
  }, [tasks, completions])

  if (habitsWithStats.length === 0) {
    return (
      <Empty
        description="No active habits to display"
        className="py-8"
      />
    )
  }

  return (
    <List
      dataSource={habitsWithStats}
      renderItem={(item, index) => {
        const streakColor = getStreakColor(item.stats.currentStreak)
        const streakEmoji = getStreakEmoji(item.stats.currentStreak)

        return (
          <List.Item>
            <Space className="w-full justify-between">
              <Space size="middle">
                <Text strong className="text-2xl text-gray-400">
                  #{index + 1}
                </Text>

                <Space direction="vertical" size={0}>
                  <Space size="small">
                    <Text className="text-lg">{streakEmoji}</Text>
                    <Text strong>{item.task.title}</Text>
                  </Space>

                  <Space size="small" wrap>
                    <Tag icon={<FireOutlined />} color={streakColor}>
                      {item.stats.currentStreak} day streak
                    </Tag>
                    <Tag icon={<TrophyOutlined />}>
                      Best: {item.stats.longestStreak}
                    </Tag>
                    <Tag>
                      {Math.round(item.stats.completionRate)}% rate
                    </Tag>
                  </Space>
                </Space>
              </Space>

              {index === 0 && item.stats.currentStreak > 0 && (
                <Text className="text-3xl">🏆</Text>
              )}
            </Space>
          </List.Item>
        )
      }}
    />
  )
}
```

---

## Step 5.4: Create Habits Page

**Create `src/pages/HabitsPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Typography,
  Space,
  Button,
  Card,
  Tabs,
  Segmented,
  message,
} from 'antd'
import {
  PlusOutlined,
  FireOutlined,
  UnorderedListOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { HabitsOverview } from '@/components/HabitsOverview'
import { TodaysHabits } from '@/components/TodaysHabits'
import { HabitCard } from '@/components/HabitCard'
import { HabitLeaderboard } from '@/components/HabitLeaderboard'
import { TaskFormModal } from '@/components/TaskFormModal'
import { HabitDetailModal } from '@/components/HabitDetailModal'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { TaskWithTags } from '@/types/task'

const { Title, Text } = Typography

type ViewMode = 'today' | 'all' | 'leaderboard'

export function HabitsPage() {
  const {
    tasks,
    fetchTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
    completeHabit,
  } = useTaskStore()
  const { fetchTags } = useTagStore()
  const { fetchRecurrences } = useRecurrenceStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<TaskWithTags | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('today')

  useEffect(() => {
    fetchTasks()
    fetchTags()
    fetchRecurrences()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, fetchRecurrences, subscribeToTasks, unsubscribeFromTasks])

  const allHabits = tasks.filter(t => t.type === 'habit' && t.status !== 'archived')

  const handleComplete = async (habit: TaskWithTags) => {
    const { error } = await completeHabit(habit.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success(`${habit.title} completed! 🎉`)
    }
  }

  const handleCreateHabit = () => {
    setIsFormOpen(true)
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center">
              <FireOutlined className="text-2xl text-orange-500" />
              <div>
                <Title level={2} className="!mb-0">
                  Habits
                </Title>
                <Text type="secondary">Build better habits, track your progress</Text>
              </div>
            </Space>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateHabit}
            size="large"
          >
            New Habit
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="mb-6">
          <HabitsOverview />
        </div>

        {/* View Mode Selector */}
        <div className="mb-4">
          <Segmented
            value={viewMode}
            onChange={value => setViewMode(value as ViewMode)}
            options={[
              {
                label: (
                  <Space>
                    <CalendarOutlined />
                    <span>Today</span>
                  </Space>
                ),
                value: 'today',
              },
              {
                label: (
                  <Space>
                    <UnorderedListOutlined />
                    <span>All Habits ({allHabits.length})</span>
                  </Space>
                ),
                value: 'all',
              },
              {
                label: (
                  <Space>
                    <TrophyOutlined />
                    <span>Leaderboard</span>
                  </Space>
                ),
                value: 'leaderboard',
              },
            ]}
            block
            size="large"
          />
        </div>

        {/* Content */}
        <Card>
          {viewMode === 'today' && (
            <div>
              <Title level={4} className="mb-4">
                Today's Habits
              </Title>
              <TodaysHabits />
            </div>
          )}

          {viewMode === 'all' && (
            <div>
              <Title level={4} className="mb-4">
                All Habits
              </Title>
              {allHabits.length === 0 ? (
                <div className="text-center py-12">
                  <Text type="secondary">No habits yet</Text>
                  <div className="mt-4">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHabit}>
                      Create Your First Habit
                    </Button>
                  </div>
                </div>
              ) : (
                <Space direction="vertical" className="w-full" size="middle">
                  {allHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      task={habit}
                      onComplete={() => handleComplete(habit)}
                      onClick={() => setSelectedHabit(habit)}
                    />
                  ))}
                </Space>
              )}
            </div>
          )}

          {viewMode === 'leaderboard' && (
            <div>
              <Title level={4} className="mb-4">
                <TrophyOutlined /> Streak Leaderboard
              </Title>
              <Text type="secondary" className="block mb-4">
                Your habits ranked by current streak
              </Text>
              <HabitLeaderboard />
            </div>
          )}
        </Card>

        {/* Task Form Modal - preset to habit type */}
        <TaskFormModal
          open={isFormOpen}
          task={
            {
              type: 'habit',
              status: 'ready',
            } as any
          }
          onClose={() => setIsFormOpen(false)}
        />

        {/* Habit Detail Modal */}
        <HabitDetailModal
          task={selectedHabit}
          open={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onComplete={() => {
            if (selectedHabit) {
              handleComplete(selectedHabit)
              setSelectedHabit(null)
            }
          }}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 5.5: Update Router and Navigation

**Update `src/lib/router.tsx`**:

```typescript
import { HabitsPage } from '@/pages/HabitsPage'

// Add route
{
  path: '/habits',
  element: (
    <ProtectedRoute>
      <HabitsPage />
    </ProtectedRoute>
  ),
},
```

**Update `src/components/AppLayout.tsx`**:

```typescript
import { FireOutlined } from '@ant-design/icons'

// Add to navMenuItems
{
  key: '/habits',
  label: 'Habits',
  icon: <FireOutlined />,
  onClick: () => navigate('/habits'),
},
```

---

## Step 5.6: Add Quick Habit Widget to Dashboard

**Create `src/components/HabitsWidget.tsx`** (for Today page):

```typescript
import { Card, Space, Progress, Typography, Button } from 'antd'
import { FireOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '@/stores/taskStore'
import { useRecurrenceStore } from '@/stores/recurrenceStore'
import { isHabitDueToday, getHabitStats } from '@/lib/habit-utils'
import { useMemo } from 'react'

const { Title, Text } = Typography

export function HabitsWidget() {
  const navigate = useNavigate()
  const { tasks } = useTaskStore()
  const { completions } = useRecurrenceStore()

  const todaysHabits = tasks.filter(
    t => t.type === 'habit' && t.status !== 'archived' && isHabitDueToday(t)
  )

  const { completed, total } = useMemo(() => {
    let completedCount = 0
    todaysHabits.forEach(habit => {
      const habitCompletions = completions.filter(c => c.task_id === habit.id)
      const stats = getHabitStats(habit, habitCompletions)
      if (stats.isCompletedToday) completedCount++
    })
    return { completed: completedCount, total: todaysHabits.length }
  }, [todaysHabits, completions])

  if (total === 0) return null

  const progress = (completed / total) * 100

  return (
    <Card>
      <Space direction="vertical" className="w-full">
        <div className="flex items-center justify-between">
          <Space>
            <FireOutlined className="text-orange-500 text-xl" />
            <Title level={5} className="!mb-0">
              Today's Habits
            </Title>
          </Space>
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/habits')}
          >
            View All
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Text>
              {completed} of {total} completed
            </Text>
            <Text strong>{Math.round(progress)}%</Text>
          </div>
          <Progress
            percent={progress}
            strokeColor="#F59E0B"
            showInfo={false}
          />
        </div>
      </Space>
    </Card>
  )
}
```

**Add to `src/pages/TodayPage.tsx`**:

```typescript
import { HabitsWidget } from '@/components/HabitsWidget'

// Add after stats or before main content
<div className="mb-6">
  <HabitsWidget />
</div>
```

---

## Step 5.7: Test Habits Page

### Test Today's Habits View

1. Navigate to `/habits`
2. **Expected**: Overview stats show correct numbers
3. View "Today" tab
4. **Expected**: Only habits scheduled for today appear
5. Complete a habit
6. **Expected**: Card shows "Done Today", stats update

### Test All Habits View

1. Switch to "All Habits" tab
2. **Expected**: All habits listed with streaks and stats
3. Click on a habit card
4. **Expected**: Detail modal opens with full stats and heatmap

### Test Leaderboard

1. Switch to "Leaderboard" tab
2. **Expected**: Habits ranked by current streak
3. Top habit has trophy emoji
4. **Expected**: Shows streak, best streak, and completion rate

### Test Overview Stats

1. Complete several habits
2. **Expected**: Overview stats update in real-time:
   - Completed Today increases
   - Active Streaks count updates
   - Total Completions increases

### Test Habits Widget on Today Page

1. Navigate to Today page
2. **Expected**: Habits widget shows today's habit progress
3. Complete a habit
4. **Expected**: Progress bar updates
5. Click "View All"
6. **Expected**: Navigates to Habits page

---

## Verification Checklist

Before proceeding to Step 6, verify:

- [ ] Habits page loads correctly
- [ ] Overview stats display accurate data
- [ ] Today's habits filtered correctly
- [ ] All habits view shows all habits
- [ ] Leaderboard ranks by streak correctly
- [ ] Habit completion works from all views
- [ ] Detail modal shows complete information
- [ ] Habits widget appears on Today page
- [ ] Navigation to habits page works
- [ ] Create habit button pre-selects habit type
- [ ] Real-time updates work
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 6: Someday Tasks](./step-6-someday-tasks.md)**

This will implement the someday/maybe task system with nudge logic.

---

## Summary

You've successfully:
- ✅ Created habits overview dashboard
- ✅ Built today's habits quick view
- ✅ Implemented habit leaderboard
- ✅ Created comprehensive habits page
- ✅ Added habits widget to Today page
- ✅ Integrated habit creation workflow
- ✅ Added navigation to habits section

**The Habits page provides a comprehensive view and management interface for all habit tracking!**
