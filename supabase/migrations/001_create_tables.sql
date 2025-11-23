-- ============================================================================
-- DoTheThing Database Schema - Script 1: Create Tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TAGS TABLE
-- ============================================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(200) NOT NULL, -- Hex color or gradient string
  icon VARCHAR(50), -- Emoji or icon identifier
  parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tags_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic properties
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'task', -- 'task', 'habit', 'parent'
  status VARCHAR(20) NOT NULL DEFAULT 'ready', -- 'ready', 'in_progress', 'blocked', 'completed', 'archived'
  blocked_reason TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Dates
  due_date TIMESTAMPTZ,
  has_due_date BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ,

  -- Completion tracking
  last_completed_at TIMESTAMPTZ,
  completed_count INTEGER NOT NULL DEFAULT 0,

  -- Timer
  timer_duration_minutes INTEGER,

  -- Habit-specific
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_safe_until TIMESTAMPTZ,
  target_frequency JSONB, -- {count: number, period: 'day'|'week'|'month'}

  -- Eisenhower Matrix
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_important BOOLEAN NOT NULL DEFAULT false,

  -- Someday tasks
  nudge_threshold_days INTEGER,
  last_nudged_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT tasks_valid_type CHECK (type IN ('task', 'habit', 'parent')),
  CONSTRAINT tasks_valid_status CHECK (status IN ('ready', 'in_progress', 'blocked', 'completed', 'archived')),
  CONSTRAINT tasks_timer_positive CHECK (timer_duration_minutes IS NULL OR timer_duration_minutes > 0),
  CONSTRAINT tasks_no_self_parent CHECK (parent_id != id)
);

-- ============================================================================
-- TASK_TAGS JUNCTION TABLE
-- ============================================================================

CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (task_id, tag_id)
);

-- ============================================================================
-- RECURRENCES TABLE
-- ============================================================================

CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  type VARCHAR(20) NOT NULL, -- 'fixed_schedule', 'after_completion'
  frequency JSONB NOT NULL, -- Pattern details
  anchor_date TIMESTAMPTZ, -- For fixed schedule
  next_due_date TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT recurrences_valid_type CHECK (type IN ('fixed_schedule', 'after_completion')),
  CONSTRAINT recurrences_fixed_has_anchor CHECK (
    type != 'fixed_schedule' OR anchor_date IS NOT NULL
  )
);

-- ============================================================================
-- COMPLETIONS TABLE
-- ============================================================================

CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  was_late BOOLEAN NOT NULL DEFAULT false,
  was_retroactive BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================================
-- SAVED_VIEWS TABLE
-- ============================================================================

CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50), -- Emoji or icon identifier
  view_mode VARCHAR(20) NOT NULL, -- 'list', 'kanban', 'eisenhower', 'today', 'habits'

  filters JSONB NOT NULL DEFAULT '{}',
  sort_order JSONB NOT NULL DEFAULT '{"field": "created_at", "direction": "desc"}',
  display_options JSONB,

  is_pinned BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT saved_views_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT saved_views_valid_mode CHECK (
    view_mode IN ('list', 'kanban', 'eisenhower', 'today', 'habits')
  )
);
