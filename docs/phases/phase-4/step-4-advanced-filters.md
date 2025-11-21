# Phase 4, Step 4: Advanced Filter System (Enhanced)

**Duration**: 1 day
**Prerequisite**: Step 3 (Kanban Board) completed

## Overview

This step enhances the existing filter system with:
- Filter presets (common filter combinations)
- Filter operator logic (AND/OR)
- Date range filters
- Custom field filters
- Filter persistence per view
- Filter count badges
- Quick filter chips

## Goals

- Enhance existing filter bar
- Add filter presets
- Implement AND/OR logic
- Add date range filtering
- Create filter chips for quick removal
- Add filter count indicators
- Persist filters per view

---

## Step 4.1: Create Filter Preset Types

**Create `src/types/filter-presets.ts`**:

```typescript
import { TaskFilters } from './task'

export interface FilterPreset {
  id: string
  name: string
  icon: string
  filters: TaskFilters
  isSystem: boolean
}

export const SYSTEM_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'today',
    name: 'Due Today',
    icon: '📅',
    filters: {
      scheduled_for_today: true,
      status: ['ready', 'in_progress'],
    },
    isSystem: true,
  },
  {
    id: 'overdue',
    name: 'Overdue',
    icon: '⚠️',
    filters: {
      is_overdue: true,
      status: ['ready', 'in_progress', 'blocked'],
    },
    isSystem: true,
  },
  {
    id: 'urgent-important',
    name: 'Urgent & Important',
    icon: '🔥',
    filters: {
      is_urgent: true,
      is_important: true,
      status: ['ready', 'in_progress'],
    },
    isSystem: true,
  },
  {
    id: 'this-week',
    name: 'This Week',
    icon: '📆',
    filters: {
      // Will be handled with date range logic
    },
    isSystem: true,
  },
  {
    id: 'no-due-date',
    name: 'No Due Date',
    icon: '❓',
    filters: {
      has_due_date: false,
      status: ['ready', 'in_progress'],
    },
    isSystem: true,
  },
]
```

---

## Step 4.2: Create Filter Chips Component

**Create `src/components/FilterChips.tsx`**:

```typescript
import { Space, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { TaskFilters } from '@/types/task'
import { useTagStore } from '@/stores/tagStore'
import { taskStatusConfig, taskTypeConfig } from '@/lib/task-utils'

interface FilterChipsProps {
  filters: TaskFilters
  onRemoveFilter: (filterKey: keyof TaskFilters, value?: any) => void
}

export function FilterChips({ filters, onRemoveFilter }: FilterChipsProps) {
  const { getTagById } = useTagStore()
  const chips: { label: string; onClose: () => void }[] = []

  // Status filters
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(status => {
      chips.push({
        label: `Status: ${taskStatusConfig[status].label}`,
        onClose: () => {
          const newStatuses = filters.status!.filter(s => s !== status)
          onRemoveFilter('status', newStatuses.length > 0 ? newStatuses : undefined)
        },
      })
    })
  }

  // Type filters
  if (filters.type && filters.type.length > 0) {
    filters.type.forEach(type => {
      chips.push({
        label: `Type: ${taskTypeConfig[type].label}`,
        onClose: () => {
          const newTypes = filters.type!.filter(t => t !== type)
          onRemoveFilter('type', newTypes.length > 0 ? newTypes : undefined)
        },
      })
    })
  }

  // Tag filters
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tagId => {
      const tag = getTagById(tagId)
      chips.push({
        label: `Tag: ${tag?.name || tagId}`,
        onClose: () => {
          const newTags = filters.tags!.filter(t => t !== tagId)
          onRemoveFilter('tags', newTags.length > 0 ? newTags : undefined)
        },
      })
    })
  }

  // Boolean filters
  if (filters.is_urgent === true) {
    chips.push({
      label: 'Urgent',
      onClose: () => onRemoveFilter('is_urgent'),
    })
  }

  if (filters.is_important === true) {
    chips.push({
      label: 'Important',
      onClose: () => onRemoveFilter('is_important'),
    })
  }

  if (filters.is_overdue === true) {
    chips.push({
      label: 'Overdue',
      onClose: () => onRemoveFilter('is_overdue'),
    })
  }

  if (filters.scheduled_for_today === true) {
    chips.push({
      label: 'Scheduled Today',
      onClose: () => onRemoveFilter('scheduled_for_today'),
    })
  }

  if (filters.has_due_date === true) {
    chips.push({
      label: 'Has Due Date',
      onClose: () => onRemoveFilter('has_due_date'),
    })
  } else if (filters.has_due_date === false) {
    chips.push({
      label: 'No Due Date',
      onClose: () => onRemoveFilter('has_due_date'),
    })
  }

  // Search filter
  if (filters.search) {
    chips.push({
      label: `Search: "${filters.search}"`,
      onClose: () => onRemoveFilter('search'),
    })
  }

  if (chips.length === 0) return null

  return (
    <Space wrap size="small">
      {chips.map((chip, index) => (
        <Tag
          key={index}
          closable
          onClose={chip.onClose}
          closeIcon={<CloseOutlined />}
          color="blue"
        >
          {chip.label}
        </Tag>
      ))}
    </Space>
  )
}
```

