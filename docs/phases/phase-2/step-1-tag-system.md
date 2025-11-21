# Phase 2, Step 1: Tag System

**Duration**: 2-3 days
**Prerequisite**: Phase 1 Complete (Authentication & Design System)

## Overview

⚠️ **CRITICAL**: This step MUST be completed before implementing tasks, as tasks depend on tags.

This step implements the complete tag system including:
- Tag database types
- TagStore with Zustand
- Hierarchical tag structure (parent/child)
- Tag CRUD operations
- Tag color/gradient system
- Tag management UI
- Tag picker component

## Goals

- Create TypeScript types for tags
- Implement TagStore with Supabase integration
- Build tag CRUD operations
- Create tag management UI
- Implement hierarchical tag picker
- Support colors and gradients
- Enable real-time tag updates

---

## Step 1.1: Create Tag Types

**Create `src/types/tag.ts`**:

```typescript
export type TagColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'gray'

export type TagGradient =
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'twilight'
  | 'rose'
  | 'candy'
  | 'sky'
  | 'fire'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: TagColor | null
  gradient: TagGradient | null
  icon: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface TagWithChildren extends Tag {
  children: TagWithChildren[]
}

export interface TagFormData {
  name: string
  color: TagColor | null
  gradient: TagGradient | null
  icon: string | null
  parent_id: string | null
}
```

**Create `src/types/database.ts`** (extend for future use):

```typescript
import { Tag } from './tag'

export interface Database {
  public: {
    Tables: {
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      // Future tables will be added here
    }
  }
}
```

---

## Step 1.2: Create TagStore

**Create `src/stores/tagStore.ts`**:

```typescript
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Tag, TagWithChildren, TagFormData } from '@/types/tag'
import { useAuthStore } from './authStore'

interface TagState {
  tags: Tag[]
  loading: boolean
  error: string | null

  // Actions
  fetchTags: () => Promise<void>
  createTag: (data: TagFormData) => Promise<{ data: Tag | null; error: Error | null }>
  updateTag: (id: string, data: Partial<TagFormData>) => Promise<{ error: Error | null }>
  deleteTag: (id: string) => Promise<{ error: Error | null }>
  getTagById: (id: string) => Tag | undefined
  getTagHierarchy: () => TagWithChildren[]
  getChildTags: (parentId: string) => Tag[]
  subscribeToTags: () => void
  unsubscribeFromTags: () => void
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ tags: data || [], loading: false })
  },

  createTag: async (data: TagFormData) => {
    const user = useAuthStore.getState().user
    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        ...data,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: [...state.tags, newTag],
    }))

    return { data: newTag, error: null }
  },

  updateTag: async (id: string, data: Partial<TagFormData>) => {
    const { error } = await supabase.from('tags').update(data).eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: state.tags.map(tag => (tag.id === id ? { ...tag, ...data } : tag)),
    }))

    return { error: null }
  },

  deleteTag: async (id: string) => {
    // Check if tag has children
    const children = get().getChildTags(id)
    if (children.length > 0) {
      return { error: new Error('Cannot delete tag with children. Delete or reassign children first.') }
    }

    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: state.tags.filter(tag => tag.id !== id),
    }))

    return { error: null }
  },

  getTagById: (id: string) => {
    return get().tags.find(tag => tag.id === id)
  },

  getTagHierarchy: (): TagWithChildren[] => {
    const { tags } = get()
    const tagMap = new Map<string, TagWithChildren>()
    const roots: TagWithChildren[] = []

    // First pass: Create all tag objects with empty children arrays
    tags.forEach(tag => {
      tagMap.set(tag.id, { ...tag, children: [] })
    })

    // Second pass: Build hierarchy
    tags.forEach(tag => {
      const tagWithChildren = tagMap.get(tag.id)!
      if (tag.parent_id) {
        const parent = tagMap.get(tag.parent_id)
        if (parent) {
          parent.children.push(tagWithChildren)
        } else {
          // Parent doesn't exist, treat as root
          roots.push(tagWithChildren)
        }
      } else {
        roots.push(tagWithChildren)
      }
    })

    // Sort children recursively
    const sortChildren = (tag: TagWithChildren) => {
      tag.children.sort((a, b) => a.name.localeCompare(b.name))
      tag.children.forEach(sortChildren)
    }

    roots.forEach(sortChildren)
    roots.sort((a, b) => a.name.localeCompare(b.name))

    return roots
  },

  getChildTags: (parentId: string): Tag[] => {
    return get().tags.filter(tag => tag.parent_id === parentId)
  },

  subscribeToTags: () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const channel = supabase
      .channel('tags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            set(state => ({
              tags: [...state.tags, payload.new as Tag],
            }))
          } else if (payload.eventType === 'UPDATE') {
            set(state => ({
              tags: state.tags.map(tag =>
                tag.id === payload.new.id ? (payload.new as Tag) : tag
              ),
            }))
          } else if (payload.eventType === 'DELETE') {
            set(state => ({
              tags: state.tags.filter(tag => tag.id !== payload.old.id),
            }))
          }
        }
      )
      .subscribe()

    // Store channel for cleanup
    ;(get() as any).channel = channel
  },

  unsubscribeFromTags: () => {
    const channel = (get() as any).channel
    if (channel) {
      supabase.removeChannel(channel)
    }
  },
}))
```

