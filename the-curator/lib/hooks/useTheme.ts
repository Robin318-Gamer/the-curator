'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Custom hook for accessing and managing theme state
 * Wraps next-themes useTheme with additional functionality
 * 
 * @returns Theme context with current theme, resolved theme, and setTheme function
 * 
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * 
 * // Toggle between light and dark
 * const toggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
 * ```
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? theme : undefined,
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    systemTheme: mounted ? systemTheme : undefined,
    mounted,
  };
}
