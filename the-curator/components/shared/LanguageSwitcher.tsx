"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { defaultLocale, localeNames, locales, type Locale } from '@/lib/config/i18n';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Attempt to detect locale from pathname; default to defaultLocale
  const pathLocale = locales.find((loc) => pathname?.startsWith(`/${loc}`));
  const currentLocale: Locale = pathLocale ?? defaultLocale;
  const queryString = searchParams?.toString() ?? '';
  const href = queryString ? `${pathname}?${queryString}` : pathname;

  return (
    <div className="flex gap-2">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={href}
          locale={loc}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            currentLocale === loc
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {localeNames[loc]}
        </Link>
      ))}
    </div>
  );
}
