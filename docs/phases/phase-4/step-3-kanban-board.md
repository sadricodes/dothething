# Phase 4, Step 3: Kanban Board View

**Duration**: 2-3 days
**Prerequisite**: Step 2 (Eisenhower Matrix) completed

## Overview

This step implements a Kanban board with status-based columns:
- Status columns (Ready, In Progress, Blocked, Completed)
- Drag and drop between columns
- Column customization
- Task cards optimized for Kanban
- Column limits (WIP limits)
- Swimlanes (by tag or type)
- Column statistics

## Goals

- Create Kanban board component
- Implement status-based columns
- Add drag-and-drop between columns
- Build Kanban task cards
- Add WIP limits per column
- Create swimlane grouping
- Add column statistics
- Implement responsive board

---

## Step 3.1: Create Kanban Utilities

**Create `src/lib/kanban-utils.ts`**:

```typescript
import { TaskStatus } from '@/types/task'

export interface KanbanColumn {
  id: TaskStatus
  label: string
  color: string
  icon: string
  wipLimit?: number
}

export const kanbanColumns: KanbanColumn[] = [
  {
    id: 'ready',
    label: 'Ready',
    color: '#6B7280',
    icon: '📋',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    color: '#3B82F6',
    icon: '⚡',
    wipLimit: 3,
  },
  {
    id: 'blocked',
    label: 'Blocked',
    color: '#F59E0B',
    icon: '🚧',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: '#10B981',
    icon: '✅',
  },
]

export function getColumnById(id: TaskStatus): KanbanColumn | undefined {
  return kanbanColumns.find(col => col.id === id)
}

export function isWipLimitExceeded(taskCount: number, wipLimit?: number): boolean {
  if (!wipLimit) return false
  return taskCount >= wipLimit
}
```

---

## Step 3.2: Create Kanban Column Component

**Create `src/components/KanbanColumn.tsx`**:

```typescript
import { Card, Space, Typography, Badge, Alert } from 'antd'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskWithTags, TaskStatus } from '@/types/task'
import { KanbanTaskCard } from './KanbanTaskCard'
import { KanbanColumn as KanbanColumnType, isWipLimitExceeded } from '@/lib/kanban-utils'

const { Title, Text } = Typography

interface KanbanColumnProps {
  column: KanbanColumnType
  tasks: TaskWithTags[]
  onTaskClick?: (task: TaskWithTags) => void
}

export function KanbanColumn({ column, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { status: column.id },
  })

  const wipExceeded = isWipLimitExceeded(tasks.length, column.wipLimit)

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full min-w-[300px]"
    >
      {/* Column Header */}
      <Card
        size="small"
        className={`mb-2 ${isOver ? 'ring-2 ring-blue-500' : ''}`}
        style={{ borderColor: column.color, borderWidth: 2 }}
      >
        <Space className="w-full justify-between">
          <Space size="small">
            <Text className="text-xl">{column.icon}</Text>
            <Title level={5} className="!mb-0">
              {column.label}
            </Title>
            <Badge
              count={tasks.length}
              style={{ backgroundColor: column.color }}
              overflowCount={99}
            />
          </Space>
          {column.wipLimit && (
            <Text
              type={wipExceeded ? 'danger' : 'secondary'}
              className="text-xs"
            >
              Limit: {column.wipLimit}
            </Text>
          )}
        </Space>
      </Card>

      {/* WIP Limit Warning */}
      {wipExceeded && (
        <Alert
          message="WIP Limit Exceeded"
          type="warning"
          className="mb-2"
          showIcon
          closable
        />
      )}

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-2 space-y-2">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8">
            <Text type="secondary" className="text-sm">
              No tasks
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Step 3.3: Create Kanban Task Card

**Create `src/components/KanbanTaskCard.tsx`**:

```typescript
import { Card, Space, Typography, Tag, Avatar, Tooltip } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithTags } from '@/types/task'
import { useTagStore } from '@/stores/tagStore'
import { Tag as TagComponent } from './Tag'
import { isTaskOverdue, isTaskDueToday } from '@/lib/task-utils'
import { format, parseISO } from 'date-fns'

const { Text } = Typography

interface KanbanTaskCardProps {
  task: TaskWithTags
  onClick?: () => void
}

