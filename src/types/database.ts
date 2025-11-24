export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export enum TaskType {
  Task = 'task',
  Habit = 'habit',
  Parent = 'parent',
}

export enum TaskStatus {
  Ready = 'ready',
  InProgress = 'in_progress',
  Blocked = 'blocked',
  Completed = 'completed',
  Archived = 'archived',
}

export enum RecurrenceType {
  FixedSchedule = 'fixed_schedule',
  AfterCompletion = 'after_completion',
}

export enum ViewMode {
  List = 'list',
  Kanban = 'kanban',
  Eisenhower = 'eisenhower',
  Today = 'today',
  Habits = 'habits',
}

export interface Database {
  public: {
    Tables: {
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: TaskType
          status: TaskStatus
          blocked_reason: string | null
          parent_id: string | null
          due_date: string | null
          has_due_date: boolean
          started_at: string | null
          last_completed_at: string | null
          completed_count: number
          timer_duration_minutes: number | null
          current_streak: number
          longest_streak: number
          streak_safe_until: string | null
          target_frequency: Json | null
          is_urgent: boolean
          is_important: boolean
          nudge_threshold_days: number | null
          last_nudged_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type?: TaskType
          status?: TaskStatus
          blocked_reason?: string | null
          parent_id?: string | null
          due_date?: string | null
          has_due_date?: boolean
          started_at?: string | null
          last_completed_at?: string | null
          completed_count?: number
          timer_duration_minutes?: number | null
          current_streak?: number
          longest_streak?: number
          streak_safe_until?: string | null
          target_frequency?: Json | null
          is_urgent?: boolean
          is_important?: boolean
          nudge_threshold_days?: number | null
          last_nudged_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: TaskType
          status?: TaskStatus
          blocked_reason?: string | null
          parent_id?: string | null
          due_date?: string | null
          has_due_date?: boolean
          started_at?: string | null
          last_completed_at?: string | null
          completed_count?: number
          timer_duration_minutes?: number | null
          current_streak?: number
          longest_streak?: number
          streak_safe_until?: string | null
          target_frequency?: Json | null
          is_urgent?: boolean
          is_important?: boolean
          nudge_threshold_days?: number | null
          last_nudged_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_tags: {
        Row: {
          task_id: string
          tag_id: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: {
          task_id?: string
          tag_id?: string
        }
      }
      recurrences: {
        Row: {
          id: string
          task_id: string
          type: RecurrenceType
          frequency: Json
          anchor_date: string | null
          next_due_date: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          type: RecurrenceType
          frequency: Json
          anchor_date?: string | null
          next_due_date: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          type?: RecurrenceType
          frequency?: Json
          anchor_date?: string | null
          next_due_date?: string
          created_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          task_id: string
          completed_at: string
          was_late: boolean
          was_retroactive: boolean
        }
        Insert: {
          id?: string
          task_id: string
          completed_at?: string
          was_late?: boolean
          was_retroactive?: boolean
        }
        Update: {
          id?: string
          task_id?: string
          completed_at?: string
          was_late?: boolean
          was_retroactive?: boolean
        }
      }
      saved_views: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          view_mode: ViewMode
          filters: Json
          sort_order: Json
          display_options: Json | null
          is_pinned: boolean
          is_default: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          view_mode: ViewMode
          filters?: Json
          sort_order?: Json
          display_options?: Json | null
          is_pinned?: boolean
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          view_mode?: ViewMode
          filters?: Json
          sort_order?: Json
          display_options?: Json | null
          is_pinned?: boolean
          is_default?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
