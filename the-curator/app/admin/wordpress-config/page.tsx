'use client'

import { useState, useEffect } from 'react'
import WordPressConfigForm from '@/components/admin/wordpress/WordPressConfigForm'

interface WordPressConfig {
  id?: string
  site_url: string
  site_name?: string
  auth_method: 'password' | 'token'
  username?: string
  password?: string
  api_token?: string
  is_active?: boolean
  validation_status?: string
}

export default function WordPressConfigPage() {
  const [config, setConfig] = useState<WordPressConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch existing configuration on mount
  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/wordpress/config')

      if (response.status === 404) {
        // No config exists yet - this is normal for first time setup
        setConfig(null)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch configuration')
      }

      const data = await response.json()
      setConfig(data.config)
    } catch (err) {
      console.error('Config fetch error:', err)
      // Don't show error if it's just missing config
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
      setConfig(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (configData: WordPressConfig) => {
    const response = await fetch('/api/admin/wordpress/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...configData,
        created_by: 'admin', // TODO: Get from session
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to save configuration')
    }

    // Refresh config
    await fetchConfig()
  }

  const handleValidate = async (configData: WordPressConfig): Promise<boolean> => {
    const response = await fetch('/api/admin/wordpress/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData),
    })

    const data = await response.json()
    return data.success === true
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading configuration...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 p-6 rounded-md">
          <p className="font-semibold text-lg mb-2">⚠️ Database Setup Required</p>
          <p className="mb-4">{error}</p>
          <div className="bg-white p-4 rounded border border-yellow-300">
            <p className="font-semibold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to your Supabase SQL Editor: <a href="https://supabase.com/dashboard/project/xulrcvbfwhhdtggkpcge/sql/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open SQL Editor</a></li>
              <li>Copy the SQL from <code className="bg-gray-100 px-1 rounded">database/wordpress_public_schema.sql</code></li>
              <li>Paste and click <strong>RUN</strong></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">WordPress Integration</h1>
        <p className="mt-2 text-gray-600">
          Configure your WordPress site connection to enable article publishing
        </p>
      </div>

      <WordPressConfigForm
        onSave={handleSave}
        onValidate={handleValidate}
        initialConfig={config}
      />

      {config && (
        <div className="mt-8 max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Current Configuration</h3>
          <dl className="space-y-1">
            <div className="flex">
              <dt className="w-32 text-sm text-blue-700">Site URL:</dt>
              <dd className="text-sm text-blue-900">{config.site_url}</dd>
            </div>
            {config.site_name && (
              <div className="flex">
                <dt className="w-32 text-sm text-blue-700">Site Name:</dt>
                <dd className="text-sm text-blue-900">{config.site_name}</dd>
              </div>
            )}
            <div className="flex">
              <dt className="w-32 text-sm text-blue-700">Auth Method:</dt>
              <dd className="text-sm text-blue-900">{config.auth_method}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 text-sm text-blue-700">Status:</dt>
              <dd className="text-sm text-blue-900">
                {config.is_active ? 'Active' : 'Inactive'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
