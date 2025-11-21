# Phase 2, Step 2: Task Data Layer

**Duration**: 3-4 days
**Prerequisite**: Step 1 (Tag System) completed

## Overview

This step implements the core task data layer including:
- Task TypeScript types
- TaskStore with Zustand
- Complete CRUD operations
- Task filtering and sorting
- Parent/child task relationships
- Real-time task updates
- Optimistic UI updates

## Goals

- Create comprehensive Task types
- Implement TaskStore with full state management
- Build task CRUD operations with Supabase
- Support task filtering (by status, type, tags, etc.)
- Implement task sorting options
- Handle parent/child task relationships
- Enable real-time synchronization
- Add optimistic updates for better UX

---

## Step 2.1: Create Task Types

**Create `src/types/task.ts`**:

```typescript
export type TaskStatus = 'ready' | 'in_progress' | 'blocked' | 'completed' | 'archived'

export type TaskType = 'task' | 'habit' | 'recurring' | 'someday'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  type: TaskType

  // Scheduling
  due_date: string | null
  scheduled_date: string | null
  completed_at: string | null

  // Priority (Eisenhower Matrix)
  is_urgent: boolean
  is_important: boolean

  // Organization
  parent_id: string | null
  order_index: number

  // Additional fields
  estimated_minutes: number | null
  actual_minutes: number | null
  notes: string | null

  // Someday task fields
  last_nudge_date: string | null
  nudge_count: number

  // Metadata
  created_at: string
  updated_at: string
}

export interface TaskWithTags extends Task {
  tags: string[] // Array of tag IDs
}

export interface TaskWithRelations extends TaskWithTags {
  children?: TaskWithRelations[]
  parent?: Task | null
}

export interface TaskFormData {
  title: string
  description?: string | null
  status?: TaskStatus
  type?: TaskType
  due_date?: string | null
  scheduled_date?: string | null
  is_urgent?: boolean
  is_important?: boolean
  parent_id?: string | null
  estimated_minutes?: number | null
  notes?: string | null
  tags?: string[]
}

export interface TaskFilters {
  status?: TaskStatus[]
  type?: TaskType[]
  tags?: string[]
  is_urgent?: boolean
  is_important?: boolean
  has_due_date?: boolean
  is_overdue?: boolean
  scheduled_for_today?: boolean
  parent_id?: string | null
  search?: string
}

export type TaskSortBy =
  | 'created_at'
  | 'updated_at'
  | 'due_date'
  | 'scheduled_date'
  | 'title'
  | 'order_index'

export type TaskSortOrder = 'asc' | 'desc'
```

**Update `src/types/database.ts`**:

```typescript
import { Tag } from './tag'
import { Task } from './task'

export interface Database {
  public: {
    Tables: {
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: never
      }
    }
  }
}
```

---

## Step 2.2: Create Task Utilities

**Create `src/lib/task-utils.ts`**:

```typescript
import { Task, TaskStatus, TaskType } from '@/types/task'
import { isToday, isPast, parseISO } from 'date-fns'

export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'completed' || task.status === 'archived') {
    return false
  }
  return isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))
}

export function isTaskScheduledToday(task: Task): boolean {
  if (!task.scheduled_date) return false
  return isToday(parseISO(task.scheduled_date))
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.due_date) return false
  return isToday(parseISO(task.due_date))
}

export function getTaskPriorityQuadrant(task: Task): 1 | 2 | 3 | 4 | null {
  const { is_urgent, is_important } = task

  if (is_urgent && is_important) return 1 // Do First
  if (!is_urgent && is_important) return 2 // Schedule
  if (is_urgent && !is_important) return 3 // Delegate
  if (!is_urgent && !is_important) return 4 // Eliminate

  return null
}

export const taskStatusConfig: Record<
  TaskStatus,
  { label: string; color: string; description: string }
> = {
  ready: {
    label: 'Ready',
    color: '#6B7280',
    description: 'Ready to work on',
  },
  in_progress: {
    label: 'In Progress',
    color: '#3B82F6',
    description: 'Currently working on',
  },
  blocked: {
    label: 'Blocked',
    color: '#F59E0B',
    description: 'Waiting on something',
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    description: 'Finished',
  },
  archived: {
    label: 'Archived',
    color: '#9CA3AF',
    description: 'Archived for reference',
  },
}

export const taskTypeConfig: Record<TaskType, { label: string; icon: string; description: string }> =
  {
    task: {
      label: 'Task',
      icon: '✓',
      description: 'One-time task',
    },
    habit: {
      label: 'Habit',
      icon: '🔄',
      description: 'Daily habit to track',
    },
    recurring: {
      label: 'Recurring',
      icon: '🔁',
      description: 'Repeating task',
    },
    someday: {
      label: 'Someday',
      icon: '💭',
      description: 'Future possibility',
    },
  }
```

