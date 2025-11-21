# Product Requirements Document: DoTheThing

## 1. Executive Summary

A personal task management application designed to combine flexible task organization, habit tracking, and smart scheduling into a single, delightful user experience. The app addresses the gap in existing solutions by providing true subtask flexibility, intelligent recurring task patterns, and integrated habit tracking with streak management.

## 2. Product Vision

Create a task management system that feels rewarding to use daily, adapts to both structured and flexible scheduling needs, and provides the organizational depth power users require without overwhelming simplicity-seeking users.

## 3. Core Principles

- **Flexibility First**: Tasks should adapt to how users actually work, not force users into rigid structures
- **Delightful Interactions**: Every action should feel satisfying and provide positive feedback
- **No Data Silos**: Habits, tasks, and recurring items share the same underlying model with specialized behaviors
- **Smart Defaults, Deep Customization**: Simple to start, powerful when needed

## 4. User Stories

### Primary Use Cases

**As a user, I want to:**
- Create tasks with flexible organization (tags, colors, hierarchy) so I can group tasks meaningfully
- Set up recurring tasks that respect my actual schedule, not just repeat blindly
- Break down complex tasks into subtasks that are full tasks themselves, not just checkboxes
- Track habits with streaks to build consistency and motivation
- Have some tasks that need doing "eventually" without the pressure of a hard deadline
- See what needs my attention today without being overwhelmed by my entire task list
- Quickly reschedule tasks when plans change
- Get gentle reminders about maintenance tasks that don't have specific due dates
- Time-box certain tasks with a countdown timer to help me get started
- Feel accomplished and motivated by visual progress indicators and celebrations

## 5. Features & Requirements

### 5.1 Task Management

#### Basic Task Properties
- **Required Fields**: Title
- **Optional Fields**: Description, due date, timer duration, blocked reason
- **Status**: Ready, In Progress, Blocked, Completed, Archived
- **Metadata**: Created date, updated date, started date, completion date, completion count
- **Organization**: Multiple tags, parent-child relationships

#### Task Types
1. **Standard Task**: Basic todo item with optional due date
2. **Parent Task**: Container for subtasks with automatic completion logic
3. **Habit**: Recurring task with streak tracking and frequency targets
4. **Someday Task**: Task without due date but with nudge threshold

#### Task States
- **Ready**: Task is ready to be started (default state for new tasks)
- **In Progress**: Task has been started and is actively being worked on
- **Blocked**: Task cannot proceed due to dependencies or external factors
- **Completed**: Task is finished
- **Archived**: Hidden from normal views, kept for history

**Status Workflow:**
```
Ready → In Progress → Completed
  ↓         ↓
Blocked ←──┘
  ↓
Ready (when unblocked)
```

**Status Behaviors:**
- New tasks default to "Ready" status
- User can manually move tasks between Ready/In Progress/Blocked
- Blocked tasks can include optional blocked reason/note
- Only "Completed" status triggers completion logic (streaks, recurrence, etc.)
- Parent tasks show status distribution of subtasks
- Dashboard can filter by status (e.g., show only "In Progress" tasks)

### 5.2 Hierarchical Task Structure

#### Parent-Subtask Relationships
```
Parent Task (Container)
├── Progress: X of Y subtasks complete
├── Auto-completion: Completes when all subtasks complete
├── Manual completion: Completes all remaining subtasks
└── Subtasks
    ├── Subtask 1 (Full task with all properties)
    ├── Subtask 2 (Can have own due date, tags, recurrence)
    └── Subtask 3 (Can itself be a parent task)
```

**Rules:**
- Subtasks are full-featured tasks with all standard properties
- Subtasks can have different due dates from parent
- Subtasks can have their own recurrence patterns
- Subtasks can be parent tasks themselves (unlimited nesting)
- Completing parent manually completes all subtasks
- Completing all subtasks auto-completes parent
- Progress visualization shows completion percentage

### 5.3 Tagging System

#### Tag Structure
```
Tag
├── Name
├── Color (hex value or gradient string)
├── Icon (optional emoji/icon identifier)
├── Parent Tag (optional, for hierarchy)
└── Child Tags (array)
```

**Hierarchical Example:**
```
Work
├── Meetings
│   ├── 1-on-1s
│   └── Team Meetings
├── Projects
│   ├── Project Alpha
│   └── Project Beta
└── Admin

Personal
├── Home
│   ├── Cleaning
│   └── Maintenance
└── Health
    ├── Exercise
    └── Medical
```

**Rules:**
- Tasks can have multiple tags at any hierarchy level
- Tag hierarchy is for organization only, not filtering logic
- Tags can be any color for visual distinction
- Orphaned tasks (parent deleted) maintain their tags

#### Tag Color System

**Default Color Palette:**
```
Provided Defaults (12 solid colors):
├── Red: #EF4444
├── Orange: #F97316
├── Yellow: #EAB308
├── Green: #22C55E
├── Teal: #14B8A6
├── Blue: #3B82F6
├── Indigo: #6366F1
├── Purple: #A855F7
├── Pink: #EC4899
├── Gray: #6B7280
├── Brown: #92400E
└── Black: #1F2937

Gradient Presets (8 combinations):
├── Sunset: #F97316 → #EF4444
├── Ocean: #3B82F6 → #14B8A6
├── Forest: #22C55E → #14B8A6
├── Twilight: #6366F1 → #A855F7
├── Rose: #EC4899 → #EF4444
├── Candy: #EC4899 → #A855F7
├── Sky: #3B82F6 → #6366F1
└── Fire: #EAB308 → #EF4444
```

**Custom Color Creation:**
```
Tag Color Editor:
├── Type Selection: Solid | Gradient
├── If Solid:
│   ├── Color picker (full spectrum)
│   └── Hex input field
├── If Gradient:
│   ├── Start color picker
│   ├── End color picker
│   ├── Direction selector (0°, 45°, 90°, 135°, 180°, etc.)
│   └── Live preview
├── Save to palette: Option to save custom color for reuse
└── Recent colors: Show last 5 used colors
```

**Color Storage:**
```
Tag.color field stores:
├── Solid: "#EF4444"
├── Gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)"
└── App parses string to determine type and render appropriately
```

### 5.4 Recurring Tasks

#### Recurrence Types

