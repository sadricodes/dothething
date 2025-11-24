# Database Migrations - DoTheThing

These SQL scripts need to be run in your Supabase SQL Editor in the exact order listed below.

## How to Run Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `srtrymmzgohgcofejjnv`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Run each script below **in order** (copy contents, paste, and run)

## Migration Order

### ✅ Step 1: Create Tables
**File:** `001_create_tables.sql`
**What it does:** Creates all 6 database tables (tags, tasks, task_tags, recurrences, completions, saved_views)

### ✅ Step 2: Create Indexes
**File:** `002_create_indexes.sql`
**What it does:** Adds performance indexes on frequently queried columns

### ✅ Step 3: Create Triggers
**File:** `003_create_triggers.sql`
**What it does:** Sets up auto-updating timestamps for tasks and saved_views

### ✅ Step 4: Enable RLS
**File:** `004_enable_rls.sql`
**What it does:** Enables Row Level Security on all tables

### ✅ Step 5: Create RLS Policies
**File:** `005_create_rls_policies.sql`
**What it does:** Creates security policies ensuring users can only access their own data

## After Running All Migrations

Once all 5 scripts have been run successfully, your database will have:

- ✅ 6 tables created
- ✅ All indexes for performance
- ✅ Auto-updating timestamps
- ✅ Row Level Security enabled
- ✅ Security policies protecting user data

## Verification

To verify everything worked:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - `tags`
   - `tasks`
   - `task_tags`
   - `recurrences`
   - `completions`
   - `saved_views`

3. Click on any table and go to **RLS** tab
4. You should see "Row Level Security is enabled" and multiple policies listed

## Troubleshooting

**Error: "relation already exists"**
- One of the tables already exists. You can either drop it first or skip that script.

**Error: "permission denied"**
- Make sure you're using the SQL Editor in the Supabase Dashboard (not trying to run locally)

**Error: "function auth.uid() does not exist"**
- This shouldn't happen in Supabase, but ensure RLS is enabled on your project

## Next Steps

After running all migrations:
1. Return to the application
2. The database connection will be tested automatically
3. You'll be ready to implement authentication in Phase 1, Step 3!