---

## Step 2.3: Create TaskStore

**Create `src/stores/taskStore.ts`**:

```typescript
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import {
  Task,
  TaskWithTags,
  TaskFormData,
  TaskFilters,
  TaskSortBy,
  TaskSortOrder,
} from '@/types/task'
import { useAuthStore } from './authStore'
import { isTaskOverdue, isTaskScheduledToday } from '@/lib/task-utils'
import { parseISO } from 'date-fns'

interface TaskState {
  tasks: TaskWithTags[]
  loading: boolean
  error: string | null
  filters: TaskFilters
  sortBy: TaskSortBy
  sortOrder: TaskSortOrder

  // Actions
  fetchTasks: () => Promise<void>
  createTask: (data: TaskFormData) => Promise<{ data: Task | null; error: Error | null }>
  updateTask: (
    id: string,
    data: Partial<TaskFormData>
  ) => Promise<{ error: Error | null }>
  deleteTask: (id: string) => Promise<{ error: Error | null }>
  completeTask: (id: string) => Promise<{ error: Error | null }>
  uncompleteTask: (id: string) => Promise<{ error: Error | null }>
  archiveTask: (id: string) => Promise<{ error: Error | null }>

  // Tag management
  addTagToTask: (taskId: string, tagId: string) => Promise<{ error: Error | null }>
  removeTagFromTask: (taskId: string, tagId: string) => Promise<{ error: Error | null }>
  setTaskTags: (taskId: string, tagIds: string[]) => Promise<{ error: Error | null }>

  // Filtering & sorting
  setFilters: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
  setSortBy: (sortBy: TaskSortBy, sortOrder?: TaskSortOrder) => void

  // Getters
  getTaskById: (id: string) => TaskWithTags | undefined
  getFilteredTasks: () => TaskWithTags[]
  getChildTasks: (parentId: string) => TaskWithTags[]
  getTodayTasks: () => TaskWithTags[]
  getOverdueTasks: () => TaskWithTasks[]

  // Real-time
  subscribeToTasks: () => void
  unsubscribeFromTasks: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: {},
  sortBy: 'created_at',
  sortOrder: 'desc',

  fetchTasks: async () => {
    set({ loading: true, error: null })

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (tasksError) {
      set({ error: tasksError.message, loading: false })
      return
    }

    // Fetch task_tags relationships
    const { data: taskTags, error: taskTagsError } = await supabase
      .from('task_tags')
      .select('task_id, tag_id')

    if (taskTagsError) {
      set({ error: taskTagsError.message, loading: false })
      return
    }

    // Combine tasks with their tags
    const tasksWithTags: TaskWithTags[] = (tasks || []).map(task => ({
      ...task,
      tags: (taskTags || [])
        .filter(tt => tt.task_id === task.id)
        .map(tt => tt.tag_id),
    }))

    set({ tasks: tasksWithTags, loading: false })
  },

  createTask: async (data: TaskFormData) => {
    const user = useAuthStore.getState().user
    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { tags = [], ...taskData } = data

    // Create task
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'ready',
        type: taskData.type || 'task',
        due_date: taskData.due_date || null,
        scheduled_date: taskData.scheduled_date || null,
        is_urgent: taskData.is_urgent || false,
        is_important: taskData.is_important || false,
        parent_id: taskData.parent_id || null,
        estimated_minutes: taskData.estimated_minutes || null,
        notes: taskData.notes || null,
        completed_at: null,
        last_nudge_date: null,
        nudge_count: 0,
        order_index: 0,
        actual_minutes: null,
      })
      .select()
      .single()

    if (taskError) {
      return { data: null, error: new Error(taskError.message) }
    }

    // Add tags if provided
    if (tags.length > 0) {
      const { error: tagsError } = await supabase.from('task_tags').insert(
        tags.map(tagId => ({
          task_id: newTask.id,
          tag_id: tagId,
        }))
      )

      if (tagsError) {
        console.error('Error adding tags:', tagsError)
      }
    }

    // Optimistic update
    set(state => ({
      tasks: [{ ...newTask, tags }, ...state.tasks],
    }))

    return { data: newTask, error: null }
  },

  updateTask: async (id: string, data: Partial<TaskFormData>) => {
    const { tags, ...taskData } = data

    // Update task
    const { error: taskError } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', id)

    if (taskError) {
      return { error: new Error(taskError.message) }
    }

    // Update tags if provided
    if (tags !== undefined) {
      await get().setTaskTags(id, tags)
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id
          ? { ...task, ...taskData, tags: tags !== undefined ? tags : task.tags }
          : task
      ),
    }))

    return { error: null }
  },

  deleteTask: async (id: string) => {
    // Check for child tasks
    const children = get().getChildTasks(id)
    if (children.length > 0) {
      return {
        error: new Error('Cannot delete task with subtasks. Delete or reassign subtasks first.'),
      }
    }

    // Delete task_tags first (foreign key)
    await supabase.from('task_tags').delete().eq('task_id', id)

    // Delete task
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
    }))

    return { error: null }
  },

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

    return { error: null }
  },

  uncompleteTask: async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'ready', completed_at: null })
      .eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, status: 'ready' as const, completed_at: null } : task
      ),
    }))

    return { error: null }
  },

  archiveTask: async (id: string) => {
    const { error } = await supabase.from('tasks').update({ status: 'archived' }).eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, status: 'archived' as const } : task
      ),
    }))

    return { error: null }
  },

  addTagToTask: async (taskId: string, tagId: string) => {
    const { error } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, tags: [...task.tags, tagId] } : task
      ),
    }))

    return { error: null }
  },

  removeTagFromTask: async (taskId: string, tagId: string) => {
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, tags: task.tags.filter(t => t !== tagId) } : task
      ),
    }))

    return { error: null }
  },

  setTaskTags: async (taskId: string, tagIds: string[]) => {
    // Remove all existing tags
    await supabase.from('task_tags').delete().eq('task_id', taskId)

    // Add new tags
    if (tagIds.length > 0) {
      const { error } = await supabase
        .from('task_tags')
        .insert(tagIds.map(tagId => ({ task_id: taskId, tag_id: tagId })))

      if (error) {
        return { error: new Error(error.message) }
      }
    }

    // Optimistic update
    set(state => ({
      tasks: state.tasks.map(task => (task.id === taskId ? { ...task, tags: tagIds } : task)),
    }))

    return { error: null }
  },

  setFilters: (filters: Partial<TaskFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
    }))
  },

  clearFilters: () => {
    set({ filters: {} })
  },

  setSortBy: (sortBy: TaskSortBy, sortOrder: TaskSortOrder = 'asc') => {
    set({ sortBy, sortOrder })
  },

  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id)
  },

  getFilteredTasks: () => {
    const { tasks, filters, sortBy, sortOrder } = get()

    let filtered = tasks.filter(task => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(task.status)) return false
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(task.type)) return false
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tagId => task.tags.includes(tagId))) return false
      }

      // Priority filters
      if (filters.is_urgent !== undefined && task.is_urgent !== filters.is_urgent) return false
      if (filters.is_important !== undefined && task.is_important !== filters.is_important)
        return false

      // Due date filters
      if (filters.has_due_date !== undefined) {
        const hasDueDate = task.due_date !== null
        if (hasDueDate !== filters.has_due_date) return false
      }

      if (filters.is_overdue && !isTaskOverdue(task)) return false
      if (filters.scheduled_for_today && !isTaskScheduledToday(task)) return false

      // Parent filter
      if (filters.parent_id !== undefined) {
        if (task.parent_id !== filters.parent_id) return false
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const titleMatch = task.title.toLowerCase().includes(searchLower)
        const descMatch = task.description?.toLowerCase().includes(searchLower)
        const notesMatch = task.notes?.toLowerCase().includes(searchLower)
        if (!titleMatch && !descMatch && !notesMatch) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'due_date':
          aVal = a.due_date ? parseISO(a.due_date).getTime() : Infinity
          bVal = b.due_date ? parseISO(b.due_date).getTime() : Infinity
          break
        case 'scheduled_date':
          aVal = a.scheduled_date ? parseISO(a.scheduled_date).getTime() : Infinity
          bVal = b.scheduled_date ? parseISO(b.scheduled_date).getTime() : Infinity
          break
        case 'created_at':
          aVal = parseISO(a.created_at).getTime()
          bVal = parseISO(b.created_at).getTime()
          break
        case 'updated_at':
          aVal = parseISO(a.updated_at).getTime()
          bVal = parseISO(b.updated_at).getTime()
          break
        case 'order_index':
          aVal = a.order_index
          bVal = b.order_index
          break
        default:
          aVal = a.created_at
          bVal = b.created_at
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  },

  getChildTasks: (parentId: string): TaskWithTags[] => {
    return get().tasks.filter(task => task.parent_id === parentId)
  },

  getTodayTasks: (): TaskWithTags[] => {
    return get().tasks.filter(
      task =>
        task.status !== 'completed' &&
        task.status !== 'archived' &&
        isTaskScheduledToday(task)
    )
  },

  getOverdueTasks: (): TaskWithTags[] => {
    return get().tasks.filter(task => isTaskOverdue(task))
  },

  subscribeToTasks: () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        async payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch tags for this task
            const { data: taskTags } = await supabase
              .from('task_tags')
              .select('tag_id')
              .eq('task_id', payload.new.id)

            const tags = (taskTags || []).map(tt => tt.tag_id)

            if (payload.eventType === 'INSERT') {
              set(state => ({
                tasks: [{ ...payload.new, tags } as TaskWithTags, ...state.tasks],
              }))
            } else {
              set(state => ({
                tasks: state.tasks.map(task =>
                  task.id === payload.new.id ? ({ ...payload.new, tags } as TaskWithTags) : task
                ),
              }))
            }
          } else if (payload.eventType === 'DELETE') {
            set(state => ({
              tasks: state.tasks.filter(task => task.id !== payload.old.id),
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_tags',
        },
        payload => {
          // Handle task_tags changes
          if (payload.eventType === 'INSERT') {
            const { task_id, tag_id } = payload.new
            set(state => ({
              tasks: state.tasks.map(task =>
                task.id === task_id && !task.tags.includes(tag_id)
                  ? { ...task, tags: [...task.tags, tag_id] }
                  : task
              ),
            }))
          } else if (payload.eventType === 'DELETE') {
            const { task_id, tag_id } = payload.old
            set(state => ({
              tasks: state.tasks.map(task =>
                task.id === task_id
                  ? { ...task, tags: task.tags.filter(t => t !== tag_id) }
                  : task
              ),
            }))
          }
        }
      )
      .subscribe()

    ;(get() as any).channel = channel
  },

  unsubscribeFromTasks: () => {
    const channel = (get() as any).channel
    if (channel) {
      supabase.removeChannel(channel)
    }
  },
}))
```

