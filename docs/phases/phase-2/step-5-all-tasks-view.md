# Phase 2, Step 5: All Tasks View

**Duration**: 2-3 days
**Prerequisite**: Step 4 (Today Dashboard) completed

## Overview

This step implements a comprehensive "All Tasks" view with:
- Advanced filtering (status, type, tags, priority, dates)
- Multiple sorting options
- Search functionality
- Bulk actions
- Task grouping options
- Filter presets
- Export/import capabilities (basic)

## Goals

- Create All Tasks page
- Implement comprehensive filter UI
- Add search functionality
- Support multiple sort options
- Add task grouping (by status, type, priority)
- Create filter presets (Quick filters)
- Implement bulk selection and actions
- Add keyboard shortcuts

---

## Step 5.1: Create Filter Bar Component

**Create `src/components/TaskFilterBar.tsx`**:

```typescript
import { Space, Select, Button, Input, DatePicker, Checkbox } from 'antd'
import {
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'
import { TaskStatus, TaskType, TaskSortBy, TaskSortOrder } from '@/types/task'
import { taskStatusConfig, taskTypeConfig } from '@/lib/task-utils'
import type { DatePickerProps } from 'antd'

const { RangePicker } = DatePicker

export function TaskFilterBar() {
  const { filters, sortBy, sortOrder, setFilters, clearFilters, setSortBy } = useTaskStore()
  const { tags } = useTagStore()

  const statusOptions = Object.entries(taskStatusConfig).map(([value, config]) => ({
    label: config.label,
    value: value as TaskStatus,
  }))

  const typeOptions = Object.entries(taskTypeConfig).map(([value, config]) => ({
    label: `${config.icon} ${config.label}`,
    value: value as TaskType,
  }))

  const tagOptions = tags.map(tag => ({
    label: tag.name,
    value: tag.id,
  }))

  const sortOptions: { label: string; value: TaskSortBy }[] = [
    { label: 'Created Date', value: 'created_at' },
    { label: 'Updated Date', value: 'updated_at' },
    { label: 'Due Date', value: 'due_date' },
    { label: 'Scheduled Date', value: 'scheduled_date' },
    { label: 'Title', value: 'title' },
    { label: 'Order', value: 'order_index' },
  ]

  const sortOrderOptions: { label: string; value: TaskSortOrder }[] = [
    { label: '↑ Asc', value: 'asc' },
    { label: '↓ Desc', value: 'desc' },
  ]

  const hasActiveFilters =
    Object.keys(filters).length > 0 &&
    Object.values(filters).some(v => v !== undefined && v !== null && v !== '')

  return (
    <Space direction="vertical" className="w-full" size="middle">
      {/* Search */}
      <Input
        placeholder="Search tasks..."
        prefix={<SearchOutlined />}
        value={filters.search || ''}
        onChange={e => setFilters({ search: e.target.value })}
        size="large"
        allowClear
      />

      {/* Filters Row 1 */}
      <Space wrap>
        <Select
          mode="multiple"
          placeholder="Status"
          value={filters.status || []}
          onChange={status => setFilters({ status })}
          options={statusOptions}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
        />

        <Select
          mode="multiple"
          placeholder="Type"
          value={filters.type || []}
          onChange={type => setFilters({ type })}
          options={typeOptions}
          style={{ minWidth: 150 }}
          maxTagCount="responsive"
        />

        <Select
          mode="multiple"
          placeholder="Tags"
          value={filters.tags || []}
          onChange={tags => setFilters({ tags })}
          options={tagOptions}
          style={{ minWidth: 200 }}
          maxTagCount="responsive"
          showSearch
          optionFilterProp="label"
        />
      </Space>

      {/* Filters Row 2 */}
      <Space wrap>
        <Space.Compact>
          <Button
            type={filters.is_urgent === true ? 'primary' : 'default'}
            onClick={() =>
              setFilters({
                is_urgent: filters.is_urgent === true ? undefined : true,
              })
            }
          >
            🔥 Urgent
          </Button>
          <Button
            type={filters.is_important === true ? 'primary' : 'default'}
            onClick={() =>
              setFilters({
                is_important: filters.is_important === true ? undefined : true,
              })
            }
          >
            ⭐ Important
          </Button>
        </Space.Compact>

        <Button
          type={filters.is_overdue === true ? 'primary' : 'default'}
          danger={filters.is_overdue === true}
          onClick={() =>
            setFilters({
              is_overdue: filters.is_overdue === true ? undefined : true,
            })
          }
        >
          Overdue
        </Button>

        <Button
          type={filters.scheduled_for_today === true ? 'primary' : 'default'}
          onClick={() =>
            setFilters({
              scheduled_for_today:
                filters.scheduled_for_today === true ? undefined : true,
            })
          }
        >
          Today
        </Button>

        <Button
          type={filters.has_due_date === true ? 'primary' : 'default'}
          onClick={() =>
            setFilters({
              has_due_date: filters.has_due_date === true ? undefined : true,
            })
          }
        >
          Has Due Date
        </Button>
      </Space>

      {/* Sort & Actions */}
      <Space wrap className="w-full justify-between">
        <Space>
          <SortAscendingOutlined />
          <Select
            value={sortBy}
            onChange={value => setSortBy(value, sortOrder)}
            options={sortOptions}
            style={{ width: 150 }}
          />
          <Select
            value={sortOrder}
            onChange={value => setSortBy(sortBy, value)}
            options={sortOrderOptions}
            style={{ width: 100 }}
          />
        </Space>

        {hasActiveFilters && (
          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Space>
    </Space>
  )
}
```