**Type 1: Fixed Schedule**
```
Fixed Schedule Recurrence
├── Pattern: {interval: number, unit: 'days'|'weeks'|'months'}
├── Anchor Date: Original start date for calculating occurrences
├── Exclude Days: [0-6] (Sunday=0, Saturday=6)
├── Next Due Date: Calculated from pattern
└── Behavior: Creates next occurrence based on original schedule regardless of completion
```

**Examples:**
- Every 7 days (weekly)
- Every 14 days, excluding weekends
- Every 2nd Monday of the month
- Every 3 months from anchor date

**Logic:**
- If completed early (Sunday for Monday task): Next occurrence still Monday
- If completed late (Tuesday for Monday task): Next occurrence still following Monday
- If missed entirely: Creates next occurrence on next scheduled date
- Excluded days: Skip to next valid day

**Type 2: After Completion**
```
After Completion Recurrence
├── Pattern: {interval: number, unit: 'hours'|'days'|'weeks'|'months'}
├── Next Due Date: Calculated from last completion
└── Behavior: Creates next occurrence X time after task completion
```

**Examples:**
- 4 days after last completed
- 6 hours after last completed
- 2 weeks after last completed

**Logic:**
- Next occurrence created only upon completion
- Scheduled relative to actual completion date, not original due date
- If completed early: Next due date calculated from early completion
- If completed late: Next due date calculated from late completion

### 5.5 Habit Tracking

#### Habit Properties
```
Habit (extends Task)
├── All standard task properties
├── Target Frequency: {count: number, period: 'day'|'week'|'month'}
├── Current Streak: number (consecutive successful completions)
├── Longest Streak: number (historical best)
├── Streak Safe Until: timestamp (24hr grace period)
└── Recurrence: Typically fixed schedule or frequency-based
```

**Streak Logic:**
```
On Habit Due:
├── If completed on time → Increment current streak
├── If not completed → Start 24hr grace period
│   ├── Grace period starts 24hrs after missed deadline
│   ├── During grace: Can complete retroactively to save streak
│   │   └── Mark completion as retroactive in history
│   └── After grace expires: Streak resets to 0
└── Update longest streak if current > longest

Streak Safe Period:
├── Timestamp = deadline + 24 hours
├── User can complete task retroactively before this time
├── After this time: Task locks, cannot be retroactively completed
└── Next occurrence begins new streak from 0 or continues if saved
```

**Frequency Examples:**
- Daily habit: Target = {count: 1, period: 'day'}
- 3x per week: Target = {count: 3, period: 'week'}
- Twice monthly: Target = {count: 2, period: 'month'}

**Dashboard Behavior:**
- Habits appear on days they're "due" based on target frequency
- Daily habits appear every day
- 3x weekly habits appear until completed 3 times that week
- Visual indicator shows progress toward weekly/monthly targets

### 5.6 Someday Tasks (No Due Date Tasks)

#### Properties
```
Someday Task
├── has_due_date: false
├── Nudge Threshold: number (days/weeks/months)
├── Last Completed: timestamp
├── Last Nudged: timestamp
└── Can Recur: boolean (recreates after completion if true)
```

**Nudge Logic:**
```
Check Daily:
├── If (now - last_completed) >= nudge_threshold
│   ├── Add to today's dashboard as "Suggested Task"
│   ├── Visual indicator: "It's been X days since you did this"
│   └── Update last_nudged timestamp
├── On Completion:
│   ├── Remove from dashboard immediately
│   ├── Reset last_completed to now
│   ├── If recurring: Will reappear after threshold passes again
│   └── If not recurring: Marks as completed, archives
└── Can Dismiss/Snooze:
    ├── Snooze: Push last_nudged forward by X days
    └── Stays off dashboard until next threshold check
```

**Use Cases:**
- Housework that needs doing regularly but not on strict schedule
- Maintenance tasks with flexible timing
- "Someday/maybe" items that shouldn't be forgotten
- Personal projects without deadlines

**Examples:**
- "Clean the gutters" - nudge after 90 days
- "Rotate mattress" - nudge after 6 months
- "Review finances" - nudge after 30 days
- "Call mom" - nudge after 7 days

### 5.7 Task Shifting/Rescheduling

#### Shift Forward Interaction
```
Context Menu on Task
├── Move to Tomorrow
├── Move Forward X Days
│   └── Opens dialog: "How many days forward?"
├── Move to Next Week (Monday)
└── Remove Due Date (convert to someday task)

Shift Logic:
├── If standard task: Update due_date
├── If recurring task (fixed schedule):
│   ├── Update current occurrence's due_date
│   └── Maintain original recurrence pattern for future
├── If recurring task (after completion):
│   ├── Update due_date
│   └── Next recurrence still calculates from actual completion
└── If habit:
    ├── Update due_date for current occurrence
    └── Streak continues if completed within grace period
```

### 5.8 Pomodoro Timer

#### Timer Properties
```
Task with Timer
├── timer_duration_minutes: number
├── Timer States: not_started | running | paused | completed
├── Current Time Remaining: number (seconds)
└── Completed Sessions: number (optional tracking)
```

**Timer Behavior:**
```
Start Timer:
├── Begin countdown from duration
├── Visual indicator on task card
├── Browser notification when complete
├── Completion celebration animation
└── Does not auto-complete task (just satisfies timer requirement)

Timer Controls:
├── Start/Resume
├── Pause
├── Cancel (reset to duration)
└── Manual Complete (end early)

Integration:
├── Timer tasks appear in dashboard with play button
├── Can complete task without timer if desired
└── Timer is helper tool, not blocker
```

**Use Case:**
- "Exercise for 30 minutes" - Timer ensures minimum effort
- "Study for 45 minutes" - Pomodoro-style focus session
- "Clean kitchen for 15 minutes" - Time-boxed maintenance

### 5.9 Dashboard Views

#### Today Dashboard

**Content Sections:**
```
Today Dashboard
├── Overdue Section (if any)
│   ├── Visual: Red/urgent styling
│   ├── Shows: Tasks past due date
│   └── Sorted: Oldest first
│
├── Habits Due Today
│   ├── Visual: Streak indicators prominent
│   ├── Shows: Habits with target for today
│   └── Sorted: By target frequency, then name
│
├── Tasks Due Today
│   ├── Visual: Standard task cards
│   ├── Shows: Tasks with today's due date
│   └── Sorted: By time (if set), then priority tags
│
└── Suggested Tasks (Nudged Someday Tasks)
    ├── Visual: Subtle, lower priority styling
    ├── Shows: Someday tasks past nudge threshold
    └── Includes: "Last done X days ago" indicator
```

