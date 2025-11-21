# DoTheThing - Feature Implementation Order

This document defines the optimal order for implementing features to ensure dependencies are handled correctly and the application remains functional at each stage.

## Table of Contents
- [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
- [Phase 2: Core Task Management](#phase-2-core-task-management)
- [Phase 3: Advanced Task Features](#phase-3-advanced-task-features)
- [Phase 4: Views & Productivity Features](#phase-4-views--productivity-features)
- [Phase 5: Polish & Launch](#phase-5-polish--launch)
- [Critical Path Summary](#critical-path-summary)

---

## Phase 1: Foundation & Setup (Weeks 1-2)

**Goal**: Establish a solid foundation with authentication, database, and design system.

### 1.1 Project Scaffolding
**Duration**: 1-2 days

- Initialize Vite + React + TypeScript project
  ```bash
  npm create vite@latest dothething -- --template react-ts
  ```
- Install core dependencies
  ```bash
  npm install antd @ant-design/icons
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  npm install zustand react-router-dom date-fns framer-motion
  npm install @supabase/supabase-js
  ```
- Install dev dependencies
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npm install -D eslint prettier vitest
  ```
- Configure ESLint + Prettier
- Set up TailwindCSS (supplementary to Ant Design)
- Configure TypeScript strict mode
- Set up project structure:
  ```
  src/
  ├── components/
  ├── stores/
  ├── lib/
  ├── types/
  ├── hooks/
  └── App.tsx
  ```

**Deliverable**: Working Vite app with all dependencies installed and configured.

---

### 1.2 Supabase Setup
**Duration**: 2-3 days

**Step 1**: Create Supabase Project
- Sign up at supabase.com
- Create new project
- Note project URL and anon key
- Create `.env` file with Supabase credentials

**Step 2**: Design Database Schema
- Create `users` table (handled by Supabase Auth)
- Create `tasks` table with all fields:
  - Basic: id, user_id, title, description, type, status
  - Dates: due_date, has_due_date, created_at, updated_at, started_at
  - Completion: last_completed_at, completed_count
  - Hierarchy: parent_id
  - Timer: timer_duration_minutes
  - Habit: current_streak, longest_streak, streak_safe_until, target_frequency
  - Priority: is_urgent, is_important
  - Someday: nudge_threshold_days, last_nudged_at
  - Status: blocked_reason
- Create `tags` table:
  - id, user_id, name, color, icon, parent_id, created_at
- Create `task_tags` junction table:
  - task_id, tag_id (composite primary key)
- Create `recurrences` table:
  - id, task_id, type, frequency, anchor_date, next_due_date, created_at
- Create `completions` table:
  - id, task_id, completed_at, was_late, was_retroactive
- Create `saved_views` table:
  - id, user_id, name, icon, view_mode, filters, sort_order, display_options, is_pinned, is_default, position, created_at, updated_at

**Step 3**: Set Up Row Level Security (RLS)
- Enable RLS on all tables
- Create policies for each table:
  - SELECT: WHERE user_id = auth.uid()
  - INSERT: WITH CHECK (user_id = auth.uid())
  - UPDATE: WHERE user_id = auth.uid()
  - DELETE: WHERE user_id = auth.uid()

**Step 4**: Create Database Migrations
- Save all schema definitions as SQL migrations
- Test migrations in Supabase dashboard

**Step 5**: Test Database Connection
- Create Supabase client in `src/lib/supabase.ts`
- Test connection with a simple query

**Deliverable**: Complete database schema with RLS policies, accessible via Supabase client.

---

### 1.3 Authentication
**Duration**: 2-3 days

**Step 1**: Implement AuthStore (Zustand)
```typescript
// src/stores/authStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}
```

**Step 2**: Build Authentication UI
- Login page using Ant Design Form
  - Email input
  - Password input
  - "Remember me" checkbox
  - Submit button
  - Link to signup
- Signup page using Ant Design Form
  - Email input
  - Password input (min 8 characters)
  - Confirm password
  - Submit button
  - Link to login
- Use Ant Design validation rules

**Step 3**: Implement Session Management
- Check for existing session on app load
- Store session in localStorage
- Auto-refresh tokens
- Handle session expiration

**Step 4**: Protected Routes
- Set up React Router
- Create ProtectedRoute component
- Redirect unauthenticated users to login
- Redirect authenticated users from login to dashboard

**Deliverable**: Working authentication with login/signup forms and protected routes.

---

### 1.4 Design System Foundation
**Duration**: 2-3 days

**Step 1**: Configure Ant Design ConfigProvider
```typescript
// src/App.tsx or theme provider
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#3B82F6', // Brand color
      borderRadius: 8,
      fontSize: 14,
    },
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  }}
>
  {/* App content */}
</ConfigProvider>
```

**Step 2**: Set Up Theme Tokens
- Define brand colors
- Set spacing values (using 8px grid)
- Configure typography scale
- Set border radius values
- Define shadow styles

**Step 3**: Implement Dark/Light Mode Toggle
- Create theme state in UIStore
- Detect system preference
- Store preference in localStorage
- Toggle switch in header/settings
- Apply algorithm to ConfigProvider

**Step 4**: Create Basic Layout Structure
```typescript
<Layout>
  <Layout.Sider>{/* Sidebar navigation */}</Layout.Sider>
  <Layout>
    <Layout.Header>{/* Top bar (mobile) */}</Layout.Header>
    <Layout.Content>{/* Main content */}</Layout.Content>
  </Layout>
</Layout>
```

**Deliverable**: Fully themed application with dark/light mode toggle and basic layout.

---

## Phase 2: Core Task Management (Weeks 3-4)

**Goal**: Build fundamental task CRUD operations, tag system, and basic UI.

### 2.1 Task Data Layer
**Duration**: 2-3 days

**Step 1**: Create Task Entity TypeScript Types
```typescript
// src/types/task.ts
export enum TaskStatus {
  Ready = 'ready',
  InProgress = 'in_progress',
  Blocked = 'blocked',
  Completed = 'completed',
  Archived = 'archived',
}

export enum TaskType {
  Task = 'task',
  Habit = 'habit',
  Parent = 'parent',
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  // ... all other fields
}
```

**Step 2**: Implement TaskStore (Zustand)
```typescript
// src/stores/taskStore.ts
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  shiftTaskForward: (id: string, days: number) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
}
```

**Step 3**: Implement CRUD Operations
- Create task: INSERT into tasks table
- Read tasks: SELECT with user_id filter
- Update task: UPDATE with optimistic updates
- Delete task: DELETE (or set status to archived)
- Handle errors and loading states

**Step 4**: Test CRUD Operations
- Create test tasks via database
- Verify fetch works
- Test update and delete

**Deliverable**: Working TaskStore with all CRUD operations.

---

### 2.2 Tag System ⭐
**Duration**: 3-4 days
**Priority**: CRITICAL - Tasks depend on tags

**Step 1**: Create Tag Types
```typescript
// src/types/tag.ts
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string; // hex or gradient string
  icon?: string;
  parent_id?: string;
  created_at: string;
}
```

**Step 2**: Implement TagStore
```typescript
interface TagState {
  tags: Tag[];
  loading: boolean;
  error: string | null;

  fetchTags: () => Promise<void>;
  addTag: (tag: Partial<Tag>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}
```

**Step 3**: Build Tag CRUD UI
- Tag list view (Ant Design Tree for hierarchy)
- Create tag modal (Ant Design Modal + Form)
- Edit tag modal
- Delete confirmation (Ant Design Popconfirm)

**Step 4**: Implement Color Picker Component
- 12 solid color presets (Ant Design color swatches)
- 8 gradient presets
- Custom color picker (use browser's input type="color")
- Gradient direction selector
- Live preview of selected color
- Store as hex string or gradient CSS string

**Step 5**: Build Tag Selector Component
- Multi-select dropdown (Ant Design TreeSelect)
- Show tag hierarchy
- Display with color chips
- Search/filter tags
- Create new tag inline (optional)

**Deliverable**: Complete tag system with hierarchical organization and color picker.

---

### 2.3 Basic Task UI
**Duration**: 4-5 days

**Step 1**: Task Card Component
```typescript
// src/components/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

**Visual Elements** (using Ant Design Card):
- Checkbox for completion (left side)
- Status indicator badge
- Title (bold, truncated if long)
- Description (smaller font, truncated)
- Due date (with date-fns formatting)
- Tags (colored chips, max 3 visible + count)
- Context menu trigger (three dots icon)
- Blocked reason (if status is blocked)

**States**:
- Default (Ready)
- In Progress (blue accent)
- Blocked (orange/red warning)
- Hover
- Completed (strikethrough, faded)
- Overdue (red accent)

**Step 2**: Task Detail Modal
```typescript
// src/components/TaskDetailModal.tsx
```

**Form Fields** (using Ant Design Form):
- Title (Input, required)
- Description (TextArea)
- Status selector (Select or Segmented)
- Due date (DatePicker)
- Tags (TreeSelect multi-select)
- Timer duration (TimePicker or InputNumber)
- Parent task selector (Select, if subtask)

**Footer Actions**:
- Save (Button.Primary)
- Cancel (Button.Default)
- Delete (Button, destructive styling, right-aligned)

**Step 3**: Context Menu Component
```typescript
// src/components/TaskContextMenu.tsx
```

**Menu Items** (using Ant Design Dropdown):
- Edit Task
- Status Actions (submenu):
  - Mark as Ready
  - Mark as In Progress
  - Mark as Blocked (opens dialog)
  - Mark as Complete
- Priority Actions (submenu):
  - Mark as Urgent
  - Mark as Important
  - Clear Priority
- Move to Tomorrow
- Move Forward X Days (opens dialog)
- Remove Due Date
- Duplicate Task
- Archive Task
- Delete Task (with confirmation)

**Deliverable**: Functional task cards with detail modal and context menus.

---

### 2.4 Today Dashboard (Basic Version)
**Duration**: 3-4 days

**Step 1**: Create Dashboard Layout
```typescript
// src/pages/TodayDashboard.tsx
```

**Sections**:
- Header with date and "Quick Add" button
- Overdue tasks section (if any)
- Tasks due today section
- Empty state (if no tasks)

**Step 2**: Implement Task Queries
```typescript
// In TaskStore, add selectors:
const getTodayTasks = () => {
  // Filter tasks where due_date is today
};

const getOverdueTasks = () => {
  // Filter tasks where due_date < today and status != completed
};
```

**Step 3**: Display Tasks
- Use TaskCard component for each task
- Group by section (Overdue, Today)
- Sort by due time, then created date
- Handle empty states with Ant Design Empty

**Step 4**: Task Completion Flow
- Click checkbox to complete
- Optimistic update (mark complete immediately)
- Update in database
- Basic animation (fade out) using Framer Motion
- Show success message (Ant Design Message)

**Deliverable**: Working Today dashboard with task completion.

---

### 2.5 All Tasks View
**Duration**: 3-4 days

**Step 1**: Create All Tasks Layout
```typescript
// src/pages/AllTasksView.tsx
```

**Layout**:
- Search bar (Ant Design Input.Search)
- Filter controls (tag filter, status filter)
- Sort dropdown (due date, created, updated, title)
- Task list (Ant Design List)

**Step 2**: Implement Search
- Filter tasks by title/description
- Debounce search input (use debounce hook)
- Highlight matching text (optional)

**Step 3**: Implement Filtering
- Filter by tags (multi-select)
- Filter by status (checkboxes)
- Combine filters (AND logic)
- Show active filters as chips
- Clear all filters button

**Step 4**: Implement Sorting
- Sort by due date (ascending/descending)
- Sort by created date
- Sort by updated date
- Sort alphabetically by title
- Store sort preference

**Step 5**: Implement Grouping (Optional)
- Group by status
- Group by tag
- Group by due date (Today, This Week, Later, No Due Date)
- Collapsible groups (Ant Design Collapse)

**Deliverable**: Complete All Tasks view with search, filter, and sort.

---

## Phase 3: Advanced Task Features (Weeks 5-6)

**Goal**: Implement hierarchical tasks, recurring tasks, habits, and someday tasks.

### 3.1 Parent/Child Tasks (Hierarchical Structure)
**Duration**: 4-5 days

**Step 1**: Update Task UI for Hierarchy
- Add "parent_id" field to task creation
- Parent task selector (Select with search)
- Prevent circular references (validation)

**Step 2**: Implement Subtask Display
- Show subtasks nested under parent (Ant Design Collapse)
- Indentation for visual hierarchy
- Subtask count badge on parent card
- Progress bar showing X of Y complete

**Step 3**: Progress Calculation
```typescript
// In TaskStore, add selector:
const getTaskProgress = (parentId: string) => {
  const subtasks = tasks.filter(t => t.parent_id === parentId);
  const completed = subtasks.filter(t => t.status === 'completed').length;
  return {
    completed,
    total: subtasks.length,
    percentage: (completed / subtasks.length) * 100,
  };
};
```

**Step 4**: Auto-Completion Logic
```typescript
// On subtask completion:
const completeTask = async (id: string) => {
  // Mark subtask complete
  await updateTask(id, { status: 'completed' });

  // Check if parent should auto-complete
  const task = tasks.find(t => t.id === id);
  if (task.parent_id) {
    const siblings = tasks.filter(t => t.parent_id === task.parent_id);
    const allComplete = siblings.every(t => t.status === 'completed');

    if (allComplete) {
      await updateTask(task.parent_id, { status: 'completed' });
    }
  }
};
```

**Step 5**: Parent Completion (Manual)
- When parent is completed manually, complete all subtasks
- Show confirmation dialog if subtasks exist
- Trigger completion animation for each

**Deliverable**: Working parent/child task relationships with auto-completion.

---

### 3.2 Task Shifting/Rescheduling
**Duration**: 2-3 days

**Step 1**: Add Shift Actions to Context Menu
- Move to Tomorrow
- Move Forward X Days
- Remove Due Date

**Step 2**: Implement Shift Logic
```typescript
const shiftTaskForward = async (id: string, days: number) => {
  const task = tasks.find(t => t.id === id);
  if (!task.due_date) return;

  const newDate = addDays(new Date(task.due_date), days);
  await updateTask(id, { due_date: newDate });
};
```

**Step 3**: Handle Recurring Tasks
- For fixed schedule: Update current occurrence only
- For after completion: Update due_date, but next recurrence still based on completion
- Show message explaining behavior

**Step 4**: Create Shift Dialog
- Ant Design Modal with InputNumber
- Buttons for common shifts (1 day, 3 days, 1 week)
- Custom input for X days

**Deliverable**: Working task rescheduling with shift actions.

---

### 3.3 Recurring Tasks
**Duration**: 5-6 days

**Step 1**: Create Recurrence Types
```typescript
// src/types/recurrence.ts
export enum RecurrenceType {
  FixedSchedule = 'fixed_schedule',
  AfterCompletion = 'after_completion',
}

export interface Recurrence {
  id: string;
  task_id: string;
  type: RecurrenceType;
  frequency: {
    interval: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
    excludeDays?: number[]; // For fixed schedule (0=Sunday, 6=Saturday)
  };
  anchor_date?: string; // For fixed schedule
  next_due_date: string;
  created_at: string;
}
```

**Step 2**: Add Recurrence UI to Task Modal
- Recurrence toggle (Switch)
- Type selector (Radio or Segmented)
- Frequency inputs:
  - Interval (InputNumber)
  - Unit (Select: hours, days, weeks, months)
  - Exclude days (Checkbox group for fixed schedule)
  - Anchor date (DatePicker for fixed schedule)

**Step 3**: Implement Fixed Schedule Logic
```typescript
// See docs/implementation/pseudocode/recurring-tasks.md
const calculateNextOccurrence = (recurrence: Recurrence) => {
  let nextDate = new Date(recurrence.anchor_date);
  const now = new Date();

  // Add interval repeatedly until nextDate > now
  while (nextDate <= now) {
    if (recurrence.frequency.unit === 'days') {
      nextDate = addDays(nextDate, recurrence.frequency.interval);
    }
    // ... other units
  }

  // Check excluded days and skip if needed
  if (recurrence.frequency.excludeDays?.includes(nextDate.getDay())) {
    // Skip to next valid day
  }

  return nextDate;
};
```

**Step 4**: Implement After Completion Logic
```typescript
const generateAfterCompletionRecurrence = (task: Task) => {
  const nextDate = new Date(task.last_completed_at);

  if (task.recurrence.frequency.unit === 'hours') {
    nextDate = addHours(nextDate, task.recurrence.frequency.interval);
  }
  // ... other units

  return nextDate;
};
```

**Step 5**: On Task Completion, Generate Next Occurrence
```typescript
const completeRecurringTask = async (task: Task) => {
  // Mark current task complete
  await updateTask(task.id, {
    status: 'completed',
    last_completed_at: new Date().toISOString(),
  });

  // Calculate next due date based on recurrence type
  const nextDueDate = task.recurrence.type === 'fixed_schedule'
    ? calculateNextOccurrence(task.recurrence)
    : generateAfterCompletionRecurrence(task);

  // Update recurrence next_due_date
  await updateRecurrence(task.recurrence.id, { next_due_date: nextDueDate });

  // Create new task instance (or reset current task)
  // Option: Keep as single task and update due_date
  // Option: Create new task instance for history
};
```

**Step 6**: Test Scenarios
- Test fixed schedule with various intervals
- Test day exclusion
- Test after completion recurrence
- Test edge cases (leap years, month-end, etc.)

**Deliverable**: Working recurring task system with both types.

---

### 3.4 Habit Tracking
**Duration**: 5-6 days

**Step 1**: Extend Task for Habits
- Add habit-specific fields to task form:
  - Target frequency (count + period)
  - Current streak (display only)
  - Longest streak (display only)

**Step 2**: Implement Streak Logic
```typescript
// See docs/implementation/pseudocode/habit-streaks.md

const completeHabit = async (task: Task) => {
  const now = new Date();
  const dueDate = new Date(task.due_date);
  const gracePeriodEnd = new Date(task.streak_safe_until);

  let wasLate = false;
  let wasRetroactive = false;

  if (now > dueDate && now <= gracePeriodEnd) {
    wasLate = true;
    wasRetroactive = true;
  } else if (now > gracePeriodEnd) {
    // Cannot complete retroactively
    return { error: 'Grace period expired' };
  }

  // Increment streak
  const newStreak = task.current_streak + 1;
  const newLongest = Math.max(newStreak, task.longest_streak);

  await updateTask(task.id, {
    status: 'completed',
    last_completed_at: now.toISOString(),
    current_streak: newStreak,
    longest_streak: newLongest,
  });

  // Record completion
  await createCompletion({
    task_id: task.id,
    completed_at: now.toISOString(),
    was_late: wasLate,
    was_retroactive: wasRetroactive,
  });

  // Check for milestone
  if ([7, 30, 100].includes(newStreak)) {
    // Trigger special celebration
  }
};
```

**Step 3**: Implement Grace Period
- Set streak_safe_until = due_date + 24 hours
- Show warning indicator when in grace period
- Allow retroactive completion
- Reset streak if grace period expires

**Step 4**: Implement Daily Streak Check
- This will be a Supabase Edge Function (Phase 5)
- For now, check on app load:
  - For each habit, check if yesterday was missed
  - If missed and grace period expired, reset streak to 0

**Step 5**: Implement Completion History
- Create completions table entries
- Display history in habit detail view
- Color code: green (on time), yellow (late), red (missed)

**Deliverable**: Working habit tracking with streaks and grace period.

---

### 3.5 Habits View
**Duration**: 4-5 days

**Step 1**: Create Habits View Layout
```typescript
// src/pages/HabitsView.tsx
```

**Sections**:
- Active habits list (grid layout)
- Calendar heatmap
- Statistics panel

**Step 2**: Active Habits List
- Grid of habit cards (Ant Design Card)
- Show streak prominently (fire emoji + count)
- Show target frequency
- Show completion status today
- Quick complete button

**Step 3**: Calendar Heatmap
- Use Ant Design Calendar or create custom
- GitHub-style contribution graph
- Color intensity based on completion
- Click date to see details
- Show current month + scroll to previous

**Step 4**: Statistics Panel
- Total habits (Ant Design Statistic)
- Active streaks count
- Longest current streak
- Most consistent habit
- This week's completion rate
- Use Ant Design Row/Col for grid layout

**Deliverable**: Complete Habits view with heatmap and stats.

---

### 3.6 Someday Tasks
**Duration**: 3-4 days

**Step 1**: Add Someday Task Fields
- has_due_date: boolean (false for someday)
- nudge_threshold_days: number
- last_nudged_at: timestamp

**Step 2**: Implement Nudge Logic
```typescript
// See docs/implementation/pseudocode/someday-nudging.md

const checkSomedayNudges = () => {
  const somedayTasks = tasks.filter(t => !t.has_due_date);
  const now = new Date();

  somedayTasks.forEach(task => {
    if (!task.nudge_threshold_days) return;

    const daysSinceCompletion = differenceInDays(
      now,
      new Date(task.last_completed_at || task.created_at)
    );

    if (daysSinceCompletion >= task.nudge_threshold_days) {
      // Add to nudged tasks
      // Update last_nudged_at
    }
  });
};
```

**Step 3**: Add to Today Dashboard
- Suggested Tasks section
- Show "Last done X days ago"
- Snooze button (updates last_nudged_at)

**Step 4**: Someday Task UI
- Toggle for has_due_date
- Nudge threshold input (InputNumber + unit selector)
- Show nudge status in task card

**Deliverable**: Working someday tasks with nudge functionality.

---

## Phase 4: Views & Productivity Features (Weeks 7-8)

**Goal**: Implement specialized views, filters, saved views, and productivity tools.

### 4.1 Pomodoro Timer
**Duration**: 3-4 days

**Step 1**: Add Timer to Task UI
- Timer duration input in task modal (TimePicker or InputNumber)
- Timer component in task card (when set)

**Step 2**: Create Timer Component
```typescript
// src/components/PomodoroTimer.tsx
```

**UI Elements** (Ant Design Progress.Circle):
- Circular progress showing time remaining
- Time display in MM:SS format
- Control buttons:
  - Start/Resume (Button.Primary)
  - Pause (Button.Default)
  - Stop/Cancel (Button.Text)

**Step 3**: Implement Timer Logic
```typescript
const [timeRemaining, setTimeRemaining] = useState(duration * 60); // seconds
const [isRunning, setIsRunning] = useState(false);

useEffect(() => {
  if (!isRunning) return;

  const interval = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 0) {
        // Timer complete
        clearInterval(interval);
        onComplete();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isRunning]);
```

**Step 4**: Timer Completion
- Browser notification (Ant Design Notification)
- Celebration animation (Framer Motion)
- Optional: auto-mark task as complete
- Sound effect (optional)

**Deliverable**: Working Pomodoro timer on tasks.

---

### 4.2 Eisenhower Matrix View
**Duration**: 5-6 days

**Step 1**: Add Priority Fields to Task UI
- In task detail modal, add "Priority" section
- Urgent checkbox (Checkbox)
- Important checkbox (Checkbox)
- Helper text explaining each dimension
- Show current quadrant based on selections

**Step 2**: Create Eisenhower Matrix Layout
```typescript
// src/pages/EisenhowerMatrixView.tsx
```

**Layout** (Ant Design Grid):
- 2x2 grid of quadrants (Row with Col span={12})
- Equal height quadrants
- Distinct background colors for each
- Quadrant headers with labels

**Step 3**: Implement Quadrant Components
```typescript
// src/components/EisenhowerQuadrant.tsx

interface QuadrantProps {
  quadrant: 1 | 2 | 3 | 4;
  tasks: Task[];
  label: string;
  color: string;
}
```

**Each Quadrant**:
- Header with label + count badge
- Scrollable task card list
- Distinct visual styling (color accent)

**Step 4**: Implement Drag and Drop
```typescript
import { DndContext, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core';

// Quadrant as droppable
const { setNodeRef } = useDroppable({
  id: `quadrant-${quadrant}`,
});

// Task card as draggable
const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
  id: task.id,
});
```

**On Drop**:
- Update is_urgent and is_important based on target quadrant
- Optimistic update
- Visual feedback during drag

**Step 5**: Unclassified Tasks Section
- Show tasks where is_urgent or is_important are null/default
- Collapsible section below matrix
- Quick classify buttons on hover

**Step 6**: Customizable Labels
- Settings to customize quadrant labels
- Store in user preferences
- Default: "Do First", "Schedule", "Delegate", "Delete"

**Deliverable**: Working Eisenhower Matrix with drag and drop.

---

### 4.3 Kanban Board View
**Duration**: 5-6 days

**Step 1**: Create Kanban Board Layout
```typescript
// src/pages/KanbanBoardView.tsx
```

**Layout**:
- Horizontal scroll container
- 4 fixed-width columns (280-320px each)
- Columns: Ready, In Progress, Blocked, Completed

**Step 2**: Implement Column Components
```typescript
// src/components/KanbanColumn.tsx

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  wipLimit?: number;
}
```

**Column Structure**:
- Header (fixed at top):
  - Status name
  - Task count badge
  - WIP limit warning (if applicable)
- Task card list (vertical stack, scrollable)
- Add task button (footer)

**Step 3**: Implement Drag and Drop
```typescript
import { DndContext, SortableContext, useSortable } from '@dnd-kit/core';

// Column as sortable context
<SortableContext items={taskIds}>
  {tasks.map(task => (
    <SortableTaskCard key={task.id} task={task} />
  ))}
</SortableContext>

// Task card as sortable
const { attributes, listeners, setNodeRef, transform } = useSortable({
  id: task.id,
});
```

**On Drop**:
- Detect target column
- Update task status
- Handle special cases:
  - Blocked: Prompt for blocked_reason (Ant Design Modal)
  - Completed: Trigger completion flow
  - In Progress: Set started_at timestamp
- Validate transition (see status transition validations)

**Step 4**: WIP Limits
- Configurable per-column (stored in user preferences)
- Visual warning when limit exceeded (red header)
- Don't prevent drop, just warn

**Step 5**: Column Settings
- Toggle column visibility
- Adjust WIP limits
- Change sort order within columns

**Deliverable**: Working Kanban board with drag and drop.

---

### 4.4 Filter System
**Duration**: 4-5 days

**Step 1**: Design Filter State
```typescript
interface FilterState {
  tags: string[]; // tag IDs
  status: TaskStatus[];
  type: TaskType[];
  is_urgent: boolean | null;
  is_important: boolean | null;
  has_due_date: boolean | null;
  due_date_range: { start: Date; end: Date } | null;
  search_text: string | null;
  // Advanced filters
  has_timer: boolean | null;
  has_subtasks: boolean | null;
  is_subtask: boolean | null;
}
```

**Step 2**: Create Filter Bar Component
```typescript
// src/components/FilterBar.tsx
```

**Layout** (Ant Design Space):
- Active filters display (Tag chips with close button)
- "Add Filter" dropdown (Dropdown with menu)
- "Clear All" button (when filters active)
- "Save View" button (when filters active)

**Step 3**: Implement Filter Controls
- Tag filter: TreeSelect multi-select
- Status filter: Checkbox.Group
- Date range: DatePicker.RangePicker
- Priority toggles: Checkbox (Urgent, Important)
- Advanced filters: Drawer with additional options

**Step 4**: Apply Filters
```typescript
// In TaskStore, add selector:
const getFilteredTasks = (filters: FilterState) => {
  return tasks.filter(task => {
    // Tag filter (OR logic)
    if (filters.tags.length > 0) {
      const hasTag = task.tag_ids.some(id => filters.tags.includes(id));
      if (!hasTag) return false;
    }

    // Status filter
    if (filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
    }

    // ... other filters

    return true;
  });
};
```

**Step 5**: Filter Persistence
- Store active filters in UIStore
- Persist to localStorage
- Clear on view change (unless saved view)

**Deliverable**: Complete filter system with UI controls.

---

### 4.5 Saved Views System ⭐
**Duration**: 6-7 days
**Dependency**: Requires all view types and filter system to be complete

**Step 1**: Create SavedView Types
```typescript
// src/types/savedView.ts
export enum ViewMode {
  List = 'list',
  Kanban = 'kanban',
  Eisenhower = 'eisenhower',
  Today = 'today',
  Habits = 'habits',
}

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  view_mode: ViewMode;
  filters: FilterState;
  sort_order: { field: string; direction: 'asc' | 'desc' };
  display_options: Record<string, any>;
  is_pinned: boolean;
  is_default: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}
```

**Step 2**: Implement SavedViewStore
```typescript
interface SavedViewState {
  views: SavedView[];
  activeViewId: string | null;
  loading: boolean;
  error: string | null;

  fetchViews: () => Promise<void>;
  createView: (view: Partial<SavedView>) => Promise<void>;
  updateView: (id: string, updates: Partial<SavedView>) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  duplicateView: (id: string) => Promise<void>;
  setActiveView: (id: string) => void;
  reorderViews: (viewIds: string[]) => Promise<void>;
  pinView: (id: string, isPinned: boolean) => Promise<void>;
  initializeDefaultViews: () => Promise<void>;
}
```

**Step 3**: Initialize Default Views
```typescript
const defaultViews: Partial<SavedView>[] = [
  {
    name: 'All Tasks',
    view_mode: ViewMode.List,
    filters: {},
    is_default: true,
    is_pinned: true,
    position: 0,
  },
  {
    name: 'Today',
    view_mode: ViewMode.Today,
    filters: {},
    is_default: true,
    is_pinned: true,
    position: 1,
  },
  {
    name: 'Habits',
    view_mode: ViewMode.Habits,
    filters: { type: [TaskType.Habit] },
    is_default: true,
    is_pinned: true,
    position: 2,
  },
  // ... more defaults
];
```

**Step 4**: Create View Creation Modal
```typescript
// src/components/CreateViewModal.tsx
```

**Form Fields** (Ant Design Form):
- Name (Input, required)
- Icon (emoji picker or select)
- View Mode (Segmented: List, Kanban, Eisenhower, Today)
- Filters (collapsible Collapse with all filter options)
- Sort Order (Select + Radio for direction)
- Display Options (conditional based on view mode)
- Pin to Sidebar (Switch)

**Footer**:
- Preview button (shows count of matching tasks)
- Cancel
- Save View (primary)

**Step 5**: Update Sidebar with Views
```typescript
// src/components/Sidebar.tsx
```

**Structure**:
- App logo/title
- Quick Add button
- Default Views section
  - Today, All Tasks, Habits, Kanban, Matrix
- Divider
- Pinned Views section ("My Views" header)
  - Draggable list of pinned views (@dnd-kit/sortable)
  - Context menu on right-click (Edit, Duplicate, Delete, Unpin)
- More Views (collapsible)
  - Unpinned views
- "+ New View" button
- Divider
- Settings (bottom)

**Step 6**: Implement View Switcher (Cmd/Ctrl+K)
```typescript
// src/components/ViewSwitcher.tsx
```

**UI** (Ant Design Modal):
- Search input with fuzzy search
- Results list:
  - Pinned views section
  - All views section
  - Each item: icon, name, task count
- Keyboard navigation (up/down arrows, enter to select, esc to close)
- Recent views (last 5 accessed)

**Global Keyboard Shortcut**:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openViewSwitcher();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

**Step 7**: Implement Drag-to-Reorder Views
- Use @dnd-kit/sortable in sidebar
- Update position on drop
- Persist to database

**Step 8**: View Management Page
- Access via Settings → "Manage Views"
- List of all views (Ant Design List)
- Actions: Edit, Duplicate, Pin/Unpin, Delete
- Bulk actions (optional)

**Deliverable**: Complete saved views system with UI, drag-reorder, and quick switcher.

---

### 4.6 Notifications System
**Duration**: 4-5 days

**Step 1**: Request Notification Permission
```typescript
// On app load or settings
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};
```

**Step 2**: Implement Notification Types
```typescript
// Tasks due in 24 hours
const notifyTaskDue = (task: Task) => {
  new Notification('Task Due Soon', {
    body: `"${task.title}" is due tomorrow`,
    icon: '/logo.png',
    tag: `task-due-${task.id}`,
  });
};

// Habit grace period
const notifyHabitGrace = (task: Task) => {
  new Notification('Save Your Streak!', {
    body: `🔥 Save your ${task.current_streak}-day streak! Complete "${task.title}" before ${formatTime(task.streak_safe_until)}`,
    icon: '/logo.png',
    tag: `habit-grace-${task.id}`,
    requireInteraction: true,
  });
};

// Someday nudge
const notifySomedayNudge = (task: Task) => {
  const daysSince = differenceInDays(new Date(), new Date(task.last_completed_at));

  new Notification('Task Reminder', {
    body: `It's been ${daysSince} days since you "${task.title}"`,
    icon: '/logo.png',
    tag: `someday-nudge-${task.id}`,
  });
};

