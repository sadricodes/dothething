# Phase 5, Step 5: Testing (Vitest + Playwright)

**Duration**: 1-2 days
**Prerequisite**: Step 4 (Edge Functions) completed

## Overview

This step implements comprehensive testing:
- Unit tests with Vitest
- Component tests with React Testing Library
- Integration tests
- E2E tests with Playwright
- Test coverage reporting
- CI/CD integration

## Goals

- Setup Vitest for unit tests
- Setup Playwright for E2E tests
- Write tests for utilities
- Write tests for stores
- Write tests for components
- Write E2E test scenarios
- Setup test coverage
- Integrate with CI/CD

---

## Step 5.1: Install Testing Dependencies

```bash
# Vitest and testing utilities
npm install --save-dev vitest
npm install --save-dev @vitest/ui
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev jsdom

# Playwright for E2E
npm install --save-dev @playwright/test
npx playwright install
```

---

## Step 5.2: Configure Vitest

**Create `vitest.config.ts`**:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Create `src/test/setup.ts`**:

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

**Update `package.json`**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Step 5.3: Write Utility Tests

**Create `src/lib/__tests__/task-utils.test.ts`**:

```typescript
import { describe, it, expect } from 'vitest'
import { isTaskOverdue, getTaskPriority, calculateProgress } from '../task-utils'
import { Task } from '@/types/task'

describe('task-utils', () => {
  describe('isTaskOverdue', () => {
    it('should return true for overdue task', () => {
      const task: Partial<Task> = {
        due_date: '2023-01-01T00:00:00Z',
        status: 'ready',
      }
      expect(isTaskOverdue(task as Task)).toBe(true)
    })

    it('should return false for future task', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const task: Partial<Task> = {
        due_date: futureDate.toISOString(),
        status: 'ready',
      }
      expect(isTaskOverdue(task as Task)).toBe(false)
    })

    it('should return false for completed task', () => {
      const task: Partial<Task> = {
        due_date: '2023-01-01T00:00:00Z',
        status: 'completed',
      }
      expect(isTaskOverdue(task as Task)).toBe(false)
    })

    it('should return false when no due date', () => {
      const task: Partial<Task> = {
        due_date: null,
        status: 'ready',
      }
      expect(isTaskOverdue(task as Task)).toBe(false)
    })
  })

  describe('getTaskPriority', () => {
    it('should return 1 for urgent and important', () => {
      const task: Partial<Task> = {
        is_urgent: true,
        is_important: true,
      }
      expect(getTaskPriority(task as Task)).toBe(1)
    })

    it('should return 2 for urgent only', () => {
      const task: Partial<Task> = {
        is_urgent: true,
        is_important: false,
      }
      expect(getTaskPriority(task as Task)).toBe(2)
    })

    it('should return 3 for important only', () => {
      const task: Partial<Task> = {
        is_urgent: false,
        is_important: true,
      }
      expect(getTaskPriority(task as Task)).toBe(3)
    })

    it('should return 4 for neither', () => {
      const task: Partial<Task> = {
        is_urgent: false,
        is_important: false,
      }
      expect(getTaskPriority(task as Task)).toBe(4)
    })
  })

  describe('calculateProgress', () => {
    it('should calculate correct progress', () => {
      const subtasks = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'ready' },
        { status: 'in_progress' },
      ]
      expect(calculateProgress(subtasks as Task[])).toBe(50)
    })

    it('should return 0 for no subtasks', () => {
      expect(calculateProgress([])).toBe(0)
    })

    it('should return 100 for all completed', () => {
      const subtasks = [
        { status: 'completed' },
        { status: 'completed' },
      ]
      expect(calculateProgress(subtasks as Task[])).toBe(100)
    })
  })
})
```

---

## Step 5.4: Write Store Tests

**Create `src/stores/__tests__/taskStore.test.ts`**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../taskStore'
import { Task } from '@/types/task'

