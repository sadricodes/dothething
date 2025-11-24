import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Radio,
  Divider,
} from 'antd'
import { TagOutlined } from '@ant-design/icons'
import { useTagStore } from '@/stores/tagStore'
import { Tag, TagColor, TagGradient, TagFormData } from '@/types/tag'
import { tagColors, tagGradients } from '@/lib/tag-colors'

interface TagFormModalProps {
  open: boolean
  tag: Tag | null
  onClose: () => void
}

const colorOptions: TagColor[] = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'gray',
]

const gradientOptions: TagGradient[] = [
  'sunset',
  'ocean',
  'forest',
  'twilight',
  'rose',
  'candy',
  'sky',
  'fire',
]

export function TagFormModal({ open, tag, onClose }: TagFormModalProps) {
  const { createTag, updateTag, tags } = useTagStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [styleType, setStyleType] = useState<'color' | 'gradient'>('color')

  const isEditing = !!tag?.id

  useEffect(() => {
    if (open) {
      if (tag) {
        form.setFieldsValue({
          name: tag.name,
          parent_id: tag.parent_id,
          icon: tag.icon,
          color: tag.color,
          gradient: tag.gradient,
        })
        setStyleType(tag.gradient ? 'gradient' : 'color')
      } else {
        form.resetFields()
        setStyleType('color')
      }
    }
  }, [open, tag, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const formData: TagFormData = {
        name: values.name,
        parent_id: values.parent_id || null,
        icon: values.icon || null,
        color: styleType === 'color' ? values.color || null : null,
        gradient: styleType === 'gradient' ? values.gradient || null : null,
      }

      if (isEditing) {
        const { error } = await updateTag(tag.id, formData)
        if (error) {
          message.error(error.message)
        } else {
          message.success('Tag updated successfully')
          onClose()
        }
      } else {
        const { error } = await createTag(formData)
        if (error) {
          message.error(error.message)
        } else {
          message.success('Tag created successfully')
          onClose()
        }
      }
    } catch (error) {
      // Form validation failed
    } finally {
      setLoading(false)
    }
  }

  const parentTagOptions = tags
    .filter(t => t.id !== tag?.id) // Can't be parent of itself
    .filter(t => !tag?.id || t.parent_id !== tag.id) // Can't select own child
    .map(t => ({
      label: t.name,
      value: t.id,
    }))

  return (
    <Modal
      title={
        <Space>
          <TagOutlined />
          {isEditing ? 'Edit Tag' : 'Create Tag'}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter a tag name' },
            { max: 50, message: 'Tag name must be 50 characters or less' },
          ]}
        >
          <Input placeholder="e.g., Work, Personal, Urgent" />
        </Form.Item>

        <Form.Item label="Parent Tag" name="parent_id">
          <Select
            placeholder="None (top-level tag)"
            allowClear
            options={parentTagOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item label="Icon (Emoji)" name="icon">
          <Input placeholder="e.g., 🏢 📱 ⚡" maxLength={2} />
        </Form.Item>

        <Divider />

        <Form.Item label="Style">
          <Radio.Group value={styleType} onChange={e => setStyleType(e.target.value)}>
            <Radio value="color">Solid Color</Radio>
            <Radio value="gradient">Gradient</Radio>
          </Radio.Group>
        </Form.Item>

        {styleType === 'color' ? (
          <Form.Item label="Color" name="color">
            <Radio.Group>
              <Space wrap>
                {colorOptions.map(color => (
                  <Radio.Button
                    key={color}
                    value={color}
                    style={{
                      backgroundColor: tagColors[color].bg,
                      borderColor: tagColors[color].border,
                      color: tagColors[color].text,
                    }}
                  >
                    {color}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        ) : (
          <Form.Item label="Gradient" name="gradient">
            <Radio.Group>
              <Space direction="vertical" className="w-full">
                {gradientOptions.map(gradient => (
                  <Radio
                    key={gradient}
                    value={gradient}
                    className="w-full"
                    style={{
                      background: tagGradients[gradient],
                      color: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    {gradient}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
