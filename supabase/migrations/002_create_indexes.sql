-- ============================================================================
-- DoTheThing Database Schema - Script 2: Create Indexes
-- ============================================================================

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);

-- Tags indexes
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_parent_id ON tags(parent_id);

-- Task_Tags indexes
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

-- Recurrences indexes
CREATE INDEX idx_recurrences_task_id ON recurrences(task_id);
CREATE INDEX idx_recurrences_next_due_date ON recurrences(next_due_date);

-- Completions indexes
CREATE INDEX idx_completions_task_id ON completions(task_id);
CREATE INDEX idx_completions_completed_at ON completions(completed_at);

-- Saved Views indexes
CREATE INDEX idx_saved_views_user_id ON saved_views(user_id);
CREATE INDEX idx_saved_views_is_pinned ON saved_views(is_pinned);
CREATE INDEX idx_saved_views_position ON saved_views(position);
