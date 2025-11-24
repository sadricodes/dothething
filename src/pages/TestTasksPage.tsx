import { useEffect, useState } from 'react'
import { Button, Space, Typography, message, Spin } from 'antd'
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { TaskList } from '@/components/TaskList'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'
import { TaskFormData } from '@/types/task'

const { Title, Text } = Typography

export function TestTasksPage() {
  const { tasks, loading, fetchTasks, createTask, subscribeToTasks, unsubscribeFromTasks } =
    useTaskStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

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
      message.success('Test task created!')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Task UI Components
            </Title>
            <Text type="secondary">Testing Task UI with TaskList, TaskCard, and Modals</Text>
          </div>
          <Space>
            <Button icon={<ThunderboltOutlined />} onClick={handleCreateTest}>
              Quick Test Task
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Task
            </Button>
          </Space>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <TaskList tasks={tasks} emptyMessage="No tasks yet. Create one to get started!" />
        )}
      </div>

      <TaskFormModal
        open={showCreateModal}
        task={null}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          message.success('Task created!')
        }}
      />
    </AppLayout>
  )
}