// Timer complete
const notifyTimerComplete = (task: Task) => {
  new Notification('Timer Complete!', {
    body: `Great work on "${task.title}"`,
    icon: '/logo.png',
    tag: `timer-complete-${task.id}`,
  });
};
```

**Step 3**: Notification Settings UI
- Settings page with notification preferences
- Toggle for each notification type (Switch)
- Quiet hours settings (TimePicker.RangePicker)
- Grace period reminder interval (Select: 1hr, 3hr, 6hr)

**Step 4**: Notification Check Logic
- Run checks every 5 minutes (setInterval)
- Check for tasks due in 24 hours
- Check for habits in grace period
- Check for someday tasks to nudge
- Respect quiet hours
- Don't send duplicate notifications (use tag)

**Step 5**: In-App Notification Center
- Badge on bell icon showing count (Ant Design Badge)
- Dropdown list of notifications (Ant Design Dropdown + List)
- Click notification to open related task
- Mark as read/clear

**Deliverable**: Working notification system with in-app and browser notifications.

---

### 4.7 Mobile Responsiveness
**Duration**: 4-5 days

**Step 1**: Responsive Layout
- Use Ant Design Grid breakpoints (xs, sm, md, lg, xl)
- Sidebar collapses to drawer on mobile (Ant Design Drawer)
- Top bar shows on mobile (Layout.Header)
- Bottom navigation (optional, Ant Design TabBar or custom)

**Step 2**: Mobile-Specific Interactions
- Swipe gestures for task completion (react-swipeable or custom)
- Long press for context menu (onTouchStart/onTouchEnd)
- Pull to refresh (react-pull-to-refresh or custom)
- Touch-friendly targets (minimum 44x44px)

**Step 3**: Mobile View Adaptations
- Kanban: Single column view with tabs, swipe to switch
- Eisenhower: Tabs for quadrants, swipe to switch
- Task cards: Full width on mobile
- Modals: Full screen on mobile
- Filter bar: Bottom sheet instead of sidebar

**Step 4**: Test on Real Devices
- iOS Safari
- Android Chrome
- Test all gestures
- Test all views
- Fix any layout issues

**Deliverable**: Fully responsive mobile experience.

---

## Phase 5: Polish & Launch (Weeks 9-10)

**Goal**: Polish animations, ensure accessibility, optimize performance, and deploy.

### 5.1 Animations & Celebrations
**Duration**: 3-4 days

**Step 1**: Task Completion Animations
- Checkmark bounce (Framer Motion)
- Confetti on completion (canvas-confetti library)
- Fade out completed task
- Smooth transitions between states

**Step 2**: Streak Milestone Celebrations
- Special animations for 7, 30, 100+ day streaks
- Fireworks or enhanced confetti
- Modal congratulating user
- Sound effect (optional)

**Step 3**: Loading Transitions
- Skeleton screens (Ant Design Skeleton)
- Smooth page transitions (Framer Motion AnimatePresence)
- Loading spinners (Ant Design Spin)

**Step 4**: Micro-interactions
- Button hover effects
- Card hover elevations
- Smooth drag previews
- Ripple effects (CSS or Framer Motion)

**Step 5**: Respect prefers-reduced-motion
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Disable or reduce animations if true
```