---

## Step 2.4: Test Task Store

**Create `src/pages/TestTasksPage.tsx`** (temporary test page):

```typescript
import { useEffect, useState } from 'react'
import { Button, Space, Card, List, Typography, message, Spin } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { useTaskStore } from '@/stores/taskStore'
import { TaskFormData } from '@/types/task'

const { Title, Text } = Typography

export function TestTasksPage() {
  const {
    tasks,
    loading,
    fetchTasks,
    createTask,
    deleteTask,
    completeTask,
    subscribeToTasks,
    unsubscribeFromTasks,
  } = useTaskStore()

  useEffect(() => {
    fetchTasks()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, subscribeToTasks, unsubscribeFromTasks])

  const handleCreateTest = async () => {
    const testTask: TaskFormData = {
      title: `Test Task ${Date.now()}`,
      description: 'This is a test task',
      status: 'ready',
      type: 'task',
    }

    const { error } = await createTask(testTask)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task created!')
    }
  }

  const handleComplete = async (id: string) => {
    const { error } = await completeTask(id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task completed!')
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteTask(id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task deleted!')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Task Store Test
            </Title>
            <Text type="secondary">Testing TaskStore CRUD operations</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTest}>
            Create Test Task
          </Button>
        </div>

        <Card>
          {loading && tasks.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <List
              dataSource={tasks}
              renderItem={task => (
                <List.Item
                  actions={[
                    <Button key="complete" size="small" onClick={() => handleComplete(task.id)}>
                      Complete
                    </Button>,
                    <Button
                      key="delete"
                      size="small"
                      danger
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={task.title}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{task.description}</Text>
                        <Space size="small">
                          <Text type="secondary">Status: {task.status}</Text>
                          <Text type="secondary">Type: {task.type}</Text>
                          <Text type="secondary">Tags: {task.tags.length}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
```

