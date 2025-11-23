-- ============================================================================
-- DoTheThing Database Schema - Script 5: Create RLS Policies
-- ============================================================================

-- ============================================================================
-- TAGS POLICIES
-- ============================================================================

CREATE POLICY tags_select_policy ON tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY tags_insert_policy ON tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY tags_update_policy ON tags
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY tags_delete_policy ON tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TASK_TAGS POLICIES
-- ============================================================================

CREATE POLICY task_tags_select_policy ON task_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY task_tags_insert_policy ON task_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY task_tags_delete_policy ON task_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RECURRENCES POLICIES
-- ============================================================================

CREATE POLICY recurrences_select_policy ON recurrences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrences.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY recurrences_insert_policy ON recurrences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrences.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY recurrences_update_policy ON recurrences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrences.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY recurrences_delete_policy ON recurrences
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrences.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPLETIONS POLICIES
-- ============================================================================

CREATE POLICY completions_select_policy ON completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY completions_insert_policy ON completions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY completions_delete_policy ON completions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SAVED_VIEWS POLICIES
-- ============================================================================

CREATE POLICY saved_views_select_policy ON saved_views
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY saved_views_insert_policy ON saved_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY saved_views_update_policy ON saved_views
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY saved_views_delete_policy ON saved_views
  FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);
