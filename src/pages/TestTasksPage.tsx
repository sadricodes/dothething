import { useEffect } from 'react'
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