export function KanbanTaskCard({ task, onClick }: KanbanTaskCardProps) {
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

  const isOverdue = isTaskOverdue(task)
  const isDueToday = isTaskDueToday(task)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="small"
      className="cursor-move hover:shadow-lg transition-shadow"
      onClick={onClick}
      {...attributes}
      {...listeners}
      styles={{
        body: {
          borderLeft: isOverdue
            ? '4px solid #EF4444'
            : isDueToday
            ? '4px solid #3B82F6'
            : undefined,
        },
      }}
    >
      <Space direction="vertical" size="small" className="w-full">
        {/* Priority Indicators */}
        {(task.is_urgent || task.is_important) && (
          <Space size={4}>
            {task.is_urgent && (
              <Tooltip title="Urgent">
                <FireOutlined className="text-red-500" />
              </Tooltip>
            )}
            {task.is_important && (
              <Tooltip title="Important">
                <StarOutlined className="text-blue-500" />
              </Tooltip>
            )}
          </Space>
        )}

        {/* Title */}
        <Text strong className="block">
          {task.title}
        </Text>

        {/* Description */}
        {task.description && (
          <Text type="secondary" className="text-xs line-clamp-2">
            {task.description}
          </Text>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <Space size={4} wrap>
            {task.tags.slice(0, 3).map(tagId => {
              const tag = getTagById(tagId)
              return tag ? <TagComponent key={tag.id} tag={tag} /> : null
            })}
            {task.tags.length > 3 && (
              <Text type="secondary" className="text-xs">
                +{task.tags.length - 3}
              </Text>
            )}
          </Space>
        )}

        {/* Metadata */}
        <Space size="small" wrap className="text-xs">
          {task.due_date && (
            <Tag
              icon={<CalendarOutlined />}
              color={isOverdue ? 'error' : isDueToday ? 'processing' : 'default'}
            >
              {format(parseISO(task.due_date), 'MMM d')}
            </Tag>
          )}

          {task.estimated_minutes && (
            <Tag icon={<ClockCircleOutlined />}>
              {task.estimated_minutes}m
            </Tag>
          )}

          {task.notes && (
            <Tag icon={<PaperClipOutlined />}>Notes</Tag>
          )}
        </Space>
      </Space>
    </Card>
  )
}
```

---

## Step 3.4: Create Kanban Board Component

**Create `src/components/KanbanBoard.tsx`**:

```typescript
import { useState } from 'react'
import { message, Space } from 'antd'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { KanbanTaskCard } from './KanbanTaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { TaskWithTags, TaskStatus } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { kanbanColumns } from '@/lib/kanban-utils'