**Update `src/lib/router.tsx`** to add test route:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TagsPage } from '@/pages/TagsPage'
import { TestTasksPage } from '@/pages/TestTasksPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
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
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tags',
    element: (
      <ProtectedRoute>
        <TagsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/test-tasks',
    element: (
      <ProtectedRoute>
        <TestTasksPage />
      </ProtectedRoute>
    ),
  },
])
```

---

## Step 2.5: Test TaskStore Operations

### Test Task Creation

1. Navigate to `/test-tasks` in browser
2. Click "Create Test Task"
3. **Expected**: New task appears in list
4. Create multiple tasks
5. **Expected**: All tasks appear

### Test Task Completion

1. Click "Complete" on a task
2. **Expected**: Task status changes to "completed"
3. Task completed_at timestamp is set

### Test Task Deletion

1. Click "Delete" on a task
2. **Expected**: Task is removed from list
3. Refresh page → Task stays deleted

### Test Real-time Updates

1. Open app in two browser tabs
2. Create task in tab 1
3. **Expected**: Task appears in tab 2 immediately
4. Complete task in tab 2
5. **Expected**: Status updates in tab 1

### Test Filtering

Open browser console and test:

```javascript
// Get store
const store = useTaskStore.getState()

// Set filter for completed tasks
store.setFilters({ status: ['completed'] })
const completed = store.getFilteredTasks()
console.log('Completed tasks:', completed)

