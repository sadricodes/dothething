# Phase 5, Step 1: Animations & Celebrations

**Duration**: 1 day
**Prerequisite**: Phase 4 completed

## Overview

This step adds delightful animations and celebrations throughout the app using Framer Motion:
- Task completion celebrations with confetti
- Smooth micro-interactions for cards and buttons
- Page transitions
- Loading states with skeleton screens
- Streak celebration animations
- Achievement unlock animations

## Goals

- Install and configure Framer Motion
- Add task completion celebration
- Create reusable animation components
- Add micro-interactions throughout
- Implement page transitions
- Create loading skeletons
- Add celebration sounds (optional)

---

## Step 1.1: Install Framer Motion

```bash
npm install framer-motion
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## Step 1.2: Create Animation Utilities

**Create `src/lib/animations.ts`**:

```typescript
import { Variants } from 'framer-motion'

// Common easing functions
export const easing = {
  smooth: [0.6, 0.05, 0.01, 0.9],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: 'spring', stiffness: 300, damping: 25 },
}

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: easing.smooth }
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easing.smooth }
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easing.smooth }
  },
}

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easing.smooth }
  },
}

export const scaleBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 15 }
  },
}

// Slide animations
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easing.smooth }
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easing.smooth }
  },
}

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Hover effects
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
}

export const hoverLift = {
  y: -4,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.2 },
}

// Tap effects
export const tapScale = {
  scale: 0.98,
}

// Loading pulse
export const pulse: Variants = {
  hidden: { opacity: 0.6 },
  visible: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse' as const,
      duration: 1,
    },
  },
}
```

---

## Step 1.3: Create Confetti Celebration Utility

**Create `src/lib/confetti.ts`**:

```typescript
import confetti from 'canvas-confetti'

export const celebrateTaskCompletion = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

export const celebrateStreak = (streakCount: number) => {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999
  }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)
}

export const celebrateAchievement = () => {
  const end = Date.now() + 2000

  const colors = ['#FFD700', '#FFA500', '#FF69B4']

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      zIndex: 9999,
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      zIndex: 9999,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
```

---

## Step 1.4: Create Animated Task Card

**Create `src/components/AnimatedTaskCard.tsx`**:

```typescript
import { motion } from 'framer-motion'
import { TaskCard, TaskCardProps } from './TaskCard'
import { fadeInUp, hoverLift, tapScale } from '@/lib/animations'

export function AnimatedTaskCard(props: TaskCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
      whileHover={hoverLift}
      whileTap={tapScale}
    >
      <TaskCard {...props} />
    </motion.div>
  )
}
```

---

## Step 1.5: Update TaskCard with Completion Animation

**Update `src/components/TaskCard.tsx`** to add celebration:

```typescript
import { celebrateTaskCompletion } from '@/lib/confetti'
import { motion, AnimatePresence } from 'framer-motion'

export function TaskCard({ task, onStatusChange, ...props }: TaskCardProps) {
  const handleStatusChange = async (status: TaskStatus) => {
    // Celebrate on completion
    if (status === 'completed' && task.status !== 'completed') {
      celebrateTaskCompletion()
    }

    await onStatusChange?.(status)
  }

  // Add completion checkmark animation
  const checkmarkVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', stiffness: 500, damping: 15 }
    }
  }

  return (
    <Card {...props}>
      {/* Existing card content */}

      {/* Completion overlay */}
      <AnimatePresence>
        {task.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#52c41a',
              pointerEvents: 'none',
              borderRadius: '8px',
            }}
          />
        )}
      </AnimatePresence>

      {/* Rest of card content */}
    </Card>
  )
}
```

---

## Step 1.6: Create Loading Skeleton Components

**Create `src/components/TaskCardSkeleton.tsx`**:

```typescript
import { Card, Skeleton, Space } from 'antd'
import { motion } from 'framer-motion'
import { pulse } from '@/lib/animations'

export function TaskCardSkeleton() {
  return (
    <motion.div variants={pulse} initial="hidden" animate="visible">
      <Card>
        <Space direction="vertical" className="w-full">
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Input active style={{ width: '100%', height: 60 }} />
          <Space>
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
          </Space>
        </Space>
      </Card>
    </motion.div>
  )
}

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Space direction="vertical" className="w-full">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </Space>
  )
}
```

---

## Step 1.7: Add Page Transitions

**Create `src/components/PageTransition.tsx`**:

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { fadeIn } from '@/lib/animations'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Update `src/App.tsx`** to wrap routes:

```typescript
import { PageTransition } from '@/components/PageTransition'

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <PageTransition>
              <AppLayout>
                <Routes>
                  {/* Your routes */}
                </Routes>
              </AppLayout>
            </PageTransition>
          }
        />
      </Routes>
    </Router>
  )
}
```

---

## Step 1.8: Add Stagger Animation to Task Lists

**Update `src/pages/AllTasksPage.tsx`**:

```typescript
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { AnimatedTaskCard } from '@/components/AnimatedTaskCard'

