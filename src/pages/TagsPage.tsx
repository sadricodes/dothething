import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Space,
  Typography,
  Tree,
  Dropdown,
  Modal,
  message,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FolderOutlined,
  TagOutlined,
} from '@ant-design/icons'
import type { MenuProps, TreeDataNode } from 'antd'
import { AppLayout } from '@/components/AppLayout'
import { Tag } from '@/components/Tag'
import { TagFormModal } from '@/components/TagFormModal'
import { useTagStore } from '@/stores/tagStore'
import { Tag as TagType, TagWithChildren } from '@/types/tag'

const { Title, Text } = Typography

export function TagsPage() {
  const { tags, loading, fetchTags, deleteTag, subscribeToTags, unsubscribeFromTags, getTagHierarchy } =
    useTagStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  useEffect(() => {
    fetchTags()
    subscribeToTags()
    return () => unsubscribeFromTags()
  }, [fetchTags, subscribeToTags, unsubscribeFromTags])

  const handleCreate = () => {
    setEditingTag(null)
    setIsFormOpen(true)
  }

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag)
    setIsFormOpen(true)
  }

  const handleDelete = (tag: TagType) => {
    Modal.confirm({
      title: `Delete "${tag.name}"?`,
      content: 'This action cannot be undone. Tasks with this tag will not be deleted.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        const { error } = await deleteTag(tag.id)
        if (error) {
          message.error(error.message)
        } else {
          message.success('Tag deleted successfully')
        }
      },
    })
  }

  const handleCreateChild = (parentTag: TagType) => {
    setEditingTag({
      ...parentTag,
      id: '',
      name: '',
      parent_id: parentTag.id,
    } as TagType)
    setIsFormOpen(true)
  }

  const getTagActions = (tag: TagType): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEdit(tag),
    },
    {
      key: 'create-child',
      label: 'Create Child Tag',
      icon: <PlusOutlined />,
      onClick: () => handleCreateChild(tag),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(tag),
    },
  ]

  const buildTreeData = (tagsHierarchy: TagWithChildren[]): TreeDataNode[] => {
    return tagsHierarchy.map(tag => ({
      key: tag.id,
      title: (
        <div className="flex items-center justify-between w-full group">
          <Space>
            {tag.children.length > 0 ? <FolderOutlined /> : <TagOutlined />}
            <Tag tag={tag} />
          </Space>
          <Dropdown menu={{ items: getTagActions(tag) }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="opacity-0 group-hover:opacity-100"
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      ),
      children: tag.children.length > 0 ? buildTreeData(tag.children) : undefined,
    }))
  }

  const treeData = buildTreeData(getTagHierarchy())

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Tags
            </Title>
            <Text type="secondary">Organize your tasks with hierarchical tags</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Tag
          </Button>
        </div>

        <Card>
          {loading && tags.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : tags.length === 0 ? (
            <Empty
              description="No tags yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-12"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Create Your First Tag
              </Button>
            </Empty>
          ) : (
            <Tree
              treeData={treeData}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              showIcon={false}
              selectedKeys={selectedTagId ? [selectedTagId] : []}
              onSelect={keys => setSelectedTagId(keys[0] as string)}
              className="tag-tree"
            />
          )}
        </Card>

        <TagFormModal
          open={isFormOpen}
          tag={editingTag}
          onClose={() => {
            setIsFormOpen(false)
            setEditingTag(null)
          }}
        />
      </div>
    </AppLayout>
  )
}