**Deliverable**: Delightful animations throughout the app.

---

### 5.2 Accessibility Audit
**Duration**: 3-4 days

**Step 1**: Keyboard Navigation
- Ensure all features accessible via keyboard
- Tab order is logical
- Focus indicators visible (Ant Design default is good)
- Modal focus trap (Ant Design Modal handles this)
- Esc key closes modals/dropdowns

**Step 2**: ARIA Labels
- Add aria-label to icon-only buttons
- Add aria-describedby for form fields
- Add aria-live regions for dynamic content:
  ```typescript
  <div role="status" aria-live="polite">
    Task completed!
  </div>
  ```
- Ensure Ant Design components have proper ARIA (they do by default)

**Step 3**: Color Contrast
- Verify all text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Use contrast checker tool
- Adjust colors if needed
- Test in dark mode too

**Step 4**: Screen Reader Testing
- Test with VoiceOver (Mac) or NVDA (Windows)
- Ensure all content is announced properly
- Fix any issues

**Step 5**: Accessibility Checklist
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Color contrast verified
- [ ] ARIA labels on icon buttons
- [ ] Screen reader tested

**Deliverable**: WCAG AA compliant application.

---

### 5.3 Performance Optimization
**Duration**: 3-4 days

**Step 1**: Memoize Selectors
```typescript
// In Zustand stores, use selectors efficiently
const useFilteredTasks = () => {
  return useTaskStore(state => {
    // This selector is memoized
    return getFilteredTasks(state.tasks, state.filters);
  }, shallow);
};
```

