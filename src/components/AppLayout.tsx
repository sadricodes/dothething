import { ReactNode } from 'react'
import { Layout, Button, Dropdown, Space, Typography, MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const { Header, Content, Sider } = Layout
const { Text } = Typography

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUIStore()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const themeMenuItems: MenuProps['items'] = [
    {
      key: 'light',
      label: 'Light',
      icon: <SunOutlined />,
      onClick: () => setTheme('light'),
    },
    {
      key: 'dark',
      label: 'Dark',
      icon: <MoonOutlined />,
      onClick: () => setTheme('dark'),
    },
    {
      key: 'system',
      label: 'System',
      icon: <DesktopOutlined />,
      onClick: () => setTheme('system'),
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'theme',
      label: 'Theme',
      icon: theme === 'dark' ? <MoonOutlined /> : <SunOutlined />,
      children: themeMenuItems,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleSignOut,
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* Sidebar - Will be enhanced in Phase 2 */}
      <Sider
        theme="light"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        width={240}
        className="border-r"
      >
        <div className="h-16 flex items-center justify-center px-4">
          <Text strong className="text-lg">
            {sidebarCollapsed ? 'DT' : 'DoTheThing'}
          </Text>
        </div>

        {/* Navigation will be added in Phase 2 */}
      </Sider>

      <Layout>
        {/* Header */}
        <Header className="bg-white border-b px-6 flex items-center justify-between">
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="lg:hidden"
          />

          <div className="flex-1" />

          <Space>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Button type="text">
                <Space>
                  <Text>{user?.email}</Text>
                  <SettingOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  )
}
