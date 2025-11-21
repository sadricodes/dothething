# Phase 2, Step 3: Basic Task UI

**Duration**: 3-4 days
**Prerequisite**: Step 2 (Task Data Layer) completed

## Overview

This step implements the core task UI components including:
- TaskCard component
- Task detail modal
- Task form modal
- Task quick actions
- Context menus
- Status badges and indicators
- Priority indicators (Eisenhower Matrix colors)

## Goals

- Create reusable TaskCard component
- Build task detail modal with full information
- Implement task form for create/edit
- Add quick actions (complete, edit, delete)
- Create context menu for tasks
- Add visual indicators for priority, status, due dates
- Implement task description rendering
- Support keyboard shortcuts

---

## Step 3.1: Create Status Badge Component

**Create `src/components/StatusBadge.tsx`**:

```typescript
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
```

---

## Step 3.2: Create Priority Indicator Component

**Create `src/components/PriorityIndicator.tsx`**:

```typescript
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
```

---

## Step 3.3: Create Task Card Component

**Create `src/components/TaskCard.tsx`**:

```typescript
import { Card, Space, Typography, Button, Checkbox, Dropdown, Tag as AntTag } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
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
```

---

## Step 3.4: Create Task Form Modal

**Create `src/components/TaskFormModal.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Checkbox,
  Space,
  message,
  Divider,
  Typography,
} from 'antd'
import { CheckSquareOutlined } from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { TagPicker } from '@/components/TagPicker'
import { Task, TaskFormData, TaskStatus, TaskType } from '@/types/task'
import { taskStatusConfig, taskTypeConfig } from '@/lib/task-utils'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text } = Typography

interface TaskFormModalProps {
  open: boolean
  task: Task | null
  parentTask?: Task | null
  onClose: () => void
  onSuccess?: (task: Task) => void
}

const statusOptions = Object.entries(taskStatusConfig).map(([value, config]) => ({
  label: config.label,
  value: value as TaskStatus,
}))

const typeOptions = Object.entries(taskTypeConfig).map(([value, config]) => ({
  label: `${config.icon} ${config.label}`,
  value: value as TaskType,
}))

export function TaskFormModal({
  open,
  task,
  parentTask,
  onClose,
  onSuccess,
}: TaskFormModalProps) {
  const { createTask, updateTask, getTaskById } = useTaskStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isEditing = !!task?.id
  const isSubtask = !!parentTask

  useEffect(() => {
    if (open) {
      if (task) {
        const taskWithTags = getTaskById(task.id)
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          status: task.status,
          type: task.type,
          due_date: task.due_date ? dayjs(task.due_date) : null,
          scheduled_date: task.scheduled_date ? dayjs(task.scheduled_date) : null,
          estimated_minutes: task.estimated_minutes,
          is_urgent: task.is_urgent,
          is_important: task.is_important,
          notes: task.notes,
          tags: taskWithTags?.tags || [],
        })
      } else if (parentTask) {
        // Initialize subtask with parent's context
        form.setFieldsValue({
          status: 'ready',
          type: 'task',
          tags: [],
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          status: 'ready',
          type: 'task',
          is_urgent: false,
          is_important: false,
          tags: [],
        })
      }
    }
  }, [open, task, parentTask, form, getTaskById])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const formData: TaskFormData = {
        title: values.title,
        description: values.description || null,
        status: values.status,
        type: values.type,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        scheduled_date: values.scheduled_date ? values.scheduled_date.toISOString() : null,
        estimated_minutes: values.estimated_minutes || null,
        is_urgent: values.is_urgent || false,
        is_important: values.is_important || false,
        notes: values.notes || null,
        tags: values.tags || [],
        parent_id: parentTask?.id || null,
      }

      if (isEditing) {
        const { error } = await updateTask(task.id, formData)
        if (error) {
          message.error(error.message)
        } else {
          message.success('Task updated successfully')
          const updated = getTaskById(task.id)
          if (updated) onSuccess?.(updated)
          onClose()
        }
      } else {
        const { data, error } = await createTask(formData)
        if (error) {
          message.error(error.message)
        } else if (data) {
          message.success(isSubtask ? 'Subtask created successfully' : 'Task created successfully')
          onSuccess?.(data)
          onClose()
        }
      }
    } catch (error) {
      // Form validation failed
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <Space>
          <CheckSquareOutlined />
          {isEditing ? 'Edit Task' : isSubtask ? 'Create Subtask' : 'Create Task'}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? 'Save' : 'Create'}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {isSubtask && parentTask && (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <Text type="secondary">Parent Task:</Text>
              <div>
                <Text strong>{parentTask.title}</Text>
              </div>
            </div>
          </>
        )}

        <Form.Item
          label="Title"
          name="title"
          rules={[
            { required: true, message: 'Please enter a task title' },
            { max: 500, message: 'Title must be 500 characters or less' },
          ]}
        >
          <Input placeholder="What needs to be done?" autoFocus />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea
            placeholder="Add details about this task..."
            rows={3}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Space className="w-full" size="large">
          <Form.Item label="Status" name="status" className="flex-1">
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item label="Type" name="type" className="flex-1">
            <Select options={typeOptions} />
          </Form.Item>
        </Space>

        <Space className="w-full" size="large">
          <Form.Item label="Due Date" name="due_date" className="flex-1">
            <DatePicker className="w-full" format="MMM D, YYYY" />
          </Form.Item>

          <Form.Item label="Scheduled Date" name="scheduled_date" className="flex-1">
            <DatePicker className="w-full" format="MMM D, YYYY" />
          </Form.Item>
        </Space>

        <Form.Item label="Estimated Time (minutes)" name="estimated_minutes">
          <InputNumber min={1} max={999} className="w-full" placeholder="e.g., 30" />
        </Form.Item>

        <Divider />

        <Form.Item label="Priority (Eisenhower Matrix)">
          <Space direction="vertical" className="w-full">
            <Form.Item name="is_urgent" valuePropName="checked" className="!mb-2">
              <Checkbox>Urgent</Checkbox>
            </Form.Item>
            <Form.Item name="is_important" valuePropName="checked" className="!mb-0">
              <Checkbox>Important</Checkbox>
            </Form.Item>
          </Space>
        </Form.Item>

        <Divider />

        <Form.Item label="Tags" name="tags">
          <TagPicker />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea
            placeholder="Additional notes, links, or context..."
            rows={3}
            maxLength={5000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

---

## Step 3.5: Create Task Detail Modal

**Create `src/components/TaskDetailModal.tsx`**:

```typescript
import { useState } from 'react'
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
  ClockCircleOutlined,
  FileTextOutlined,
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
        <Descriptions column={2} size="small">
          {task.due_date && (
            <Descriptions.Item label="Due Date" span={1}>
              <Space size="small">
                <CalendarOutlined />
                <Text>{format(parseISO(task.due_date), 'MMM d, yyyy')}</Text>
              </Space>
            </Descriptions.Item>
          )}

          {task.scheduled_date && (
            <Descriptions.Item label="Scheduled" span={1}>
              <Space size="small">
                <CalendarOutlined />
                <Text>{format(parseISO(task.scheduled_date), 'MMM d, yyyy')}</Text>
              </Space>
            </Descriptions.Item>
          )}

          {task.estimated_minutes && (
            <Descriptions.Item label="Estimated Time" span={1}>
              <Space size="small">
                <ClockCircleOutlined />
                <Text>{task.estimated_minutes} minutes</Text>
              </Space>
            </Descriptions.Item>
          )}

          {task.actual_minutes && (
            <Descriptions.Item label="Actual Time" span={1}>
              <Space size="small">
                <ClockCircleOutlined />
                <Text>{task.actual_minutes} minutes</Text>
              </Space>
            </Descriptions.Item>
          )}

          {task.completed_at && (
            <Descriptions.Item label="Completed At" span={2}>
              <Text>{format(parseISO(task.completed_at), 'MMM d, yyyy h:mm a')}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

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

        {/* Notes */}
        {task.notes && (
          <div>
            <Text strong>Notes</Text>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
              <Paragraph className="!mb-0 whitespace-pre-wrap text-gray-700">
                {task.notes}
              </Paragraph>
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
```

---

## Step 3.6: Create Task List Component

**Create `src/components/TaskList.tsx`**:

```typescript
import { useState } from 'react'
import { Empty, Space, Typography, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'
import { TaskFormModal } from './TaskFormModal'
import { TaskWithTags, Task } from '@/types/task'
import { useTaskStore } from '@/stores/taskStore'

const { Text } = Typography

interface TaskListProps {
  tasks: TaskWithTags[]
  emptyMessage?: string
  showDescription?: boolean
  compact?: boolean
}

export function TaskList({
  tasks,
  emptyMessage = 'No tasks found',
  showDescription = true,
  compact = false,
}: TaskListProps) {
  const { completeTask, uncompleteTask, deleteTask } = useTaskStore()
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null)

  const handleComplete = async (task: TaskWithTags) => {
    const isCompleted = task.status === 'completed'
    const { error } = isCompleted
      ? await uncompleteTask(task.id)
      : await completeTask(task.id)

    if (error) {
      message.error(error.message)
    }
  }

  const handleDelete = async (task: TaskWithTags) => {
    const { error } = await deleteTask(task.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('Task deleted')
      setSelectedTask(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#D1D5DB' }} />}
        description={<Text type="secondary">{emptyMessage}</Text>}
        className="py-12"
      />
    )
  }

  return (
    <>
      <Space direction="vertical" className="w-full" size="middle">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => handleComplete(task)}
            onEdit={() => setEditingTask(task)}
            onDelete={() => handleDelete(task)}
            onCreateSubtask={() => setSubtaskParent(task)}
            onClick={() => setSelectedTask(task)}
            showDescription={showDescription}
            compact={compact}
          />
        ))}
      </Space>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={() => {
          if (selectedTask) {
            setEditingTask(selectedTask)
            setSelectedTask(null)
          }
        }}
        onDelete={() => selectedTask && handleDelete(selectedTask)}
        onComplete={() => selectedTask && handleComplete(selectedTask)}
        onCreateSubtask={() => {
          if (selectedTask) {
            setSubtaskParent(selectedTask)
            setSelectedTask(null)
          }
        }}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />

      {/* Subtask Form Modal */}
      <TaskFormModal
        open={!!subtaskParent}
        task={null}
        parentTask={subtaskParent}
        onClose={() => setSubtaskParent(null)}
      />
    </>
  )
}
```

---

## Step 3.7: Update Test Page

**Update `src/pages/TestTasksPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { TaskList } from '@/components/TaskList'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'

const { Title, Text } = Typography

export function TestTasksPage() {
  const { tasks, fetchTasks, subscribeToTasks, unsubscribeFromTasks } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Task UI Test
            </Title>
            <Text type="secondary">Testing task card components and interactions</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsFormOpen(true)}>
            New Task
          </Button>
        </div>

        <TaskList tasks={tasks} emptyMessage="No tasks yet. Create your first task!" />

        <TaskFormModal
          open={isFormOpen}
          task={null}
          onClose={() => setIsFormOpen(false)}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 3.8: Add Required Dependencies

If not already installed, add dayjs:

```bash
npm install dayjs
```

---

## Step 3.9: Test Task UI Components

### Test Task Creation

1. Navigate to `/test-tasks`
2. Click "New Task" button
3. Fill in form:
   - Title: "Complete project documentation"
   - Description: "Write comprehensive docs"
   - Status: Ready
   - Type: Task
   - Due Date: Tomorrow
   - Mark as Urgent & Important
   - Add 2-3 tags
4. Click "Create"
5. **Expected**: Task appears with priority indicator, due date, tags

### Test Task Card Display

1. **Expected**: Task card shows:
   - Checkbox (unchecked)
   - Priority fire icon (red, for urgent+important)
   - Title and description
   - Status badge
   - Due date tag
   - All selected tags
   - Three-dot menu button

### Test Task Completion

1. Click checkbox on a task
2. **Expected**:
   - Task becomes semi-transparent
   - Title gets strikethrough
   - Status changes to "Completed"

### Test Task Detail Modal

1. Click anywhere on task card (not checkbox/buttons)
2. **Expected**: Detail modal opens showing:
   - Full task information
   - Edit, Complete, Delete buttons
   - All metadata
   - Subtasks section

### Test Task Editing

1. Click three-dot menu → "Edit"
2. Modify any field
3. Click "Save"
4. **Expected**: Changes reflect immediately

### Test Subtask Creation

1. In detail modal, click "Add Subtask"
2. Create subtask
3. **Expected**: Subtask appears in subtasks section

### Test Task Deletion

1. Click three-dot menu → "Delete"
2. **Expected**: Task removed from list

---

## Verification Checklist

Before proceeding to Step 4, verify:

- [ ] TaskCard renders correctly
- [ ] Status badges display with correct colors
- [ ] Priority indicators show correct quadrant
- [ ] Task form modal works for create/edit
- [ ] Task detail modal shows all information
- [ ] Checkboxes complete/uncomplete tasks
- [ ] Three-dot menu works
- [ ] Tags display correctly on cards
- [ ] Due dates show with correct colors (overdue=red, today=blue)
- [ ] Subtasks can be created
- [ ] Task deletion works
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Mobile responsive

---

## Troubleshooting

### Issue: Tags not showing on task cards

**Solution**:
1. Verify tags are loaded in TagStore
2. Check task.tags array has tag IDs
3. Verify getTagById returns tags

### Issue: Date picker not working

**Solution**:
1. Ensure dayjs is installed
2. Verify date format in form values
3. Check DatePicker import from antd

### Issue: Priority indicator not showing

**Solution**:
1. Verify task has is_urgent and is_important set
2. Check getTaskPriorityQuadrant logic
3. Ensure priority colors are defined

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 4: Today Dashboard](./step-4-today-dashboard.md)**

This will implement the Today dashboard showing scheduled tasks and quick actions.

---

## Summary

You've successfully:
- ✅ Created StatusBadge component
- ✅ Created PriorityIndicator component
- ✅ Built comprehensive TaskCard component
- ✅ Implemented TaskFormModal for create/edit
- ✅ Built TaskDetailModal with full information
- ✅ Created TaskList component
- ✅ Added quick actions (complete, edit, delete)
- ✅ Implemented context menus
- ✅ Added visual indicators for status, priority, due dates
- ✅ Tested all task UI interactions

**The basic task UI is complete and ready for the Today dashboard!**