**Parent Task Display:**
```
Collapsed Parent Task Card
├── Title
├── Progress Bar (X of Y complete)
├── Subtask Count Badge
├── Due Date (if any)
├── Tags
└── Expand/Collapse Control

Expanded Parent Task Card
├── Title
├── Progress Bar
├── Subtask List
│   ├── Subtask 1 (full task card)
│   ├── Subtask 2 (full task card)
│   └── Subtask 3 (full task card)
└── Each subtask shows completion controls
```

**Filtering & Sorting:**
- Default: Overdue → Habits → Due Today → Suggested
- Optional filters: By tag, by task type
- Optional sort: Alphabetical, by due time, by priority

#### All Tasks View

**Organization Options:**
```
All Tasks View
├── List View (default)
│   ├── Grouped by: Status | Tags | Due Date | Parent/Child
│   ├── Filtered by: Active | Completed | Archived
│   └── Sorted by: Due date | Created date | Updated date | Title
│
├── Search/Filter Bar
│   ├── Text search (title, description)
│   ├── Tag filter (multi-select, hierarchical)
│   ├── Date range filter
│   └── Task type filter
│
└── Quick Actions per Task
    ├── Complete
    ├── Edit
    ├── Shift Forward
    ├── Archive
    └── Delete
```

#### Habits View

**Habit-Specific Display:**
```
Habits View
├── Active Habits List
│   ├── Current Streak (prominent)
│   ├── Longest Streak
│   ├── Target Frequency
│   ├── Completion Status Today
│   └── Quick complete button
│
├── Calendar Heatmap
│   ├── Visual: GitHub-style contribution graph
│   ├── Shows: Completion history over time
│   ├── Colors: Intensity based on frequency
│   └── Interactive: Click date for details
│
└── Statistics Panel
    ├── Total Habits
    ├── Active Streaks
    ├── Longest Current Streak
    ├── Most Consistent Habit
    └── This Week's Completion Rate
```

### 5.10 Task Completion Flow

#### Standard Task Completion
```
User Triggers Complete:
├── Desktop: Single click on checkbox
├── Mobile: Swipe gesture (partial swipe → confirm prompt, full swipe → complete)
│
├── If Parent Task:
│   ├── Mark parent as completed
│   ├── Mark all subtasks as completed
│   ├── Record completion time for all
│   └── Trigger completion animation
│
├── If Subtask:
│   ├── Mark subtask as completed
│   ├── Check if all siblings completed
│   │   └── If yes: Auto-complete parent
│   └── Update parent progress bar
│
├── If Standard Task:
│   ├── Mark as completed
│   ├── Record completion time
│   └── If recurring: Generate next occurrence
│
└── Completion Effects:
    ├── Celebration animation (confetti, checkmark bounce)
    ├── Update completion count
    ├── Remove from today's dashboard (if applicable)
    └── Add to completion history
```

#### Habit Completion
```
Complete Habit:
├── Mark as completed for this occurrence
├── Check if within grace period or on time:
│   ├── On time: Increment current_streak
│   ├── Within grace: Mark as retroactive, increment streak
│   └── After grace: Cannot complete retroactively
│
├── Update longest_streak if current > longest
├── Record completion in history
│   ├── completed_at timestamp
│   ├── was_late boolean
│   └── was_retroactive boolean
│
├── Generate next occurrence (based on recurrence pattern)
├── Update weekly/monthly progress if applicable
└── Extra celebration if milestone streak (7, 30, 100, etc.)
```

#### Recurring Task Completion
```
Complete Recurring Task:
│
├── If Fixed Schedule:
│   ├── Mark current occurrence complete
│   ├── Calculate next occurrence from original anchor_date + pattern
│   ├── Respect excluded days (skip to next valid day)
│   └── Create new task instance with new due_date
│
├── If After Completion:
│   ├── Mark current occurrence complete
│   ├── Calculate next occurrence: completed_at + interval
│   └── Create new task instance with calculated due_date
│
└── Completion Record:
    ├── Store completion timestamp
    ├── Store was_late boolean (if completed after due_date)
    ├── Link to specific recurrence instance
    └── Maintain completion count across all instances
```

## 6. Data Model

### 6.1 Entity Definitions

#### Task Entity
```
Task {
  id: UUID
  user_id: UUID (foreign key to User)
  title: string (required)
  description: string (optional)
  type: enum ['task', 'habit', 'parent']
  status: enum ['ready', 'in_progress', 'blocked', 'completed', 'archived']
  blocked_reason: string (optional, explanation when status is 'blocked')
  parent_id: UUID (nullable, foreign key to Task)
  
  // Date tracking
  started_at: timestamp (nullable, set when moved to 'in_progress')
  
  // Due date handling
  due_date: timestamp (nullable)
  has_due_date: boolean
  nudge_threshold_days: integer (nullable, for someday tasks)
  last_nudged_at: timestamp (nullable)
  
  // Completion tracking
  last_completed_at: timestamp (nullable)
  completed_count: integer
  
  // Timer
  timer_duration_minutes: integer (nullable)
  
  // Habit-specific
  current_streak: integer (default 0)
  longest_streak: integer (default 0)
  streak_safe_until: timestamp (nullable)
  target_frequency: JSON (nullable)
    // Structure: {count: number, period: 'day'|'week'|'month'}
  
  // Metadata
  created_at: timestamp
  updated_at: timestamp
}

Relationships:
- Task belongs_to User
- Task belongs_to Task (parent, optional)
- Task has_many Tasks (children/subtasks)
- Task has_many TaskTags
- Task has_many Tags (through TaskTags)
- Task has_one Recurrence (optional)
- Task has_many Completions
```

#### Recurrence Entity
```
Recurrence {
  id: UUID
  task_id: UUID (foreign key to Task)
  type: enum ['fixed_schedule', 'after_completion']
  frequency: JSON (required)
    // Fixed schedule: {interval: number, unit: 'days'|'weeks'|'months', excludeDays: [0-6]}
    // After completion: {interval: number, unit: 'hours'|'days'|'weeks'|'months'}
  anchor_date: timestamp (nullable, for fixed schedules)
  next_due_date: timestamp (calculated)
  created_at: timestamp
}

Relationships:
- Recurrence belongs_to Task
```

