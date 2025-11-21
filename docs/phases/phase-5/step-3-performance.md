# Phase 5, Step 3: Performance Optimization

**Duration**: 1 day
**Prerequisite**: Step 2 (Accessibility) completed

## Overview

This step optimizes app performance through:
- Code splitting and lazy loading
- Bundle size optimization
- React performance optimizations
- Image optimization
- Caching strategies
- Database query optimization
- Monitoring and profiling

## Goals

- Reduce initial bundle size
- Implement lazy loading
- Optimize re-renders
- Add proper memoization
- Optimize images
- Implement virtual scrolling for long lists
- Add performance monitoring
- Optimize database queries

---

## Step 3.1: Setup Performance Monitoring

```bash
npm install web-vitals
```

**Create `src/lib/vitals.ts`**:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  console.log(metric)

  // Example: Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
```

**Update `src/main.tsx`**:

```typescript
import { reportWebVitals } from './lib/vitals'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Report web vitals
reportWebVitals()
```

---

## Step 3.2: Implement Code Splitting and Lazy Loading

**Update `src/App.tsx`** with lazy loaded routes:

```typescript
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'

// Eagerly load critical routes
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { TodayPage } from '@/pages/TodayPage'

// Lazy load non-critical routes
const AllTasksPage = lazy(() => import('@/pages/AllTasksPage'))
const HabitsPage = lazy(() => import('@/pages/HabitsPage'))
const KanbanPage = lazy(() => import('@/pages/KanbanPage'))
const EisenhowerMatrixPage = lazy(() => import('@/pages/EisenhowerMatrixPage'))

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spin size="large" tip="Loading..." />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/today" element={<TodayPage />} />
                    <Route path="/tasks" element={<AllTasksPage />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/kanban" element={<KanbanPage />} />
                    <Route path="/matrix" element={<EisenhowerMatrixPage />} />
                    <Route path="*" element={<Navigate to="/today" replace />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}
```

---

## Step 3.3: Optimize Bundle Size with Vite

**Update `vite.config.ts`**:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'date-vendor': ['date-fns'],
          'animation-vendor': ['framer-motion', 'canvas-confetti'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      '@supabase/supabase-js',
    ],
  },
})
```

```bash
npm install --save-dev rollup-plugin-visualizer
```

---

## Step 3.4: Memoize Expensive Components

**Create `src/components/MemoizedTaskCard.tsx`**:

```typescript
import { memo } from 'react'
import { TaskCard, TaskCardProps } from './TaskCard'

function TaskCardComponent(props: TaskCardProps) {
  return <TaskCard {...props} />
}

// Memoize with custom comparison
export const MemoizedTaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if task data or handlers change
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  )
})
```

---

## Step 3.5: Optimize Task Store with Selectors

**Update `src/stores/taskStore.ts`** to add selective subscriptions:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'

// ... existing store code ...

// Selective hooks to prevent unnecessary re-renders
export const useTasksOnly = () => useTaskStore((state) => state.tasks, shallow)
export const useFiltersOnly = () => useTaskStore((state) => state.filters, shallow)
export const useIsLoading = () => useTaskStore((state) => state.isLoading)

// Memoized selectors
export const useTodayTasks = () =>
  useTaskStore(
    (state) => {
      const today = startOfDay(new Date())
      return state.tasks.filter(
        (task) =>
          task.scheduled_date &&
          isSameDay(parseISO(task.scheduled_date), today) &&
          task.status !== 'completed'
      )
    },
    shallow
  )

export const useOverdueTasks = () =>
  useTaskStore(
    (state) => {
      const now = new Date()
      return state.tasks.filter(
        (task) =>
          task.due_date &&
          isBefore(parseISO(task.due_date), now) &&
          task.status !== 'completed'
      )
    },
    shallow
  )
```

---

## Step 3.6: Implement Virtual Scrolling for Long Lists

```bash
npm install react-window
npm install --save-dev @types/react-window
```

**Create `src/components/VirtualTaskList.tsx`**:

```typescript
import { FixedSizeList as List } from 'react-window'
import { TaskWithTags } from '@/types/task'
import { MemoizedTaskCard } from './MemoizedTaskCard'
import { useRef, useEffect } from 'react'

interface VirtualTaskListProps {
  tasks: TaskWithTags[]
  onEdit: (task: TaskWithTags) => void
  onDelete: (taskId: string) => void
  height?: number
}

export function VirtualTaskList({
  tasks,
  onEdit,
  onDelete,
  height = 600,
}: VirtualTaskListProps) {
  const listRef = useRef<List>(null)

  // Reset scroll position when tasks change significantly
  useEffect(() => {
    listRef.current?.scrollToItem(0)
  }, [tasks.length])

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index]

    return (
      <div style={{ ...style, padding: '8px' }}>
        <MemoizedTaskCard
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task.id)}
        />
      </div>
    )
  }

  if (tasks.length === 0) {
    return <div>No tasks found</div>
  }

  // Use virtual scrolling only for large lists
  if (tasks.length < 20) {
    return (
      <div>
        {tasks.map((task) => (
          <div key={task.id} style={{ padding: '8px' }}>
            <MemoizedTaskCard
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={tasks.length}
      itemSize={180}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

**Update `src/pages/AllTasksPage.tsx`**:

```typescript
import { VirtualTaskList } from '@/components/VirtualTaskList'

export function AllTasksPage() {
  const filteredTasks = useTaskStore((state) => state.getFilteredTasks())

  return (
    <div>
      <h1>All Tasks</h1>
      <VirtualTaskList
        tasks={filteredTasks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        height={window.innerHeight - 200}
      />
    </div>
  )
}
```

---

## Step 3.7: Optimize Database Queries

**Update `src/lib/supabase.ts`** with query optimizations:

```typescript
// Fetch only required columns
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      description,
      status,
      type,
      due_date,
      scheduled_date,
      is_urgent,
      is_important,
      parent_id,
      created_at,
      updated_at,
      task_tags(tag_id, tags(id, name, color, gradient, icon))
    `
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Use indexes for common queries
export async function fetchTodayTasks() {
  const today = startOfDay(new Date()).toISOString()
  const tomorrow = startOfDay(addDays(new Date(), 1)).toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('scheduled_date', today)
    .lt('scheduled_date', tomorrow)
    .neq('status', 'completed')
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data
}

// Batch operations
export async function batchUpdateTasks(updates: Array<{ id: string; status: TaskStatus }>) {
  const { data, error } = await supabase.rpc('batch_update_task_status', {
    task_updates: updates,
  })

  if (error) throw error
  return data
}
```

**Create database function for batch updates**:

```sql
-- Add to Supabase SQL Editor
CREATE OR REPLACE FUNCTION batch_update_task_status(
  task_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tasks
  SET status = (elem->>'status')::task_status,
      updated_at = now()
  FROM jsonb_array_elements(task_updates) AS elem
  WHERE tasks.id = (elem->>'id')::uuid
    AND tasks.user_id = auth.uid();
END;
$$;
```

---

## Step 3.8: Add Database Indexes

**Run in Supabase SQL Editor**:

```sql
-- Index for scheduled date queries
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date
ON tasks(user_id, scheduled_date)
WHERE status != 'completed';

-- Index for due date queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(user_id, due_date)
WHERE status != 'completed';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(user_id, status);

-- Index for parent_id queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id
ON tasks(user_id, parent_id)
WHERE parent_id IS NOT NULL;

-- Composite index for Eisenhower Matrix
CREATE INDEX IF NOT EXISTS idx_tasks_urgency_importance
ON tasks(user_id, is_urgent, is_important)
WHERE status != 'completed';

-- Index for habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id
ON habits(user_id, is_active);

-- Index for habit completions
CREATE INDEX IF NOT EXISTS idx_habit_completions_date
ON habit_completions(habit_id, completion_date DESC);

-- Index for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id
ON tags(user_id);

-- Index for task_tags junction
CREATE INDEX IF NOT EXISTS idx_task_tags_task
ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag
ON task_tags(tag_id);
```

---

## Step 3.9: Implement Request Debouncing

**Create `src/hooks/useDebounce.ts`**:

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**Update search to use debouncing**:

```typescript
import { useDebounce } from '@/hooks/useDebounce'

export function TaskFilterBar() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const { setFilters } = useTaskStore()

  useEffect(() => {
    setFilters({ search: debouncedSearch })
  }, [debouncedSearch, setFilters])

  return (
    <Input
      placeholder="Search tasks..."
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      prefix={<SearchOutlined />}
    />
  )
}
```

---

## Step 3.10: Optimize Re-renders with useCallback

**Update `src/pages/AllTasksPage.tsx`**:

```typescript
import { useCallback, useMemo } from 'react'

export function AllTasksPage() {
  const tasks = useTasksOnly()
  const filters = useFiltersOnly()

  // Memoize filtered tasks
  const filteredTasks = useMemo(() => {
    return applyFilters(tasks, filters)
  }, [tasks, filters])

  // Memoize callbacks
  const handleEdit = useCallback((task: TaskWithTags) => {
    setEditingTask(task)
    setShowModal(true)
  }, [])

  const handleDelete = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status })
  }, [])

  return (
    <VirtualTaskList
      tasks={filteredTasks}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
```

---

## Step 3.11: Add Service Worker for Caching

**Create `public/sw.js`**:

```javascript
const CACHE_NAME = 'dothething-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
```

**Register service worker in `src/main.tsx`**:

```typescript
// Register service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}
```

---

## Step 3.12: Optimize Images

**Create `src/lib/image-optimization.ts`**:

```typescript
export function getOptimizedImageUrl(url: string, width: number, quality: number = 80): string {
  // If using a CDN like Cloudinary or Imgix
  // return `${url}?w=${width}&q=${quality}&auto=format`

  // For Supabase Storage
  const { data } = supabase.storage.from('avatars').getPublicUrl(url, {
    transform: {
      width,
      quality,
    },
  })

  return data.publicUrl
}

// Lazy load images
export function lazyLoadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = imageUrl
  })
}
```

---

## Step 3.13: Add Performance Profiling

**Create `src/lib/profiler.tsx`**:

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react'

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (import.meta.env.DEV) {
    console.log('Profiler:', {
      id,
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
    })

    // Alert on slow renders
    if (actualDuration > 16) {
      console.warn(`Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms`)
    }
  }
}

interface AppProfilerProps {
  id: string
  children: React.ReactNode
}

export function AppProfiler({ id, children }: AppProfilerProps) {
  if (!import.meta.env.DEV) {
    return <>{children}</>
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
```

