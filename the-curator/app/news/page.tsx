import { Suspense } from 'react';
import NewsLanding from '@/components/news/NewsLanding';

function LoadingFallback() {
  return (
    <div className="bg-slate-50 dark:bg-stone-900 min-h-screen flex items-center justify-center">
      <div className="text-slate-500 dark:text-stone-400">載入中...</div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewsLanding />
    </Suspense>
  );
}