#### Tag Entity
```
Tag {
  id: UUID
  user_id: UUID (foreign key to User)
  name: string (required)
  color: string (hex color or gradient string, required)
  icon: string (nullable, emoji or icon identifier)
  parent_id: UUID (nullable, foreign key to Tag)
  created_at: timestamp
}

Relationships:
- Tag belongs_to User
- Tag belongs_to Tag (parent, optional)
- Tag has_many Tags (children)
- Tag has_many TaskTags
- Tag has_many Tasks (through TaskTags)
```

#### TaskTag Entity (Junction)
```
TaskTag {
  task_id: UUID (foreign key to Task)
  tag_id: UUID (foreign key to Tag)
  // Composite primary key (task_id, tag_id)
}

Relationships:
- TaskTag belongs_to Task
- TaskTag belongs_to Tag
```

#### Completion Entity
```
Completion {
  id: UUID
  task_id: UUID (foreign key to Task)
  completed_at: timestamp (default now)
  was_late: boolean (default false)
  was_retroactive: boolean (default false, for grace period saves)
}

Relationships:
- Completion belongs_to Task
```

#### User Entity
```
User {
  id: UUID (Supabase Auth user)
  email: string
  created_at: timestamp
  // Additional user preferences
  notification_settings: JSON (nullable)
    // Structure: {
    //   tasks_due_enabled: boolean,
    //   habits_grace_enabled: boolean,
    //   someday_nudge_enabled: boolean,
    //   timer_complete_enabled: boolean,
    //   quiet_hours_start: string (HH:MM),
    //   quiet_hours_end: string (HH:MM),
    //   grace_reminder_interval: number (hours)
    // }
}

Relationships:
- User has_many Tasks
- User has_many Tags
```

### 6.2 Data Relationships Diagram

```
User
├── Tasks (1:many)
│   ├── Parent/Child Tasks (self-referential)
│   ├── TaskTags → Tags (many:many)
│   ├── Recurrence (1:1, optional)
│   └── Completions (1:many)
└── Tags (1:many)
    └── Parent/Child Tags (self-referential)
```

### 6.3 Key Queries & Computed Values

#### Today Dashboard Query
```
Get Today's Tasks:
├── Query overdue tasks:
│   └── WHERE due_date < today AND status IN ('ready', 'in_progress', 'blocked')
│
├── Query today's tasks:
│   └── WHERE due_date = today AND status IN ('ready', 'in_progress', 'blocked')
│
├── Query today's habits:
│   └── WHERE type = 'habit' 
│       AND status IN ('ready', 'in_progress', 'blocked')
│       AND (should_appear_today based on target_frequency)
│
└── Query nudged someday tasks:
    └── WHERE has_due_date = false
        AND status IN ('ready', 'in_progress', 'blocked')
        AND (now - last_completed_at) >= nudge_threshold_days
        AND (last_nudged_at IS NULL OR last_nudged_at < today)
```

#### Habit Appearance Logic
```
Should Habit Appear Today:
├── If target_frequency.period = 'day':
│   └── Appears every day
│
├── If target_frequency.period = 'week':
│   ├── Count completions this week
│   └── If count < target_frequency.count: Appears today
│
└── If target_frequency.period = 'month':
    ├── Count completions this month
    └── If count < target_frequency.count: Appears today
```

#### Parent Task Progress
```
Calculate Progress:
├── Get all subtasks WHERE parent_id = task.id
├── Count completed subtasks
├── Calculate percentage: (completed / total) * 100
└── Return: {completed: number, total: number, percentage: number}
```

#### Next Recurrence Calculation
```
Calculate Next Due Date (Fixed Schedule):
├── Start from anchor_date
├── Add (interval * unit) repeatedly until date > now
├── Check if date falls on excluded day:
│   └── If yes: Increment to next non-excluded day
└── Return calculated date

Calculate Next Due Date (After Completion):
├── Start from last_completed_at
├── Add (interval * unit)
└── Return calculated date
```

#### Streak Validation
```
Check Streak Status:
├── If completed on or before due_date:
│   └── Streak continues
│
├── If not completed and now < streak_safe_until:
│   └── Can save streak with retroactive completion
│
├── If now >= streak_safe_until:
│   ├── Streak is lost
│   ├── Reset current_streak to 0
│   └── Lock from retroactive completion
│
└── Update longest_streak if current_streak > longest_streak
```

## 7. User Interface Requirements

### 7.1 Visual Design Principles

**Color & Theming:**
- Light and dark mode support (system preference detection + manual toggle)
- Gradient accents for visual interest and depth
- Tag colors customizable with full color picker
- Status colors: Green (completed), Red (overdue), Yellow (due soon), Blue (active)
- Depth through layering: Cards float above background with subtle shadows

**Typography:**
- Clear hierarchy: H1 (page titles), H2 (section headers), body, small text
- Readable font sizes: Minimum 14px for body text
- Adequate line height for comfortable reading

**Spacing & Layout:**
- Generous whitespace between elements
- Consistent padding/margins using 8px grid system
- Rounded corners on all interactive elements (border-radius: 8-16px)
- Cards use consistent elevation/shadow patterns

**Motion & Animation:**
- Framer Motion for all transitions and interactions
- Entrance animations: Fade + slide for new elements
- Completion animations: Checkmark scale + bounce, optional confetti
- Streak milestone celebrations: Extra special animation at 7, 30, 100 days
- Smooth transitions: 200-300ms for most interactions
- Loading states: Skeleton screens or subtle pulse animations
- Gesture feedback: Visual response to touch/click immediately

**Responsive Design:**
- Mobile-first approach
- Desktop: Multi-column layouts where appropriate
- Tablet: Hybrid of mobile and desktop patterns
- Touch targets: Minimum 44x44px for mobile

### 7.2 Component Requirements

#### Task Card Component
```
Visual Elements:
├── Status Indicator (left edge or badge)
│   ├── Ready: Default/subtle styling
│   ├── In Progress: Blue accent/border
│   ├── Blocked: Red/orange warning indicator
│   └── Completed: Checkmark (for reference)
├── Checkbox/Complete Control (left of title)
├── Title (prominent)
├── Blocked Reason (if status is 'blocked', shown below title in warning style)
├── Description (truncated if long)
├── Due Date Display (with time if set)
│   └── Color-coded: Overdue (red), Today (blue), Future (gray)
├── Tags (colored chips, max 3 visible + count)
├── Timer Control (if timer set)
├── Progress Bar (if parent task)
│   └── Shows: X/Y subtasks complete + status breakdown
├── Streak Indicator (if habit)
│   └── Shows: 🔥 Current streak count
└── Context Menu Trigger (three dots or right-click)

Interactions:
├── Click checkbox: Complete task
├── Click card: Open detail modal
├── Click context menu: Show actions
├── Click timer: Start/stop timer
├── Click expand (parent): Show/hide subtasks
└── Swipe (mobile): Reveal complete action

States:
├── Default (Ready status)
├── In Progress (blue accent/border)
├── Blocked (orange/red warning styling)
├── Hover (desktop)
├── Active/Pressed
├── Completed (strikethrough, faded)
└── Overdue (red accent, can be combined with status)
```

