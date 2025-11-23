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
