# Phase 4, Step 2: Eisenhower Matrix View

**Duration**: 2 days
**Prerequisite**: Step 1 (Pomodoro Timer) completed

## Overview

This step implements the Eisenhower Matrix (2x2 priority grid):
- Four quadrants based on urgent/important
- Drag and drop between quadrants
- Quadrant-specific views
- Priority-based task coloring
- Quick actions per quadrant
- Matrix statistics
- Responsive grid layout

## Goals

- Create Eisenhower Matrix component
- Implement 2x2 grid layout
- Add drag-and-drop between quadrants
- Build quadrant cards
- Add priority toggle actions
- Create matrix statistics
- Implement responsive design
- Add quadrant filtering

---

## Step 2.1: Create Matrix Utilities

**Create `src/lib/matrix-utils.ts`**:

```typescript
import { Task } from '@/types/task'

export type QuadrantType = 1 | 2 | 3 | 4

export interface Quadrant {
  id: QuadrantType
  label: string
  description: string
  color: string
  borderColor: string
  icon: string
  actionLabel: string
}

export const quadrants: Record<QuadrantType, Quadrant> = {
  1: {
    id: 1,
    label: 'Do First',
    description: 'Urgent & Important',
    color: '#FEE2E2',
    borderColor: '#EF4444',
    icon: '🔥',
    actionLabel: 'Do it now',
  },
  2: {
    id: 2,
    label: 'Schedule',
    description: 'Not Urgent but Important',
    color: '#DBEAFE',
    borderColor: '#3B82F6',
    icon: '📅',
    actionLabel: 'Plan when to do it',
  },
  3: {
    id: 3,
    label: 'Delegate',
    description: 'Urgent but Not Important',
    color: '#FEF3C7',
    borderColor: '#F59E0B',
    icon: '👥',
    actionLabel: 'Delegate if possible',
  },
  4: {
    id: 4,
    label: 'Eliminate',
    description: 'Not Urgent & Not Important',
    color: '#F3F4F6',
    borderColor: '#9CA3AF',
    icon: '🗑️',
    actionLabel: 'Minimize or eliminate',
  },
}

export function getTaskQuadrant(task: Task): QuadrantType | null {
  const { is_urgent, is_important } = task

  if (is_urgent && is_important) return 1
  if (!is_urgent && is_important) return 2
  if (is_urgent && !is_important) return 3
  if (!is_urgent && !is_important) return 4

  return null
}

export function getQuadrantTasks(tasks: Task[], quadrant: QuadrantType): Task[] {
  return tasks.filter(task => getTaskQuadrant(task) === quadrant)
}

export function setTaskQuadrant(
  task: Task,
  quadrant: QuadrantType
): { is_urgent: boolean; is_important: boolean } {
  switch (quadrant) {
    case 1:
      return { is_urgent: true, is_important: true }
    case 2:
      return { is_urgent: false, is_important: true }
    case 3:
      return { is_urgent: true, is_important: false }
    case 4:
      return { is_urgent: false, is_important: false }
  }
}
```

---

## Step 2.2: Create Quadrant Card Component

**Create `src/components/QuadrantCard.tsx`**:

```typescript
import { Card, Space, Typography, Empty, Badge } from 'antd'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskWithTags } from '@/types/task'
import { MatrixTaskCard } from './MatrixTaskCard'
import { Quadrant } from '@/lib/matrix-utils'

const { Title, Text } = Typography

interface QuadrantCardProps {
  quadrant: Quadrant
  tasks: TaskWithTags[]
  onTaskClick?: (task: TaskWithTags) => void
}

export function QuadrantCard({ quadrant, tasks, onTaskClick }: QuadrantCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${quadrant.id}`,
    data: { quadrant: quadrant.id },
  })

  return (
    <Card
      ref={setNodeRef}
      className={`h-full transition-all ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: quadrant.color,
        borderColor: quadrant.borderColor,
        borderWidth: 2,
      }}
      styles={{
        body: { height: 'calc(100% - 60px)', overflowY: 'auto', padding: 12 },
      }}
    >
      {/* Header */}
      <div className="mb-3">
        <Space size="small" className="mb-1">
          <Text className="text-2xl">{quadrant.icon}</Text>
          <Title level={5} className="!mb-0">
            {quadrant.label}
          </Title>
          <Badge count={tasks.length} style={{ backgroundColor: quadrant.borderColor }} />
        </Space>
        <Text type="secondary" className="text-xs block">
          {quadrant.description}
        </Text>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.length === 0 ? (
          <Empty
            description={<Text type="secondary" className="text-xs">No tasks</Text>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-4"
          />
        ) : (
          <Space direction="vertical" className="w-full" size="small">
            {tasks.map(task => (
              <MatrixTaskCard
                key={task.id}
                task={task}
                quadrant={quadrant}
                onClick={() => onTaskClick?.(task)}
              />
            ))}
          </Space>
        )}
      </SortableContext>
    </Card>
  )
}
```

---

## Step 2.3: Create Matrix Task Card

**Create `src/components/MatrixTaskCard.tsx`**:

```typescript
import { Card, Space, Typography, Checkbox, Tag } from 'antd'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithTags } from '@/types/task'
import { Quadrant } from '@/lib/matrix-utils'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { Tag as TagComponent } from './Tag'

const { Text } = Typography

interface MatrixTaskCardProps {
  task: TaskWithTags
  quadrant: Quadrant
  onClick?: () => void
}

export function MatrixTaskCard({ task, quadrant, onClick }: MatrixTaskCardProps) {
  const { completeTask, uncompleteTask } = useTaskStore()
  const { getTagById } = useTagStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isCompleted = task.status === 'completed'

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCompleted) {
      await uncompleteTask(task.id)
    } else {
      await completeTask(task.id)
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="small"
      className={`cursor-move hover:shadow-md transition-shadow ${
        isCompleted ? 'opacity-60' : ''
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <Space direction="vertical" size={4} className="w-full">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={isCompleted}
            onClick={handleComplete}
            className="mt-1"
          />
          <Text
            strong
            delete={isCompleted}
            className="text-sm flex-1"
          >
            {task.title}
          </Text>
        </div>

        {task.tags.length > 0 && (
          <div className="ml-6">
            <Space size={4} wrap>
              {task.tags.slice(0, 2).map(tagId => {
                const tag = getTagById(tagId)
                return tag ? (
                  <TagComponent key={tag.id} tag={tag} />
                ) : null
              })}
              {task.tags.length > 2 && (
                <Text type="secondary" className="text-xs">
                  +{task.tags.length - 2}
                </Text>
              )}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  )
}
```

---

## Step 2.4: Create Eisenhower Matrix Component

**Create `src/components/EisenhowerMatrix.tsx`**:

```typescript
import { useState } from 'react'
import { Space, Typography, message } from 'antd'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { QuadrantCard } from './QuadrantCard'
import { MatrixTaskCard } from './MatrixTaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { TaskWithTags } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { quadrants, getQuadrantTasks, setTaskQuadrant, QuadrantType } from '@/lib/matrix-utils'

const { Title } = Typography

export function EisenhowerMatrix() {
  const { tasks, updateTask } = useTaskStore()
  const [activeTask, setActiveTask] = useState<TaskWithTags | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const activeTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived'
  )

  const quadrant1Tasks = getQuadrantTasks(activeTasks, 1)
  const quadrant2Tasks = getQuadrantTasks(activeTasks, 2)
  const quadrant3Tasks = getQuadrantTasks(activeTasks, 3)
  const quadrant4Tasks = getQuadrantTasks(activeTasks, 4)

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)

    const { active, over } = event

    if (!over) return

    const task = active.data.current?.task as TaskWithTags
    const targetQuadrant = over.data.current?.quadrant as QuadrantType

    if (!task || !targetQuadrant) return

    // Update task priority based on quadrant
    const { is_urgent, is_important } = setTaskQuadrant(task, targetQuadrant)

    const { error } = await updateTask(task.id, {
      is_urgent,
      is_important,
    })

    if (error) {
      message.error(error.message)
    } else {
      message.success(`Moved to ${quadrants[targetQuadrant].label}`)
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-250px)]">
          {/* Quadrant 1: Do First */}
          <QuadrantCard
            quadrant={quadrants[1]}
            tasks={quadrant1Tasks}
            onTaskClick={setSelectedTask}
          />

          {/* Quadrant 2: Schedule */}
          <QuadrantCard
            quadrant={quadrants[2]}
            tasks={quadrant2Tasks}
            onTaskClick={setSelectedTask}
          />

          {/* Quadrant 3: Delegate */}
          <QuadrantCard
            quadrant={quadrants[3]}
            tasks={quadrant3Tasks}
            onTaskClick={setSelectedTask}
          />

          {/* Quadrant 4: Eliminate */}
          <QuadrantCard
            quadrant={quadrants[4]}
            tasks={quadrant4Tasks}
            onTaskClick={setSelectedTask}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <MatrixTaskCard
              task={activeTask}
              quadrant={quadrants[1]}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
```

---

## Step 2.5: Create Matrix Statistics Component

**Create `src/components/MatrixStats.tsx`**:

```typescript
import { Card, Row, Col, Statistic, Progress, Space, Typography } from 'antd'
import { useTaskStore } from '@/stores/taskStore'
import { getQuadrantTasks, quadrants } from '@/lib/matrix-utils'
import { useMemo } from 'react'

const { Text } = Typography

export function MatrixStats() {
  const { tasks } = useTaskStore()

  const activeTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived'
  )

  const stats = useMemo(() => {
    const q1 = getQuadrantTasks(activeTasks, 1).length
    const q2 = getQuadrantTasks(activeTasks, 2).length
    const q3 = getQuadrantTasks(activeTasks, 3).length
    const q4 = getQuadrantTasks(activeTasks, 4).length
    const total = q1 + q2 + q3 + q4

    return {
      q1,
      q2,
      q3,
      q4,
      total,
      q1Percent: total > 0 ? (q1 / total) * 100 : 0,
      q2Percent: total > 0 ? (q2 / total) * 100 : 0,
      q3Percent: total > 0 ? (q3 / total) * 100 : 0,
      q4Percent: total > 0 ? (q4 / total) * 100 : 0,
    }
  }, [activeTasks])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title={quadrants[1].label}
            value={stats.q1}
            prefix={quadrants[1].icon}
            valueStyle={{ color: quadrants[1].borderColor }}
          />
          <Progress
            percent={stats.q1Percent}
            showInfo={false}
            strokeColor={quadrants[1].borderColor}
            size="small"
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title={quadrants[2].label}
            value={stats.q2}
            prefix={quadrants[2].icon}
            valueStyle={{ color: quadrants[2].borderColor }}
          />
          <Progress
            percent={stats.q2Percent}
            showInfo={false}
            strokeColor={quadrants[2].borderColor}
            size="small"
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title={quadrants[3].label}
            value={stats.q3}
            prefix={quadrants[3].icon}
            valueStyle={{ color: quadrants[3].borderColor }}
          />
          <Progress
            percent={stats.q3Percent}
            showInfo={false}
            strokeColor={quadrants[3].borderColor}
            size="small"
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title={quadrants[4].label}
            value={stats.q4}
            prefix={quadrants[4].icon}
            valueStyle={{ color: quadrants[4].borderColor }}
          />
          <Progress
            percent={stats.q4Percent}
            showInfo={false}
            strokeColor={quadrants[4].borderColor}
            size="small"
          />
        </Card>
      </Col>
    </Row>
  )
}
```

---

## Step 2.6: Create Matrix Page

**Create `src/pages/MatrixPage.tsx`**:

```typescript
import { useEffect } from 'react'
import { Typography, Space, Button } from 'antd'
import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix'
import { MatrixStats } from '@/components/MatrixStats'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { useState } from 'react'
import { TaskFormModal } from '@/components/TaskFormModal'

