import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  selectedTask: string | null
  showCompletedTasks: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  selectTask: (id: string | null) => void
  toggleShowCompleted: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      theme: 'system',
      sidebarCollapsed: false,
      selectedTask: null,
      showCompletedTasks: false,

      setTheme: theme => set({ theme }),

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      selectTask: id => set({ selectedTask: id }),

      toggleShowCompleted: () =>
        set(state => ({ showCompletedTasks: !state.showCompletedTasks })),
    }),
    {
      name: 'ui-storage',
      partialize: state => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        showCompletedTasks: state.showCompletedTasks,
      }),
    }
  )
)
