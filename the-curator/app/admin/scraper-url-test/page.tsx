"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function ScraperUrlTestContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Load URL from query parameter if present
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
      // Auto-trigger scraping if URL is provided
      handleTest(urlParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleTest(urlToTest?: string) {
    const targetUrl = urlToTest || url;
    setLoading(true);
    setError(null);
    setResult(null);
    setImportStatus(null);
    try {
      const res = await fetch('/api/scraper/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      
      // Check if response is valid JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError(`Server error: Expected JSON but got ${contentType || 'unknown'} (Status: ${res.status})`);
        return;
      }
      
      const data = await res.json();
      if (!data.success) {
        setError(data.error || data.details || 'Unknown error');
      } else {
        setResult(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError('Server timeout or returned invalid response. The scraper is taking too long. Try a different article.');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToDatabase() {
    if (!result) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const res = await fetch('/api/articles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedArticle: result,
          sourceUrl: url,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setImportStatus({
          success: true,
          message: data.message,
        });
      } else {
        setImportStatus({
          success: false,
          message: data.error || data.message || 'Failed to save article',
        });
      }
    } catch (err: unknown) {
      setImportStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to save article',
      });
    } finally {
      setImporting(false);
    }
  }

  // Type assertions for result properties
  const resultData = result as {
    articleId?: string;
    title?: string;
    author?: string;
    category?: string;
    subCategory?: string;
    publishedDate?: string;
    updateDate?: string;
    tags?: string[];
    images?: string[];
    articleImageList?: Array<{ url: string; caption?: string }>;
    content?: Array<{ type: string; text: string }> | string;
  } | null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Scraper URL Test</h1>
      <div className="mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          placeholder="Paste news article URL here..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !url}
        onClick={() => handleTest()}
      >
        {loading ? 'Testing...' : 'Run Scraper'}
      </button>
      {resultData && (
        <button
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-700"
          disabled={importing}
          onClick={handleSaveToDatabase}
        >
          {importing ? '💾 Saving...' : '💾 Save to Database'}
        </button>
      )}
      {error && (
        <div className="mt-4 text-red-600">Error: {error}</div>
      )}
      {importStatus && (
        <div className={`mt-4 p-3 rounded ${importStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {importStatus.message}
        </div>
      )}
      {resultData && (
        <div className="mt-8 border rounded p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Extracted Metadata</h2>
          {resultData.articleId && <div className="mb-2"><strong>Article ID:</strong> {resultData.articleId}</div>}
          <div className="mb-2"><strong>Title:</strong> {resultData.title}</div>
          <div className="mb-2"><strong>Author:</strong> {resultData.author}</div>
          <div className="mb-2"><strong>Category:</strong> {resultData.category}</div>
          {resultData.subCategory && <div className="mb-2"><strong>Sub Category:</strong> {resultData.subCategory}</div>}
          <div className="mb-2"><strong>Published Date:</strong> {resultData.publishedDate}</div>
          <div className="mb-2"><strong>Update Date:</strong> {resultData.updateDate || 'N/A'}</div>
          <div className="mb-2"><strong>Tags:</strong> {resultData.tags?.length ? resultData.tags.join(', ') : 'None'}</div>
          
          {resultData.images && resultData.images.length > 0 && (
            <div className="mb-4">
              <strong>Main Image:</strong>
              <div className="mt-2 border rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultData.images[0]} alt="Main featured image" className="w-full h-auto" />
              </div>
            </div>
          )}
          
          {resultData.articleImageList && resultData.articleImageList.length > 0 && (
            <div className="mb-4">
              <strong>Article Images ({resultData.articleImageList.length}):</strong>
              <div className="mt-2 space-y-4">
                {resultData.articleImageList.map((item, i: number) => (
                  <div key={i} className="border rounded overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.caption || `Article image ${i + 1}`} className="w-full h-auto" />
                    {item.caption && (
                      <div className="p-2 text-sm text-gray-600 bg-gray-50">
                        {item.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-2"><strong>Content:</strong></div>
          <div className="text-gray-800 text-sm max-h-96 overflow-auto border p-4 bg-white rounded space-y-4">
            {Array.isArray(resultData.content) ? (
              resultData.content.map((block, i: number) => {
                if (block.type === 'heading') {
                  return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-900">{block.text}</h3>;
                }
                return <p key={i} className="leading-relaxed">{block.text}</p>;
              })
            ) : typeof resultData.content === 'string' ? (
              resultData.content.split('\n\n').filter(Boolean).map((block: string, i: number) => {
                if (block.startsWith('### ')) {
                  const headingText = block.replace('### ', '');
                  return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-900">{headingText}</h3>;
                }
                return <p key={i} className="leading-relaxed">{block}</p>;
              })
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScraperUrlTestPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-10 px-4">Loading...</div>}>
      <ScraperUrlTestContent />
    </Suspense>
  );
}
