"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { localeNames, locales, type Locale } from '@/lib/config/i18n';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = (router.locale ?? 'en') as Locale;
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