**Step 2**: Optimize Re-renders
- Use React.memo for components that don't need to re-render
- Use useMemo for expensive calculations
- Use useCallback for stable function references
- Check re-renders with React DevTools Profiler

**Step 3**: Code Splitting
```typescript
// Lazy load routes
const TodayDashboard = lazy(() => import('./pages/TodayDashboard'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));

// Wrap in Suspense
<Suspense fallback={<Spin />}>
  <TodayDashboard />
</Suspense>
```

**Step 4**: Database Query Optimization
- Add indexes on frequently queried columns:
  - tasks.user_id
  - tasks.status
  - tasks.due_date
  - tags.user_id
  - saved_views.user_id
- Use SELECT only needed columns
- Batch updates where possible

**Step 5**: Bundle Size Analysis
```bash
npm run build
npx vite-bundle-visualizer
```
- Identify large dependencies
- Lazy load heavy components
- Consider smaller alternatives if needed

**Step 6**: Caching
- Cache task data for 1 minute
- Invalidate cache on mutations
- Use Zustand persist middleware for offline support (optional)

**Deliverable**: Optimized application with fast load times.

---

### 5.4 Edge Functions (Supabase)
**Duration**: 3-4 days

**Step 1**: Daily Streak Check
```typescript
// supabase/functions/daily-streak-check/index.ts

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get all active habits
  const { data: habits } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('type', 'habit')
    .in('status', ['ready', 'in_progress']);

  const now = new Date();

  for (const habit of habits) {
    const gracePeriodEnd = new Date(habit.streak_safe_until);

    // If grace period expired and not completed
    if (now > gracePeriodEnd && habit.status !== 'completed') {
      // Reset streak
      await supabaseClient
        .from('tasks')
        .update({ current_streak: 0 })
        .eq('id', habit.id);
    }
  }

  return new Response('OK', { status: 200 });
});
```

