import type { Metadata } from 'next';
import Image from 'next/image';
import { Inter } from 'next/font/google';
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
    <html lang="zh-Hant">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-start px-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="The Curator logo"
                  width={42}
                  height={42}
                  className="rounded-full border border-slate-200 bg-white"
                />
                <div>
                  <p className="text-lg font-semibold tracking-wide">The Curator</p>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">HK news aggregator</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex h-16 items-center justify-center px-4 text-sm text-gray-600">
              © {new Date().getFullYear()} The Curator. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