**Wrap expensive components**:

```typescript
import { AppProfiler } from '@/lib/profiler'

export function AllTasksPage() {
  return (
    <AppProfiler id="AllTasksPage">
      {/* Page content */}
    </AppProfiler>
  )
}
```

---

## Step 3.14: Test Performance

### Test Initial Load Time

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Hard refresh (Cmd/Ctrl + Shift + R)
4. **Expected**: FCP < 2s, LCP < 3s
5. Check bundle sizes
6. **Expected**: Main bundle < 500KB gzipped

### Test Runtime Performance

1. Open DevTools → Performance tab
2. Record while navigating and interacting
3. **Expected**: 60fps (16ms frame time)
4. **Expected**: No long tasks (>50ms)
5. Check memory usage
6. **Expected**: No memory leaks on page changes

### Test with React DevTools Profiler

1. Install React DevTools
2. Open Profiler tab
3. Record interaction (e.g., filtering tasks)
4. **Expected**: Components render in <16ms
5. **Expected**: No unnecessary re-renders

### Test Bundle Size

```bash
npm run build
```

**Expected output**:
```
dist/index.html                   1.50 kB
dist/assets/react-vendor.js       142.50 kB / gzip: 45.20 kB
dist/assets/antd-vendor.js        450.30 kB / gzip: 125.10 kB
dist/assets/supabase-vendor.js    85.20 kB / gzip: 28.40 kB
dist/assets/index.js              120.80 kB / gzip: 38.60 kB
```