**Step 2**: Someday Task Nudging
```typescript
// supabase/functions/someday-nudge-check/index.ts

// Check all someday tasks
// If days_since_completion >= nudge_threshold
// Update last_nudged_at
// Trigger notification
```

**Step 3**: Schedule Edge Functions
- Set up cron jobs in Supabase dashboard
- daily-streak-check: runs at midnight UTC
- someday-nudge-check: runs daily at 9am UTC

**Step 4**: Test Edge Functions
- Deploy to Supabase
- Test invocation manually
- Verify cron schedule
- Check logs

**Deliverable**: Scheduled edge functions for background tasks.

---

### 5.5 Testing
**Duration**: 4-5 days

**Step 1**: Unit Tests (Vitest)
```typescript
// src/lib/recurrence.test.ts
describe('calculateNextOccurrence', () => {
  it('should calculate next occurrence for daily recurrence', () => {
    // Test
  });

  it('should skip excluded days', () => {
    // Test
  });
});

// src/lib/streaks.test.ts
describe('habit streak logic', () => {
  it('should increment streak on on-time completion', () => {
    // Test
  });

  it('should allow retroactive completion in grace period', () => {
    // Test
  });

  it('should reset streak after grace period', () => {
    // Test
  });
});
```

**Critical Functions to Test**:
- Recurring task calculation
- Habit streak management
- Filter logic
- Parent task auto-completion
- Someday task nudging