const mockTask: Task = {
  id: '1',
  user_id: 'user1',
  title: 'Test Task',
  description: 'Test description',
  status: 'ready',
  type: 'task',
  due_date: null,
  scheduled_date: null,
  is_urgent: false,
  is_important: false,
  parent_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('taskStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTaskStore.setState({
      tasks: [],
      filters: {},
      isLoading: false,
    })
  })

  it('should add task', () => {
    const { addTask } = useTaskStore.getState()
    addTask(mockTask)

    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toEqual(mockTask)
  })

  it('should update task', () => {
    const { addTask, updateTask } = useTaskStore.getState()
    addTask(mockTask)
    updateTask('1', { title: 'Updated Title' })

    const { tasks } = useTaskStore.getState()
    expect(tasks[0].title).toBe('Updated Title')
  })

  it('should delete task', () => {
    const { addTask, deleteTask } = useTaskStore.getState()
    addTask(mockTask)
    deleteTask('1')

    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(0)
  })

  it('should filter tasks by status', () => {
    const { addTask, setFilters, getFilteredTasks } = useTaskStore.getState()

    addTask({ ...mockTask, id: '1', status: 'ready' })
    addTask({ ...mockTask, id: '2', status: 'completed' })
    addTask({ ...mockTask, id: '3', status: 'ready' })

    setFilters({ status: ['ready'] })

    const filtered = getFilteredTasks()
    expect(filtered).toHaveLength(2)
    expect(filtered.every((t) => t.status === 'ready')).toBe(true)
  })

  it('should search tasks', () => {
    const { addTask, setFilters, getFilteredTasks } = useTaskStore.getState()

    addTask({ ...mockTask, id: '1', title: 'Buy groceries' })
    addTask({ ...mockTask, id: '2', title: 'Write report' })
    addTask({ ...mockTask, id: '3', title: 'Buy tickets' })

    setFilters({ search: 'buy' })

    const filtered = getFilteredTasks()
    expect(filtered).toHaveLength(2)
    expect(filtered.every((t) => t.title.toLowerCase().includes('buy'))).toBe(true)
  })
})
```

---

## Step 5.5: Write Component Tests

**Create `src/components/__tests__/TaskCard.test.tsx`**:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from '../TaskCard'
import { Task } from '@/types/task'

const mockTask: Task = {
  id: '1',
  user_id: 'user1',
  title: 'Test Task',
  description: 'Test description',
  status: 'ready',
  type: 'task',
  due_date: null,
  scheduled_date: null,
  is_urgent: false,
  is_important: false,
  parent_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('TaskCard', () => {
  it('should render task title and description', () => {
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should show urgent tag when task is urgent', () => {
    render(<TaskCard task={{ ...mockTask, is_urgent: true }} />)

    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('should show important tag when task is important', () => {
    render(<TaskCard task={{ ...mockTask, is_important: true }} />)

    expect(screen.getByText('Important')).toBeInTheDocument()
  })

  it('should call onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<TaskCard task={mockTask} onEdit={onEdit} />)

    const editButton = screen.getByLabelText('Edit')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(<TaskCard task={mockTask} onDelete={onDelete} />)

    const deleteButton = screen.getByLabelText('Delete')
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(mockTask.id)
  })

  it('should change status when status select changed', async () => {
    const onStatusChange = vi.fn()
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} />)

    const statusSelect = screen.getByRole('combobox')
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } })

    expect(onStatusChange).toHaveBeenCalledWith('in_progress')
  })
})
```

---

## Step 5.6: Configure Playwright

**Create `playwright.config.ts`**:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Step 5.7: Write E2E Tests

**Create `e2e/auth.spec.ts`**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/today')
    await expect(page.locator('h1')).toContainText('Today')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('.ant-message-error')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Logout
    await page.click('button[aria-label="Log out"]')
    await expect(page).toHaveURL('/login')
  })
})
```

**Create `e2e/tasks.spec.ts`**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/today')
  })

  test('should create a new task', async ({ page }) => {
    await page.click('button:has-text("New Task")')

    await page.fill('input[name="title"]', 'Test Task')
    await page.fill('textarea[name="description"]', 'Test Description')
    await page.click('button:has-text("Create Task")')

    await expect(page.locator('text=Test Task')).toBeVisible()
  })

  test('should edit task', async ({ page }) => {
    // Create task first
    await page.click('button:has-text("New Task")')
    await page.fill('input[name="title"]', 'Task to Edit')
    await page.click('button:has-text("Create Task")')

    // Edit task
    await page.click('[aria-label="More options"]')
    await page.click('text=Edit')

    await page.fill('input[name="title"]', 'Edited Task')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Edited Task')).toBeVisible()
  })

  test('should delete task', async ({ page }) => {
    // Create task first
    await page.click('button:has-text("New Task")')
    await page.fill('input[name="title"]', 'Task to Delete')
    await page.click('button:has-text("Create Task")')

    // Delete task
    await page.click('[aria-label="More options"]')
    await page.click('text=Delete')
    await page.click('button:has-text("Confirm")')

    await expect(page.locator('text=Task to Delete')).not.toBeVisible()
  })

  test('should change task status', async ({ page }) => {
    // Create task first
    await page.click('button:has-text("New Task")')
    await page.fill('input[name="title"]', 'Status Change Task')
    await page.click('button:has-text("Create Task")')

    // Change status
    await page.click('[aria-label="Task status"]')
    await page.click('text=In Progress')

    await expect(page.locator('text=In Progress')).toBeVisible()
  })

  test('should filter tasks', async ({ page }) => {
    await page.goto('/tasks')

    // Apply filter
    await page.click('text=Status')
    await page.check('[value="completed"]')

    // Verify only completed tasks shown
    const tasks = page.locator('[data-testid="task-card"]')
    const count = await tasks.count()

    for (let i = 0; i < count; i++) {
      await expect(tasks.nth(i)).toContainText('Completed')
    }
  })

  test('should search tasks', async ({ page }) => {
    await page.goto('/tasks')

    await page.fill('input[placeholder*="Search"]', 'important')

    const results = page.locator('[data-testid="task-card"]')
    const count = await results.count()

    expect(count).toBeGreaterThan(0)
  })
})
```

