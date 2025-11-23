import { Typography, Space, Card, Alert } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text, Paragraph } = Typography

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={2}>Welcome to DoTheThing! 👋</Title>
            <Text type="secondary">Logged in as {user?.email}</Text>
          </div>

          <Alert
            message="Phase 1 Complete!"
            description="Authentication and design system are set up. Task management features will be added in Phase 2."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />

          <Card title="What's Next?">
            <Space direction="vertical" size="middle" className="w-full">
              <div>
                <Text strong>Phase 2: Core Task Management</Text>
                <Paragraph type="secondary" className="!mb-0 !mt-1">
                  • Create and manage tasks
                  <br />
                  • Organize with tags
                  <br />
                  • Parent/child task relationships
                  <br />• Today dashboard
                </Paragraph>
              </div>

              <div>
                <Text strong>Phase 3: Advanced Features</Text>
                <Paragraph type="secondary" className="!mb-0 !mt-1">
                  • Recurring tasks
                  <br />
                  • Habit tracking with streaks
                  <br />• Someday tasks
                </Paragraph>
              </div>
            </Space>
          </Card>

          <Card title="Current Features" className="bg-blue-50 border-blue-200">
            <Space direction="vertical" size="small">
              <Text>✅ User authentication (sign up, login, logout)</Text>
              <Text>✅ Protected routes</Text>
              <Text>✅ Dark/Light mode toggle</Text>
              <Text>✅ Responsive layout</Text>
              <Text>✅ Ant Design theming</Text>
            </Space>
          </Card>
        </Space>
      </div>
    </AppLayout>
  )
}