**Step 2**: E2E Tests (Playwright - Optional)
```typescript
// tests/task-completion.spec.ts
test('user can create and complete a task', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="quick-add"]');
  await page.fill('[data-testid="task-title"]', 'Test Task');
  await page.click('[data-testid="save-task"]');

  // Verify task appears
  await expect(page.locator('text=Test Task')).toBeVisible();

  // Complete task
  await page.click('[data-testid="task-checkbox"]');

  // Verify completion animation
  await expect(page.locator('text=Test Task')).not.toBeVisible();
});
```

**Key Flows to Test**:
- Create and complete task
- Create habit and track streak
- Save and access custom view
- Drag and drop in Kanban

**Step 3**: Run Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

**Deliverable**: Test coverage for critical functionality.

---

### 5.6 Documentation & Deployment
**Duration**: 3-4 days

**Step 1**: User Documentation
- Help tooltips using Ant Design Tooltip
- Onboarding hints (optional, dismissible)
- Settings explanations
- FAQ section (optional)

**Step 2**: Code Documentation
- JSDoc comments on complex functions
- README with setup instructions
- Architecture documentation
- Deployment guide

**Step 3**: Environment Setup
```bash
# .env.production
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

**Step 4**: Build for Production
```bash
npm run build
```

**Step 5**: Deploy to Vercel/Netlify
- Connect GitHub repository
- Configure environment variables
- Set build command: `npm run build`
- Set output directory: `dist`
- Deploy

**Step 6**: Database Migrations
- Run all migrations in production Supabase
- Verify RLS policies
- Test with production data

**Step 7**: Error Monitoring
- Set up Sentry (optional)
- Configure error boundaries
- Monitor for runtime errors

**Step 8**: Final Testing
- Test production deployment
- Verify all features work
- Check on multiple devices
- Fix any production-specific issues

**Deliverable**: Production-ready application deployed and monitored.

---

## Critical Path Summary

```
Phase 1: Foundation
├── 1.1 Project Scaffolding (1-2 days)
├── 1.2 Supabase Setup (2-3 days) ⭐ CRITICAL
├── 1.3 Authentication (2-3 days) ⭐ CRITICAL
└── 1.4 Design System (2-3 days)
    ↓
