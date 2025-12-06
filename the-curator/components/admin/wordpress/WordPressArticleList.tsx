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

interface WordPressArticleListProps {
  onEdit: (article: WordPressPublishedArticle) => void
  onDelete: (articleId: string) => Promise<void>
  onRefresh: () => void
}

export default function WordPressArticleList({
  onEdit,
  onDelete,
  onRefresh,
}: WordPressArticleListProps) {
  const [articles, setArticles] = useState<WordPressPublishedArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Fetch articles
  const fetchArticles = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(includeDeleted && { include_deleted: 'true' }),
      })

      const response = await fetch(`/api/admin/wordpress/list?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }

      const data = await response.json()
      setArticles(data.articles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchArticles()
  }

  // Handle delete
  const handleDelete = async (articleId: string) => {
    try {
      await onDelete(articleId)
      setDeleteConfirm(null)
      fetchArticles()
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Load on mount and when filters change
  useState(() => {
    fetchArticles()
  })

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Published Articles</h2>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={fetchArticles}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Refresh
          </button>
        </form>

        {/* Include Deleted Checkbox */}
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked)
              setPage(1)
            }}
            className="mr-2"
          />
          Include deleted articles
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-600">Loading articles...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Articles Table */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No articles found. Start by publishing your first article!
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Published
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  WP Post ID
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className={article.is_deleted ? 'bg-gray-100 opacity-60' : ''}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{article.title}</div>
                    {article.excerpt && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {article.excerpt}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.sync_status === 'synced'
                          ? 'bg-green-100 text-green-800'
                          : article.sync_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {article.sync_status}
                    </span>
                    {article.is_deleted && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                        Deleted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(article.published_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <a
                      href={article.wp_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {article.wp_post_id}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(article)}
                        disabled={article.is_deleted}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(article.id)}
                        disabled={article.is_deleted}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && articles.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={articles.length < 20}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this article? This will mark it as deleted
              but won't remove it from WordPress.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
