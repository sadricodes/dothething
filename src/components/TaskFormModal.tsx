import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
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
          is_urgent: task.is_urgent,
          is_important: task.is_important,
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
        is_urgent: values.is_urgent || false,
        is_important: values.is_important || false,
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

        <Form.Item label="Due Date" name="due_date">
          <DatePicker className="w-full" format="MMM D, YYYY" />
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
      </Form>
    </Modal>
  )
}
