"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  {
    href: "/admin/articles",
    label: "導入佇列",
    description: "檢視待處理 URL 並批次匯入",
  },
  {
    href: "/admin/article-list-scraper",
    label: "分類掃描",
    description: "重新掃描 HK01 各分類",
  },
  {
    href: "/admin/scraper-url-test",
    label: "單篇測試",
    description: "貼上網址即時測試",
  },
  {
    href: "/admin/database",
    label: "資料庫工具",
    description: "重置 schema 與佇列",
  },
  {
    href: "/admin/scraper-test",
    label: "樣本驗證",
    description: "對照 Sample Data",
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-slate-900 dark:bg-stone-950 text-white shadow-lg border-b dark:border-stone-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-stone-500">Admin</p>
          <p className="text-lg font-semibold text-white">The Curator 工具列</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-700 dark:border-stone-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:hover:bg-stone-800 md:hidden"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label="切換導覽選單"
        >
          {isMenuOpen ? "Close" : "Menu"}
        </button>
      </div>
      <div className={`${isMenuOpen ? "block" : "hidden"} border-t border-slate-800 dark:border-stone-700 md:block`}>
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 md:grid-cols-5">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`group rounded-xl border px-4 py-3 transition-all duration-150 ${
                isActive(link.href)
                  ? "border-white dark:border-stone-300 bg-white dark:bg-stone-100 text-slate-900 dark:text-stone-950 shadow"
                  : "border-slate-700/80 dark:border-stone-700 bg-slate-900 dark:bg-stone-900 text-slate-200 dark:text-stone-300 hover:border-slate-400 dark:hover:border-stone-500"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <p className="text-sm font-semibold tracking-wide">{link.label}</p>
              <p className="text-xs text-slate-400 dark:text-stone-500 group-hover:text-slate-300 dark:group-hover:text-stone-400">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
