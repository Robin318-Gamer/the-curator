'use client'

import { useState, useEffect } from 'react'

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

interface WordPressConfigFormProps {
  onSave: (config: WordPressConfig) => Promise<void>
  onValidate: (config: WordPressConfig) => Promise<boolean>
  initialConfig?: WordPressConfig | null
}

export default function WordPressConfigForm({
  onSave,
  onValidate,
  initialConfig,
}: WordPressConfigFormProps) {
  const [siteUrl, setSiteUrl] = useState('')
  const [siteName, setSiteName] = useState('')
  const [authMethod, setAuthMethod] = useState<'password' | 'token'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiToken, setApiToken] = useState('')

  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [saveResult, setSaveResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Load initial config
  useEffect(() => {
    if (initialConfig) {
      setSiteUrl(initialConfig.site_url || '')
      setSiteName(initialConfig.site_name || '')
      setAuthMethod(initialConfig.auth_method || 'password')
      setUsername(initialConfig.username || '')
      // Don't populate password/token for security
    }
  }, [initialConfig])

  const handleValidate = async () => {
    // Don't validate if required fields are empty
    if (!siteUrl || !siteUrl.trim()) {
      setValidationResult({
        success: false,
        message: 'Please enter a WordPress site URL first',
      })
      return
    }

    if (authMethod === 'password' && (!username || !password)) {
      setValidationResult({
        success: false,
        message: 'Please enter username and password',
      })
      return
    }

    if (authMethod === 'token' && !apiToken) {
      setValidationResult({
        success: false,
        message: 'Please enter API token',
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)
    setSaveResult(null)

    try {
      const config: WordPressConfig = {
        site_url: siteUrl,
        auth_method: authMethod,
        ...(authMethod === 'password' && { username, password }),
        ...(authMethod === 'token' && { api_token: apiToken }),
      }

      const success = await onValidate(config)

      setValidationResult({
        success,
        message: success
          ? 'Connection successful! WordPress site is reachable.'
          : 'Connection failed. Check your credentials and URL.',
      })
    } catch (error) {
      setValidationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Validation failed',
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveResult(null)

    try {
      const config: WordPressConfig = {
        site_url: siteUrl,
        site_name: siteName,
        auth_method: authMethod,
        ...(authMethod === 'password' && { username, password }),
        ...(authMethod === 'token' && { api_token: apiToken }),
      }

      await onSave(config)

      setSaveResult({
        success: true,
        message: 'Configuration saved successfully!',
      })
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">WordPress Configuration</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site URL */}
        <div>
          <label htmlFor="site_url" className="block text-sm font-medium text-gray-700 mb-2">
            WordPress Site URL *
          </label>
          <input
            type="url"
            id="site_url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://yourblog.com"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Must use HTTPS. Example: https://myblog.com
          </p>
        </div>

        {/* Site Name */}
        <div>
          <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-2">
            Site Name (Optional)
          </label>
          <input
            type="text"
            id="site_name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="My WordPress Blog"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Auth Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authentication Method *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="password"
                checked={authMethod === 'password'}
                onChange={(e) => setAuthMethod(e.target.value as 'password')}
                className="mr-2"
              />
              Username & Password
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="token"
                checked={authMethod === 'token'}
                onChange={(e) => setAuthMethod(e.target.value as 'token')}
                className="mr-2"
              />
              API Token
            </label>
          </div>
        </div>

        {/* Password Authentication */}
        {authMethod === 'password' && (
          <>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Password will be encrypted before storage
              </p>
            </div>
          </>
        )}

        {/* Token Authentication */}
        {authMethod === 'token' && (
          <div>
            <label htmlFor="api_token" className="block text-sm font-medium text-gray-700 mb-2">
              API Token *
            </label>
            <input
              type="password"
              id="api_token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Token will be encrypted before storage
            </p>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`p-4 rounded-md ${
              validationResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {validationResult.message}
          </div>
        )}

        {/* Save Result */}
        {saveResult && (
          <div
            className={`p-4 rounded-md ${
              saveResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {saveResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || !siteUrl}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="submit"
            disabled={isSaving || !siteUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
