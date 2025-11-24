import { Tag as TagType } from '@/types/tag'
import { Tag as AntTag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { getTagStyle } from '@/lib/tag-colors'

interface TagProps {
  tag: TagType
  closable?: boolean
  onClose?: () => void
  onClick?: () => void
  className?: string
}

export function Tag({ tag, closable = false, onClose, onClick, className = '' }: TagProps) {
  const style = getTagStyle(tag.color, tag.gradient)

  return (
    <AntTag
      style={style}
      closable={closable}
      onClose={onClose}
      onClick={onClick}
      className={`cursor-pointer border ${className}`}
      closeIcon={<CloseOutlined style={{ color: style.color }} />}
    >
      {tag.icon && <span className="mr-1">{tag.icon}</span>}
      {tag.name}
    </AntTag>
  )
}