// Clear filters
store.clearFilters()

// Filter by overdue
store.setFilters({ is_overdue: true })
const overdue = store.getFilteredTasks()
console.log('Overdue tasks:', overdue)
```

---

## Verification Checklist

Before proceeding to Step 3, verify:

- [ ] Task types are defined correctly
- [ ] TaskStore is created and initialized
- [ ] Tasks can be created
- [ ] Tasks can be updated
- [ ] Tasks can be deleted (with child check)
- [ ] Tasks can be completed/uncompleted
- [ ] Tasks can be archived
- [ ] Tags can be added to tasks
- [ ] Tags can be removed from tasks
- [ ] Filtering works (status, type, tags, etc.)
- [ ] Sorting works (by different fields)
- [ ] Parent/child relationships work
- [ ] Real-time updates work
- [ ] Optimistic updates work
- [ ] No console errors

---

## Troubleshooting

### Issue: Tasks not loading

**Solution**:
1. Check Supabase connection
2. Verify RLS policies for tasks table
3. Check task_tags join query
4. Verify user is authenticated

### Issue: Tags not showing on tasks

**Solution**:
1. Check task_tags table has entries
2. Verify join query in fetchTasks
3. Check RLS policies on task_tags table

### Issue: Can't delete tasks with children

**Solution**: This is expected. Delete child tasks first or reassign them.

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 3: Basic Task UI](./step-3-basic-task-ui.md)**

This will implement the task UI components including task cards, modals, and forms.

---

## Summary

You've successfully:
- ✅ Created comprehensive Task types
- ✅ Implemented TaskStore with full CRUD
- ✅ Built task filtering and sorting
- ✅ Implemented parent/child relationships
- ✅ Added real-time synchronization
- ✅ Implemented optimistic updates
- ✅ Created task utility functions
- ✅ Tested all task operations

**The task data layer is complete and ready for UI components!**
