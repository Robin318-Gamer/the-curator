'use client'

import { useState } from 'react'

interface PublishFormData {
  title: string
  content: string
  excerpt: string
  featured_image_url: string
  categories: number[]
  tags: number[]
  status: 'draft' | 'publish'
}

interface WordPressPublisherFormProps {
  onPublish: (data: PublishFormData) => Promise<void>
  onPreview: (data: PublishFormData) => void
}

export default function WordPressPublisherForm({
  onPublish,
  onPreview,
}: WordPressPublisherFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [categories, setCategories] = useState<number[]>([])
  const [tags, setTags] = useState<number[]>([])
  const [status, setStatus] = useState<'draft' | 'publish'>('publish')

  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{
    success: boolean
    message: string
    link?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPublishing(true)
    setPublishResult(null)

    try {
      const formData: PublishFormData = {
        title,
        content,
        excerpt,
        featured_image_url: featuredImageUrl,
        categories,
        tags,
        status,
      }

      await onPublish(formData)

      setPublishResult({
        success: true,
        message: 'Article published successfully!',
      })

      // Clear form
      setTitle('')
      setContent('')
      setExcerpt('')
      setFeaturedImageUrl('')
      setCategories([])
      setTags([])
    } catch (error) {
      let errorMessage = 'Failed to publish article'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setPublishResult({
        success: false,
        message: `Error: ${errorMessage}`,
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    const formData: PublishFormData = {
      title,
      content,
      excerpt,
      featured_image_url: featuredImageUrl,
      categories,
      tags,
      status,
    }
    onPreview(formData)
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Publish to WordPress</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Article Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter article title"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Article Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter article content (HTML supported)"
          />
          <p className="mt-1 text-sm text-gray-500">
            HTML content is supported. Use WordPress block editor syntax if needed.
          </p>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt (Optional)
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief summary of the article"
          />
        </div>

        {/* Featured Image URL */}
        <div>
          <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image URL (Optional)
          </label>
          <input
            type="url"
            id="featured_image"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
          {featuredImageUrl && (
            <div className="mt-2">
              <img
                src={featuredImageUrl}
                alt="Featured preview"
                className="max-w-xs rounded border border-gray-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-2">
            Categories (Optional)
          </label>
          <input
            type="text"
            id="categories"
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
            placeholder="1, 5, 12 (Category IDs separated by commas)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter WordPress category IDs separated by commas
          </p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            id="tags"
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
            placeholder="3, 8, 15 (Tag IDs separated by commas)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter WordPress tag IDs separated by commas
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publish Status *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="publish"
                checked={status === 'publish'}
                onChange={(e) => setStatus(e.target.value as 'publish')}
                className="mr-2"
              />
              Publish Immediately
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="draft"
                checked={status === 'draft'}
                onChange={(e) => setStatus(e.target.value as 'draft')}
                className="mr-2"
              />
              Save as Draft
            </label>
          </div>
        </div>

        {/* Publish Result */}
        {publishResult && (
          <div
            className={`p-4 rounded-md ${
              publishResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p>{publishResult.message}</p>
            {publishResult.link && (
              <a
                href={publishResult.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 inline-block"
              >
                View on WordPress
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!title || !content}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Preview
          </button>

          <button
            type="submit"
            disabled={isPublishing || !title || !content}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publishing...' : 'Publish to WordPress'}
          </button>
        </div>
      </form>
    </div>
  )
}
