import type { Metadata } from 'next';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'The Curator - Hong Kong News Aggregator',
  description: 'Curated news from Hong Kong sources with AI-powered summaries',
  keywords: ['Hong Kong', 'news', 'aggregator', 'AI summary', 'HK01', 'Ming Pao', 'Oriental Daily'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-stone-950/95 dark:supports-[backdrop-filter]:bg-stone-950/60 dark:border-stone-800">
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="The Curator logo"
                    width={42}
                    height={42}
                    className="rounded-full border border-slate-200 bg-white dark:border-stone-700"
                  />
                  <div>
                    <p className="text-lg font-semibold tracking-wide dark:text-stone-50">The Curator</p>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-stone-500">HK news aggregator</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 md:py-0 dark:border-stone-800">
              <div className="container mx-auto flex h-16 items-center justify-center px-4 text-sm text-gray-600 dark:text-stone-400">
                © {new Date().getFullYear()} The Curator. All rights reserved.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
