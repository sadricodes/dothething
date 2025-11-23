import { Space, Typography, Tooltip } from 'antd'
import { FireOutlined, CalendarOutlined, UserOutlined, StopOutlined } from '@ant-design/icons'
import { Task } from '@/types/task'
import { getTaskPriorityQuadrant } from '@/lib/task-utils'
import { colors } from '@/lib/design-tokens'

const { Text } = Typography

interface PriorityIndicatorProps {
  task: Task
  showLabel?: boolean
  size?: 'small' | 'default' | 'large'
}

const quadrantConfig = {
  1: {
    label: 'Do First',
    icon: <FireOutlined />,
    color: colors.urgentImportant,
    description: 'Urgent & Important',
  },
  2: {
    label: 'Schedule',
    icon: <CalendarOutlined />,
    color: colors.notUrgentImportant,
    description: 'Not Urgent but Important',
  },
  3: {
    label: 'Delegate',
    icon: <UserOutlined />,
    color: colors.urgentNotImportant,
    description: 'Urgent but Not Important',
  },
  4: {
    label: 'Eliminate',
    icon: <StopOutlined />,
    color: colors.notUrgentNotImportant,
    description: 'Not Urgent & Not Important',
  },
}

export function PriorityIndicator({ task, showLabel = false, size = 'default' }: PriorityIndicatorProps) {
  const quadrant = getTaskPriorityQuadrant(task)
  if (!quadrant) return null

  const config = quadrantConfig[quadrant]
  const fontSize = size === 'small' ? 12 : size === 'large' ? 20 : 16

  const content = (
    <Space size="small">
      <span style={{ color: config.color, fontSize }}>{config.icon}</span>
      {showLabel && <Text style={{ color: config.color }}>{config.label}</Text>}
    </Space>
  )

  return <Tooltip title={config.description}>{content}</Tooltip>
}
