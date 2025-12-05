"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ScraperUrlTestPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
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
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Unknown error');
      } else {
        setResult(data.data);
      }
    } catch (err: any) {
      setError(err.message || String(err));
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
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Failed to save article',
      });
    } finally {
      setImporting(false);
    }
  }

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
        onClick={handleTest}
      >
        {loading ? 'Testing...' : 'Run Scraper'}
      </button>
      {result && (
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
      {result && (
        <div className="mt-8 border rounded p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Extracted Metadata</h2>
          {result.articleId && <div className="mb-2"><strong>Article ID:</strong> {result.articleId}</div>}
          <div className="mb-2"><strong>Title:</strong> {result.title}</div>
          <div className="mb-2"><strong>Author:</strong> {result.author}</div>
          <div className="mb-2"><strong>Category:</strong> {result.category}</div>
          {result.subCategory && <div className="mb-2"><strong>Sub Category:</strong> {result.subCategory}</div>}
          <div className="mb-2"><strong>Published Date:</strong> {result.publishedDate}</div>
          <div className="mb-2"><strong>Update Date:</strong> {result.updateDate || 'N/A'}</div>
          <div className="mb-2"><strong>Tags:</strong> {result.tags?.length ? result.tags.join(', ') : 'None'}</div>
          
          {result.images?.length > 0 && (
            <div className="mb-4">
              <strong>Main Image:</strong>
              <div className="mt-2 border rounded overflow-hidden">
                <img src={result.images[0]} alt="Main featured image" className="w-full h-auto" />
              </div>
            </div>
          )}
          
          {result.articleImageList?.length > 0 && (
            <div className="mb-4">
              <strong>Article Images ({result.articleImageList.length}):</strong>
              <div className="mt-2 space-y-4">
                {result.articleImageList.map((item: { url: string; caption?: string }, i: number) => (
                  <div key={i} className="border rounded overflow-hidden bg-white">
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
            {result.content.split('\n\n').filter(Boolean).map((block: string, i: number) => {
              // Check if this is a heading (starts with ###)
              if (block.startsWith('### ')) {
                const headingText = block.replace('### ', '');
                return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-900">{headingText}</h3>;
              }
              // Regular paragraph
              return <p key={i} className="leading-relaxed">{block}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