---

## Step 1.3: Create Tag Color/Gradient Utilities

**Create `src/lib/tag-colors.ts`**:

```typescript
import { TagColor, TagGradient } from '@/types/tag'

export const tagColors: Record<TagColor, { bg: string; text: string; border: string }> = {
  red: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  orange: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
  amber: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  yellow: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  lime: { bg: '#ECFCCB', text: '#3F6212', border: '#BEF264' },
  green: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  emerald: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  teal: { bg: '#CCFBF1', text: '#115E59', border: '#5EEAD4' },
  cyan: { bg: '#CFFAFE', text: '#155E75', border: '#67E8F9' },
  sky: { bg: '#E0F2FE', text: '#075985', border: '#7DD3FC' },
  blue: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  indigo: { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' },
  violet: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  purple: { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
  fuchsia: { bg: '#FAE8FF', text: '#86198F', border: '#F0ABFC' },
  pink: { bg: '#FCE7F3', text: '#9F1239', border: '#F9A8D4' },
  rose: { bg: '#FFE4E6', text: '#9F1239', border: '#FDA4AF' },
  gray: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
}

export const tagGradients: Record<TagGradient, string> = {
  sunset: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
  ocean: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)',
  forest: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
  twilight: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
  rose: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
  candy: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
  sky: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
  fire: 'linear-gradient(135deg, #EAB308 0%, #EF4444 100%)',
}

export function getTagStyle(color: TagColor | null, gradient: TagGradient | null) {
  if (gradient) {
    return {
      background: tagGradients[gradient],
      color: '#FFFFFF',
      border: 'none',
    }
  }

  if (color) {
    const colorDef = tagColors[color]
    return {
      backgroundColor: colorDef.bg,
      color: colorDef.text,
      borderColor: colorDef.border,
    }
  }

  // Default gray
  return {
    backgroundColor: tagColors.gray.bg,
    color: tagColors.gray.text,
    borderColor: tagColors.gray.border,
  }
}
```

---

## Step 1.4: Create Tag Component

**Create `src/components/Tag.tsx`**:

```typescript
import { Tag as TagType } from '@/types/tag'
import { Tag as AntTag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { getTagStyle } from '@/lib/tag-colors'

interface TagProps {
  tag: TagType
  closable?: boolean
  onClose?: () => void
  onClick?: () => void
  className?: string
}

export function Tag({ tag, closable = false, onClose, onClick, className = '' }: TagProps) {
  const style = getTagStyle(tag.color, tag.gradient)

  return (
    <AntTag
      style={style}
      closable={closable}
      onClose={onClose}
      onClick={onClick}
      className={`cursor-pointer border ${className}`}
      closeIcon={<CloseOutlined style={{ color: style.color }} />}
    >
      {tag.icon && <span className="mr-1">{tag.icon}</span>}
      {tag.name}
    </AntTag>
  )
}
```

---

## Step 1.5: Create Tag Management Page

