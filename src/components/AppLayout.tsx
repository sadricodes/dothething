import { ReactNode, useEffect } from 'react'
import { Layout, Button, Dropdown, Space, Typography, MenuProps, Menu, Badge } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  DashboardOutlined,
  TagOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { isTaskDueToday, isTaskDueThisWeek } from '@/lib/task-utils'

const { Header, Content, Sider } = Layout
const { Text } = Typography

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUIStore()
  const { tasks, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Calculate task counts
  const activeTasks = tasks.filter(task => task.status !== 'archived')
  const todayTasks = activeTasks.filter(
    task =>
      isTaskDueToday(task) ||
      (task.due_date && new Date(task.due_date) < new Date() && !isTaskDueToday(task))
  )
  const weekTasks = activeTasks.filter(task => isTaskDueThisWeek(task))
  const inboxCount = activeTasks.length

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

  const navMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: (
        <span className="flex items-center justify-between w-full">
          <span>Dashboard</span>
          {inboxCount > 0 && !sidebarCollapsed && (
            <Badge count={inboxCount} showZero={false} overflowCount={99} />
          )}
        </span>
      ),
      icon: <DashboardOutlined />,
      onClick: () => navigate('/dashboard'),
      children: [
        {
          key: 'today',
          label: (
            <span className="flex items-center justify-between w-full">
              <span>Today</span>
              {todayTasks.length > 0 && (
                <Badge count={todayTasks.length} showZero={false} overflowCount={99} />
              )}
            </span>
          ),
          icon: <CalendarOutlined />,
          onClick: () => navigate('/dashboard'),
        },
        {
          key: 'week',
          label: (
            <span className="flex items-center justify-between w-full">
              <span>This Week</span>
              {weekTasks.length > 0 && (
                <Badge count={weekTasks.length} showZero={false} overflowCount={99} />
              )}
            </span>
          ),
          icon: <ThunderboltOutlined />,
          onClick: () => navigate('/dashboard'),
        },
        {
          key: 'inbox',
          label: (
            <span className="flex items-center justify-between w-full">
              <span>Inbox</span>
              {inboxCount > 0 && (
                <Badge count={inboxCount} showZero={false} overflowCount={99} />
              )}
            </span>
          ),
          icon: <InboxOutlined />,
          onClick: () => navigate('/dashboard'),
        },
      ],
    },
    {
      key: '/tags',
      label: 'Tags',
      icon: <TagOutlined />,
      onClick: () => navigate('/tags'),
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        theme="light"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        width={240}
        className="border-r"
      >
        <div className="h-16 flex items-center justify-center px-4 border-b">
          <Text strong className="text-lg">
            {sidebarCollapsed ? '✓' : 'DoTheThing'}
          </Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/dashboard']}
          items={navMenuItems}
          className="border-r-0"
        />
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