---

## Step 5.2: Create Quick Filters Component

**Create `src/components/QuickFilters.tsx`**:

```typescript
import { Space, Button, Badge } from 'antd'
import {
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  FireOutlined,
  StarOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useTaskStore } from '@/stores/taskStore'
import { TaskFilters } from '@/types/task'

interface QuickFilter {
  label: string
  icon: React.ReactNode
  filters: Partial<TaskFilters>
  count?: number
}

export function QuickFilters() {
  const { tasks, setFilters, clearFilters, filters } = useTaskStore()

  const quickFilters: QuickFilter[] = [
    {
      label: 'All Active',
      icon: <InboxOutlined />,
      filters: { status: ['ready', 'in_progress', 'blocked'] },
      count: tasks.filter(t =>
        ['ready', 'in_progress', 'blocked'].includes(t.status)
      ).length,
    },
    {
      label: 'Ready',
      icon: <InboxOutlined />,
      filters: { status: ['ready'] },
      count: tasks.filter(t => t.status === 'ready').length,
    },
    {
      label: 'In Progress',
      icon: <ClockCircleOutlined />,
      filters: { status: ['in_progress'] },
      count: tasks.filter(t => t.status === 'in_progress').length,
    },
    {
      label: 'Blocked',
      icon: <PauseCircleOutlined />,
      filters: { status: ['blocked'] },
      count: tasks.filter(t => t.status === 'blocked').length,
    },
    {
      label: 'Completed',
      icon: <CheckCircleOutlined />,
      filters: { status: ['completed'] },
      count: tasks.filter(t => t.status === 'completed').length,
    },
    {
      label: 'Urgent & Important',
      icon: <FireOutlined />,
      filters: { is_urgent: true, is_important: true },
      count: tasks.filter(t => t.is_urgent && t.is_important && t.status !== 'completed' && t.status !== 'archived').length,
    },
    {
      label: 'Important',
      icon: <StarOutlined />,
      filters: { is_important: true },
      count: tasks.filter(t => t.is_important && t.status !== 'completed' && t.status !== 'archived').length,
    },
    {
      label: 'Scheduled Today',
      icon: <CalendarOutlined />,
      filters: { scheduled_for_today: true },
      count: tasks.filter(t => {
        if (!t.scheduled_date) return false
        return new Date(t.scheduled_date).toDateString() === new Date().toDateString()
      }).length,
    },
  ]

  const isFilterActive = (filter: Partial<TaskFilters>) => {
    return JSON.stringify(filter) === JSON.stringify(filters)
  }

  const handleQuickFilter = (filter: Partial<TaskFilters>) => {
    if (isFilterActive(filter)) {
      clearFilters()
    } else {
      clearFilters()
      setFilters(filter)
    }
  }

  return (
    <Space wrap>
      {quickFilters.map((qf, index) => (
        <Badge key={index} count={qf.count} overflowCount={999}>
          <Button
            icon={qf.icon}
            type={isFilterActive(qf.filters) ? 'primary' : 'default'}
            onClick={() => handleQuickFilter(qf.filters)}
          >
            {qf.label}
          </Button>
        </Badge>
      ))}
    </Space>
  )
}
```