#### Context Menu Component
```
Actions:
├── Edit Task
├── Status Actions:
│   ├── Mark as Ready
│   ├── Mark as In Progress
│   ├── Mark as Blocked → Opens dialog for blocked reason
│   └── Mark as Complete
├── Move to Tomorrow
├── Move Forward X Days → Opens dialog
├── Remove Due Date
├── Duplicate Task
├── Archive Task
└── Delete Task

Appearance:
├── Floating menu positioned near trigger
├── Subtle shadow for depth
├── Icons + text labels
└── Keyboard shortcuts shown (desktop)
```

#### Tag Chip Component
```
Visual:
├── Background: Tag color (semi-transparent in light mode, solid in dark)
├── Text: Contrasting color for readability
├── Icon: Optional emoji/icon on left
├── Border-radius: Fully rounded (pill shape)
└── Size: Compact, readable

States:
├── Default
├── Hover (desktop): Slightly brighter
├── Active/Selected (filtering): Darker/more opaque
└── Interactive vs Display-only variants
```

#### Progress Bar Component
```
Visual:
├── Background: Subtle gray track
├── Fill: Gradient (primary color → accent)
├── Height: 6-8px
├── Border-radius: Fully rounded
├── Animation: Smooth fill transition on change
└── Text Label: "X of Y complete" below or overlaid

Variants:
├── Linear (horizontal bar)
└── Circular (for compact views)
```

#### Timer Component
```
Visual:
├── Time Display: MM:SS format, large and readable
├── Progress Ring: Circular countdown visual
├── Controls: Play/Pause/Stop buttons
├── State Indicator: Color changes based on state
│   └── Not started (gray), Running (blue), Paused (yellow), Complete (green)
└── Sound/Notification: Optional completion alert

Interactions:
├── Start: Begin countdown
├── Pause: Hold current time
├── Resume: Continue from paused time
├── Stop: End session (doesn't complete task)
└── Complete Early: End timer and allow task completion
```

#### Habit Streak Display
```
Visual:
├── Fire Emoji: 🔥 (or custom icon)
├── Streak Count: Large, prominent number
├── Longest Streak: Smaller text below
├── Progress to Milestone: Optional visual
│   └── "7 more days to reach 30-day streak!"
└── Grace Period Indicator: Yellow warning if in 24hr window

Celebration Moments:
├── Milestone reached: Special animation
├── Streak saved during grace: Relief animation
└── New longest streak: Extra special celebration
```

### 7.3 Page Layouts

#### Today Dashboard Layout
```
Desktop (1200px+):
├── Header: Title "Today" + Date + Quick Add Button
├── Main Content (single column, max-width 800px, centered)
│   ├── Overdue Section (if any)
│   ├── Habits Section
│   ├── Tasks Section
│   └── Suggested Tasks Section
└── Sidebar (optional): Week calendar preview, stats summary

Mobile (<768px):
├── Header: Compact title + Quick Add
├── Main Content (full width)
│   ├── Sections stack vertically
│   └── Cards full-width with padding
└── Bottom Navigation: Dashboard | All Tasks | Habits | Settings
```

#### All Tasks Layout
```
Desktop:
├── Header: Title + Search/Filter Bar
├── Sidebar (left): Tag tree navigation
├── Main Content: Task list
│   ├── Grouping headers (if grouped)
│   ├── Task cards
│   └── Empty state if no tasks
└── Floating Action Button: Quick Add (bottom-right)

Mobile:
├── Header: Title + Filter Icon
├── Main Content: Task list (full width)
└── Bottom Sheet: Filter/sort options (triggered by filter icon)
```

#### Habits View Layout
```
Desktop:
├── Header: Title "Habits"
├── Top Section: Active habits list
│   └── Grid of habit cards (2-3 columns)
├── Middle Section: Calendar heatmap
│   └── Full-width, scrollable for long history
└── Bottom Section: Statistics panel
    └── Grid of stat cards

Mobile:
├── Header: Title "Habits"
├── Tabs: Active | Calendar | Stats
├── Content: Current tab content
└── Swipe between tabs gesture
```

#### Task Detail Modal
```
Layout (Overlay, centered):
├── Header: Close button + Task title (editable)
├── Body (scrollable):
│   ├── Description field (expandable textarea)
│   ├── Due Date Picker
│   ├── Tag Selector (multi-select with hierarchy)
│   ├── Timer Duration Input (if applicable)
│   ├── Parent Task Selector (if subtask)
│   ├── Recurrence Settings (if recurring)
│   │   ├── Type selector (fixed vs after completion)
│   │   └── Frequency configuration
│   ├── Habit Settings (if habit type)
│   │   └── Target frequency configuration
│   ├── Someday Settings (if no due date)
│   │   └── Nudge threshold input
│   └── Subtasks List (if parent)
│       └── Inline subtask creation
├── Footer: Action buttons
│   ├── Save Changes (primary)
│   ├── Cancel
│   ├── Archive/Delete (destructive, separate)
│   └── Duplicate (utility)
└── Backdrop: Dim background, click to close
```

### 7.4 Interaction Patterns

#### Desktop Interactions
- Hover states on all interactive elements
- Right-click context menus
- Keyboard shortcuts for power users (later enhancement)
- Drag and drop for reordering (later enhancement)
- Double-click to open detail modal

#### Mobile Interactions
- Swipe left on task card: Reveal complete button
- Swipe right on task card: Reveal reschedule options
- Long press: Open context menu
- Pull to refresh on lists
- Bottom sheets for filters and settings
- Native date pickers and time pickers

#### Gesture Feedback
- Immediate visual response to all touch/click events
- Haptic feedback on completion (mobile)
- Optimistic UI updates (assume success, revert on error)
- Loading states for async operations
- Error states with retry options

### 7.5 Empty States

All views must handle empty states gracefully:

```
Today Dashboard (no tasks):
├── Illustration: Happy/relaxed visual
├── Message: "Nothing due today! You're all caught up."
└── Action: "Add a task" button

All Tasks (no tasks):
├── Illustration: Getting started visual
├── Message: "Get started by creating your first task"
└── Action: "Create Task" prominent button

Habits (no habits):
├── Illustration: Streak/habit visual
├── Message: "Build better habits, one day at a time"
└── Action: "Create Your First Habit" button

Search/Filter (no results):
├── Message: "No tasks match your filters"
└── Action: "Clear Filters" button
```

## 8. Authentication & User Management

### 8.1 Authentication Strategy

**Primary Authentication:**
- Supabase Auth for user management
- Email/password authentication (primary method)
- Magic link authentication for passwordless login (optional)
- OAuth providers (Google, GitHub) for convenience (optional)

**Security:**
- Password requirements: Minimum 8 characters
- Email verification required on signup
- Password reset via email link
- Session token refresh handled by Supabase

### 8.2 Multi-User Architecture

**Data Isolation:**
```
Row Level Security (RLS) Policies:
├── All tables include user_id foreign key
├── SELECT: WHERE user_id = auth.uid()
├── INSERT: WITH CHECK (user_id = auth.uid())
├── UPDATE: WHERE user_id = auth.uid()
└── DELETE: WHERE user_id = auth.uid()
```

**User Data Boundaries:**
- Each user can only access their own tasks, tags, completions
- Database enforces isolation at PostgreSQL level
- No shared data between users
- Complete data independence per user

**Session Management:**
- Persistent sessions with "remember me" functionality
- Automatic token refresh
- Logout clears all local state and invalidates session
- Session expires after 30 days of inactivity

### 8.3 User Preferences

```
User Preferences (stored in users table):
├── Theme: 'light' | 'dark' | 'system'
├── Notification Settings:
│   ├── tasks_due_enabled: boolean
│   ├── habits_grace_enabled: boolean
│   ├── someday_nudge_enabled: boolean
│   ├── timer_complete_enabled: boolean
│   ├── quiet_hours_start: string (HH:MM)
│   ├── quiet_hours_end: string (HH:MM)
│   └── grace_reminder_interval: number (1, 3, or 6 hours)
└── Display Preferences:
    ├── default_view: 'dashboard' | 'all_tasks' | 'habits'
    ├── show_completed_tasks: boolean
    └── compact_view: boolean
```

## 9. Notifications System

### 9.1 Notification Types

**Tasks Coming Due (24hr Warning):**
```
Trigger: Task due in next 24 hours
Timing: Once, 24 hours before due time
Content: "[Task Name]" is due tomorrow at [time]
Action: Click to view task
Priority: Normal
```

**Habits in Grace Period:**
```
Trigger: Habit missed, within 24hr grace window
Timing: Initial at 1hr after missed, then every X hours (user configurable: 1, 3, or 6)
Content: "🔥 Save your [X]-day streak! Complete [Habit Name] before [time]"
Action: Click to complete habit
Priority: High (urgent styling, sound enabled by default)
```

**Nudged Someday Tasks:**
```
Trigger: Someday task hits nudge threshold
Timing: Once per day, morning (9am user's local time)
Content: "It's been [X] days since you [Task Name]"
Action: Click to view task on dashboard
Priority: Low (subtle, no sound)
```

**Timer Completion:**
```
Trigger: Pomodoro timer reaches 0:00
Timing: Immediate
Content: "Timer complete! Great work on [Task Name]"
Action: Celebration animation, click to mark task done
Sound: Optional completion chime
Priority: Normal
```

### 9.2 Notification Settings

**User Configuration:**
```
Notification Preferences:
├── Enable/Disable per notification type
├── Quiet Hours:
│   ├── Start time (HH:MM)
│   ├── End time (HH:MM)
│   └── No notifications during this period
├── Grace Period Reminders:
│   └── Frequency: Every 1hr | 3hr | 6hr
└── Sound:
    ├── Enable/disable notification sounds
    └── Per-notification-type sound settings
```

### 9.3 Implementation Details

**Browser Notifications:**
- Uses Web Notifications API
- Requires user permission on first notification attempt
- Graceful fallback if permission denied
- In-app notification center as alternative display

