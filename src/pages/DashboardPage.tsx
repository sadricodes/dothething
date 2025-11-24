import { useEffect, useState } from 'react'
import { Tabs, Input, Typography, Spin } from 'antd'
import { PlusOutlined, InboxOutlined, CalendarOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { TaskList } from '@/components/TaskList'
import { useTaskStore } from '@/stores/taskStore'
import { TaskFormData, TaskWithTags } from '@/types/task'
import { isTaskDueToday, isTaskDueThisWeek } from '@/lib/task-utils'

const { Title } = Typography

type ViewType = 'today' | 'week' | 'inbox'

export function DashboardPage() {
  const { tasks, loading, fetchTasks, createTask, subscribeToTasks, unsubscribeFromTasks } =
    useTaskStore()
  const [activeView, setActiveView] = useState<ViewType>('today')
  const [quickAddValue, setQuickAddValue] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, subscribeToTasks, unsubscribeFromTasks])

  const handleQuickAdd = async () => {
    if (!quickAddValue.trim()) return

    setQuickAddLoading(true)
    const taskData: TaskFormData = {
      title: quickAddValue.trim(),
      status: 'ready',
      type: 'task',
    }

    const { error } = await createTask(taskData)
    if (!error) {
      setQuickAddValue('')
    }
    setQuickAddLoading(false)
  }

  const handleQuickAddKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd()
    }
  }

  // Filter tasks based on active view
  const getFilteredTasks = (): TaskWithTags[] => {
    // Exclude archived tasks from all views
    const activeTasks = tasks.filter(task => task.status !== 'archived')

    switch (activeView) {
      case 'today':
        // Tasks due today or overdue
        return activeTasks.filter(
          task => isTaskDueToday(task) || (task.due_date && new Date(task.due_date) < new Date() && !isTaskDueToday(task))
        )

      case 'week':
        // Tasks due this week
        return activeTasks.filter(task => isTaskDueThisWeek(task))

      case 'inbox':
      default:
        // All non-archived tasks
        return activeTasks
    }
  }

  const filteredTasks = getFilteredTasks()

  const tabItems = [
    {
      key: 'today',
      label: (
        <span>
          <CalendarOutlined />
          Today
        </span>
      ),
      children: null,
    },
    {
      key: 'week',
      label: (
        <span>
          <ThunderboltOutlined />
          This Week
        </span>
      ),
      children: null,
    },
    {
      key: 'inbox',
      label: (
        <span>
          <InboxOutlined />
          Inbox
        </span>
      ),
      children: null,
    },
  ]

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Title level={2} className="!mb-4">
            Tasks
          </Title>

          {/* Quick Add Input */}
          <Input
            size="large"
            placeholder="Quick add task... (press Enter)"
            prefix={<PlusOutlined />}
            value={quickAddValue}
            onChange={e => setQuickAddValue(e.target.value)}
            onKeyPress={handleQuickAddKeyPress}
            disabled={quickAddLoading}
            className="mb-4"
          />

          {/* View Tabs */}
          <Tabs
            activeKey={activeView}
            items={tabItems}
            onChange={key => setActiveView(key as ViewType)}
          />
        </div>

        {/* Task List */}
        {loading && tasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            emptyMessage={
              activeView === 'today'
                ? 'No tasks due today'
                : activeView === 'week'
                ? 'No tasks due this week'
                : 'No tasks in inbox'
            }
          />
        )}
      </div>
    </AppLayout>
  )
}