---

## Step 5.3: Create Task Grouping Component

**Create `src/components/GroupedTaskList.tsx`**:

```typescript
import { Card, Typography, Space, Divider, Empty } from 'antd'
import { TaskWithTags, TaskStatus, TaskType } from '@/types/task'
import { TaskList } from './TaskList'
import { taskStatusConfig, taskTypeConfig, getTaskPriorityQuadrant } from '@/lib/task-utils'

const { Title } = Typography

interface GroupedTaskListProps {
  tasks: TaskWithTags[]
  groupBy: 'status' | 'type' | 'priority' | 'none'
}

export function GroupedTaskList({ tasks, groupBy }: GroupedTaskListProps) {
  if (groupBy === 'none') {
    return <TaskList tasks={tasks} />
  }

  if (groupBy === 'status') {
    const groups: Record<TaskStatus, TaskWithTags[]> = {
      ready: [],
      in_progress: [],
      blocked: [],
      completed: [],
      archived: [],
    }

    tasks.forEach(task => {
      groups[task.status].push(task)
    })

    return (
      <Space direction="vertical" className="w-full" size="large">
        {(Object.keys(groups) as TaskStatus[]).map(status => {
          const statusTasks = groups[status]
          if (statusTasks.length === 0) return null

          return (
            <Card
              key={status}
              title={
                <Space>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: taskStatusConfig[status].color,
                      display: 'inline-block',
                    }}
                  />
                  <span>
                    {taskStatusConfig[status].label} ({statusTasks.length})
                  </span>
                </Space>
              }
            >
              <TaskList tasks={statusTasks} compact />
            </Card>
          )
        })}
      </Space>
    )
  }

  if (groupBy === 'type') {
    const groups: Record<TaskType, TaskWithTags[]> = {
      task: [],
      habit: [],
      recurring: [],
      someday: [],
    }

    tasks.forEach(task => {
      groups[task.type].push(task)
    })

    return (
      <Space direction="vertical" className="w-full" size="large">
        {(Object.keys(groups) as TaskType[]).map(type => {
          const typeTasks = groups[type]
          if (typeTasks.length === 0) return null

          return (
            <Card
              key={type}
              title={
                <Space>
                  <span>{taskTypeConfig[type].icon}</span>
                  <span>
                    {taskTypeConfig[type].label} ({typeTasks.length})
                  </span>
                </Space>
              }
            >
              <TaskList tasks={typeTasks} compact />
            </Card>
          )
        })}
      </Space>
    )
  }

  if (groupBy === 'priority') {
    const quadrants: Record<1 | 2 | 3 | 4 | 0, TaskWithTags[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      0: [], // No priority set
    }

    tasks.forEach(task => {
      const quadrant = getTaskPriorityQuadrant(task) || 0
      quadrants[quadrant].push(task)
    })

    const quadrantLabels = {
      1: '🔥 Do First (Urgent & Important)',
      2: '📅 Schedule (Not Urgent but Important)',
      3: '👥 Delegate (Urgent but Not Important)',
      4: '🗑️ Eliminate (Not Urgent & Not Important)',
      0: '⚪ No Priority Set',
    }

    return (
      <Space direction="vertical" className="w-full" size="large">
        {([1, 2, 3, 4, 0] as const).map(quadrant => {
          const quadrantTasks = quadrants[quadrant]
          if (quadrantTasks.length === 0) return null

          return (
            <Card
              key={quadrant}
              title={`${quadrantLabels[quadrant]} (${quadrantTasks.length})`}
            >
              <TaskList tasks={quadrantTasks} compact />
            </Card>
          )
        })}
      </Space>
    )
  }

  return null
}
```

