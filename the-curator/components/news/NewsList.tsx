"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ArticleSummary = {
  id: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  sub_category?: string | null;
  published_date?: string | null;
  main_image_url?: string | null;
  tags?: string | null;
};

type ApiResponse = {
  success: boolean;
  data: ArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  subCategoriesByCategory: Record<string, string[]>;
  sources?: Array<{ key: string; name: string }>;
  message?: string;
};

const PAGE_SIZE = 12;

const translations = {
  searchLabel: '搜尋標題',
  tagLabel: '標籤',
  searchPlaceholder: '輸入標題關鍵字',
  tagPlaceholder: '輸入標籤關鍵字',
  searchButton: '查詢',
  sourceLabel: '來源',
  categoryLabel: '分類',
  subCategoryLabel: '子分類',
  dateFromLabel: '開始日期',
  dateToLabel: '結束日期',
  showingLabel: (visible: number, total: number) => `顯示 ${visible} / ${total} 篇文章`,
  noArticles: '目前沒有符合條件的文章。',
  loadMore: '載入更多',
  loading: '載入中…',
} as const;

export default function NewsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = translations;

  const paramString = searchParams?.toString() ?? '';
  const appliedSearch = searchParams?.get('search') ?? '';
  const appliedTag = searchParams?.get('tag') ?? '';
  const appliedSource = searchParams?.get('source') ?? '';
  const appliedCategory = searchParams?.get('category') ?? '';
  const appliedSubCategory = searchParams?.get('subCategory') ?? '';
  const appliedDateFrom = searchParams?.get('dateFrom') ?? '';
  const appliedDateTo = searchParams?.get('dateTo') ?? '';

  const [searchInput, setSearchInput] = useState(appliedSearch);
  const [tagInput, setTagInput] = useState(appliedTag);
  const [source, setSource] = useState(appliedSource);
  const [category, setCategory] = useState(appliedCategory);
  const [subCategory, setSubCategory] = useState(appliedSubCategory);
  const [dateFrom, setDateFrom] = useState(appliedDateFrom);
  const [dateTo, setDateTo] = useState(appliedDateTo);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<Array<{ key: string; name: string }>>([]);
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState<Record<string, string[]>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const subCategoryOptions = useMemo(() => {
    if (category) {
      return subCategoriesByCategory[category] || [];
    }
    const allSubs = Object.values(subCategoriesByCategory).flat();
    return Array.from(new Set(allSubs));
  }, [category, subCategoriesByCategory]);

  const hasMore = page * PAGE_SIZE < total;

  useEffect(() => {
    setSearchInput(appliedSearch);
    setTagInput(appliedTag);
    setSource(appliedSource);
    setCategory(appliedCategory);
    setSubCategory(appliedSubCategory);
    setDateFrom(appliedDateFrom);
    setDateTo(appliedDateTo);
    setPage(1);
  }, [appliedSearch, appliedTag, appliedSource, appliedCategory, appliedSubCategory, appliedDateFrom, appliedDateTo]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, appliedTag, appliedSource, appliedCategory, appliedSubCategory, appliedDateFrom, appliedDateTo]);

  const updateFilters = useCallback(
    (updates: Partial<{ search: string; tag: string; source: string; category: string; subCategory: string; dateFrom: string; dateTo: string }>) => {
      const params = new URLSearchParams(paramString);
      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search);
        } else {
          params.delete('search');
        }
      }
      if (updates.tag !== undefined) {
        if (updates.tag) {
          params.set('tag', updates.tag);
        } else {
          params.delete('tag');
        }
      }
      if (updates.source !== undefined) {
        if (updates.source) {
          params.set('source', updates.source);
        } else {
          params.delete('source');
        }
      }
      if (updates.category !== undefined) {
        if (updates.category) {
          params.set('category', updates.category);
        } else {
          params.delete('category');
        }
      }
      if (updates.subCategory !== undefined) {
        if (updates.subCategory) {
          params.set('subCategory', updates.subCategory);
        } else {
          params.delete('subCategory');
        }
      }
      if (updates.dateFrom !== undefined) {
        if (updates.dateFrom) {
          params.set('dateFrom', updates.dateFrom);
        } else {
          params.delete('dateFrom');
        }
      }
      if (updates.dateTo !== undefined) {
        if (updates.dateTo) {
          params.set('dateTo', updates.dateTo);
        } else {
          params.delete('dateTo');
        }
      }

      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target);
    },
    [pathname, paramString, router]
  );

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (appliedSearch) params.set('search', appliedSearch);
      if (appliedTag) params.set('tag', appliedTag);
      if (appliedSource) params.set('source', appliedSource);
      if (appliedCategory) params.set('category', appliedCategory);
      if (appliedSubCategory) params.set('subCategory', appliedSubCategory);
      if (appliedDateFrom) params.set('dateFrom', appliedDateFrom);
      if (appliedDateTo) params.set('dateTo', appliedDateTo);

      const response = await fetch(`/api/news/list?${params.toString()}`);
      const payload: ApiResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load news');
      }

      setTotal(payload.total || 0);
      setCategories(payload.categories || []);
      setSources(payload.sources || []);
      setSubCategoriesByCategory(payload.subCategoriesByCategory || {});
      setArticles(prev => (page === 1 ? payload.data : [...prev, ...payload.data]));
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, appliedTag, appliedSource, appliedCategory, appliedSubCategory, appliedDateFrom, appliedDateTo]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loading) {
          loadMore();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchInput.trim(), tag: tagInput.trim() });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubCategory('');
    updateFilters({ category: value, subCategory: '' });
  };

  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    updateFilters({ subCategory: value });
  };

  const handleTagClick = (tag: string) => {
    setTagInput(tag);
    updateFilters({ tag });
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <form className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" onSubmit={handleSearch}>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.searchLabel}
              </label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.tagLabel}
              </label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                placeholder={t.tagPlaceholder}
                value={tagInput}
                onChange={event => setTagInput(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 dark:bg-stone-50 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white dark:text-stone-900 transition-colors hover:bg-slate-800 dark:hover:bg-stone-200"
            >
              {t.searchButton}
            </button>
          </form>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.sourceLabel}
              </label>
              <select
                className="mt-1 rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                value={source}
                onChange={event => {
                  const value = event.target.value;
                  setSource(value);
                  updateFilters({ source: value });
                }}
              >
                <option value="">全部來源</option>
                {sources.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.categoryLabel}
              </label>
              <select
                className="mt-1 rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                value={category}
                onChange={event => handleCategoryChange(event.target.value)}
              >
                <option value="">全部分類</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.subCategoryLabel}
              </label>
              <select
                className="mt-1 rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                value={subCategory}
                onChange={event => handleSubCategoryChange(event.target.value)}
                disabled={!subCategoryOptions.length}
              >
                <option value="">全部子分類</option>
                {subCategoryOptions.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.dateFromLabel}
              </label>
              <input
                type="date"
                className="mt-1 rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                value={dateFrom}
                onChange={event => {
                  setDateFrom(event.target.value);
                  updateFilters({ dateFrom: event.target.value });
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-stone-400">
                {t.dateToLabel}
              </label>
              <input
                type="date"
                className="mt-1 rounded-2xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-slate-900 dark:text-stone-50 px-3 py-2 text-sm"
                value={dateTo}
                onChange={event => {
                  setDateTo(event.target.value);
                  updateFilters({ dateTo: event.target.value });
                }}
              />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-stone-500">
          {t.showingLabel(articles.length, total)}
        </p>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>

      {articles.length === 0 && !loading && (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 p-8 text-center text-slate-500 dark:text-stone-400">
          {t.noArticles}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {articles.map(article => (
          <article
            key={article.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-sm transition-shadow hover:shadow-lg"
          >
            {article.main_image_url && (
              <div className="overflow-hidden bg-slate-100 dark:bg-stone-900">
                <img
                  src={article.main_image_url}
                  alt={article.title}
                  className="w-full object-contain"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="text-xs uppercase tracking-[0.5em] text-slate-400 dark:text-stone-500">
                {(article.category || 'Hong Kong').toUpperCase()} · {formatDate(article.published_date)}
              </div>
              <Link href={`/news/${article.id}`} className="text-lg font-semibold text-slate-900 dark:text-stone-50">
                {article.title}
              </Link>
              <p className="text-sm text-slate-600 dark:text-stone-300 line-clamp-3">
                {article.excerpt || '尚未生成摘要'}
              </p>
              {article.tags && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {article.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(Boolean)
                    .map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className="rounded-full border border-slate-200 dark:border-stone-600 px-3 py-1 text-slate-500 dark:text-stone-400 transition-colors hover:border-slate-900 dark:hover:border-stone-300 hover:text-slate-900 dark:hover:text-stone-50"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              )}
              <Link
                href={`/news/${article.id}`}
                className="mt-auto text-sm font-semibold text-slate-900 dark:text-stone-50 underline-offset-4 transition-colors hover:text-slate-600 dark:hover:text-stone-300"
              >
                Read article →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {(hasMore || loading) && (
        <div className="flex flex-col items-center gap-3">
          <div ref={loadMoreRef} className="h-1 w-full" />
          <button
            type="button"
            onClick={loadMore}
            disabled={loading || !hasMore}
            className="rounded-2xl border border-slate-300 dark:border-stone-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-slate-900 dark:text-stone-50 transition-colors hover:bg-slate-900 dark:hover:bg-stone-100 hover:text-white dark:hover:text-stone-900 disabled:opacity-40"
          >
            {loading ? t.loading : t.loadMore}
          </button>
        </div>
      )}
    </section>
  );
}
