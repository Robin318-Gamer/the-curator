'use client';

import { useTheme } from '@/lib/hooks/useTheme';
import { THEME_TRANSITION_DURATION } from '@/lib/constants/theme';

interface ThemeToggleProps {
  className?: string;
  ariaLabel?: string;
}

/**
 * Theme toggle button component
 * Allows users to switch between light and dark modes
 * 
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle({ className, ariaLabel }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, mounted } = useTheme();

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${className || ''}`}
        disabled
        aria-label="Loading theme toggle"
      >
        <span className="sr-only">Loading theme toggle</span>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className || ''}`}
      aria-label={ariaLabel || `Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{ transitionDuration: `${THEME_TRANSITION_DURATION}ms` }}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <SunIcon className="h-5 w-5 text-stone-100" />
      ) : (
        <MoonIcon className="h-5 w-5 text-stone-900" />
      )}
    </button>
  );
}

/**
 * Sun icon for light mode
 */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
