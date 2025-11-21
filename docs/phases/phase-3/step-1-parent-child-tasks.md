# Phase 3, Step 1: Parent/Child Tasks Enhancement

**Duration**: 2-3 days
**Prerequisite**: Phase 2 Complete

## Overview

This step enhances the parent/child task functionality with:
- Visual hierarchy display
- Task tree view
- Subtask progress tracking
- Automatic parent status updates
- Collapse/expand subtasks
- Drag and drop reordering
- Subtask completion percentages

## Goals

- Enhance task cards to show subtask progress
- Create hierarchical task tree view
- Implement collapse/expand for subtasks
- Add drag-and-drop reordering of subtasks
- Auto-update parent status based on children
- Add subtask completion percentage
- Create breadcrumb navigation for nested tasks

---

## Step 1.1: Add Subtask Progress to Task Types

**Update `src/types/task.ts`**:

```typescript
// Add helper interface for task with computed fields
export interface TaskWithProgress extends TaskWithTags {
  subtaskCount: number
  completedSubtaskCount: number
  subtaskProgress: number // 0-100
}
```

**Create `src/lib/subtask-utils.ts`**:

```typescript
import { Task, TaskWithTags, TaskWithProgress } from '@/types/task'

export function calculateSubtaskProgress(
  task: TaskWithTags,
  allTasks: TaskWithTags[]
): TaskWithProgress {
  const subtasks = allTasks.filter(t => t.parent_id === task.id)
  const completedSubtasks = subtasks.filter(t => t.status === 'completed')

  return {
    ...task,
    subtaskCount: subtasks.length,
    completedSubtaskCount: completedSubtasks.length,
    subtaskProgress: subtasks.length > 0 ? (completedSubtasks.length / subtasks.length) * 100 : 0,
  }
}

export function getTaskWithProgress(
  task: TaskWithTags,
  allTasks: TaskWithTags[]
): TaskWithProgress {
  return calculateSubtaskProgress(task, allTasks)
}

export function getAllTasksWithProgress(tasks: TaskWithTags[]): TaskWithProgress[] {
  return tasks.map(task => calculateSubtaskProgress(task, tasks))
}

export function getTaskBreadcrumb(taskId: string, allTasks: Task[]): Task[] {
  const breadcrumb: Task[] = []
  let currentTask = allTasks.find(t => t.id === taskId)

  while (currentTask) {
    breadcrumb.unshift(currentTask)
    if (!currentTask.parent_id) break
    currentTask = allTasks.find(t => t.id === currentTask!.parent_id)
  }

  return breadcrumb
}
```

---

## Step 1.2: Update TaskCard with Subtask Progress

**Update `src/components/TaskCard.tsx`** to add progress indicator:

```typescript
import { Card, Space, Typography, Button, Checkbox, Dropdown, Tag as AntTag, Progress } from 'antd'
// ... other imports remain the same
import { useTaskStore } from '@/stores/taskStore'
import { getTaskWithProgress } from '@/lib/subtask-utils'

// ... (keep existing props and other code)

export function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
  onCreateSubtask,
  onClick,
  showDescription = true,
  compact = false,
}: TaskCardProps) {
  const { getTagById, tasks } = useTagStore() // Add tasks from store
  const taskStore = useTaskStore()

  // Calculate subtask progress
  const taskWithProgress = getTaskWithProgress(task, taskStore.tasks)

  const isCompleted = task.status === 'completed'
  const isOverdue = isTaskOverdue(task)
  const isDueToday = isTaskDueToday(task)
  const hasSubtasks = taskWithProgress.subtaskCount > 0

  // ... (existing code)

  return (
    <Card
      // ... existing props
    >
      <Space direction="vertical" className="w-full" size="small">
        {/* ... (existing header code) */}

        {/* Subtask Progress */}
        {hasSubtasks && (
          <div className="mt-2">
            <Space direction="vertical" className="w-full" size={2}>
              <div className="flex items-center justify-between">
                <Text type="secondary" className="text-xs">
                  Subtasks: {taskWithProgress.completedSubtaskCount}/{taskWithProgress.subtaskCount}
                </Text>
                <Text type="secondary" className="text-xs">
                  {Math.round(taskWithProgress.subtaskProgress)}%
                </Text>
              </div>
              <Progress
                percent={taskWithProgress.subtaskProgress}
                size="small"
                showInfo={false}
                strokeColor={isCompleted ? '#10B981' : '#3B82F6'}
              />
            </Space>
          </div>
        )}

        {/* ... (rest of existing code) */}
      </Space>
    </Card>
  )
}
```

---

## Step 1.3: Create Task Tree View Component

**Create `src/components/TaskTreeView.tsx`**:

