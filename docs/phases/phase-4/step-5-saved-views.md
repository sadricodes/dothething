# Phase 4, Step 5: Saved Views System

**Duration**: 2 days
**Prerequisite**: Step 4 (Advanced Filters) completed

## Overview

This step implements saved views allowing users to save filter combinations:
- Save current filter state as named view
- Quick view switcher (Cmd/Ctrl+K)
- Default view per page
- View management (edit, delete, duplicate)
- View sharing (export/import)
- View icons and colors
- Recently used views

## Goals

- Create saved views data structure
- Implement view CRUD operations
- Build view switcher UI
- Add keyboard shortcut (Cmd/Ctrl+K)
- Create view management modal
- Add view persistence
- Implement default view settings
- Add view export/import

---

## Step 5.1: Update SavedView Types

**Update `src/types/saved-view.ts`** (already defined in PRD, enhance):

```typescript
export type ViewMode = 'list' | 'kanban' | 'matrix' | 'calendar'

export interface SavedView {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null

  // View configuration
  view_mode: ViewMode
  filters: Record<string, any>
  sort_by: string | null
  sort_order: 'asc' | 'desc' | null

  // Metadata
  is_default: boolean
  is_favorite: boolean
  last_used_at: string | null
  use_count: number

  created_at: string
  updated_at: string
}

export interface SavedViewFormData {
  name: string
  description?: string
  icon?: string
  color?: string
  view_mode: ViewMode
  filters: Record<string, any>
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  is_default?: boolean
  is_favorite?: boolean
}

export const VIEW_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
]

export const VIEW_ICONS = [
  '📋', '📊', '📈', '🎯', '⭐', '🔥', '💼', '🏠',
  '📅', '✅', '🚀', '💡', '🎨', '🔔', '📌', '🎪',
]
```

---

## Step 5.2: Create SavedView Store

**Create `src/stores/savedViewStore.ts`**:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { SavedView, SavedViewFormData, ViewMode } from '@/types/saved-view'
import { useAuthStore } from './authStore'

interface SavedViewState {
  views: SavedView[]
  currentViewId: string | null
  loading: boolean
  error: string | null

  // Actions
  fetchViews: () => Promise<void>
  createView: (data: SavedViewFormData) => Promise<{ data: SavedView | null; error: Error | null }>
  updateView: (id: string, data: Partial<SavedViewFormData>) => Promise<{ error: Error | null }>
  deleteView: (id: string) => Promise<{ error: Error | null }>
  duplicateView: (id: string) => Promise<{ data: SavedView | null; error: Error | null }>

  // View usage
  setCurrentView: (viewId: string | null) => void
  applyView: (viewId: string) => Promise<void>
  setDefaultView: (viewId: string) => Promise<{ error: Error | null }>
  toggleFavorite: (viewId: string) => Promise<{ error: Error | null }>

  // Helpers
  getViewById: (id: string) => SavedView | undefined
  getDefaultView: () => SavedView | undefined
  getFavoriteViews: () => SavedView[]
  getRecentViews: (limit?: number) => SavedView[]

  // Export/Import
  exportView: (viewId: string) => string | null
  importView: (viewData: string) => Promise<{ data: SavedView | null; error: Error | null }>
}

