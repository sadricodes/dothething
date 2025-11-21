# Phase 5, Step 4: Edge Functions

**Duration**: 1 day
**Prerequisite**: Step 3 (Performance) completed

## Overview

This step implements Supabase Edge Functions to handle server-side logic:
- Generate recurring tasks
- Send scheduled notifications
- Clean up old completed tasks
- Process habit streaks
- Send reminder emails
- Generate analytics

## Goals

- Setup Edge Functions locally
- Deploy Edge Functions to Supabase
- Create recurring task generator
- Create notification sender
- Create cleanup function
- Create habit streak processor
- Setup cron jobs
- Test Edge Functions

---

## Step 4.1: Setup Edge Functions

**Install Supabase CLI**:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Initialize Edge Functions
supabase functions new generate-recurring-tasks
supabase functions new send-notifications
supabase functions new cleanup-tasks
supabase functions new process-habits
```

---

## Step 4.2: Create Generate Recurring Tasks Function

**Create `supabase/functions/generate-recurring-tasks/index.ts`**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { addDays, addWeeks, addMonths, parseISO, startOfDay } from 'https://esm.sh/date-fns@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RecurringTask {
  id: string
  user_id: string
  title: string
  description: string | null
  recurrence_pattern: string
  recurrence_interval: number
  last_generated_date: string | null
  next_due_date: string
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active recurring tasks
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_recurring', true)
      .eq('status', 'ready')
      .not('recurrence_pattern', 'is', null)

    if (fetchError) throw fetchError

    const today = startOfDay(new Date())
    const tasksCreated: any[] = []

    for (const task of recurringTasks as RecurringTask[]) {
      const lastGenerated = task.last_generated_date
        ? parseISO(task.last_generated_date)
        : null
      const nextDue = parseISO(task.next_due_date)

      // Check if we need to generate a new instance
      if (nextDue <= today) {
        // Calculate next due date based on pattern
        let newNextDue: Date

        switch (task.recurrence_pattern) {
          case 'daily':
            newNextDue = addDays(nextDue, task.recurrence_interval)
            break
          case 'weekly':
            newNextDue = addWeeks(nextDue, task.recurrence_interval)
            break
          case 'monthly':
            newNextDue = addMonths(nextDue, task.recurrence_interval)
            break
          default:
            continue
        }

        // Create new task instance
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            user_id: task.user_id,
            title: task.title,
            description: task.description,
            status: 'ready',
            type: 'task',
            due_date: today.toISOString(),
            scheduled_date: today.toISOString(),
            parent_id: task.id,
            is_recurring: false,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating task:', createError)
          continue
        }

        // Update parent task with new next_due_date
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            last_generated_date: today.toISOString(),
            next_due_date: newNextDue.toISOString(),
          })
          .eq('id', task.id)

        if (updateError) {
          console.error('Error updating task:', updateError)
          continue
        }

        tasksCreated.push(newTask)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasksCreated: tasksCreated.length,
        tasks: tasksCreated,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

## Step 4.3: Create Send Notifications Function

**Create `supabase/functions/send-notifications/index.ts`**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isBefore, parseISO, subHours } from 'https://esm.sh/date-fns@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const now = new Date()

    // Get tasks due in next hour that haven't been notified
    const oneHourFromNow = subHours(now, -1)

    const { data: dueTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*, users(email, notification_settings)')
      .lte('due_date', oneHourFromNow.toISOString())
      .gte('due_date', now.toISOString())
      .in('status', ['ready', 'in_progress'])
      .is('notification_sent', false)

    if (fetchError) throw fetchError

    const notificationsSent: any[] = []

    for (const task of dueTasks) {
      const settings = task.users?.notification_settings || {}

      // Check if user wants due date reminders
      if (!settings.due_date_reminders) continue

      // Create in-app notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: task.user_id,
          type: 'task_due_soon',
          title: 'Task Due Soon',
          message: `"${task.title}" is due in less than 1 hour`,
          link: `/tasks/${task.id}`,
          read: false,
        })
        .select()
        .single()

      if (notifError) {
        console.error('Error creating notification:', notifError)
        continue
      }

      // Send browser notification via web push (if implemented)
      if (settings.browser_notifications) {
        // Implementation depends on web push setup
        // await sendWebPush(task.user_id, notification)
      }

      // Send email notification (if implemented)
      if (settings.email_notifications) {
        // await sendEmail(task.users.email, notification)
      }

      // Mark task as notified
      await supabase
        .from('tasks')
        .update({ notification_sent: true })
        .eq('id', task.id)

      notificationsSent.push(notification)
    }

    // Also check for overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', now.toISOString())
      .in('status', ['ready', 'in_progress'])
      .is('overdue_notification_sent', false)

    if (!overdueError && overdueTasks) {
      for (const task of overdueTasks) {
        await supabase.from('notifications').insert({
          user_id: task.user_id,
          type: 'task_overdue',
          title: 'Task Overdue',
          message: `"${task.title}" is now overdue`,
          link: `/tasks/${task.id}`,
          read: false,
        })

        await supabase
          .from('tasks')
          .update({ overdue_notification_sent: true })
          .eq('id', task.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notificationsSent.length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

## Step 4.4: Create Cleanup Function

**Create `supabase/functions/cleanup-tasks/index.ts`**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { subDays } from 'https://esm.sh/date-fns@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Delete completed tasks older than 90 days
    const ninetyDaysAgo = subDays(new Date(), 90)

    const { data: deletedTasks, error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('status', 'completed')
      .lt('updated_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (deleteError) throw deleteError

    // Delete read notifications older than 30 days
    const thirtyDaysAgo = subDays(new Date(), 30)

    const { data: deletedNotifications, error: notifError } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id')

    if (notifError) throw notifError

    // Archive old pomodoro sessions (optional)
    const sixtyDaysAgo = subDays(new Date(), 60)

    const { data: archivedSessions, error: sessionError } = await supabase
      .from('pomodoro_sessions')
      .delete()
      .lt('started_at', sixtyDaysAgo.toISOString())
      .select('id')

    if (sessionError) throw sessionError

    return new Response(
      JSON.stringify({
        success: true,
        deletedTasks: deletedTasks?.length || 0,
        deletedNotifications: deletedNotifications?.length || 0,
        archivedSessions: archivedSessions?.length || 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

## Step 4.5: Create Process Habits Function

**Create `supabase/functions/process-habits/index.ts`**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startOfDay, subDays, differenceInDays, parseISO } from 'https://esm.sh/date-fns@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const today = startOfDay(new Date())

    // Get all active habits
    const { data: habits, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)

    if (fetchError) throw fetchError

    const habitsProcessed: any[] = []

    for (const habit of habits) {
      // Get recent completions
      const sevenDaysAgo = subDays(today, 7)

      const { data: completions, error: completionError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habit.id)
        .gte('completion_date', sevenDaysAgo.toISOString())
        .order('completion_date', { ascending: false })

      if (completionError) {
        console.error('Error fetching completions:', completionError)
        continue
      }

      // Check if habit should be marked as broken
      const lastCompletion = completions[0]
        ? parseISO(completions[0].completion_date)
        : null

      if (lastCompletion) {
        const daysSinceCompletion = differenceInDays(today, lastCompletion)
        const graceWindow = habit.grace_period_days || 1

        // Streak broken if missed beyond grace period
        if (daysSinceCompletion > graceWindow && habit.current_streak > 0) {
          // Create notification about broken streak
          await supabase.from('notifications').insert({
            user_id: habit.user_id,
            type: 'habit_streak_broken',
            title: 'Habit Streak Broken',
            message: `Your ${habit.current_streak}-day streak for "${habit.title}" has ended`,
            link: `/habits`,
            read: false,
          })

          // Reset streak
          await supabase
            .from('habits')
            .update({
              current_streak: 0,
              last_broken_date: today.toISOString(),
            })
            .eq('id', habit.id)

          habitsProcessed.push({ id: habit.id, action: 'streak_broken' })
        }
      }

      // Send reminder notifications
      if (habit.reminder_time) {
        const yesterday = subDays(today, 1)

        // Check if completed today
        const completedToday = completions.some(
          (c) => startOfDay(parseISO(c.completion_date)).getTime() === today.getTime()
        )

        if (!completedToday) {
          // Check if reminder already sent today
          const { data: existingReminder } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', habit.user_id)
            .eq('type', 'habit_reminder')
            .gte('created_at', today.toISOString())
            .like('message', `%${habit.title}%`)
            .single()

          if (!existingReminder) {
            await supabase.from('notifications').insert({
              user_id: habit.user_id,
              type: 'habit_reminder',
              title: 'Habit Reminder',
              message: `Don't forget to complete "${habit.title}" today!`,
              link: `/habits`,
              read: false,
            })

            habitsProcessed.push({ id: habit.id, action: 'reminder_sent' })
          }
        }
      }

      // Celebrate milestones
      if (habit.current_streak > 0 && habit.current_streak % 7 === 0) {
        const { data: milestoneNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', habit.user_id)
          .eq('type', 'habit_milestone')
          .gte('created_at', today.toISOString())
          .like('message', `%${habit.current_streak}%`)
          .single()

        if (!milestoneNotif) {
          await supabase.from('notifications').insert({
            user_id: habit.user_id,
            type: 'habit_milestone',
            title: '🎉 Milestone Reached!',
            message: `${habit.current_streak} days streak for "${habit.title}"!`,
            link: `/habits`,
            read: false,
          })

          habitsProcessed.push({ id: habit.id, action: 'milestone_celebrated' })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        habitsProcessed: habitsProcessed.length,
        habits: habitsProcessed,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

## Step 4.6: Deploy Edge Functions

**Deploy all functions**:

```bash
# Deploy individually
supabase functions deploy generate-recurring-tasks
supabase functions deploy send-notifications
supabase functions deploy cleanup-tasks
supabase functions deploy process-habits

# Or deploy all at once
supabase functions deploy
```

---

## Step 4.7: Setup Cron Jobs via pg_cron

**Run in Supabase SQL Editor**:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule recurring task generation (every hour)
SELECT cron.schedule(
  'generate-recurring-tasks',
  '0 * * * *', -- Every hour at :00
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/generate-recurring-tasks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);

-- Schedule notifications (every 15 minutes)
SELECT cron.schedule(
  'send-notifications',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);

-- Schedule cleanup (daily at 2 AM)
SELECT cron.schedule(
  'cleanup-tasks',
  '0 2 * * *', -- Every day at 2:00 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/cleanup-tasks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);

-- Schedule habit processing (every 6 hours)
SELECT cron.schedule(
  'process-habits',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/process-habits',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('generate-recurring-tasks');
```

---

## Step 4.8: Test Edge Functions Locally

**Test with curl**:

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve generate-recurring-tasks

# Test the function
curl --request POST \
  'http://localhost:54321/functions/v1/generate-recurring-tasks' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'

# Test notifications
supabase functions serve send-notifications
curl --request POST \
  'http://localhost:54321/functions/v1/send-notifications' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'

# Test cleanup
supabase functions serve cleanup-tasks
curl --request POST \
  'http://localhost:54321/functions/v1/cleanup-tasks' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'

# Test habit processing
supabase functions serve process-habits
curl --request POST \
  'http://localhost:54321/functions/v1/process-habits' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

---

## Step 4.9: Monitor Edge Functions

**View function logs**:

```bash
# View logs for a specific function
supabase functions logs generate-recurring-tasks

# Follow logs in real-time
supabase functions logs generate-recurring-tasks --follow

# View logs with timestamp
supabase functions logs send-notifications --tail 100
```

**In Supabase Dashboard**:
1. Go to Edge Functions section
2. Select a function
3. View Logs tab
4. Monitor invocations and errors

---

## Step 4.10: Add Error Monitoring

**Create error notification function**:

```typescript
// Add to each edge function
async function notifyError(error: Error, context: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  await supabase.from('edge_function_errors').insert({
    function_name: context,
    error_message: error.message,
    error_stack: error.stack,
    timestamp: new Date().toISOString(),
  })
}

// Use in try-catch blocks
try {
  // Function logic
} catch (error) {
  await notifyError(error, 'generate-recurring-tasks')
  throw error
}
```

**Create error log table**:

```sql
CREATE TABLE edge_function_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent errors
CREATE INDEX idx_edge_function_errors_timestamp
ON edge_function_errors(timestamp DESC);
```

---

## Step 4.11: Test Cron Jobs

### Test Recurring Task Generation

1. Create a daily recurring task
2. Set next_due_date to today
3. Wait for cron job (or trigger manually)
4. **Expected**: New task instance created
5. **Expected**: Parent task next_due_date updated
6. Check logs for success message

### Test Notifications

1. Create task due in 30 minutes
2. Wait for notification job
3. **Expected**: In-app notification created
4. **Expected**: Task marked as notified
5. Check notifications table

### Test Cleanup

1. Create completed task
2. Set updated_at to 100 days ago
3. Run cleanup function
4. **Expected**: Task deleted
5. **Expected**: Old notifications deleted

### Test Habit Processing

1. Create habit with 7-day streak
2. Complete habit yesterday
3. Run process-habits function
4. **Expected**: Milestone notification created
5. Skip habit for 2 days
6. Run function again
7. **Expected**: Streak broken notification

---

## Verification Checklist

Before proceeding to Step 5, verify:

- [ ] Supabase CLI installed and configured
- [ ] All Edge Functions created
- [ ] Functions deployed successfully
- [ ] Cron jobs scheduled
- [ ] Recurring tasks generate correctly
- [ ] Notifications send properly
- [ ] Cleanup removes old data
- [ ] Habit streaks process correctly
- [ ] Error logging implemented
- [ ] Function logs accessible
- [ ] Local testing works
- [ ] Production deployment successful
- [ ] Cron jobs running on schedule
- [ ] No function errors in logs

---

## Environment Variables

**Required for Edge Functions**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

Set in Supabase Dashboard → Settings → Edge Functions

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 5: Testing](./step-5-testing.md)**

This will implement comprehensive testing with Vitest and Playwright.

---

## Summary

You've successfully:
- ✅ Setup Supabase Edge Functions
- ✅ Created recurring task generator
- ✅ Implemented notification sender
- ✅ Built cleanup function
- ✅ Created habit processor
- ✅ Deployed functions to Supabase
- ✅ Scheduled cron jobs
- ✅ Added error monitoring
- ✅ Tested functions locally and in production

**The app now has robust server-side automation!**
