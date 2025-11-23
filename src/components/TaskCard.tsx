import { Card, Space, Typography, Button, Checkbox, Dropdown, Tag as AntTag } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { Tag } from '@/components/Tag'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityIndicator } from '@/components/PriorityIndicator'
import { useTagStore } from '@/stores/tagStore'
import { isTaskOverdue, isTaskDueToday } from '@/lib/task-utils'
import { format, parseISO } from 'date-fns'

const { Text, Paragraph } = Typography

interface TaskCardProps {
  task: TaskWithTags
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onCreateSubtask?: () => void
  onClick?: () => void
  showDescription?: boolean
  compact?: boolean
}

export function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
  onCreateSubtask,
  onClick,
  showDescription = true,
  compact = false,
}: TaskCardProps) {
  const { getTagById } = useTagStore()

  const isCompleted = task.status === 'completed'
  const isOverdue = isTaskOverdue(task)
  const isDueToday = isTaskDueToday(task)

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: onEdit,
    },
    {
      key: 'create-subtask',
      label: 'Create Subtask',
      icon: <PlusOutlined />,
      onClick: onCreateSubtask,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: onDelete,
    },
  ]

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or checkboxes
    if ((e.target as HTMLElement).closest('button, .ant-checkbox, .ant-dropdown')) {
      return
    }
    onClick?.()
  }

  return (
    <Card
      className={`task-card ${compact ? 'task-card-compact' : ''} ${
        isCompleted ? 'opacity-60' : ''
      } hover:shadow-md transition-shadow cursor-pointer`}
      size={compact ? 'small' : 'default'}
      onClick={handleCardClick}
      bordered
      styles={{
        body: {
          borderLeft: isOverdue
            ? '4px solid #EF4444'
            : isDueToday
            ? '4px solid #3B82F6'
            : undefined,
        },
      }}
    >
      <Space direction="vertical" className="w-full" size="small">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Space size="small" className="flex-1">
            <Checkbox
              checked={isCompleted}
              onChange={onComplete}
              onClick={e => e.stopPropagation()}
            />

            <div className="flex-1">
              <Space direction="vertical" size={2} className="w-full">
                <div className="flex items-center gap-2">
                  <PriorityIndicator task={task} size="small" />
                  <Text
                    strong
                    delete={isCompleted}
                    className={compact ? 'text-sm' : 'text-base'}
                  >
                    {task.title}
                  </Text>
                </div>

                {!compact && showDescription && task.description && (
                  <Paragraph
                    type="secondary"
                    className="!mb-0 text-sm"
                    ellipsis={{ rows: 2 }}
                    delete={isCompleted}
                  >
                    {task.description}
                  </Paragraph>
                )}
              </Space>
            </div>
          </Space>

          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0"
            />
          </Dropdown>
        </div>

        {/* Metadata */}
        <Space size="small" wrap className="text-xs">
          <StatusBadge status={task.status} size="small" />

          {task.due_date && (
            <AntTag
              icon={<CalendarOutlined />}
              color={isOverdue ? 'error' : isDueToday ? 'processing' : 'default'}
            >
              {format(parseISO(task.due_date), 'MMM d')}
            </AntTag>
          )}

          {task.estimated_minutes && (
            <AntTag icon={<ClockCircleOutlined />}>
              {task.estimated_minutes}m
            </AntTag>
          )}

          {task.notes && <AntTag icon={<FileTextOutlined />}>Notes</AntTag>}
        </Space>

        {/* Tags */}
        {task.tags.length > 0 && (
          <Space size="small" wrap>
            {task.tags.map(tagId => {
              const tag = getTagById(tagId)
              return tag ? <Tag key={tag.id} tag={tag} /> : null
            })}
          </Space>
        )}
      </Space>
    </Card>
  )
}