---

## Step 5.4: Create All Tasks Page

**Create `src/pages/AllTasksPage.tsx`**:

```typescript
import { useEffect, useState } from 'react'
import {
  Typography,
  Space,
  Button,
  Card,
  Segmented,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd'
import {
  UnorderedListOutlined,
  PlusOutlined,
  AppstoreOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { AppLayout } from '@/components/AppLayout'
import { TaskFilterBar } from '@/components/TaskFilterBar'
import { QuickFilters } from '@/components/QuickFilters'
import { GroupedTaskList } from '@/components/GroupedTaskList'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useTaskStore } from '@/stores/taskStore'
import { useTagStore } from '@/stores/tagStore'

const { Title, Text } = Typography

type GroupMode = 'none' | 'status' | 'type' | 'priority'

export function AllTasksPage() {
  const {
    fetchTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
    getFilteredTasks,
  } = useTaskStore()
  const { fetchTags } = useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [groupMode, setGroupMode] = useState<GroupMode>('none')

  useEffect(() => {
    fetchTasks()
    fetchTags()
    subscribeToTasks()
    return () => unsubscribeFromTasks()
  }, [fetchTasks, fetchTags, subscribeToTasks, unsubscribeFromTasks])

  const filteredTasks = getFilteredTasks()

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              All Tasks
            </Title>
            <Text type="secondary">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormOpen(true)}
            size="large"
          >
            New Task
          </Button>
        </div>

        {/* Quick Filters */}
        <Card className="mb-4">
          <Space direction="vertical" className="w-full" size="middle">
            <div>
              <Text strong className="block mb-2">
                Quick Filters
              </Text>
              <QuickFilters />
            </div>

            <Divider className="!my-2" />

            <div>
              <Text strong className="block mb-2">
                Advanced Filters
              </Text>
              <TaskFilterBar />
            </div>
          </Space>
        </Card>

        {/* Group By Options */}
        <div className="mb-4">
          <Space align="center">
            <Text strong>Group by:</Text>
            <Segmented
              value={groupMode}
              onChange={value => setGroupMode(value as GroupMode)}
              options={[
                {
                  label: 'None',
                  value: 'none',
                  icon: <UnorderedListOutlined />,
                },
                {
                  label: 'Status',
                  value: 'status',
                  icon: <AppstoreOutlined />,
                },
                {
                  label: 'Type',
                  value: 'type',
                  icon: <AppstoreOutlined />,
                },
                {
                  label: 'Priority',
                  value: 'priority',
                  icon: <BarChartOutlined />,
                },
              ]}
            />
          </Space>
        </div>

        {/* Task List */}
        <GroupedTaskList tasks={filteredTasks} groupBy={groupMode} />

        {/* Task Form Modal */}
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

## Step 5.5: Update Router

**Update `src/lib/router.tsx`**:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { TodayPage } from '@/pages/TodayPage'
import { AllTasksPage } from '@/pages/AllTasksPage'
import { TagsPage } from '@/pages/TagsPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/today" replace />,
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
    path: '/today',
    element: (
      <ProtectedRoute>
        <TodayPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    element: (
      <ProtectedRoute>
        <AllTasksPage />
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

## Step 5.6: Update Sidebar Navigation

**Update `src/components/AppLayout.tsx`**:

```typescript
// Add to navMenuItems
const navMenuItems: MenuProps['items'] = [
  {
    key: '/today',
    label: 'Today',
    icon: <CalendarOutlined />,
    onClick: () => navigate('/today'),
  },
  {
    key: '/tasks',
    label: 'All Tasks',
    icon: <UnorderedListOutlined />,
    onClick: () => navigate('/tasks'),
  },
  {
    key: '/tags',
    label: 'Tags',
    icon: <TagOutlined />,
    onClick: () => navigate('/tags'),
  },
]
```

---

## Step 5.7: Test All Tasks View

### Test Basic Filtering

1. Navigate to `/tasks`
2. Select "In Progress" from Status filter
3. **Expected**: Only in-progress tasks shown
4. Add "Urgent" filter
5. **Expected**: Only urgent + in-progress tasks shown
6. Click "Clear Filters"
7. **Expected**: All tasks shown again

### Test Search

1. Type search term in search box
2. **Expected**: Tasks filtered by title/description/notes
3. Clear search
4. **Expected**: All tasks shown

### Test Quick Filters

1. Click "Urgent & Important" quick filter
2. **Expected**: Only Q1 tasks shown, button highlighted
3. Click same button again
4. **Expected**: Filter cleared, all tasks shown

### Test Sorting

1. Select "Title" from sort dropdown
2. Select "Asc" order
3. **Expected**: Tasks sorted A-Z by title
4. Change to "Desc"
5. **Expected**: Tasks sorted Z-A

### Test Grouping

1. Select "Group by: Status"
2. **Expected**: Tasks grouped into cards by status
3. Change to "Group by: Priority"
4. **Expected**: Tasks grouped by Eisenhower quadrants
5. Change to "Group by: Type"
6. **Expected**: Tasks grouped by task type

### Test Filter Persistence

1. Set multiple filters
2. Navigate to Today page
3. Return to All Tasks
4. **Expected**: Filters are still applied

### Test Tag Filtering

1. Select 2-3 tags from Tags filter
2. **Expected**: Only tasks with ANY of those tags shown
3. Tasks must have at least one selected tag

---

## Verification Checklist

Before proceeding to Phase 3, verify:

- [ ] All Tasks page loads correctly
- [ ] Search filters tasks by content
- [ ] Status filter works (multi-select)
- [ ] Type filter works (multi-select)
- [ ] Tag filter works (multi-select)
- [ ] Priority filters work (Urgent/Important)
- [ ] Quick filters work and show counts
- [ ] Sorting works (all fields, both orders)
- [ ] Grouping works (status, type, priority)
- [ ] Clear filters button works
- [ ] Filter persistence works
- [ ] Task creation from this page works
- [ ] All task interactions work (complete, edit, delete)
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] No console errors

---

## Troubleshooting

### Issue: Filters not working

**Solution**:
1. Check getFilteredTasks implementation
2. Verify filter state updates correctly
3. Check filter logic for each filter type

### Issue: Grouping not showing all groups

**Solution**:
1. Verify all groups are defined
2. Check that empty groups are hidden (expected)
3. Ensure tasks have correct field values

### Issue: Search not finding tasks

**Solution**:
1. Check search logic includes title, description, notes
2. Verify case-insensitive comparison
3. Ensure search term is trimmed

### Issue: Quick filters count wrong

**Solution**:
1. Verify count logic matches filter logic
2. Check for status exclusions (completed/archived)
3. Ensure real-time updates trigger recounts

---

## Next Steps

**🎉 Phase 2 Complete!**

All verification checks should pass. You now have:
- ✅ Complete tag system with hierarchy
- ✅ Full task CRUD with real-time sync
- ✅ Comprehensive task UI components
- ✅ Today dashboard with quick actions
- ✅ Advanced filtering and search
- ✅ Multiple view modes and grouping

**Proceed to Phase 3**:
- **[Phase 3: Advanced Task Features](../phase-3/step-1-parent-child-tasks.md)**

This will implement parent/child tasks, recurring tasks, habits, and someday tasks.

---

## Summary

You've successfully:
- ✅ Created comprehensive filter bar with all filter types
- ✅ Implemented quick filters with task counts
- ✅ Built task grouping (status, type, priority)
- ✅ Added search functionality
- ✅ Implemented advanced sorting
- ✅ Created filter persistence
- ✅ Built All Tasks page
- ✅ Added All Tasks to navigation
- ✅ Tested all filtering combinations

**Phase 2 is complete! The core task management system is fully functional.**