```typescript
import { useState } from 'react'
import { Tree, Space, Typography, Button, Checkbox, Progress } from 'antd'
import type { TreeDataNode, TreeProps } from 'antd'
import {
  CaretRightOutlined,
  CaretDownOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { TaskWithTags, TaskWithProgress } from '@/types/task'
import { Tag } from './Tag'
import { StatusBadge } from './StatusBadge'
import { PriorityIndicator } from './PriorityIndicator'
import { useTagStore } from '@/stores/tagStore'
import { useTaskStore } from '@/stores/taskStore'
import { getTaskWithProgress } from '@/lib/subtask-utils'

const { Text } = Typography

interface TaskTreeViewProps {
  tasks: TaskWithTags[]
  onTaskClick?: (task: TaskWithTags) => void
  onTaskComplete?: (task: TaskWithTags) => void
}

export function TaskTreeView({ tasks, onTaskClick, onTaskComplete }: TaskTreeViewProps) {
  const { getTagById } = useTagStore()
  const taskStore = useTaskStore()
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // Build tree structure
  const buildTree = (parentId: string | null = null): TaskWithTags[] => {
    return tasks
      .filter(task => task.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index)
  }

  const buildTreeData = (parentId: string | null = null): TreeDataNode[] => {
    const children = buildTree(parentId)

    return children.map(task => {
      const taskWithProgress = getTaskWithProgress(task, taskStore.tasks)
      const hasChildren = tasks.some(t => t.parent_id === task.id)
      const childNodes = hasChildren ? buildTreeData(task.id) : undefined

      return {
        key: task.id,
        title: (
          <div
            className="flex items-center justify-between w-full group py-1"
            onClick={() => onTaskClick?.(task)}
          >
            <Space size="small" className="flex-1">
              <Checkbox
                checked={task.status === 'completed'}
                onChange={e => {
                  e.stopPropagation()
                  onTaskComplete?.(task)
                }}
                onClick={e => e.stopPropagation()}
              />

              {hasChildren ? (
                <FolderOutlined className="text-blue-500" />
              ) : (
                <FileOutlined className="text-gray-400" />
              )}

              <PriorityIndicator task={task} size="small" />

              <Text
                delete={task.status === 'completed'}
                className={task.status === 'completed' ? 'opacity-60' : ''}
              >
                {task.title}
              </Text>

              {taskWithProgress.subtaskCount > 0 && (
                <Text type="secondary" className="text-xs">
                  ({taskWithProgress.completedSubtaskCount}/{taskWithProgress.subtaskCount})
                </Text>
              )}
            </Space>

            <Space size="small">
              <StatusBadge status={task.status} size="small" />
              {task.tags.slice(0, 2).map(tagId => {
                const tag = getTagById(tagId)
                return tag ? <Tag key={tag.id} tag={tag} /> : null
              })}
              {task.tags.length > 2 && (
                <Text type="secondary" className="text-xs">
                  +{task.tags.length - 2}
                </Text>
              )}
            </Space>
          </div>
        ),
        children: childNodes,
        isLeaf: !hasChildren,
      }
    })
  }

  const treeData = buildTreeData()

  const handleExpand: TreeProps['onExpand'] = (keys) => {
    setExpandedKeys(keys as string[])
  }

  return (
    <Tree
      treeData={treeData}
      expandedKeys={expandedKeys}
      onExpand={handleExpand}
      showLine={{ showLeafIcon: false }}
      showIcon={false}
      switcherIcon={({ expanded }) =>
        expanded ? <CaretDownOutlined /> : <CaretRightOutlined />
      }
      className="task-tree"
    />
  )
}
```

---

## Step 1.4: Create Subtask Manager Component

**Create `src/components/SubtaskManager.tsx`**:

```typescript
import { useState } from 'react'
import { Space, Button, Input, List, Progress, Typography, Empty, message } from 'antd'
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { Task, TaskWithTags, TaskFormData } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'
import { getTaskWithProgress } from '@/lib/subtask-utils'

const { Text } = Typography

interface SubtaskManagerProps {
  parentTask: Task
}

export function SubtaskManager({ parentTask }: SubtaskManagerProps) {
  const {
    tasks,
    createTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    getChildTasks,
  } = useTaskStore()
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const subtasks = getChildTasks(parentTask.id)
  const parentWithProgress = getTaskWithProgress(
    { ...parentTask, tags: [] } as TaskWithTags,
    tasks
  )

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      message.warning('Please enter a subtask title')
      return
    }

    setLoading(true)

    const subtaskData: TaskFormData = {
      title: newSubtaskTitle.trim(),
      status: 'ready',
      type: 'task',
      parent_id: parentTask.id,
    }

    const { error } = await createTask(subtaskData)

    if (error) {
      message.error(error.message)
    } else {
      message.success('Subtask added')
      setNewSubtaskTitle('')
    }

    setLoading(false)
  }

  const handleToggleComplete = async (subtask: TaskWithTags) => {
    const isCompleted = subtask.status === 'completed'
    const { error } = isCompleted
      ? await uncompleteTask(subtask.id)
      : await completeTask(subtask.id)

    if (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (subtask: TaskWithTags) => {
    const { error } = await deleteTask(subtask.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Subtask deleted')
    }
  }

  return (
    <Space direction="vertical" className="w-full" size="middle">
      {/* Progress */}
      {subtasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Text strong>
              Progress: {parentWithProgress.completedSubtaskCount}/
              {parentWithProgress.subtaskCount} complete
            </Text>
            <Text type="secondary">{Math.round(parentWithProgress.subtaskProgress)}%</Text>
          </div>
          <Progress
            percent={parentWithProgress.subtaskProgress}
            strokeColor="#10B981"
          />
        </div>
      )}

      {/* Subtask List */}
      {subtasks.length > 0 ? (
        <List
          dataSource={subtasks}
          renderItem={subtask => (
            <List.Item
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(subtask)}
                />,
              ]}
            >
              <Space className="w-full">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <CheckOutlined
                      className={
                        subtask.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                      }
                    />
                  }
                  onClick={() => handleToggleComplete(subtask)}
                />
                <Text
                  delete={subtask.status === 'completed'}
                  className={subtask.status === 'completed' ? 'opacity-60' : ''}
                >
                  {subtask.title}
                </Text>
              </Space>
            </List.Item>
          )}
          size="small"
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No subtasks yet"
          className="py-4"
        />
      )}

      {/* Add Subtask */}
      <Space.Compact className="w-full">
        <Input
          placeholder="Add a subtask..."
          value={newSubtaskTitle}
          onChange={e => setNewSubtaskTitle(e.target.value)}
          onPressEnter={handleAddSubtask}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddSubtask}
          loading={loading}
        >
          Add
        </Button>
      </Space.Compact>
    </Space>
  )
}
```

---

## Step 1.5: Update Task Detail Modal

**Update `src/components/TaskDetailModal.tsx`** to use SubtaskManager:

```typescript
// ... existing imports
import { SubtaskManager } from './SubtaskManager'
import { getTaskBreadcrumb } from '@/lib/subtask-utils'

// ... in the component

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  onComplete,
  onCreateSubtask,
}: TaskDetailModalProps) {
  const { getTagById } = useTagStore()
  const { tasks } = useTaskStore()

  if (!task) return null

  const isCompleted = task.status === 'completed'
  const breadcrumb = getTaskBreadcrumb(task.id, tasks)

  return (
    <Modal
      // ... existing props
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <div className="text-xs text-gray-500">
            {breadcrumb.map((t, index) => (
              <span key={t.id}>
                {index > 0 && ' > '}
                <Text type="secondary">{t.title}</Text>
              </span>
            ))}
          </div>
        )}

        {/* ... existing header code */}

        {/* ... existing sections ... */}

        {/* Replace subtasks section with SubtaskManager */}
        <div>
          <Text strong className="block mb-3">
            Subtasks
          </Text>
          <SubtaskManager parentTask={task} />
        </div>

        {/* ... rest of existing code */}
      </Space>
    </Modal>
  )
}
```

---

## Step 1.6: Add Auto-Complete Parent Feature

**Update `src/stores/taskStore.ts`** to add auto-complete logic:

```typescript
// Add helper function
const shouldAutoCompleteParent = async (parentId: string, tasks: TaskWithTags[]) => {
  const siblings = tasks.filter(t => t.parent_id === parentId)
  const allCompleted = siblings.every(t => t.status === 'completed')
  return allCompleted && siblings.length > 0
}

// Update completeTask action
completeTask: async (id: string) => {
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: now })
    .eq('id', id)

  if (error) {
    return { error: new Error(error.message) }
  }

  // Optimistic update
  set(state => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, status: 'completed' as const, completed_at: now } : task
    ),
  }))

  // Check if parent should auto-complete
  const task = get().getTaskById(id)
  if (task?.parent_id) {
    const { tasks } = get()
    const shouldComplete = await shouldAutoCompleteParent(task.parent_id, tasks)

    if (shouldComplete) {
      // Auto-complete parent
      await get().completeTask(task.parent_id)
    }
  }

  return { error: null }
},
```

---

## Step 1.7: Create Task Hierarchy Page