export function KanbanBoard() {
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
    t => t.status !== 'archived' && t.type !== 'habit'
  )

  const getColumnTasks = (status: TaskStatus) => {
    return activeTasks.filter(task => task.status === status)
  }

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
    const targetStatus = over.data.current?.status as TaskStatus

    if (!task || !targetStatus) return

    // Don't update if dropped in same column
    if (task.status === targetStatus) return

    // Update task status
    const updateData: any = { status: targetStatus }

    // Auto-set completed_at when moving to completed
    if (targetStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    // Clear completed_at when moving out of completed
    if (task.status === 'completed' && targetStatus !== 'completed') {
      updateData.completed_at = null
    }

    const { error } = await updateTask(task.id, updateData)

    if (error) {
      message.error(error.message)
    } else {
      const column = kanbanColumns.find(col => col.id === targetStatus)
      message.success(`Moved to ${column?.label || targetStatus}`)
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-[calc(100vh-250px)] overflow-x-auto pb-4">
          {kanbanColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard task={activeTask} />
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

## Step 3.5: Create Kanban Stats Component

**Create `src/components/KanbanStats.tsx`**:

```typescript
import { Card, Row, Col, Statistic, Progress } from 'antd'
import { useTaskStore } from '@/stores/taskStore'
import { kanbanColumns } from '@/lib/kanban-utils'
import { useMemo } from 'react'

export function KanbanStats() {
  const { tasks } = useTaskStore()

  const activeTasks = tasks.filter(
    t => t.status !== 'archived' && t.type !== 'habit'
  )

  const stats = useMemo(() => {
    const columnCounts = kanbanColumns.reduce((acc, col) => {
      acc[col.id] = activeTasks.filter(t => t.status === col.id).length
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(columnCounts).reduce((sum, count) => sum + count, 0)

    return {
      columnCounts,
      total,
      percentages: Object.entries(columnCounts).reduce((acc, [status, count]) => {
        acc[status] = total > 0 ? (count / total) * 100 : 0
        return acc
      }, {} as Record<string, number>),
    }
  }, [activeTasks])

  return (
    <Row gutter={[16, 16]}>
      {kanbanColumns.map(column => (
        <Col key={column.id} xs={12} sm={6}>
          <Card>
            <Statistic
              title={column.label}
              value={stats.columnCounts[column.id] || 0}
              prefix={column.icon}
              valueStyle={{ color: column.color }}
            />
            <Progress
              percent={stats.percentages[column.id] || 0}
              showInfo={false}
              strokeColor={column.color}
              size="small"
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
```

---

## Step 3.6: Create Kanban Page

**Create `src/pages/KanbanPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import { Typography, Space, Button, Select } from 'antd'
import { ProjectOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { KanbanBoard } from '@/components/KanbanBoard'
import { KanbanStats } from '@/components/KanbanStats'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'

const { Title, Text } = Typography

export function KanbanPage() {
  const { fetchTasks, subscribeToTasks, unsubscribeFromTasks } = useTaskStore()
  const { fetchTags, tags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  return (
    <AppLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center">
              <ProjectOutlined className="text-2xl text-green-500" />
              <div>
                <Title level={2} className="!mb-0">
                  Kanban Board
                </Title>
                <Text type="secondary">Visualize your workflow</Text>
              </div>
            </Space>
          </div>
          <Space>
            <Select
              placeholder="Filter by tag"
              value={filterTag}
              onChange={setFilterTag}
              allowClear
              style={{ width: 200 }}
              options={tags.map(tag => ({
                label: tag.name,
                value: tag.id,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsFormOpen(true)}
              size="large"
            >
              New Task
            </Button>
          </Space>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <KanbanStats />
        </div>

        {/* Board */}
        <KanbanBoard />

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

## Step 3.7: Update Router and Navigation

**Update `src/lib/router.tsx`**:

```typescript
import { KanbanPage } from '@/pages/KanbanPage'

{
  path: '/kanban',
  element: (
    <ProtectedRoute>
      <KanbanPage />
    </ProtectedRoute>
  ),
},
```

**Update `src/components/AppLayout.tsx`**:

```typescript
import { ProjectOutlined } from '@ant-design/icons'

{
  key: '/kanban',
  label: 'Kanban',
  icon: <ProjectOutlined />,
  onClick: () => navigate('/kanban'),
},
```

---

## Step 3.8: Test Kanban Board

### Test Column Display

1. Navigate to `/kanban`
2. **Expected**: 4 columns displayed (Ready, In Progress, Blocked, Completed)
3. Tasks appear in columns based on status

### Test Drag and Drop

1. Drag task from "Ready" to "In Progress"
2. **Expected**:
   - Task moves to new column
   - Task status updates
   - Success message shown

3. Drag task to "Completed"
4. **Expected**: `completed_at` timestamp set

5. Drag completed task back to "Ready"
6. **Expected**: `completed_at` cleared

### Test WIP Limits

1. Set WIP limit for "In Progress" to 3
2. Add 3 tasks to "In Progress"
3. **Expected**: Warning appears when limit reached

### Test Stats

1. **Expected**: Stats show accurate count per column
2. Progress bars show distribution
3. Total count matches active tasks

### Test Horizontal Scroll

1. Add many columns or resize window to narrow width
2. **Expected**: Board scrolls horizontally

### Test Task Cards

1. **Expected**: Cards show:
   - Priority indicators
   - Title and description
   - Tags
   - Due date
   - Estimated time
   - Overdue warning

---

## Verification Checklist

Before proceeding to Step 4, verify:

- [ ] Kanban board displays all columns
- [ ] Tasks appear in correct columns
- [ ] Drag and drop works between columns
- [ ] Task status updates when moved
- [ ] Completed_at timestamp set/cleared correctly
- [ ] WIP limit warnings work
- [ ] Stats display accurate counts
- [ ] Task cards show all metadata
- [ ] Horizontal scroll works
- [ ] Task detail modal opens
- [ ] Real-time updates work
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 4: Advanced Filter System](./step-4-advanced-filters.md)**

This will enhance the existing filters with saved filter presets and advanced combinations.

---

## Summary

You've successfully:
- ✅ Created Kanban board with status columns
- ✅ Implemented drag-and-drop workflow
- ✅ Built Kanban task cards with rich metadata
- ✅ Added WIP limits per column
- ✅ Created Kanban statistics
- ✅ Implemented horizontal scrolling board
- ✅ Added column styling and indicators
- ✅ Built complete Kanban page

**The Kanban board provides a visual workflow management system!**
