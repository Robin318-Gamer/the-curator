import Link from 'next/link';
import NewsList from './NewsList';

const copy = {
  badge: '精選香港新聞',
  title: '最新摘錄',
  back: '返回首頁',
} as const;

export default function NewsLanding() {
  const text = copy;

  return (
    <div className="bg-slate-50 dark:bg-stone-900 min-h-screen">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-slate-400 dark:text-stone-500">{text.badge}</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-stone-50">{text.title}</h1>
          <p className="text-sm text-slate-600 dark:text-stone-400" />
        </header>
        <NewsList />
        <div className="text-center text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-stone-500">
          <Link href="/">{text.back}</Link>
        </div>
      </div>
    </div>
  );
}
