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
  getOverdueTasks: () => TaskWithTags[]

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
