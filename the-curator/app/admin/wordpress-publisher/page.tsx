'use client'

import { useState } from 'react'
import WordPressPublisherForm from '@/components/admin/wordpress/WordPressPublisherForm'
import WordPressPreviewModal from '@/components/admin/wordpress/WordPressPreviewModal'

interface PublishFormData {
  title: string
  content: string
  excerpt: string
  featured_image_url: string
  categories: number[]
  tags: number[]
  status: 'draft' | 'publish'
}

export default function WordPressPublisherPage() {
  const [previewData, setPreviewData] = useState<PublishFormData | null>(null)

  const handlePublish = async (data: PublishFormData) => {
    const response = await fetch('/api/admin/wordpress/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        published_by: 'admin', // TODO: Get from session
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      let errorMessage = errorData.error || 'Failed to publish article'
      
      // Include details if available
      if (errorData.details) {
        errorMessage += `: ${errorData.details}`
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result
  }

  const handlePreview = (data: PublishFormData) => {
    setPreviewData(data)
  }

  const handleClosePreview = () => {
    setPreviewData(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WordPress Publisher</h1>
        <p className="mt-2 text-gray-600">
          Publish articles from The Curator to your WordPress site
        </p>
      </div>

      <WordPressPublisherForm onPublish={handlePublish} onPreview={handlePreview} />

      <WordPressPreviewModal data={previewData} onClose={handleClosePreview} />
    </div>
  )
}
