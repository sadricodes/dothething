import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, signIn } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null)

    const { error } = await signIn(values.email, values.password)

    if (error) {
      setError(error.message)
      return
    }

    // Navigate to dashboard on success
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              Welcome Back
            </Title>
            <Text type="secondary">Sign in to your DoTheThing account</Text>
          </div>

          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-500 hover:text-blue-600">
                Sign up
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
