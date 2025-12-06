'use client'

interface PublishFormData {
  title: string
  content: string
  excerpt: string
  featured_image_url: string
  categories: number[]
  tags: number[]
  status: 'draft' | 'publish'
}

interface WordPressPreviewModalProps {
  data: PublishFormData | null
  onClose: () => void
}

export default function WordPressPreviewModal({
  data,
  onClose,
}: WordPressPreviewModalProps) {
  if (!data) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Featured Image */}
          {data.featured_image_url && (
            <div className="mb-6">
              <img
                src={data.featured_image_url}
                alt={data.title}
                className="w-full max-h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{data.title}</h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              {data.status === 'publish' ? 'Published' : 'Draft'}
            </span>
            {data.categories.length > 0 && (
              <span>Categories: {data.categories.join(', ')}</span>
            )}
            {data.tags.length > 0 && (
              <span>Tags: {data.tags.join(', ')}</span>
            )}
          </div>

          {/* Excerpt */}
          {data.excerpt && (
            <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 italic text-gray-700">
              {data.excerpt}
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