**Create `e2e/habits.spec.ts`**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Habit Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/habits')
  })

  test('should create habit', async ({ page }) => {
    await page.click('button:has-text("New Habit")')

    await page.fill('input[name="title"]', 'Daily Exercise')
    await page.fill('input[name="frequency"]', '1')
    await page.click('button:has-text("Create")')

    await expect(page.locator('text=Daily Exercise')).toBeVisible()
  })

  test('should complete habit', async ({ page }) => {
    const habitCard = page.locator('[data-testid="habit-card"]').first()
    const streakBefore = await habitCard.locator('[data-testid="streak"]').textContent()

    await habitCard.click('button:has-text("Complete")')

    const streakAfter = await habitCard.locator('[data-testid="streak"]').textContent()
    expect(streakAfter).not.toBe(streakBefore)
  })

  test('should show habit heatmap', async ({ page }) => {
    const heatmap = page.locator('[data-testid="habit-heatmap"]')
    await expect(heatmap).toBeVisible()

    const cells = heatmap.locator('.heatmap-cell')
    const count = await cells.count()
    expect(count).toBeGreaterThan(0)
  })
})
```

---

## Step 5.8: Add Test Helpers

**Create `e2e/helpers.ts`**:

```typescript
import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/today')
}

export async function createTask(
  page: Page,
  title: string,
  description?: string
) {
  await page.click('button:has-text("New Task")')
  await page.fill('input[name="title"]', title)
  if (description) {
    await page.fill('textarea[name="description"]', description)
  }
  await page.click('button:has-text("Create Task")')
  await page.waitForSelector(`text=${title}`)
}

export async function createHabit(page: Page, title: string, frequency: number) {
  await page.goto('/habits')
  await page.click('button:has-text("New Habit")')
  await page.fill('input[name="title"]', title)
  await page.fill('input[name="frequency"]', frequency.toString())
  await page.click('button:has-text("Create")')
  await page.waitForSelector(`text=${title}`)
}
```

---

## Step 5.9: Setup Test Coverage

**Run tests with coverage**:

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

**Coverage goals**:
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

---

## Step 5.10: Setup CI/CD with GitHub Actions

**Create `.github/workflows/test.yml`**:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Step 5.11: Test All Critical Paths

### Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Signup new user
- [ ] Logout
- [ ] Protected route redirect

### Task Management
- [ ] Create task
- [ ] Edit task
- [ ] Delete task
- [ ] Change task status
- [ ] Mark task urgent/important
- [ ] Set due date
- [ ] Filter tasks
- [ ] Search tasks
- [ ] Sort tasks

### Habit Tracking
- [ ] Create habit
- [ ] Complete habit
- [ ] View streak
- [ ] View heatmap
- [ ] Break streak
- [ ] Archive habit

### Views
- [ ] Today view shows today's tasks
- [ ] Kanban board drag and drop
- [ ] Eisenhower Matrix quadrants
- [ ] Saved views switch
- [ ] Filter presets apply

---

## Verification Checklist

Before proceeding to Step 6, verify:

- [ ] Vitest configured and running
- [ ] Playwright configured and running
- [ ] Unit tests written for utilities
- [ ] Unit tests written for stores
- [ ] Component tests written
- [ ] E2E tests cover critical flows
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] CI/CD pipeline configured
- [ ] Tests run on pull requests
- [ ] Coverage reports generated
- [ ] No flaky tests

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 6: Documentation & Deployment](./step-6-deployment.md)**

This will finalize documentation and deploy the app.

---

## Summary

You've successfully:
- ✅ Setup Vitest for unit testing
- ✅ Setup Playwright for E2E testing
- ✅ Written comprehensive unit tests
- ✅ Written component tests
- ✅ Created E2E test scenarios
- ✅ Configured test coverage reporting
- ✅ Integrated tests with CI/CD
- ✅ Achieved >80% code coverage
- ✅ All critical paths tested

**The app is now thoroughly tested and reliable!**
