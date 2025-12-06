'use client'

import { useState } from 'react'
import WordPressArticleList from '@/components/admin/wordpress/WordPressArticleList'
import WordPressEditModal from '@/components/admin/wordpress/WordPressEditModal'

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

export default function WordPressManagementPage() {
  const [editingArticle, setEditingArticle] = useState<WordPressPublishedArticle | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (article: WordPressPublishedArticle) => {
    setEditingArticle(article)
  }

  const handleSave = async (articleId: string, updates: Partial<WordPressPublishedArticle>) => {
    const response = await fetch('/api/admin/wordpress/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article_id: articleId,
        ...updates,
        updated_by: 'admin', // TODO: Get from session
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update article')
    }

    setRefreshKey((k) => k + 1)
  }

  const handleDelete = async (articleId: string) => {
    const response = await fetch(
      `/api/admin/wordpress/delete?article_id=${articleId}&deleted_by=admin`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete article')
    }
  }

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  const handleCloseEdit = () => {
    setEditingArticle(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WordPress Management</h1>
        <p className="mt-2 text-gray-600">
          Manage articles published to WordPress
        </p>
      </div>

      <WordPressArticleList
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
      />

      <WordPressEditModal
        article={editingArticle}
        onClose={handleCloseEdit}
        onSave={handleSave}
      />
    </div>
  )
}
