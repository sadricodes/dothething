import { Button, Typography, Space, Card } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export function DashboardPage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Title level={2}>Dashboard</Title>
              <Text type="secondary">Welcome to DoTheThing!</Text>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text strong>Logged in as: </Text>
              <Text>{user?.email}</Text>
            </div>

            <div>
              <Text type="secondary">
                Authentication is working! The task management features will be added in Phase 2.
              </Text>
            </div>

            <Button type="default" icon={<LogoutOutlined />} onClick={handleSignOut} danger>
              Sign Out
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  )
}