const { Title, Text } = Typography

export function MatrixPage() {
  const { fetchTasks, subscribeToTasks, unsubscribeFromTasks } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center">
              <AppstoreOutlined className="text-2xl text-purple-500" />
              <div>
                <Title level={2} className="!mb-0">
                  Eisenhower Matrix
                </Title>
                <Text type="secondary">Prioritize tasks by urgency and importance</Text>
              </div>
            </Space>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormOpen(true)}
            size="large"
          >
            New Task
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <MatrixStats />
        </div>

        {/* Matrix */}
        <EisenhowerMatrix />

        {/* Task Form */}
        <TaskFormModal
          open={isFormOpen}
          task={null}
          onClose={() => setIsFormOpen(false)}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 2.7: Update Router and Navigation

**Update `src/lib/router.tsx`**:

```typescript
import { MatrixPage } from '@/pages/MatrixPage'

{
  path: '/matrix',
  element: (
    <ProtectedRoute>
      <MatrixPage />
    </ProtectedRoute>
  ),
},
```

**Update `src/components/AppLayout.tsx`**:

```typescript
import { AppstoreOutlined } from '@ant-design/icons'

{
  key: '/matrix',
  label: 'Matrix',
  icon: <AppstoreOutlined />,
  onClick: () => navigate('/matrix'),
},
```

---

## Step 2.8: Install @dnd-kit Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Step 2.9: Test Eisenhower Matrix

### Test Quadrant Display

1. Navigate to `/matrix`
2. Create tasks with different priorities
3. **Expected**: Tasks appear in correct quadrants based on urgent/important flags

### Test Drag and Drop

1. Drag a task from Q1 to Q2
2. **Expected**:
   - Task moves to Q2
   - Task's `is_urgent` becomes false
   - Task's `is_important` stays true
   - Success message shown

3. Drag task from Q3 to Q4
4. **Expected**: Both urgent and important become false

### Test Stats

1. **Expected**: Stats cards show count per quadrant
2. Progress bars show distribution
3. Percents add up to 100%

### Test Task Completion

1. Complete a task in any quadrant
2. **Expected**: Task becomes semi-transparent, stays in quadrant

### Test Responsive Layout

1. Resize browser to mobile width
2. **Expected**: Grid stacks to single column

### Test Task Click

1. Click on a task card
2. **Expected**: Task detail modal opens

---

## Verification Checklist

Before proceeding to Step 3, verify:

- [ ] Matrix displays 4 quadrants correctly
- [ ] Tasks appear in correct quadrants
- [ ] Drag and drop works between quadrants
- [ ] Task priority updates when moved
- [ ] Stats display accurate counts
- [ ] Progress bars show correct percentages
- [ ] Task completion works
- [ ] Task detail modal opens
- [ ] Responsive layout works
- [ ] Real-time updates work
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 3: Kanban Board View](./step-3-kanban-board.md)**

This will implement the Kanban board with status-based columns.

---

## Summary

You've successfully:
- ✅ Created Eisenhower Matrix 2x2 grid
- ✅ Implemented drag-and-drop prioritization
- ✅ Built quadrant cards with styling
- ✅ Added matrix statistics
- ✅ Created matrix task cards
- ✅ Integrated @dnd-kit for drag and drop
- ✅ Added responsive grid layout
- ✅ Built complete Matrix page

**The Eisenhower Matrix provides a powerful visual prioritization tool!**
