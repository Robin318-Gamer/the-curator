'use client'

import { useState } from 'react'

interface WordPressPublishedArticle {
  id: string
  title: string
  content: string
  excerpt?: string
  featured_image_url?: string
  wp_post_id: number
  wp_post_url: string
  wp_categories?: number[]
  wp_tags?: number[]
  published_at: string
  updated_at?: string
  is_deleted: boolean
  sync_status: 'synced' | 'pending' | 'failed'
}

interface WordPressEditModalProps {
  article: WordPressPublishedArticle | null
  onClose: () => void
  onSave: (articleId: string, updates: Partial<WordPressPublishedArticle>) => Promise<void>
}

export default function WordPressEditModal({
  article,
  onClose,
  onSave,
}: WordPressEditModalProps) {
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [categories, setCategories] = useState<number[]>(article?.wp_categories || [])
  const [tags, setTags] = useState<number[]>(article?.wp_tags || [])

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!article) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await onSave(article.id, {
        title,
        content,
        excerpt,
        wp_categories: categories,
        wp_tags: tags,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Article</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="edit_title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="edit_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="edit_content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="edit_content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="edit_excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              id="edit_excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div>
            <label htmlFor="edit_categories" className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <input
              type="text"
              id="edit_categories"
              value={categories.join(', ')}
              onChange={(e) =>
                setCategories(
                  e.target.value
                    .split(',')
                    .map((c) => parseInt(c.trim(), 10))
                    .filter((c) => !isNaN(c))
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1, 5, 12"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="edit_tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="edit_tags"
              value={tags.join(', ')}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(',')
                    .map((t) => parseInt(t.trim(), 10))
                    .filter((t) => !isNaN(t))
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="3, 8, 15"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
