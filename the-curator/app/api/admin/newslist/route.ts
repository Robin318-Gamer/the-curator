import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, message: 'Supabase service role client not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const sourceKey = searchParams.get('sourceKey');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limitRaw = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, limitRaw));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('newslist')
    .select(
      `id, source_article_id, url, status, attempt_count, last_processed_at, created_at, updated_at, error_log, meta, resolved_article_id,
       source:news_sources(name, source_key)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  if (sourceKey) {
    query = query.eq('news_sources.source_key', sourceKey);
  }

  if (category) {
    query = query.eq('meta->>category', category);
  }

  if (search) {
    const ilikeValue = `%${search}%`;
    if (/^\d+$/.test(search)) {
      query = query.ilike('source_article_id', ilikeValue);
    } else {
      query = query.ilike('url', ilikeValue);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[NewslistAPI] Failed to fetch entries:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to load newslist entries', error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    total: count ?? data?.length ?? 0,
    page,
    pageSize: limit,
  });
}