export const useSavedViewStore = create<SavedViewState>()(
  persist(
    (set, get) => ({
      views: [],
      currentViewId: null,
      loading: false,
      error: null,

      fetchViews: async () => {
        set({ loading: true, error: null })

        const { data, error } = await supabase
          .from('saved_views')
          .select('*')
          .order('last_used_at', { ascending: false, nullsFirst: false })
          .order('name', { ascending: true })

        if (error) {
          set({ error: error.message, loading: false })
          return
        }

        set({ views: data || [], loading: false })
      },

      createView: async (formData: SavedViewFormData) => {
        const user = useAuthStore.getState().user
        if (!user) {
          return { data: null, error: new Error('User not authenticated') }
        }

        const { data: newView, error } = await supabase
          .from('saved_views')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
            color: formData.color || null,
            view_mode: formData.view_mode,
            filters: formData.filters,
            sort_by: formData.sort_by || null,
            sort_order: formData.sort_order || null,
            is_default: formData.is_default || false,
            is_favorite: formData.is_favorite || false,
            last_used_at: null,
            use_count: 0,
          })
          .select()
          .single()

        if (error) {
          return { data: null, error: new Error(error.message) }
        }

        set(state => ({
          views: [newView, ...state.views],
        }))

        return { data: newView, error: null }
      },

      updateView: async (id: string, data: Partial<SavedViewFormData>) => {
        const { error } = await supabase
          .from('saved_views')
          .update(data)
          .eq('id', id)

        if (error) {
          return { error: new Error(error.message) }
        }

        set(state => ({
          views: state.views.map(view =>
            view.id === id ? { ...view, ...data, updated_at: new Date().toISOString() } : view
          ),
        }))

        return { error: null }
      },

      deleteView: async (id: string) => {
        const { error } = await supabase.from('saved_views').delete().eq('id', id)

        if (error) {
          return { error: new Error(error.message) }
        }

        set(state => ({
          views: state.views.filter(view => view.id !== id),
          currentViewId: state.currentViewId === id ? null : state.currentViewId,
        }))

        return { error: null }
      },

      duplicateView: async (id: string) => {
        const user = useAuthStore.getState().user
        if (!user) {
          return { data: null, error: new Error('User not authenticated') }
        }

        const originalView = get().getViewById(id)
        if (!originalView) {
          return { data: null, error: new Error('View not found') }
        }

        const { data: newView, error } = await supabase
          .from('saved_views')
          .insert({
            user_id: user.id,
            name: `${originalView.name} (Copy)`,
            description: originalView.description,
            icon: originalView.icon,
            color: originalView.color,
            view_mode: originalView.view_mode,
            filters: originalView.filters,
            sort_by: originalView.sort_by,
            sort_order: originalView.sort_order,
            is_default: false,
            is_favorite: false,
            last_used_at: null,
            use_count: 0,
          })
          .select()
          .single()

        if (error) {
          return { data: null, error: new Error(error.message) }
        }

        set(state => ({
          views: [newView, ...state.views],
        }))

        return { data: newView, error: null }
      },

      setCurrentView: (viewId: string | null) => {
        set({ currentViewId: viewId })
      },

      applyView: async (viewId: string) => {
        const view = get().getViewById(viewId)
        if (!view) return

        // Update usage stats
        await supabase
          .from('saved_views')
          .update({
            last_used_at: new Date().toISOString(),
            use_count: view.use_count + 1,
          })
          .eq('id', viewId)

        // Update local state
        set(state => ({
          currentViewId: viewId,
          views: state.views.map(v =>
            v.id === viewId
              ? { ...v, last_used_at: new Date().toISOString(), use_count: v.use_count + 1 }
              : v
          ),
        }))
      },

      setDefaultView: async (viewId: string) => {
        // Clear other defaults
        await supabase.from('saved_views').update({ is_default: false }).neq('id', viewId)

        // Set new default
        const { error } = await supabase
          .from('saved_views')
          .update({ is_default: true })
          .eq('id', viewId)

        if (error) {
          return { error: new Error(error.message) }
        }

        set(state => ({
          views: state.views.map(view => ({
            ...view,
            is_default: view.id === viewId,
          })),
        }))

        return { error: null }
      },

      toggleFavorite: async (viewId: string) => {
        const view = get().getViewById(viewId)
        if (!view) return { error: new Error('View not found') }

        const newFavoriteState = !view.is_favorite

        const { error } = await supabase
          .from('saved_views')
          .update({ is_favorite: newFavoriteState })
          .eq('id', viewId)

        if (error) {
          return { error: new Error(error.message) }
        }

        set(state => ({
          views: state.views.map(v =>
            v.id === viewId ? { ...v, is_favorite: newFavoriteState } : v
          ),
        }))

        return { error: null }
      },

      getViewById: (id: string) => {
        return get().views.find(view => view.id === id)
      },

      getDefaultView: () => {
        return get().views.find(view => view.is_default)
      },

      getFavoriteViews: () => {
        return get().views.filter(view => view.is_favorite)
      },

      getRecentViews: (limit: number = 5) => {
        return [...get().views]
          .filter(view => view.last_used_at)
          .sort((a, b) => {
            const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
            const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0
            return bTime - aTime
          })
          .slice(0, limit)
      },

      exportView: (viewId: string) => {
        const view = get().getViewById(viewId)
        if (!view) return null

        const exportData = {
          name: view.name,
          description: view.description,
          icon: view.icon,
          color: view.color,
          view_mode: view.view_mode,
          filters: view.filters,
          sort_by: view.sort_by,
          sort_order: view.sort_order,
        }

        return JSON.stringify(exportData, null, 2)
      },

      importView: async (viewData: string) => {
        try {
          const parsed = JSON.parse(viewData)

          const formData: SavedViewFormData = {
            name: parsed.name || 'Imported View',
            description: parsed.description,
            icon: parsed.icon,
            color: parsed.color,
            view_mode: parsed.view_mode || 'list',
            filters: parsed.filters || {},
            sort_by: parsed.sort_by,
            sort_order: parsed.sort_order,
          }

          return await get().createView(formData)
        } catch (error: any) {
          return { data: null, error: new Error('Invalid view data') }
        }
      },
    }),
    {
      name: 'saved-views-storage',
      partialize: state => ({
        currentViewId: state.currentViewId,
      }),
    }
  )
)
```

---

## Step 5.3: Create View Switcher Modal

**Create `src/components/ViewSwitcherModal.tsx`**:

```typescript
import { useState, useEffect } from 'react'
import { Modal, Input, List, Space, Typography, Tag, Button, Empty } from 'antd'
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { useSavedViewStore } from '@/stores/savedViewStore'
import { useTaskStore } from '@/stores/taskStore'
import { SavedView } from '@/types/saved-view'

