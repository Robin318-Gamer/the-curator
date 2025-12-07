"use client";
import React, { useState } from 'react';

interface Article {
  articleId: string;
  url: string;
  category: string;
  titleSlug: string;
}

export default function ArticleListScraperPage() {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoriesScanned, setCategoriesScanned] = useState<number>(0);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  async function handleFetchArticles() {
    setLoading(true);
    setError(null);
    setArticles([]);
    setCategoriesScanned(0);
    setLimitWarning(null);
    
    try {
      const res = await fetch('/api/scraper/article-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const htmlText = await res.text();
        if (htmlText.includes('FUNCTION_INVOCATION_TIMEOUT')) {
          setError('Request timeout: The scraper is taking too long (>10s limit on Vercel Hobby). Try reducing the number of categories or upgrade to Pro plan.');
        } else {
          setError(`Server returned HTML error page. Status: ${res.status}. Check Vercel logs for details.`);
        }
        return;
      }
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to fetch articles');
      } else {
        setArticles(data.data.articles || []);
        setCategoriesScanned(data.data.categoriesScanned || 0);
        
        // Show warning if limit was applied
        if (data.data.limitApplied) {
          setLimitWarning(
            `Note: Only scanned ${data.data.categoriesScanned} of ${data.data.totalCategoriesFound} categories due to Vercel 10-second timeout limit. Upgrade to Pro for unlimited execution time.`
          );
        }
      }
    } catch (err: any) {
      if (err.message.includes('JSON')) {
        setError('Server timeout or returned invalid response. This operation takes too long for Vercel free tier (10s limit). Consider upgrading or reducing scope.');
      } else {
        setError(err.message || String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleScrapeArticle(articleUrl: string) {
    // Open scraper-url-test page in new tab with the URL pre-filled
    const encodedUrl = encodeURIComponent(articleUrl);
    window.open(`/admin/scraper-url-test?url=${encodedUrl}`, '_blank');
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Article List Scraper</h1>
      <p className="text-gray-600 mb-6">
        Automatically discovers all categories from HK01.com and fetches all unique articles
      </p>
      
      {/* Fetch Button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
          disabled={loading}
          onClick={handleFetchArticles}
        >
          {loading ? 'Scanning All Categories...' : 'Fetch All Articles from HK01.com'}
        </button>
        
        {loading && (
          <span className="text-sm text-gray-500">
            This may take a few minutes...
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Limit Warning */}
      {limitWarning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          ⚠️ {limitWarning}
        </div>
      )}

      {/* Articles Table */}
      {articles.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white shadow">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">
              Found {articles.length} Unique Articles
            </h2>
          </div> from {categoriesScanned} Categories
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Article ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title Preview</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">URL</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articles.map((article, index) => (
                  <tr key={article.articleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{article.articleId}</td>
                    <td className="px-4 py-3 text-sm">{article.category}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" title={article.titleSlug}>
                      {article.titleSlug}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                        onClick={() => handleScrapeArticle(article.url)}
                      >
                        Scrape
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Click &quot;Fetch All Articles&quot; to discover articles from all HK01 categories</p>
        </div>
      )}
    </div>
  );
}
