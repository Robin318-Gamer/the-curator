import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sourceKey = 'hk01', customUrl } = await req.json().catch(() => ({}));
    
    console.log('[ArticleList Simple] Received request');
    console.log('[ArticleList Simple] sourceKey:', sourceKey);
    console.log('[ArticleList Simple] customUrl:', customUrl);
    
    // Return a simple response for testing
    return Response.json({ 
      success: true, 
      data: {
        articles: [
          {
            articleId: '123',
            url: 'https://example.com/article/123',
            category: 'test',
            titleSlug: 'Test Article'
          }
        ],
        total: 1,
        categoriesScanned: 1,
        totalCategoriesFound: 1,
        limitApplied: false,
        timeoutProtection: true
      }
    });
    
  } catch (err) {
    console.error('[ArticleList Simple] Error:', err);
    return Response.json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