Phase 2: Core Task Management
├── 2.1 Task Data Layer (2-3 days) ⭐ CRITICAL
├── 2.2 Tag System (3-4 days) ⭐ CRITICAL - MUST BE FIRST
├── 2.3 Basic Task UI (4-5 days) ⭐ CRITICAL
├── 2.4 Today Dashboard (3-4 days)
└── 2.5 All Tasks View (3-4 days)
    ↓
Phase 3: Advanced Task Features
├── 3.1 Parent/Child Tasks (4-5 days)
├── 3.2 Task Shifting (2-3 days)
├── 3.3 Recurring Tasks (5-6 days)
├── 3.4 Habit Tracking (5-6 days)
├── 3.5 Habits View (4-5 days)
└── 3.6 Someday Tasks (3-4 days)
    ↓
    (Items 3.1-3.6 can be done in parallel after 2.5)
    ↓
Phase 4: Views & Productivity Features
├── 4.1 Pomodoro Timer (3-4 days)
├── 4.2 Eisenhower Matrix (5-6 days)
├── 4.3 Kanban Board (5-6 days)
├── 4.4 Filter System (4-5 days) ⭐ REQUIRED for 4.5
├── 4.5 Saved Views (6-7 days) ⭐ DEPENDS on 4.2, 4.3, 4.4
├── 4.6 Notifications (4-5 days)
└── 4.7 Mobile Responsive (4-5 days)
    ↓
    (Items 4.1-4.3 can be done in parallel)
    (Item 4.5 depends on ALL view types existing)
    ↓