### Test Lighthouse Score

1. Open DevTools → Lighthouse tab
2. Run audit
3. **Expected Scores**:
   - Performance: >90
   - Accessibility: >95
   - Best Practices: >90
   - SEO: >90

---

## Verification Checklist

Before proceeding to Step 4, verify:

- [ ] Web Vitals reporting implemented
- [ ] Code splitting with lazy loading
- [ ] Bundle size < 1MB total
- [ ] Chunks properly split by vendor
- [ ] Components memoized where appropriate
- [ ] Store selectors optimized
- [ ] Virtual scrolling for long lists
- [ ] Database queries optimized
- [ ] Database indexes created
- [ ] Search debounced
- [ ] Callbacks memoized
- [ ] Service worker registered
- [ ] Images optimized
- [ ] Lighthouse performance >90
- [ ] No unnecessary re-renders
- [ ] No memory leaks
- [ ] 60fps maintained during interactions

---

## Performance Budget

Set these targets:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Bundle Size**: < 1MB
- **Main Thread Blocking**: < 300ms
- **Memory Usage**: < 50MB

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 4: Edge Functions](./step-4-edge-functions.md)**

This will implement server-side logic for scheduled tasks and notifications.

---

## Summary

You've successfully:
- ✅ Implemented Web Vitals monitoring
- ✅ Added code splitting and lazy loading
- ✅ Optimized bundle size with vendor chunks
- ✅ Memoized components and callbacks
- ✅ Implemented virtual scrolling
- ✅ Optimized database queries and indexes
- ✅ Added request debouncing
- ✅ Implemented service worker caching
- ✅ Optimized images
- ✅ Added performance profiling
- ✅ Achieved Lighthouse score >90

**The app now loads and runs blazingly fast!**