const { Text } = Typography

interface ViewSwitcherModalProps {
  open: boolean
  onClose: () => void
}

export function ViewSwitcherModal({ open, onClose }: ViewSwitcherModalProps) {
  const { views, currentViewId, applyView, toggleFavorite } = useSavedViewStore()
  const { setFilters, clearFilters, setSortBy } = useTaskStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  const filteredViews = views.filter(view =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectView = async (view: SavedView) => {
    // Apply view filters and sorting
    clearFilters()
    setFilters(view.filters)
    if (view.sort_by) {
      setSortBy(view.sort_by as any, view.sort_order as any)
    }

    await applyView(view.id)
    onClose()
  }

  return (
    <Modal
      title="Switch View"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" className="w-full" size="middle">
        {/* Search */}
        <Input
          placeholder="Search views..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          autoFocus
          size="large"
        />

        {/* Views List */}
        {filteredViews.length === 0 ? (
          <Empty description="No views found" className="py-8" />
        ) : (
          <List
            dataSource={filteredViews}
            renderItem={view => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentViewId === view.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectView(view)}
                actions={[
                  <Button
                    key="favorite"
                    type="text"
                    size="small"
                    icon={
                      view.is_favorite ? (
                        <StarFilled className="text-yellow-500" />
                      ) : (
                        <StarOutlined />
                      )
                    }
                    onClick={e => {
                      e.stopPropagation()
                      toggleFavorite(view.id)
                    }}
                  />,
                ]}
              >
                <Space className="w-full justify-between">
                  <Space>
                    {view.icon && <Text className="text-xl">{view.icon}</Text>}
                    <div>
                      <Space size="small">
                        <Text strong>{view.name}</Text>
                        {currentViewId === view.id && (
                          <CheckOutlined className="text-blue-500" />
                        )}
                      </Space>
                      {view.description && (
                        <div>
                          <Text type="secondary" className="text-xs">
                            {view.description}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Space>

                  <Space size="small">
                    {view.is_default && <Tag color="blue">Default</Tag>}
                    <Tag
                      style={{ backgroundColor: view.color || undefined }}
                      className="text-white"
                    >
                      {view.view_mode}
                    </Tag>
                    {view.use_count > 0 && (
                      <Text type="secondary" className="text-xs">
                        <ClockCircleOutlined /> {view.use_count}
                      </Text>
                    )}
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Modal>
  )
}
```

---

## Step 5.4: Create View Management Modal

**Create `src/components/ViewManagementModal.tsx`**:

```typescript
import { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  ColorPicker,
  Switch,
} from 'antd'
import {
  SaveOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useSavedViewStore } from '@/stores/savedViewStore'
import { useTaskStore } from '@/stores/taskStore'
import { SavedView, VIEW_ICONS, VIEW_COLORS, ViewMode } from '@/types/saved-view'

const { TextArea } = Input

interface ViewManagementModalProps {
  open: boolean
  onClose: () => void
  view?: SavedView
}

export function ViewManagementModal({ open, onClose, view }: ViewManagementModalProps) {
  const {
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
    exportView,
    importView,
  } = useSavedViewStore()
  const { filters, sortBy, sortOrder } = useTaskStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isEditing = !!view

  useEffect(() => {
    if (open) {
      if (view) {
        form.setFieldsValue(view)
      } else {
        form.resetFields()
        form.setFieldsValue({
          view_mode: 'list',
          filters: filters,
          sort_by: sortBy,
          sort_order: sortOrder,
        })
      }
    }
  }, [open, view, form, filters, sortBy, sortOrder])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (isEditing) {
        const { error } = await updateView(view.id, values)
        if (error) {
          message.error(error.message)
        } else {
          message.success('View updated')
          onClose()
        }
      } else {
        const { error } = await createView({
          ...values,
          filters: filters,
          sort_by: sortBy,
          sort_order: sortOrder,
        })
        if (error) {
          message.error(error.message)
        } else {
          message.success('View created')
          onClose()
        }
      }
    } catch (error) {
      // Form validation failed
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!view) return

    Modal.confirm({
      title: 'Delete View?',
      content: `Are you sure you want to delete "${view.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        const { error } = await deleteView(view.id)
        if (error) {
          message.error(error.message)
        } else {
          message.success('View deleted')
          onClose()
        }
      },
    })
  }

  const handleDuplicate = async () => {
    if (!view) return

    const { error } = await duplicateView(view.id)
    if (error) {
      message.error(error.message)
    } else {
      message.success('View duplicated')
    }
  }

  const handleExport = () => {
    if (!view) return

    const data = exportView(view.id)
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${view.name}.json`
      a.click()
      message.success('View exported')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const text = await file.text()
        const { error } = await importView(text)
        if (error) {
          message.error(error.message)
        } else {
          message.success('View imported')
        }
      }
    }
    input.click()
  }

  return (
    <Modal
      title={isEditing ? 'Edit View' : 'Save Current View'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="My Custom View" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={2} placeholder="Optional description..." />
        </Form.Item>

        <Space className="w-full" size="large">
          <Form.Item label="Icon" name="icon">
            <Select style={{ width: 120 }}>
              {VIEW_ICONS.map(icon => (
                <Select.Option key={icon} value={icon}>
                  <span className="text-xl">{icon}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Select style={{ width: 120 }}>
              {VIEW_COLORS.map(color => (
                <Select.Option key={color.value} value={color.value}>
                  <Space>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        backgroundColor: color.value,
                        borderRadius: 4,
                      }}
                    />
                    {color.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="View Mode" name="view_mode">
            <Select style={{ width: 120 }}>
              <Select.Option value="list">List</Select.Option>
              <Select.Option value="kanban">Kanban</Select.Option>
              <Select.Option value="matrix">Matrix</Select.Option>
            </Select>
          </Form.Item>
        </Space>

        <Space className="w-full">
          <Form.Item label="Set as Default" name="is_default" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Add to Favorites" name="is_favorite" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

        <Space className="w-full justify-between mt-4">
          <Space>
            {isEditing && (
              <>
                <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
                  Duplicate
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                  Export
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
            {!isEditing && (
              <Button icon={<UploadOutlined />} onClick={handleImport}>
                Import
              </Button>
            )}
          </Space>

          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
              {isEditing ? 'Update' : 'Save'} View
            </Button>
          </Space>
        </Space>
      </Form>
    </Modal>
  )
}
```

---

## Step 5.5: Add Keyboard Shortcut Hook

**Create `src/hooks/useViewSwitcherShortcut.ts`**:

```typescript
import { useEffect } from 'react'

export function useViewSwitcherShortcut(onTrigger: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onTrigger()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onTrigger, enabled])
}
```

---

## Step 5.6: Add View Controls to All Tasks Page

**Update `src/pages/AllTasksPage.tsx`**:

```typescript
import { useState } from 'react'
import { ViewSwitcherModal } from '@/components/ViewSwitcherModal'
import { ViewManagementModal } from '@/components/ViewManagementModal'
import { useViewSwitcherShortcut } from '@/hooks/useViewSwitcherShortcut'
import { useSavedViewStore } from '@/stores/savedViewStore'
import { Button, Space, Dropdown } from 'antd'
import { EyeOutlined, SaveOutlined, DownOutlined } from '@ant-design/icons'

// In component:
const [switcherOpen, setSwitcherOpen] = useState(false)
const [manageOpen, setManageOpen] = useState(false)
const { currentViewId, getViewById } = useSavedViewStore()

useViewSwitcherShortcut(() => setSwitcherOpen(true))

const currentView = currentViewId ? getViewById(currentViewId) : null

// Add to header:
<Space>
  <Dropdown
    menu={{
      items: [
        {
          key: 'switch',
          label: 'Switch View',
          icon: <EyeOutlined />,
          onClick: () => setSwitcherOpen(true),
        },
        {
          key: 'save',
          label: currentView ? 'Update View' : 'Save as View',
          icon: <SaveOutlined />,
          onClick: () => setManageOpen(true),
        },
      ],
    }}
  >
    <Button>
      {currentView ? (
        <>
          {currentView.icon} {currentView.name}
        </>
      ) : (
        'Views'
      )}
      <DownOutlined />
    </Button>
  </Dropdown>
</Space>

// Add modals before closing tag:
<ViewSwitcherModal open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
<ViewManagementModal
  open={manageOpen}
  onClose={() => setManageOpen(false)}
  view={currentView || undefined}
/>
```

---

## Step 5.7: Test Saved Views

### Test View Creation

1. Apply filters on All Tasks page
2. Click "Save as View"
3. Name it "Urgent Tasks", add icon and color
4. **Expected**: View saved, appears in switcher

### Test View Switcher

1. Press Cmd/Ctrl+K
2. **Expected**: Switcher modal opens
3. Type to search views
4. Click a view
5. **Expected**: Filters apply, modal closes

### Test View Management

1. Open saved view
2. Click "Update View"
3. Change name or settings
4. **Expected**: View updates

### Test Export/Import

1. Export a view
2. **Expected**: JSON file downloads
3. Import the file
4. **Expected**: View recreated

### Test Default View

1. Mark a view as default
2. Refresh page
3. **Expected**: Default view loads automatically

---

## Verification Checklist

Before proceeding to Step 6, verify:

- [ ] Views can be created with current filters
- [ ] View switcher opens with Cmd/Ctrl+K
- [ ] Views can be edited and deleted
- [ ] Default view loads on page load
- [ ] Favorite views work
- [ ] View export/import works
- [ ] View usage tracking works
- [ ] Recent views shown correctly
- [ ] View icons and colors display
- [ ] No console errors

---

## Next Steps

Once verified, proceed to:
- **[Step 6: Notifications System](./step-6-notifications.md)**

---

## Summary

You've successfully:
- ✅ Created saved views system
- ✅ Built view switcher with keyboard shortcut
- ✅ Implemented view management
- ✅ Added view export/import
- ✅ Created default and favorite views
- ✅ Added view usage tracking

**Saved views provide powerful custom workspace configurations!**
