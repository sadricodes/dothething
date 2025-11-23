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