Phase 5: Polish & Launch
├── 5.1 Animations (3-4 days)
├── 5.2 Accessibility (3-4 days)
├── 5.3 Performance (3-4 days)
├── 5.4 Edge Functions (3-4 days)
├── 5.5 Testing (4-5 days)
└── 5.6 Deployment (3-4 days)
```

---

## Key Dependencies & Blocking Relationships

### Must Be Done First (Blockers)
1. **Supabase Setup** → Everything depends on database
2. **Authentication** → Everything depends on user context
3. **Task Data Layer** → All features depend on tasks existing
4. **Tag System** → Tasks need tags for organization

### Must Be Done Before Saved Views
- All view types (Today, All Tasks, Habits, Kanban, Eisenhower)
- Complete filter system
- View-specific display options

### Can Be Parallelized
- After Phase 2.5, items 3.1-3.6 can be done in any order
- Phase 4: Timer, Eisenhower, Kanban can be done in parallel
- Phase 5: Most items can be done concurrently

### Sequential Dependencies
1. Database → Auth → Tasks → UI
2. Tasks → Tags → Task UI
3. Basic UI → Advanced Features
4. All Views → Saved Views System
5. Features → Testing → Deployment

---

## Testing Checkpoints

After each major milestone, verify:

**After Phase 1**:
- ✅ Can create account and log in
- ✅ Database connection works
- ✅ Dark mode toggles correctly

**After Phase 2**:
- ✅ Can create, edit, delete tasks
- ✅ Can create and apply tags
- ✅ Today dashboard shows tasks
- ✅ All tasks view has search/filter

**After Phase 3**:
- ✅ Parent/subtask relationships work
- ✅ Recurring tasks generate correctly
- ✅ Habit streaks track accurately
- ✅ Someday tasks nudge appropriately

**After Phase 4**:
- ✅ Timer counts down and notifies
- ✅ Eisenhower Matrix drag works
- ✅ Kanban drag works
- ✅ Filters apply correctly
- ✅ Saved views can be created/edited
- ✅ Quick switcher (Cmd+K) works
- ✅ Mobile layout is responsive

**After Phase 5**:
- ✅ All animations are smooth
- ✅ Accessibility checklist complete
- ✅ Performance is optimized
- ✅ Edge functions run on schedule
- ✅ Tests pass
- ✅ Production deployment works

---

## Version History

- **v1.0** (2024-11-21): Initial implementation order document created
- Detailed breakdown of all phases with dependencies
- Critical path identified
- Parallel work opportunities highlighted

---

**Next Steps**: Begin Phase 1 - Foundation & Setup