**Create `src/pages/TagsPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Space,
  Typography,
  Tree,
  Dropdown,
  Modal,
  message,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FolderOutlined,
  TagOutlined,
} from '@ant-design/icons'
import type { MenuProps, TreeDataNode } from 'antd'
import { AppLayout } from '@/components/AppLayout'
import { Tag } from '@/components/Tag'
import { TagFormModal } from '@/components/TagFormModal'
import { useTagStore } from '@/stores/tagStore'
import { Tag as TagType, TagWithChildren } from '@/types/tag'

const { Title, Text } = Typography

export function TagsPage() {
  const { tags, loading, fetchTags, deleteTag, subscribeToTags, unsubscribeFromTags, getTagHierarchy } =
    useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  useEffect(() => {
    fetchTags()
    subscribeToTags()
    return () => unsubscribeFromTags()
  }, [fetchTags, subscribeToTags, unsubscribeFromTags])

  const handleCreate = () => {
    setEditingTag(null)
    setIsFormOpen(true)
  }

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag)
    setIsFormOpen(true)
  }

  const handleDelete = (tag: TagType) => {
    Modal.confirm({
      title: `Delete "${tag.name}"?`,
      content: 'This action cannot be undone. Tasks with this tag will not be deleted.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        const { error } = await deleteTag(tag.id)
        if (error) {
          message.error(error.message)
        } else {
          message.success('Tag deleted successfully')
        }
      },
    })
  }

  const handleCreateChild = (parentTag: TagType) => {
    setEditingTag({
      ...parentTag,
      id: '',
      name: '',
      parent_id: parentTag.id,
    } as TagType)
    setIsFormOpen(true)
  }

  const getTagActions = (tag: TagType): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEdit(tag),
    },
    {
      key: 'create-child',
      label: 'Create Child Tag',
      icon: <PlusOutlined />,
      onClick: () => handleCreateChild(tag),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(tag),
    },
  ]

  const buildTreeData = (tagsHierarchy: TagWithChildren[]): TreeDataNode[] => {
    return tagsHierarchy.map(tag => ({
      key: tag.id,
      title: (
        <div className="flex items-center justify-between w-full group">
          <Space>
            {tag.children.length > 0 ? <FolderOutlined /> : <TagOutlined />}
            <Tag tag={tag} />
          </Space>
          <Dropdown menu={{ items: getTagActions(tag) }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="opacity-0 group-hover:opacity-100"
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      ),
      children: tag.children.length > 0 ? buildTreeData(tag.children) : undefined,
    }))
  }

  const treeData = buildTreeData(getTagHierarchy())

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Tags
            </Title>
            <Text type="secondary">Organize your tasks with hierarchical tags</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Tag
          </Button>
        </div>

        <Card>
          {loading && tags.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : tags.length === 0 ? (
            <Empty
              description="No tags yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-12"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Create Your First Tag
              </Button>
            </Empty>
          ) : (
            <Tree
              treeData={treeData}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              showIcon={false}
              selectedKeys={selectedTagId ? [selectedTagId] : []}
              onSelect={keys => setSelectedTagId(keys[0] as string)}
              className="tag-tree"
            />
          )}
        </Card>

        <TagFormModal
          open={isFormOpen}
          tag={editingTag}
          onClose={() => {
            setIsFormOpen(false)
            setEditingTag(null)
          }}
        />
      </div>
    </AppLayout>
  )
}
```

---

## Step 1.6: Create Tag Form Modal

**Create `src/components/TagFormModal.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Space,
  Button,
  message,
  Radio,
  Divider,
  Typography,
} from 'antd'
import { TagOutlined } from '@ant-design/icons'
import { useTagStore } from '@/stores/tagStore'
import { Tag, TagColor, TagGradient, TagFormData } from '@/types/tag'
import { tagColors, tagGradients } from '@/lib/tag-colors'

const { Text } = Typography

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
```

---

## Step 1.7: Create Tag Picker Component

**Create `src/components/TagPicker.tsx`**:

```typescript
import { useState } from 'react'
import { Select, Space, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTagStore } from '@/stores/tagStore'
import { Tag } from '@/components/Tag'
import { Tag as TagType } from '@/types/tag'

interface TagPickerProps {
  value?: string[]
  onChange?: (tagIds: string[]) => void
  onCreateTag?: () => void
  placeholder?: string
  maxTags?: number
}

export function TagPicker({
  value = [],
  onChange,
  onCreateTag,
  placeholder = 'Select tags...',
  maxTags,
}: TagPickerProps) {
  const { tags, getTagById } = useTagStore()
  const [searchValue, setSearchValue] = useState('')

  const selectedTags = value.map(id => getTagById(id)).filter(Boolean) as TagType[]

  const handleChange = (selectedIds: string[]) => {
    onChange?.(selectedIds)
  }

  const tagOptions = tags.map(tag => ({
    label: tag.name,
    value: tag.id,
    tag,
  }))

  return (
    <Space direction="vertical" className="w-full">
      <Select
        mode="multiple"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        searchValue={searchValue}
        onSearch={setSearchValue}
        className="w-full"
        maxCount={maxTags}
        filterOption={(input, option) =>
          (option?.label as string).toLowerCase().includes(input.toLowerCase())
        }
        tagRender={props => {
          const tag = getTagById(props.value as string)
          if (!tag) return null
          return (
            <Tag
              tag={tag}
              closable
              onClose={props.onClose}
              className="!mr-1"
            />
          )
        }}
        dropdownRender={menu => (
          <>
            {menu}
            {onCreateTag && (
              <div className="p-2 border-t">
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={onCreateTag}
                  className="w-full"
                >
                  Create New Tag
                </Button>
              </div>
            )}
          </>
        )}
        options={tagOptions}
      />

      {selectedTags.length > 0 && (
        <Space wrap>
          {selectedTags.map(tag => (
            <Tag
              key={tag.id}
              tag={tag}
              closable
              onClose={() => {
                handleChange(value.filter(id => id !== tag.id))
              }}
            />
          ))}
        </Space>
      )}
    </Space>
  )
}
```

