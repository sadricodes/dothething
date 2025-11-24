import {
  Modal,
  Descriptions,
  Space,
  Button,
  Typography,
  Divider,
  Empty,
  Tag as AntTag,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { TaskWithTags } from '@/types/task'
import { Tag } from '@/components/Tag'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityIndicator } from '@/components/PriorityIndicator'
import { useTagStore } from '@/stores/tagStore'
import { useTaskStore } from '@/stores/taskStore'
import { taskTypeConfig } from '@/lib/task-utils'
import { format, parseISO } from 'date-fns'

const { Title, Text, Paragraph } = Typography

interface TaskDetailModalProps {
  task: TaskWithTags | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  onCreateSubtask?: () => void
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  onComplete,
  onCreateSubtask,
}: TaskDetailModalProps) {
  const { getTagById } = useTagStore()
  const { getChildTasks } = useTaskStore()

  if (!task) return null

  const isCompleted = task.status === 'completed'
  const subtasks = getChildTasks(task.id)

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Header */}
        <div>
          <Space className="w-full justify-between mb-2">
            <PriorityIndicator task={task} showLabel size="large" />
            <Space>
              <Button icon={<EditOutlined />} onClick={onEdit}>
                Edit
              </Button>
              <Button
                type={isCompleted ? 'default' : 'primary'}
                icon={isCompleted ? <CloseOutlined /> : <CheckOutlined />}
                onClick={onComplete}
              >
                {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                Delete
              </Button>
            </Space>
          </Space>

          <Title level={3} className="!mb-2" delete={isCompleted}>
            {task.title}
          </Title>

          <Space size="small">
            <StatusBadge status={task.status} />
            <AntTag>{taskTypeConfig[task.type].icon} {taskTypeConfig[task.type].label}</AntTag>
          </Space>
        </div>

        <Divider className="!my-2" />

        {/* Description */}
        {task.description && (
          <div>
            <Text strong>Description</Text>
            <Paragraph className="!mb-0 mt-2 text-gray-700">
              {task.description}
            </Paragraph>
          </div>
        )}

        {/* Details */}
        {(task.due_date || task.completed_at) && (
          <Descriptions column={2} size="small">
            {task.due_date && (
              <Descriptions.Item label="Due Date" span={1}>
                <Space size="small">
                  <CalendarOutlined />
                  <Text>{format(parseISO(task.due_date), 'MMM d, yyyy')}</Text>
                </Space>
              </Descriptions.Item>
            )}

            {task.completed_at && (
              <Descriptions.Item label="Completed At" span={2}>
                <Text>{format(parseISO(task.completed_at), 'MMM d, yyyy h:mm a')}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div>
            <Text strong>Tags</Text>
            <div className="mt-2">
              <Space size="small" wrap>
                {task.tags.map(tagId => {
                  const tag = getTagById(tagId)
                  return tag ? <Tag key={tag.id} tag={tag} /> : null
                })}
              </Space>
            </div>
          </div>
        )}

        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Text strong>Subtasks ({subtasks.length})</Text>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={onCreateSubtask}
            >
              Add Subtask
            </Button>
          </div>

          {subtasks.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No subtasks"
              className="py-4"
            />
          ) : (
            <Space direction="vertical" className="w-full">
              {subtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className="p-2 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <Space size="small">
                    <CheckOutlined
                      className={subtask.status === 'completed' ? 'text-green-500' : 'text-gray-300'}
                    />
                    <Text delete={subtask.status === 'completed'}>{subtask.title}</Text>
                  </Space>
                </div>
              ))}
            </Space>
          )}
        </div>

        <Divider className="!my-2" />

        {/* Metadata */}
        <div className="text-xs text-gray-500">
          <div>Created: {format(parseISO(task.created_at), 'MMM d, yyyy h:mm a')}</div>
          <div>Updated: {format(parseISO(task.updated_at), 'MMM d, yyyy h:mm a')}</div>
        </div>
      </Space>
    </Modal>
  )
}
