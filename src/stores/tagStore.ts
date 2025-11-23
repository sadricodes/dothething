import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Tag, TagWithChildren, TagFormData } from '@/types/tag'
import { useAuthStore } from './authStore'

interface TagState {
  tags: Tag[]
  loading: boolean
  error: string | null

  // Actions
  fetchTags: () => Promise<void>
  createTag: (data: TagFormData) => Promise<{ data: Tag | null; error: Error | null }>
  updateTag: (id: string, data: Partial<TagFormData>) => Promise<{ error: Error | null }>
  deleteTag: (id: string) => Promise<{ error: Error | null }>
  getTagById: (id: string) => Tag | undefined
  getTagHierarchy: () => TagWithChildren[]
  getChildTags: (parentId: string) => Tag[]
  subscribeToTags: () => void
  unsubscribeFromTags: () => void
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ tags: data || [], loading: false })
  },

  createTag: async (data: TagFormData) => {
    const user = useAuthStore.getState().user
    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        ...data,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: [...state.tags, newTag],
    }))

    return { data: newTag, error: null }
  },

  updateTag: async (id: string, data: Partial<TagFormData>) => {
    const { error } = await supabase.from('tags').update(data).eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: state.tags.map(tag => (tag.id === id ? { ...tag, ...data } : tag)),
    }))

    return { error: null }
  },

  deleteTag: async (id: string) => {
    // Check if tag has children
    const children = get().getChildTags(id)
    if (children.length > 0) {
      return { error: new Error('Cannot delete tag with children. Delete or reassign children first.') }
    }

    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) {
      return { error: new Error(error.message) }
    }

    // Optimistic update
    set(state => ({
      tags: state.tags.filter(tag => tag.id !== id),
    }))

    return { error: null }
  },

  getTagById: (id: string) => {
    return get().tags.find(tag => tag.id === id)
  },

  getTagHierarchy: (): TagWithChildren[] => {
    const { tags } = get()
    const tagMap = new Map<string, TagWithChildren>()
    const roots: TagWithChildren[] = []

    // First pass: Create all tag objects with empty children arrays
    tags.forEach(tag => {
      tagMap.set(tag.id, { ...tag, children: [] })
    })

    // Second pass: Build hierarchy
    tags.forEach(tag => {
      const tagWithChildren = tagMap.get(tag.id)!
      if (tag.parent_id) {
        const parent = tagMap.get(tag.parent_id)
        if (parent) {
          parent.children.push(tagWithChildren)
        } else {
          // Parent doesn't exist, treat as root
          roots.push(tagWithChildren)
        }
      } else {
        roots.push(tagWithChildren)
      }
    })

    // Sort children recursively
    const sortChildren = (tag: TagWithChildren) => {
      tag.children.sort((a, b) => a.name.localeCompare(b.name))
      tag.children.forEach(sortChildren)
    }

    roots.forEach(sortChildren)
    roots.sort((a, b) => a.name.localeCompare(b.name))

    return roots
  },

  getChildTags: (parentId: string): Tag[] => {
    return get().tags.filter(tag => tag.parent_id === parentId)
  },

  subscribeToTags: () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const channel = supabase
      .channel('tags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            set(state => ({
              tags: [...state.tags, payload.new as Tag],
            }))
          } else if (payload.eventType === 'UPDATE') {
            set(state => ({
              tags: state.tags.map(tag =>
                tag.id === payload.new.id ? (payload.new as Tag) : tag
              ),
            }))
          } else if (payload.eventType === 'DELETE') {
            set(state => ({
              tags: state.tags.filter(tag => tag.id !== payload.old.id),
            }))
          }
        }
      )
      .subscribe()

    // Store channel for cleanup
    ;(get() as any).channel = channel
  },

  unsubscribeFromTags: () => {
    const channel = (get() as any).channel
    if (channel) {
      supabase.removeChannel(channel)
    }
  },
}))