**Notification Queue:**
- Checks notification conditions every 5 minutes (background task)
- Respects quiet hours settings
- Deduplicates notifications (don't send same notification twice)
- Clears notification when user views related task

**Notification Interactions:**
- Click notification: Opens app and focuses related task
- Dismiss notification: Marks as acknowledged, won't re-send
- Notification center: Shows last 20 notifications with timestamps

## 10. Technical Architecture

### 10.1 Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling and dev server
- Zustand for state management
- Framer Motion for animations
- TailwindCSS for styling
- React Hook Form for form handling
- date-fns for date manipulation
- React Router for navigation

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Auth for authentication
- Supabase Realtime for live updates
- Supabase Storage (future: for attachments)
- Supabase Edge Functions (for scheduled tasks/notifications)

**Development:**
- ESLint + Prettier for code quality
- TypeScript strict mode
- Vitest for unit testing
- Playwright for E2E testing (optional)

**Future Mobile:**
- React Native (reuse business logic)
- Shared component library where possible
- React Native Reanimated for animations

### 10.2 State Management Architecture

```
Zustand Store Structure:

TaskStore (primary store):
├── State:
│   ├── tasks: Task[]
│   ├── loading: boolean
│   ├── error: string | null
│   └── selectedDate: Date (for dashboard filtering)
│
└── Actions (async, interact with Supabase):
    ├── fetchTasks()
    ├── addTask(task: Partial<Task>)
    ├── updateTask(id: string, updates: Partial<Task>)
    ├── completeTask(id: string, retroactive?: boolean)
    ├── deleteTask(id: string)
    ├── archiveTask(id: string)
    ├── shiftTaskForward(id: string, days: number)
    └── duplicateTask(id: string)

TagStore:
├── State:
│   ├── tags: Tag[]
│   ├── loading: boolean
│   └── error: string | null
│
└── Actions:
    ├── fetchTags()
    ├── addTag(tag: Partial<Tag>)
    ├── updateTag(id: string, updates: Partial<Tag>)
    └── deleteTag(id: string)

UIStore (app-level UI state):
├── State:
│   ├── theme: 'light' | 'dark' | 'system'
│   ├── selectedTask: string | null (for detail modal)
│   ├── showCompletedTasks: boolean
│   └── sidebarCollapsed: boolean
│
└── Actions:
    ├── toggleTheme()
    ├── selectTask(id: string | null)
    └── toggleSidebar()

AuthStore:
├── State:
│   ├── user: User | null
│   ├── session: Session | null
│   └── loading: boolean
│
└── Actions:
    ├── signIn(email: string, password: string)
    ├── signUp(email: string, password: string)
    ├── signOut()
    └── updateProfile(updates: Partial<User>)

Selectors (computed values, memoized):
├── getTodayTasks(): Task[]
├── getOverdueTasks(): Task[]
├── getNudgedTasks(): Task[]
├── getHabitsDueToday(): Task[]
├── getTasksByTag(tagId: string): Task[]
├── getSubtasks(parentId: string): Task[]
├── getTaskProgress(parentId: string): ProgressData
└── getHabitStats(): HabitStatistics
```

### 10.3 Data Flow

```
User Action Flow:
├── User interacts with component
├── Component calls Zustand action
├── Action performs optimistic update (immediate UI change)
├── Action calls Supabase API
├── On success: Confirm optimistic update
├── On error: Revert optimistic update, show error toast
└── Supabase Realtime broadcasts change to all clients

Realtime Subscription Flow:
├── App subscribes to Supabase realtime on tasks, tags tables
├── On INSERT/UPDATE/DELETE event from Supabase:
│   ├── Check if change is from current client (ignore if so)
│   └── Update Zustand store with new data
└── All subscribed components re-render with fresh data
```

### 10.4 Critical Business Logic

#### Recurring Task Generation
```
On Task Completion:
├── Check if task has recurrence
├── If yes:
│   ├── Get recurrence pattern
│   ├── Calculate next_due_date:
│   │   ├── Fixed schedule: Use anchor_date + pattern
│   │   └── After completion: Use completed_at + interval
│   ├── Create new task instance:
│   │   ├── Copy all properties from original
│   │   ├── Set due_date to next_due_date
│   │   ├── Reset status to 'active'
│   │   ├── Link to same recurrence record
│   │   └── Increment completed_count
│   └── Update recurrence.next_due_date
└── Mark current instance as completed
```

#### Habit Streak Management
```
Daily Streak Check (runs at midnight):
├── For each active habit:
│   ├── Check if completed yesterday
│   ├── If no:
│   │   ├── Set streak_safe_until = yesterday + 24 hours
│   │   ├── If now > streak_safe_until:
│   │   │   ├── Reset current_streak to 0
│   │   │   └── Lock from retroactive completion
│   │   └── Send notification about grace period
│   └── If yes: Streak continues
└── Generate today's habit occurrence if needed
```

#### Someday Task Nudging
```
Daily Nudge Check (runs at start of day):
├── For each active someday task:
│   ├── Calculate: days_since_completion = now - last_completed_at
│   ├── If days_since_completion >= nudge_threshold_days:
│   │   ├── Add to today's dashboard
│   │   ├── Update last_nudged_at = today
│   │   └── Show "Last done X days ago" message
│   └── On completion:
│       ├── Remove from dashboard
│       └── Reset last_completed_at
└── User can manually snooze (updates last_nudged_at)
```

#### Parent Task Auto-Completion
```
On Subtask Completion:
├── Mark subtask as completed
├── Get parent task
├── Get all sibling subtasks
├── Check if all siblings completed
├── If yes:
│   ├── Mark parent as completed
│   ├── Set parent.last_completed_at = now
│   ├── Increment parent.completed_count
│   ├── Trigger completion animation
│   └── If parent has recurrence: Generate next instance
└── Update parent progress bar regardless
```

### 10.5 Performance Considerations

**Data Loading:**
- Initial load: Fetch only active tasks, not archived
- Lazy load archived tasks only when "Show Completed" toggled
- Paginate "All Tasks" view if user has hundreds of tasks
- Index database on user_id, status, due_date for fast queries

**Realtime Updates:**
- Subscribe only to relevant tables (tasks, tags for current user)
- Use Supabase RLS (Row Level Security) to ensure users only get their data
- Debounce rapid updates to prevent excessive re-renders

**Optimistic Updates:**
- All mutations update local state immediately
- If API call fails, revert and show error toast
- Prevents UI lag, feels instant

**Caching:**
- Store last fetch timestamp
- Skip refetch if data is fresh (< 1 minute old)
- Invalidate cache on mutations

**Animation Performance:**
- Use transform and opacity for animations (GPU accelerated)
- Avoid animating width, height, or position
- Use will-change sparingly
- Respect prefers-reduced-motion media query

## 11. Accessibility Requirements

### 11.1 WCAG Compliance

**WCAG AA (Minimum Requirements):**
- Color contrast ratio minimum 4.5:1 for normal text
- Color contrast ratio minimum 3:1 for large text (18pt+)
- All interactive elements keyboard accessible
- Focus indicators visible on all focusable elements
- Screen reader support for all core functionality
- Alternative text for all images/icons
- Semantic HTML throughout
- Form labels properly associated with inputs

**WCAG AAA (Aspirational Goals):**
- Color contrast ratio 7:1 for normal text
- Color contrast ratio 4.5:1 for large text
- Text spacing adjustable without breaking layout
- No content loss at 200% zoom
- All functionality available via keyboard alone
- Enhanced focus indicators (thicker, higher contrast)

### 11.2 Specific Implementations

**Keyboard Navigation:**
- Tab order follows logical flow
- All interactive elements reachable via Tab
- Modal dialogs trap focus within modal
- Escape key closes modals and menus
- Enter/Space activates buttons and checkboxes
- Arrow keys navigate lists and menus

**Screen Reader Support:**
- ARIA labels on icon-only buttons
- ARIA live regions for dynamic content:
  - Task completed announcements
  - Streak updated announcements
  - Error messages
  - Success notifications
- ARIA expanded/collapsed for collapsible sections
- ARIA describedby for form field instructions

**Visual Accessibility:**
- Color is not the only indicator of state
- Icons accompany color-coded statuses
- Patterns/textures in addition to color gradients (optional)
- High contrast mode support
- Text remains readable at 200% zoom

**Motion Accessibility:**
- Respect prefers-reduced-motion
- If user prefers reduced motion:
  - Disable confetti and celebration animations
  - Use simple fade transitions instead of complex animations
  - Reduce animation duration to < 50ms
  - Keep essential animations (progress indicators remain)

**Color Accessibility:**
- Tag color picker includes contrast checker
- Warning if text/background contrast fails AA
- Suggest alternative colors if contrast insufficient
- Allow manual text color override per tag

## 12. Success Criteria

### 12.1 Core Functionality
- ✅ User can create, edit, complete, and delete tasks
- ✅ Parent tasks with unlimited subtask nesting works correctly
- ✅ Tags with hierarchy can be created and applied to tasks
- ✅ Recurring tasks generate new instances correctly based on pattern
- ✅ Habits track streaks accurately with grace period
- ✅ Someday tasks appear on dashboard after threshold
- ✅ Pomodoro timer counts down and completes successfully
- ✅ Today dashboard shows relevant tasks in correct priority order

### 12.2 User Experience
- ✅ App feels delightful to use daily
- ✅ Completion animations are satisfying
- ✅ UI is clean, uncluttered, easy to navigate
- ✅ Mobile gestures work smoothly
- ✅ App works in both light and dark mode
- ✅ Loading states prevent confusion
- ✅ Errors are handled gracefully with clear messaging
- ✅ Notifications appear at appropriate times and are helpful

### 12.3 Performance
- ✅ Dashboard loads in < 1 second
- ✅ Animations are smooth (60fps)
- ✅ Realtime updates appear within 1 second
- ✅ No UI lag when completing tasks (optimistic updates)
- ✅ App works offline (degrades gracefully, shows cached data)

### 12.4 Data Integrity
- ✅ No tasks lost due to sync issues
- ✅ Streaks calculated correctly even with retroactive completion
- ✅ Recurring tasks never create duplicates
- ✅ Parent-subtask relationships maintained correctly
- ✅ Tag hierarchy doesn't break with orphaned tags

### 12.5 Accessibility
- ✅ Meets WCAG AA standards
- ✅ Fully keyboard navigable
- ✅ Screen reader compatible
- ✅ Color contrast ratios verified
- ✅ Reduced motion preference respected

## 13. Future Enhancements (Out of Scope for V1)

**Features to consider later:**
- Task attachments (files, images)
- Task comments/notes over time
- Collaboration (shared tasks with others)
- Calendar view (month/week view of tasks)
- Natural language input ("Remind me to call mom next Tuesday")
- Task templates for repeated complex projects
- Advanced filtering (boolean logic, saved filters)
- Keyboard shortcuts for power users
- Drag and drop task reordering
- Task dependencies ("Task B can't start until Task A is done")
- Time tracking (total time spent on task)
- Integrations (Google Calendar, email, etc.)
- Daily/weekly review flow
- Goal setting and tracking
- Gamification (points, levels, achievements beyond streaks)
- Data export/import
- Account deletion with data retention options
- Comprehensive onboarding tutorial

## 14. Design Decisions Summary

### 14.1 Core Decisions

**Application Identity:**
- Name: DoTheThing (working title)
- Purpose: Personal task management with habit tracking
- Target User: Single user (initially), designed for multi-tenant

**Technology Choices:**
- Frontend: React + TypeScript + Vite
- State: Zustand
- Styling: TailwindCSS + Framer Motion
- Backend: Supabase (Auth + Database + Realtime + Edge Functions)
- Authentication: Email/password (primary)

**User Experience:**
- No onboarding tutorial (self-discovery)
- Light + Dark mode
- Mobile-first responsive design
- Delightful animations and celebrations
- Confetti on task completion
- Gradients and depth for visual appeal

**Data Strategy:**
- Multi-tenant architecture from day one
- Row Level Security enforced
- No analytics or tracking
- Real-time sync across devices
- Optimistic updates for instant feel

**Accessibility:**
- WCAG AA minimum compliance
- WCAG AAA aspirational
- Full keyboard navigation
- Screen reader support
- Reduced motion support

### 14.2 Key Features

**Task Organization:**
- Hierarchical tags with colors/gradients
- Parent/subtask unlimited nesting
- Multiple tags per task
- Progress bars for parent tasks

**Scheduling:**
- Standard tasks with due dates
- Someday tasks with nudge thresholds
- Fixed schedule recurring tasks
- After-completion recurring tasks
- Exclude days from recurring patterns

**Habit Tracking:**
- Streak counting with milestones
- 24-hour grace period with retroactive completion
- Longest streak tracking
- Calendar heatmap visualization
- Target frequency (daily, weekly, monthly)

**Productivity Tools:**
- Pomodoro-style timers
- Quick reschedule (tomorrow, X days)
- Today dashboard with smart filtering
- Notifications for due tasks and grace periods

**Visual Design:**
- 12 solid color defaults + 8 gradient presets
- Custom color creation with picker
- Rounded corners and shadows for depth
- Smooth animations with Framer Motion
- Celebration moments for achievements

---

## 15. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal: Working authentication and basic infrastructure**
- Set up Vite + React + TypeScript project
- Configure Supabase project
- Create database schema with migrations
- Implement authentication UI (login/signup)
- Set up Zustand stores (basic structure)
- Create design system (colors, typography, components)
- Configure ESLint + Prettier

### Phase 2: Core Task Management (Week 3-4)
**Goal: CRUD operations and basic task viewing**
- Task CRUD operations (create, read, update, delete)
- Today dashboard layout and basic rendering
- Task card component with all states
- Task completion flow with animations
- Tag system (CRUD, color picker, hierarchy)
- Parent/subtask relationships
- All Tasks view with filtering

### Phase 3: Smart Scheduling (Week 5-6)
**Goal: Recurring tasks and habit tracking**
- Recurring task logic (fixed schedule)
- Recurring task logic (after completion)
- Habit creation with target frequency
- Streak tracking and grace period
- Someday tasks with nudge logic
- Task shifting/rescheduling
- Habits view with calendar heatmap

### Phase 4: Polish & Features (Week 7-8)
**Goal: Notifications, timer, and refinement**
- Pomodoro timer integration
- Notification system (all types)
- Edge Functions for scheduled jobs
- Dark mode implementation
- Mobile responsive design
- Accessibility audit and fixes
- Performance optimization

### Phase 5: Testing & Launch (Week 9-10)
**Goal: Production-ready application**
- End-to-end testing
- Bug fixes and edge cases
- Documentation
- Deployment to production
- User testing (personal use)
- Iteration based on feedback

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-14  
**Status**: Approved for Development  
**Next Steps**: Database schema creation and project scaffolding
