import { useState } from 'react'
import { Empty, Space, message } from 'antd'
import { TaskWithTags } from '@/types/task'
import { TaskCard } from '@/components/TaskCard'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'

interface TaskListProps {
  tasks: TaskWithTags[]
  emptyMessage?: string
  showDescription?: boolean
  compact?: boolean
}

export function TaskList({
  tasks,
  emptyMessage = 'No tasks',
  showDescription = true,
  compact = false,
}: TaskListProps) {
  const [detailTask, setDetailTask] = useState<TaskWithTags | null>(null)
  const [editTask, setEditTask] = useState<TaskWithTags | null>(null)
  const [subtaskParent, setSubtaskParent] = useState<TaskWithTags | null>(null)

  const { completeTask, uncompleteTask, deleteTask } = useTaskStore()

  const handleComplete = async (task: TaskWithTags) => {
    const isCompleted = task.status === 'completed'
    const action = isCompleted ? uncompleteTask : completeTask

    const { error } = await action(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success(isCompleted ? 'Task marked incomplete' : 'Task completed!')
    }
  }

  const handleEdit = (task: TaskWithTags) => {
    setDetailTask(null)
    setEditTask(task)
  }

  const handleDelete = async (task: TaskWithTags) => {
    const { error } = await deleteTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task deleted')
      setDetailTask(null)
    }
  }

  const handleCreateSubtask = (parent: TaskWithTags) => {
    setDetailTask(null)
    setSubtaskParent(parent)
  }

  const handleTaskClick = (task: TaskWithTags) => {
    setDetailTask(task)
  }

  const handleDetailEdit = () => {
    if (detailTask) {
      handleEdit(detailTask)
    }
  }

  const handleDetailDelete = () => {
    if (detailTask) {
      handleDelete(detailTask)
    }
  }

  const handleDetailComplete = () => {
    if (detailTask) {
      handleComplete(detailTask)
    }
  }

  const handleDetailCreateSubtask = () => {
    if (detailTask) {
      handleCreateSubtask(detailTask)
    }
  }

  if (tasks.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyMessage}
        className="py-12"
      />
    )
  }

  return (
    <>
      <Space direction="vertical" className="w-full" size="middle">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onEdit={() => handleEdit(task)}
            onDelete={() => handleDelete(task)}
            onCreateSubtask={() => handleCreateSubtask(task)}
            onClick={() => handleTaskClick(task)}
            showDescription={showDescription}
            compact={compact}
          />
        ))}
      </Space>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
        onComplete={handleDetailComplete}
        onCreateSubtask={handleDetailCreateSubtask}
      />

      {/* Edit Task Modal */}
      <TaskFormModal
        open={!!editTask}
        task={editTask || null}
        onClose={() => setEditTask(null)}
        onSuccess={() => {
          setEditTask(null)
          message.success('Task updated!')
        }}
      />

      {/* Create Subtask Modal */}
      <TaskFormModal
        open={!!subtaskParent}
        task={null}
        parentTask={subtaskParent || null}
        onClose={() => setSubtaskParent(null)}
        onSuccess={() => {
          setSubtaskParent(null)
          message.success('Subtask created!')
        }}
      />
    </>
  )
}