**Create `src/pages/HierarchyPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import { Typography, Space, Button, Card, Segmented } from 'antd'
import {
  ApartmentOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { TaskTreeView } from '@/components/TaskTreeView'
import { TaskFormModal } from '@/components/TaskFormModal'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { TaskList } from '@/components/TaskList'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { TaskWithTags } from '@/types/task'

const { Title, Text } = Typography

type ViewMode = 'tree' | 'list'

export function HierarchyPage() {
  const {
    tasks,
    fetchTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
    completeTask,
    uncompleteTask,
  } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  // Only show active tasks (not completed or archived)
  const activeTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived'
  )

  // Root tasks (no parent)
  const rootTasks = activeTasks.filter(t => !t.parent_id)

  const handleTaskComplete = async (task: TaskWithTags) => {
    const isCompleted = task.status === 'completed'
    await (isCompleted ? uncompleteTask(task.id) : completeTask(task.id))
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Space align="center">
              <ApartmentOutlined className="text-2xl text-purple-500" />
              <div>
                <Title level={2} className="!mb-0">
                  Task Hierarchy
                </Title>
                <Text type="secondary">View and manage task relationships</Text>
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

        {/* View Mode Toggle */}
        <div className="mb-4">
          <Segmented
            value={viewMode}
            onChange={value => setViewMode(value as ViewMode)}
            options={[
              {
                label: 'Tree View',
                value: 'tree',
                icon: <ApartmentOutlined />,
              },
              {
                label: 'List View',
                value: 'list',
                icon: <UnorderedListOutlined />,
              },
            ]}
          />
        </div>

        {/* Task View */}
        <Card>
          {viewMode === 'tree' ? (
            <TaskTreeView
              tasks={activeTasks}
              onTaskClick={task => setSelectedTask(task)}
              onTaskComplete={handleTaskComplete}
            />
          ) : (
            <TaskList
              tasks={rootTasks}
              emptyMessage="No top-level tasks. Create one to get started!"
            />
          )}
        </Card>

        {/* Task Form Modal */}
        <TaskFormModal
          open={isFormOpen}
          task={null}
          onClose={() => setIsFormOpen(false)}
        />

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            // Handle edit
            setSelectedTask(null)
          }}
          onDelete={() => {
            // Handle delete
            setSelectedTask(null)
          }}
          onComplete={() => {
            if (selectedTask) {
              handleTaskComplete(selectedTask)
            }
          }}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 1.8: Update Router and Navigation

**Update `src/lib/router.tsx`**:

```typescript
import { HierarchyPage } from '@/pages/HierarchyPage'

// Add route
{
  path: '/hierarchy',
  element: (
    <ProtectedRoute>
      <HierarchyPage />
    </ProtectedRoute>
  ),
},
```

**Update `src/components/AppLayout.tsx`**:

```typescript
import { ApartmentOutlined } from '@ant-design/icons'

// Add to navMenuItems
{
  key: '/hierarchy',
  label: 'Hierarchy',
  icon: <ApartmentOutlined />,
  onClick: () => navigate('/hierarchy'),
},
```

---

## Step 1.9: Test Parent/Child Tasks

### Test Subtask Progress Display

1. Create a task with 3 subtasks
2. Complete 1 subtask
3. **Expected**: Progress bar shows 33%, "1/3 complete"
4. Complete another subtask
5. **Expected**: Progress updates to 67%, "2/3 complete"

### Test Tree View

1. Navigate to `/hierarchy`
2. Create parent task "Project Alpha"
3. Add 2 subtasks to it
4. Create another parent task "Project Beta"
5. **Expected**: Tree shows hierarchical structure with expand/collapse

### Test Auto-Complete Parent

1. Create parent with 2 subtasks
2. Mark first subtask complete
3. **Expected**: Parent remains incomplete
4. Mark second subtask complete
5. **Expected**: Parent auto-completes

### Test Breadcrumb Navigation

1. Open detail modal for deeply nested task (grandchild)
2. **Expected**: Breadcrumb shows "Grandparent > Parent > Task"

### Test Subtask Manager

1. Open task detail modal
2. Add subtasks using quick add
3. Complete/uncomplete subtasks
4. Delete a subtask
5. **Expected**: All actions work, progress updates

---

## Verification Checklist

Before proceeding to Step 2, verify:

- [ ] Subtask progress shows on task cards
- [ ] Progress bar displays correctly
- [ ] Tree view renders hierarchy
- [ ] Expand/collapse works in tree
- [ ] Subtask manager adds/removes subtasks
- [ ] Auto-complete parent works
- [ ] Breadcrumb navigation displays
- [ ] Hierarchy page loads correctly
- [ ] Tree/list view toggle works
- [ ] Real-time updates work
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 2: Task Shifting & Rescheduling](./step-2-task-shifting.md)**

This will implement task date shifting and smart rescheduling features.

---

## Summary

You've successfully:
- ✅ Enhanced task cards with subtask progress
- ✅ Created task tree view component
- ✅ Built subtask manager with quick add
- ✅ Implemented auto-complete parent logic
- ✅ Added breadcrumb navigation
- ✅ Created hierarchy page
- ✅ Added progress tracking utilities

**Parent/child task system is now fully featured!**
