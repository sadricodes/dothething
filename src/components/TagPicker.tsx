import { useState } from 'react'
import { Select, Space, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTagStore } from '@/stores/tagStore'
import { Tag } from '@/components/Tag'
import { Tag as TagType } from '@/types/tag'

interface TagPickerProps {
  value?: string[]
  onChange?: (tagIds: string[]) => void
  onCreateTag?: () => void
  placeholder?: string
  maxTags?: number
}

export function TagPicker({
  value = [],
  onChange,
  onCreateTag,
  placeholder = 'Select tags...',
  maxTags,
}: TagPickerProps) {
  const { tags, getTagById } = useTagStore()
  const [searchValue, setSearchValue] = useState('')

  const selectedTags = value.map(id => getTagById(id)).filter(Boolean) as TagType[]

  const handleChange = (selectedIds: string[]) => {
    onChange?.(selectedIds)
  }

  const tagOptions = tags.map(tag => ({
    label: tag.name,
    value: tag.id,
    tag,
  }))

  return (
    <Space direction="vertical" className="w-full">
      <Select
        mode="multiple"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        searchValue={searchValue}
        onSearch={setSearchValue}
        className="w-full"
        maxCount={maxTags}
        filterOption={(input, option) =>
          (option?.label as string).toLowerCase().includes(input.toLowerCase())
        }
        tagRender={props => {
          const tag = getTagById(props.value as string)
          if (!tag) return <></>
          return (
            <Tag
              tag={tag}
              closable
              onClose={props.onClose}
              className="!mr-1"
            />
          )
        }}
        popupRender={menu => (
          <>
            {menu}
            {onCreateTag && (
              <div className="p-2 border-t">
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={onCreateTag}
                  className="w-full"
                >
                  Create New Tag
                </Button>
              </div>
            )}
          </>
        )}
        options={tagOptions}
      />

      {selectedTags.length > 0 && (
        <Space wrap>
          {selectedTags.map(tag => (
            <Tag
              key={tag.id}
              tag={tag}
              closable
              onClose={() => {
                handleChange(value.filter(id => id !== tag.id))
              }}
            />
          ))}
        </Space>
      )}
    </Space>
  )
}
