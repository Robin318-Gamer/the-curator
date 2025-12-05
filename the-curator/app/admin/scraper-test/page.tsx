'use client';

import { useState, useEffect } from 'react';
import type { NewsSource, ValidationResult } from '@/lib/types/database';

interface SampleArticle {
  id: string;
  name: string;
  source: string;
  dataFile: string;
  htmlFile: string;
}

const SAMPLE_ARTICLES: SampleArticle[] = [
  {
    id: 'article1',
    name: 'Article 1 - HK01',
    source: 'HK01',
    dataFile: '/SampleDate/Article1Data.md',
    htmlFile: '/SampleDate/Article1Sourcecode.txt',
  },
  {
    id: 'article2',
    name: 'Article 2 - Ming Pao',
    source: 'Ming Pao',
    dataFile: '/SampleDate/Article2Data.md',
    htmlFile: '/SampleDate/Article2SourcCode.txt',
  },
  {
    id: 'article3',
    name: 'Article 3 - Oriental Daily',
    source: 'Oriental Daily',
    dataFile: '/SampleDate/Article3Data.md',
    htmlFile: '/SampleDate/Article3SourceCode.txt',
  },
];

export default function ScraperTestPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<NewsSource | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<SampleArticle | null>(null);
  const [html, setHtml] = useState('');
  const [expectedData, setExpectedData] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);

  // Load available sources
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/scraper/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleArticleSelect = async (article: SampleArticle) => {
    setSelectedArticle(article);
    setTestResult(null);

    // Find matching source
    const source = sources.find((s) => s.name === article.source);
    if (source) {
      setSelectedSource(source);
    }

    // Load HTML and expected data (placeholder - in real implementation, fetch from server)
    // For now, we'll show a message to manually paste the content
    setHtml('');
    setExpectedData(null);
  };

  const runTest = async () => {
    if (!selectedSource || !html || !expectedData) {
      alert('Please select an article, load HTML, and expected data');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/scraper/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource.id,
          html,
          expectedData,
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Scraper Test Page</h1>
          <p className="mt-2 text-gray-600">
            Test and validate article scraping logic with sample data
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel: Article Selection */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold">Sample Articles</h2>
              
              {loadingSources ? (
                <p className="text-gray-500">Loading sources...</p>
              ) : (
                <div className="space-y-2">
                  {SAMPLE_ARTICLES.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleSelect(article)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        selectedArticle?.id === article.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{article.name}</div>
                      <div className="mt-1 text-sm text-gray-500">{article.source}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedArticle && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Data File
                    </label>
                    <p className="mt-1 text-sm text-gray-600">{selectedArticle.dataFile}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      HTML File
                    </label>
                    <p className="mt-1 text-sm text-gray-600">{selectedArticle.htmlFile}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedSource && (
              <div className="mt-6 rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">Source Config</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedSource.name}
                  </div>
                  <div>
                    <span className="font-medium">Base URL:</span>{' '}
                    <span className="text-gray-600">{selectedSource.base_url}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Test Interface */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Test Interface</h2>
                <button
                  onClick={runTest}
                  disabled={loading || !html || !expectedData}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Testing...' : 'Run Test'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTML Source Code
                  </label>
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="Paste HTML source code here..."
                    className="w-full h-40 rounded-lg border border-gray-300 p-3 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Copy from {selectedArticle?.htmlFile || 'HTML file'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Data (JSON)
                  </label>
                  <textarea
                    value={expectedData ? JSON.stringify(expectedData, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        setExpectedData(JSON.parse(e.target.value));
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"title": "...", "content": "...", "publishedDate": "..."}'
                    className="w-full h-40 rounded-lg border border-gray-300 p-3 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Copy from {selectedArticle?.dataFile || 'data file'} and format as JSON
                  </p>
                </div>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold">Test Results</h3>
                  
                  {testResult.error ? (
                    <div className="rounded-lg bg-red-50 p-4 text-red-800">
                      <p className="font-medium">Error:</p>
                      <p className="mt-1">{testResult.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center gap-4">
                        <div
                          className={`rounded-lg px-4 py-2 font-medium ${
                            testResult.validationStatus?.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {testResult.validationStatus?.success ? '✓ PASSED' : '✗ FAILED'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {testResult.validationStatus?.passed}/{testResult.validationStatus?.total}{' '}
                          checks passed
                        </div>
                        <div className="text-sm text-gray-600">
                          {testResult.executionTime}ms
                        </div>
                      </div>

                      <div className="space-y-3">
                        {testResult.validationResults?.map((result: ValidationResult, idx: number) => (
                          <div
                            key={idx}
                            className={`rounded-lg border p-3 ${
                              result.match
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-medium capitalize">{result.field}</div>
                              <div className="text-sm">
                                {result.match ? '✓ Match' : '✗ Mismatch'}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-600">Expected:</div>
                                <div className="mt-1 rounded bg-white p-2 font-mono text-xs">
                                  {result.expected}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-600">Actual:</div>
                                <div className="mt-1 rounded bg-white p-2 font-mono text-xs">
                                  {result.actual}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
