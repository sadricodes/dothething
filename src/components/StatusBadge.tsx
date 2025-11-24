import { Tag } from 'antd'
import { TaskStatus } from '@/types/task'
import { taskStatusConfig } from '@/lib/task-utils'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  InboxOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'

interface StatusBadgeProps {
  status: TaskStatus
  size?: 'small' | 'default'
}

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  ready: <InboxOutlined />,
  in_progress: <ClockCircleOutlined />,
  blocked: <PauseCircleOutlined />,
  completed: <CheckCircleOutlined />,
  archived: <FolderOpenOutlined />,
}

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const config = taskStatusConfig[status]

  return (
    <Tag
      icon={statusIcons[status]}
      color={config.color}
      className={size === 'small' ? 'text-xs' : ''}
    >
      {config.label}
    </Tag>
  )
}
