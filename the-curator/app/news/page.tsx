import { Suspense } from 'react';
import NewsLanding from '@/components/news/NewsLanding';

function LoadingFallback() {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="text-slate-500">載入中...</div>
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