export function AllTasksPage() {
  const { filteredTasks, isLoading } = useTaskStore()

  if (isLoading) {
    return <TaskListSkeleton count={8} />
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {filteredTasks.map(task => (
        <motion.div key={task.id} variants={staggerItem}>
          <AnimatedTaskCard task={task} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

---

## Step 1.9: Add Habit Streak Celebration

**Update `src/components/HabitCard.tsx`**:

```typescript
import { celebrateStreak } from '@/lib/confetti'
import { motion } from 'framer-motion'
import { scaleBounce } from '@/lib/animations'

export function HabitCard({ habit }: HabitCardProps) {
  const handleComplete = async () => {
    const newStreak = habit.current_streak + 1

    await completeHabit(habit.id)

    // Celebrate milestones
    if (newStreak % 7 === 0) {
      celebrateStreak(newStreak)
    }
  }

  return (
    <Card>
      {/* Existing content */}

      {/* Animated streak badge */}
      {habit.current_streak > 0 && (
        <motion.div
          key={habit.current_streak}
          variants={scaleBounce}
          initial="hidden"
          animate="visible"
        >
          <Badge count={`🔥 ${habit.current_streak}`} />
        </motion.div>
      )}
    </Card>
  )
}
```

---

## Step 1.10: Add Button Micro-interactions

**Create `src/components/AnimatedButton.tsx`**:

```typescript
import { Button, ButtonProps } from 'antd'
import { motion } from 'framer-motion'
import { hoverScale, tapScale } from '@/lib/animations'

export function AnimatedButton(props: ButtonProps) {
  return (
    <motion.div
      whileHover={hoverScale}
      whileTap={tapScale}
      style={{ display: 'inline-block' }}
    >
      <Button {...props} />
    </motion.div>
  )
}
```

---

## Step 1.11: Add Achievement Unlock Modal

**Create `src/components/AchievementModal.tsx`**:

```typescript
import { Modal, Typography, Space } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleBounce } from '@/lib/animations'
import { celebrateAchievement } from '@/lib/confetti'
import { useEffect } from 'react'

const { Title, Text } = Typography

interface Achievement {
  title: string
  description: string
  icon: string
}

interface AchievementModalProps {
  open: boolean
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementModal({ open, achievement, onClose }: AchievementModalProps) {
  useEffect(() => {
    if (open && achievement) {
      celebrateAchievement()
    }
  }, [open, achievement])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
    >
      <AnimatePresence>
        {achievement && (
          <motion.div
            variants={scaleBounce}
            initial="hidden"
            animate="visible"
            style={{ textAlign: 'center', padding: '24px' }}
          >
            <Space direction="vertical" size="large" className="w-full">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                }}
              >
                <div style={{ fontSize: 80 }}>{achievement.icon}</div>
              </motion.div>

              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  <TrophyOutlined /> Achievement Unlocked!
                </Title>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {achievement.title}
                </Title>
                <Text type="secondary">{achievement.description}</Text>
              </div>
            </Space>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
```

---

## Step 1.12: Add Loading States with Skeletons

**Update `src/pages/TodayPage.tsx`**:

```typescript
import { TaskListSkeleton } from '@/components/TaskCardSkeleton'
import { motion } from 'framer-motion'
import { fadeInDown } from '@/lib/animations'

export function TodayPage() {
  const { todayTasks, isLoading } = useTaskStore()

  if (isLoading) {
    return (
      <div>
        <Skeleton.Input active style={{ width: 300, marginBottom: 24 }} />
        <TaskListSkeleton count={5} />
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
    >
      {/* Page content */}
    </motion.div>
  )
}
```

---

## Step 1.13: Test Animations

### Test Task Completion

1. Complete a task
2. **Expected**: Confetti celebration triggers
3. **Expected**: Completion overlay fades in
4. **Expected**: Checkmark animates with spring effect

### Test Page Transitions

1. Navigate between pages
2. **Expected**: Smooth fade transitions
3. **Expected**: No layout jumps
4. **Expected**: Previous page fades out before new page fades in

### Test Loading States

1. Refresh page or clear cache
2. **Expected**: Skeleton screens show while loading
3. **Expected**: Pulsing animation on skeletons
4. **Expected**: Smooth transition when content loads

### Test Hover Effects

1. Hover over task cards
2. **Expected**: Card lifts with shadow
3. **Expected**: Smooth animation
4. Hover over buttons
5. **Expected**: Subtle scale effect

### Test Habit Streaks

1. Complete a habit to reach 7-day streak
2. **Expected**: Extended confetti celebration
3. **Expected**: Streak badge animates in
4. Complete habit again
5. **Expected**: Streak count updates with bounce

### Test List Animations

1. Navigate to All Tasks with many tasks
2. **Expected**: Tasks stagger in from top to bottom
3. **Expected**: 100ms delay between each
4. Filter tasks
5. **Expected**: Smooth layout animations as tasks reorder

---

## Verification Checklist

Before proceeding to Step 2, verify:

- [ ] Framer Motion installed and configured
- [ ] Task completion triggers confetti
- [ ] Cards have hover and tap effects
- [ ] Page transitions work smoothly
- [ ] Loading skeletons display correctly
- [ ] Habit streaks celebrate at milestones
- [ ] List items stagger in
- [ ] Buttons have micro-interactions
- [ ] Achievement modal with celebration
- [ ] No performance issues with animations
- [ ] Animations respect reduced motion preferences

---

## Performance Considerations

**Add motion preference detection** in `src/lib/animations.ts`:

```typescript
export const shouldReduceMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Use in components:
const animationProps = shouldReduceMotion()
  ? {}
  : { variants: fadeInUp, initial: 'hidden', animate: 'visible' }
```

---

## Next Steps

Once all verification checks pass, proceed to:
- **[Step 2: Accessibility Audit](./step-2-accessibility.md)**

This will ensure the app is accessible to all users.

---

## Summary

You've successfully:
- ✅ Installed Framer Motion and canvas-confetti
- ✅ Created reusable animation utilities
- ✅ Added task completion celebrations
- ✅ Implemented page transitions
- ✅ Created loading skeletons
- ✅ Added micro-interactions throughout
- ✅ Celebrated habit streaks
- ✅ Built achievement unlock modal
- ✅ Respected motion preferences

**The app now feels polished and delightful to use!**