---

## Step 1.8: Add Tags Route

**Update `src/lib/router.tsx`**:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TagsPage } from '@/pages/TagsPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tags',
    element: (
      <ProtectedRoute>
        <TagsPage />
      </ProtectedRoute>
    ),
  },
])
```

---

## Step 1.9: Add Tags Navigation

**Update `src/components/AppLayout.tsx`** to add sidebar navigation:

```typescript
import { ReactNode } from 'react'
import { Layout, Button, Dropdown, Space, Typography, MenuProps, Menu } from 'antd'
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
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

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
      label: 'Dashboard',
      icon: <DashboardOutlined />,
      onClick: () => navigate('/dashboard'),
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

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navMenuItems}
          className="border-r-0"
        />
      </Sider>

      <Layout>
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

        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  )
}
```

---

## Step 1.10: Test Tag System

### Test Tag Creation

1. Start dev server: `npm run dev`
2. Login to the application
3. Navigate to Tags page (sidebar)
4. Click "New Tag" button
5. Create a tag: "Work" with blue color and 🏢 icon
6. **Expected**: Tag appears in the tree
7. Create another tag: "Personal" with green color and 🏡 icon
8. **Expected**: Both tags visible

### Test Tag Hierarchy

1. Click on "Work" tag → Click ⋯ menu → "Create Child Tag"
2. Create "Meetings" as child of "Work"
3. **Expected**: "Meetings" appears nested under "Work"
4. Create "Projects" as another child of "Work"
5. **Expected**: Both children appear under "Work"

### Test Tag Editing

1. Click ⋯ menu on any tag → "Edit"
2. Change name, color, or icon
3. **Expected**: Changes save and display immediately

### Test Tag Deletion

1. Try to delete "Work" (which has children)
2. **Expected**: Error message "Cannot delete tag with children"
3. Delete "Meetings" (no children)
4. **Expected**: Tag deleted successfully

### Test Tag Gradients

1. Create a new tag with gradient style
2. Select "sunset" gradient
3. **Expected**: Tag displays with gradient background

---

## Verification Checklist

Before proceeding to Step 2, verify:

- [ ] Tag types are defined correctly
- [ ] TagStore is created and initialized
- [ ] Tags can be created with colors/gradients
- [ ] Tags can be edited
- [ ] Tags can be deleted (with child check)
- [ ] Tag hierarchy is displayed in tree view
- [ ] Parent/child relationships work
- [ ] Tag picker component renders
- [ ] Tags persist across page refreshes
- [ ] Real-time updates work (test in two browser tabs)
- [ ] Tags page is accessible from sidebar
- [ ] No console errors
- [ ] All Ant Design components render correctly

---

## Troubleshooting

### Issue: Tags not loading

**Solution**:
1. Check Supabase connection in network tab
2. Verify RLS policies are correct for tags table
3. Check user is authenticated
4. Verify `fetchTags()` is called in useEffect

### Issue: Can't delete parent tags

**Solution**: This is expected behavior. Delete or reassign child tags first.

### Issue: Real-time updates not working

**Solution**:
1. Verify Supabase Realtime is enabled for tags table
2. Check subscription is created in `subscribeToTags()`
3. Ensure cleanup happens in `unsubscribeFromTags()`

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 2: Task Data Layer](./step-2-task-data-layer.md)**

This will implement the Task entity, TaskStore, and CRUD operations.

---

## Summary

You've successfully:
- ✅ Created Tag types with TypeScript
- ✅ Implemented TagStore with Zustand
- ✅ Built hierarchical tag system
- ✅ Created tag CRUD operations
- ✅ Implemented tag colors and gradients
- ✅ Built tag management UI with Ant Design Tree
- ✅ Created reusable Tag and TagPicker components
- ✅ Added real-time tag synchronization
- ✅ Added tags navigation to sidebar

**Tags are now ready to be used by tasks in the next step!**
