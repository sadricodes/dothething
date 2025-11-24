export type TagColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'gray'

export type TagGradient =
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'twilight'
  | 'rose'
  | 'candy'
  | 'sky'
  | 'fire'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: TagColor | null
  gradient: TagGradient | null
  icon: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface TagWithChildren extends Tag {
  children: TagWithChildren[]
}

export interface TagFormData {
  name: string
  color: TagColor | null
  gradient: TagGradient | null
  icon: string | null
  parent_id: string | null
}