---

## Step 4.3: Create Filter Presets Component

**Create `src/components/FilterPresets.tsx`**:

```typescript
import { Space, Button, Typography } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { SYSTEM_FILTER_PRESETS } from '@/types/filter-presets'
import { useTaskStore } from '@/stores/taskStore'

const { Text } = Typography

export function FilterPresets() {
  const { setFilters, clearFilters } = useTaskStore()

  const handleApplyPreset = (presetId: string) => {
    const preset = SYSTEM_FILTER_PRESETS.find(p => p.id === presetId)
    if (!preset) return

    clearFilters()
    setFilters(preset.filters)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FilterOutlined />
        <Text strong>Quick Filters</Text>
      </div>
      <Space wrap>
        {SYSTEM_FILTER_PRESETS.map(preset => (
          <Button
            key={preset.id}
            size="small"
            onClick={() => handleApplyPreset(preset.id)}
          >
            <span className="mr-1">{preset.icon}</span>
            {preset.name}
          </Button>
        ))}
      </Space>
    </div>
  )
}
```

---

## Step 4.4: Enhanced Filter Bar with Chips

**Update `src/components/TaskFilterBar.tsx`** to add filter chips:

```typescript
import { FilterChips } from './FilterChips'
import { FilterPresets } from './FilterPresets'
import { Divider } from 'antd'

// Add to the component, before the existing filters:

export function TaskFilterBar() {
  const { filters, /* ... other hooks */ } = useTaskStore()

  const handleRemoveFilter = (filterKey: keyof TaskFilters, value?: any) => {
    if (value !== undefined) {
      setFilters({ [filterKey]: value })
    } else {
      // Remove filter completely
      const newFilters = { ...filters }
      delete newFilters[filterKey]
      clearFilters()
      setFilters(newFilters)
    }
  }

  return (
    <Space direction="vertical" className="w-full" size="middle">
      {/* Filter Presets */}
      <FilterPresets />

      <Divider className="!my-2" />

      {/* Active Filter Chips */}
      <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />

      {/* Existing search and filter controls... */}
      {/* ... rest of existing code */}
    </Space>
  )
}
```

---

## Step 4.5: Add Filter Count Badge to Navigation

**Update `src/components/AppLayout.tsx`** to show filter count:

```typescript
import { Badge } from 'antd'
import { useTaskStore } from '@/stores/taskStore'

// In the component:
const { filters } = useTaskStore()

// Count active filters
const activeFilterCount = Object.keys(filters).filter(key => {
  const value = filters[key as keyof typeof filters]
  if (Array.isArray(value)) return value.length > 0
  return value !== undefined && value !== null && value !== ''
}).length

// Update Tasks menu item:
{
  key: '/tasks',
  label: (
    <Badge count={activeFilterCount} offset={[10, 0]} size="small">
      <span>All Tasks</span>
    </Badge>
  ),
  icon: <UnorderedListOutlined />,
  onClick: () => navigate('/tasks'),
},
```

---

## Step 4.6: Add Date Range Filter

**Update `src/types/task.ts`** to add date range filter:

```typescript
export interface TaskFilters {
  // ... existing filters ...
  due_date_range?: {
    start: string | null
    end: string | null
  }
  scheduled_date_range?: {
    start: string | null
    end: string | null
  }
}
```

**Update `src/stores/taskStore.ts`** filtering logic:

```typescript
getFilteredTasks: () => {
  const { tasks, filters, sortBy, sortOrder } = get()

  let filtered = tasks.filter(task => {
    // ... existing filter logic ...

    // Date range filters
    if (filters.due_date_range) {
      if (!task.due_date) return false
      const dueDate = parseISO(task.due_date)

      if (filters.due_date_range.start) {
        const start = parseISO(filters.due_date_range.start)
        if (isBefore(dueDate, start)) return false
      }

      if (filters.due_date_range.end) {
        const end = parseISO(filters.due_date_range.end)
        if (isAfter(dueDate, end)) return false
      }
    }

    if (filters.scheduled_date_range) {
      if (!task.scheduled_date) return false
      const scheduledDate = parseISO(task.scheduled_date)

      if (filters.scheduled_date_range.start) {
        const start = parseISO(filters.scheduled_date_range.start)
        if (isBefore(scheduledDate, start)) return false
      }

      if (filters.scheduled_date_range.end) {
        const end = parseISO(filters.scheduled_date_range.end)
        if (isAfter(scheduledDate, end)) return false
      }
    }

    return true
  })

  // ... existing sort logic ...
},
```

---

## Step 4.7: Add Date Range Picker to Filter Bar

**Update `src/components/TaskFilterBar.tsx`**:

```typescript
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// Add to form:
<Space wrap>
  <div>
    <Text strong className="block mb-1 text-sm">Due Date Range</Text>
    <RangePicker
      value={
        filters.due_date_range?.start && filters.due_date_range?.end
          ? [
              dayjs(filters.due_date_range.start),
              dayjs(filters.due_date_range.end),
            ]
          : null
      }
      onChange={dates => {
        if (dates && dates[0] && dates[1]) {
          setFilters({
            due_date_range: {
              start: dates[0].toISOString(),
              end: dates[1].toISOString(),
            },
          })
        } else {
          setFilters({ due_date_range: undefined })
        }
      }}
    />
  </div>

  <div>
    <Text strong className="block mb-1 text-sm">Scheduled Date Range</Text>
    <RangePicker
      value={
        filters.scheduled_date_range?.start && filters.scheduled_date_range?.end
          ? [
              dayjs(filters.scheduled_date_range.start),
              dayjs(filters.scheduled_date_range.end),
            ]
          : null
      }
      onChange={dates => {
        if (dates && dates[0] && dates[1]) {
          setFilters({
            scheduled_date_range: {
              start: dates[0].toISOString(),
              end: dates[1].toISOString(),
            },
          })
        } else {
          setFilters({ scheduled_date_range: undefined })
        }
      }}
    />
  </div>
</Space>
```

---

## Step 4.8: Test Advanced Filters

### Test Filter Presets

1. Navigate to All Tasks page
2. Click "Due Today" preset
3. **Expected**: Only today's tasks shown, chips appear
4. Click "Urgent & Important" preset
5. **Expected**: Filters update, previous filters cleared

### Test Filter Chips

1. Apply multiple filters (status, tags, urgent)
2. **Expected**: Chips appear for each filter
3. Click X on a chip
4. **Expected**: That filter removed, tasks update

### Test Filter Count Badge

1. Apply 3 filters
2. **Expected**: Badge shows "3" on All Tasks nav item
3. Clear all filters
4. **Expected**: Badge disappears

### Test Date Range Filter

1. Select due date range (next 7 days)
2. **Expected**: Only tasks with due dates in that range shown
3. Clear date range
4. **Expected**: All tasks shown again

### Test Filter Persistence

1. Apply filters on All Tasks page
2. Navigate to another page
3. Return to All Tasks
4. **Expected**: Filters still applied

---

## Verification Checklist

Before proceeding to Step 5, verify:

- [ ] Filter presets work correctly
- [ ] Filter chips display for active filters
- [ ] Removing chips clears filters
- [ ] Filter count badge shows on navigation
- [ ] Date range filters work
- [ ] Multiple filters combine correctly (AND logic)
- [ ] Filter persistence works
- [ ] Preset filters clear previous filters
- [ ] All filter types supported by chips
- [ ] No console errors

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 5: Saved Views System](./step-5-saved-views.md)**

This will implement user-created saved views with custom filters and view modes.

---

## Summary

You've successfully:
- ✅ Enhanced filter system with presets
- ✅ Created filter chips for active filters
- ✅ Added filter count badges
- ✅ Implemented date range filtering
- ✅ Created quick filter shortcuts
- ✅ Added filter persistence
- ✅ Built filter preset system

**The advanced filter system provides powerful task filtering capabilities!**
