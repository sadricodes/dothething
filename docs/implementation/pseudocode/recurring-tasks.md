# Recurring Task Generation Logic

## Overview

This document describes how to generate the next occurrence of a recurring task when the current one is completed.

## Two Types of Recurrence

### 1. Fixed Schedule Recurrence
Tasks that recur on a fixed schedule regardless of when they're completed.

**Example**: "Team meeting every Monday"
- If completed on Sunday → Next occurrence is still Monday
- If completed on Tuesday → Next occurrence is still the following Monday

### 2. After Completion Recurrence
Tasks that recur X time after completion.

**Example**: "Water plants 3 days after last watering"
- Completed early (Day 1) → Next due Day 4
- Completed late (Day 5) → Next due Day 8

## Pseudocode

### Fixed Schedule Recurrence

```
FUNCTION calculateNextFixedScheduleDate(task, recurrence):
    // Get the original anchor date and pattern
    anchorDate = recurrence.anchor_date
    interval = recurrence.frequency.interval
    unit = recurrence.frequency.unit  // 'days', 'weeks', 'months'
    excludeDays = recurrence.frequency.excludeDays  // [0-6], Sunday=0
    
    // Start from anchor date
    nextDate = anchorDate
    
    // Keep adding interval until we're past today
    WHILE nextDate <= today:
        IF unit == 'days':
            nextDate = nextDate + interval days
        ELSE IF unit == 'weeks':
            nextDate = nextDate + (interval * 7) days
        ELSE IF unit == 'months':
            nextDate = nextDate + interval months
    
    // Check if nextDate falls on an excluded day
    WHILE nextDate.dayOfWeek IN excludeDays:
        nextDate = nextDate + 1 day
    
    RETURN nextDate

FUNCTION onTaskComplete_FixedSchedule(task):
    // Mark current task as completed
    task.status = 'completed'
    task.last_completed_at = now()
    task.completed_count = task.completed_count + 1
    
    // Save completion record
    CREATE completion_record:
        task_id = task.id
        completed_at = now()
        was_late = (now() > task.due_date)
    
    // Calculate next occurrence
    recurrence = GET recurrence WHERE task_id = task.id
    nextDueDate = calculateNextFixedScheduleDate(task, recurrence)
    
    // Create new task instance
    CREATE new_task:
        // Copy all properties from original task
        user_id = task.user_id
        title = task.title
        description = task.description
        type = task.type
        status = 'ready'  // Reset to ready
        parent_id = task.parent_id
        tags = task.tags (copy all)
        has_due_date = task.has_due_date
        timer_duration_minutes = task.timer_duration_minutes
        
        // Set new due date
        due_date = nextDueDate
        
        // Link to same recurrence
        recurrence_id = recurrence.id
        
        // Reset completion tracking
        last_completed_at = null
        completed_count = 0
    
    // Update recurrence next_due_date
    recurrence.next_due_date = nextDueDate
    
    RETURN new_task
```

### After Completion Recurrence

```
FUNCTION calculateNextAfterCompletionDate(completedAt, recurrence):
    interval = recurrence.frequency.interval
    unit = recurrence.frequency.unit  // 'hours', 'days', 'weeks', 'months'
    
    nextDate = completedAt
    
    IF unit == 'hours':
        nextDate = nextDate + interval hours
    ELSE IF unit == 'days':
        nextDate = nextDate + interval days
    ELSE IF unit == 'weeks':
        nextDate = nextDate + (interval * 7) days
    ELSE IF unit == 'months':
        nextDate = nextDate + interval months
    
    RETURN nextDate

FUNCTION onTaskComplete_AfterCompletion(task):
    completedAt = now()
    
    // Mark current task as completed
    task.status = 'completed'
    task.last_completed_at = completedAt
    task.completed_count = task.completed_count + 1
    
    // Save completion record
    CREATE completion_record:
        task_id = task.id
        completed_at = completedAt
        was_late = (completedAt > task.due_date)
    
    // Calculate next occurrence based on completion time
    recurrence = GET recurrence WHERE task_id = task.id
    nextDueDate = calculateNextAfterCompletionDate(completedAt, recurrence)
    
    // Create new task instance
    CREATE new_task:
        // Copy all properties from original task
        user_id = task.user_id
        title = task.title
        description = task.description
        type = task.type
        status = 'ready'
        parent_id = task.parent_id
        tags = task.tags (copy all)
        has_due_date = task.has_due_date
        timer_duration_minutes = task.timer_duration_minutes
        
        // Set new due date
        due_date = nextDueDate
        
        // Link to same recurrence
        recurrence_id = recurrence.id
        
        // Reset completion tracking
        last_completed_at = null
        completed_count = 0
    
    // Update recurrence next_due_date
    recurrence.next_due_date = nextDueDate
    
    RETURN new_task
```

## Implementation Notes

### Database Operations
1. **Use a transaction** to ensure atomicity:
   - Mark old task as completed
   - Create completion record
   - Create new task instance
   - Update recurrence.next_due_date

2. **Tag relationships**: Copy all task-tag relationships to the new task instance

3. **Parent relationships**: Preserve the parent_id if the task is a subtask

### Edge Cases

**Fixed Schedule**:
- What if the next occurrence is in the past? Keep calculating until it's in the future
- What if multiple excluded days in a row? Keep incrementing until valid day found
- What if interval is 0? Treat as a one-time task (no recurrence)

**After Completion**:
- Always use actual completion time, not original due date
- If task has no due_date, still calculate from completion time
- If completed before due_date, calculate from early completion

### Testing Scenarios

**Fixed Schedule**:
```
Test 1: Weekly task on Monday
- Anchor: Monday, Week 1
- Complete: Sunday, Week 1
- Expected Next: Monday, Week 2

Test 2: Every 2 weeks, excluding Saturday/Sunday
- Anchor: Monday, Week 1
- Complete: Friday, Week 2
- Next calculation: Monday, Week 3
- If Monday, Week 3 is Saturday: Skip to Monday, Week 3

Test 3: Monthly task
- Anchor: Jan 15
- Complete: Jan 20
- Expected Next: Feb 15
```

**After Completion**:
```
Test 1: Every 3 days after completion
- Complete: Jan 1, 10:00 AM
- Expected Next: Jan 4, 10:00 AM

Test 2: Every 6 hours after completion
- Complete: Jan 1, 2:00 PM
- Expected Next: Jan 1, 8:00 PM

Test 3: Completed late
- Original Due: Jan 5
- Complete: Jan 8
- Expected Next: Jan 8 + interval (not Jan 5 + interval)
```

## Integration with Task Completion Flow

```
FUNCTION completeTask(taskId, isRetroactive = false):
    task = GET task WHERE id = taskId
    
    // Check if task has recurrence
    recurrence = GET recurrence WHERE task_id = taskId
    
    IF recurrence EXISTS:
        IF recurrence.type == 'fixed_schedule':
            newTask = onTaskComplete_FixedSchedule(task)
        ELSE IF recurrence.type == 'after_completion':
            newTask = onTaskComplete_AfterCompletion(task)
    ELSE:
        // Regular task, just mark as completed
        task.status = 'completed'
        task.last_completed_at = now()
        task.completed_count = task.completed_count + 1
        
        CREATE completion_record:
            task_id = task.id
            completed_at = now()
            was_late = (now() > task.due_date)
            was_retroactive = isRetroactive
    
    RETURN task
```
