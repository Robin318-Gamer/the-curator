import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

const MAX_PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limitRaw = parseInt(searchParams.get('limit') || '12', 10);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(6, Number.isNaN(limitRaw) ? 12 : limitRaw));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category');
  const subCategory = searchParams.get('subCategory');
  const tag = searchParams.get('tag')?.trim();
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let query = supabase
    .from('articles')
    .select(
      'id, title, excerpt, category, sub_category, published_date, main_image_url, tags, source_id, source_article_id',
      { count: 'exact' }
    )
    .eq('scrape_status', 'success')
    .order('published_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (subCategory) {
    query = query.eq('sub_category', subCategory);
  }

  if (tag) {
    query = query.ilike('tags', `%${tag}%`);
  }

  // Add date range filtering
  if (dateFrom) {
    query = query.gte('published_date', dateFrom);
  }

  if (dateTo) {
    // Add 1 day to include the entire dateTo day
    const dateToEnd = new Date(dateTo);
    dateToEnd.setDate(dateToEnd.getDate() + 1);
    const dateToEndStr = dateToEnd.toISOString().split('T')[0];
    query = query.lt('published_date', dateToEndStr);
  }

  const { data: articles, error, count } = await query;

  if (error) {
    console.error('[NewsAPI] Failed to fetch articles', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from('articles')
    .select('category, sub_category')
    .neq('category', null)
    .order('category', { ascending: true });

  if (categoryError) {
    console.warn('[NewsAPI] Failed to load category list', categoryError.message);
  }

  const categories: string[] = [];
  const subCategoriesByCategory: Record<string, string[]> = {};

  (categoryRows || []).forEach((row) => {
    const categoryKey = row.category?.trim();
    if (!categoryKey) return;
    if (!categories.includes(categoryKey)) {
      categories.push(categoryKey);
    }

    const subKey = row.sub_category?.trim();
    if (!subKey) return;
    subCategoriesByCategory[categoryKey] = subCategoriesByCategory[categoryKey] || [];
    if (!subCategoriesByCategory[categoryKey].includes(subKey)) {
      subCategoriesByCategory[categoryKey].push(subKey);
    }
  });

  return NextResponse.json({
    success: true,
    data: articles || [],
    total: count ?? (articles?.length ?? 0),
    page,
    pageSize: limit,
    categories,
    subCategoriesByCategory,
  });
}
