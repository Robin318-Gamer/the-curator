import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';

export const revalidate = 60;

type ArticleBlock = {
  type: 'heading' | 'paragraph';
  text: string;
};

type ArticleDetail = {
  id: string;
  title: string;
  author?: string | null;
  category?: string | null;
  sub_category?: string | null;
  published_date?: string | null;
  updated_date?: string | null;
  main_image_url?: string | null;
  main_image_caption?: string | null;
  content?: ArticleBlock[];
  excerpt?: string | null;
  tags?: string | null;
  article_images?: Array<{
    image_url: string;
    caption?: string | null;
    is_main_image: boolean;
  }>;
};

async function fetchArticle(id: string): Promise<ArticleDetail | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(
      `id, title, author, category, sub_category, published_date, updated_date,
       main_image_url, main_image_caption, content, excerpt, tags, article_images ( image_url, caption, is_main_image )`
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load article', error.message);
    return null;
  }

  return data;
}

function formatDate(value?: string | null) {
  if (!value) return '未知時間';
  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id);

  if (!article) {
    notFound();
  }

  return (
    <div className="bg-slate-50 dark:bg-stone-900 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/news"
          className="text-sm font-semibold text-slate-500 dark:text-stone-400 transition-colors hover:text-slate-900 dark:hover:text-stone-200"
        >
          ← 回到新聞列表
        </Link>
        <article className="space-y-6 rounded-3xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 shadow-sm">
          <div className="space-y-1 text-sm text-slate-500 dark:text-stone-400">
            <p className="tracking-[0.4em] uppercase">{article.category || 'HK01'}</p>
            <p>{formatDate(article.published_date)}</p>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-stone-50">{article.title}</h1>
          {article.author && (
            <p className="text-sm text-slate-700 dark:text-stone-300">撰文：{article.author}</p>
          )}
          {article.main_image_url && (
            <figure className="rounded-2xl border border-slate-100 dark:border-stone-700 bg-slate-100/80 dark:bg-stone-900 overflow-hidden">
              <img
                src={article.main_image_url}
                alt={article.title}
                className="w-full rounded-2xl object-contain"
              />
              {article.main_image_caption && (
                <figcaption className="p-3 text-xs text-slate-600 dark:text-stone-400">{article.main_image_caption}</figcaption>
              )}
            </figure>
          )}
          <div className="space-y-4 text-base text-slate-700 dark:text-stone-300">
            {article.content?.map((block, index) =>
              block.type === 'heading' ? (
                <h3 key={`${block.text}-${index}`} className="text-xl font-semibold text-slate-900 dark:text-stone-50">
                  {block.text}
                </h3>
              ) : (
                <p key={`${block.text}-${index}`} className="leading-relaxed">
                  {block.text}
                </p>
              )
            )}
          </div>

          {article.tags && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-stone-400">
              {article.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <Link
                    key={tag}
                    href={`/news?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-slate-200 dark:border-stone-600 px-3 py-1 transition-colors hover:border-slate-900 dark:hover:border-stone-300 hover:text-slate-900 dark:hover:text-stone-200"
                  >
                    {tag}
                  </Link>
                ))}
            </div>
          )}

          {article.article_images?.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-stone-500">
                全文圖片
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {article.article_images.map((img, idx) => (
                  <div key={`${img.image_url}-${idx}`} className="space-y-2">
                    <img src={img.image_url} alt={img.caption || `image-${idx + 1}`} className="h-44 w-full rounded-2xl object-cover" />
                    {img.caption && (
                      <p className="text-xs text-slate-500 dark:text-stone-400">{img.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}
