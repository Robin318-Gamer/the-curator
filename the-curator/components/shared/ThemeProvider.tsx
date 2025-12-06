'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

/**
 * Theme provider component that wraps the application
 * Provides theme context to all child components
 * Uses localStorage persistence (next-themes default)
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Handle cookie persistence separately
    const STORAGE_KEY = 'theme-preference';
    
    // On mount, check if we need to sync from cookie
    const syncCookieToStorage = () => {
      if (typeof document === 'undefined') return;
      
      // Try to read from cookies
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${STORAGE_KEY}=`))
        ?.split('=')[1];
      
      if (cookieValue) {
        // If cookie exists, sync to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, decodeURIComponent(cookieValue));
        } catch {
          // Silently fail if localStorage unavailable
        }
      }
    };
    
    // Sync cookie to storage on mount
    syncCookieToStorage();
    
    // Listen for storage changes and sync to cookies
    const handleStorageChange = () => {
      if (typeof document === 'undefined') return;
      
      try {
        const currentTheme = localStorage.getItem(STORAGE_KEY);
        if (currentTheme) {
          const expiresDate = new Date();
          expiresDate.setFullYear(expiresDate.getFullYear() + 1);
          document.cookie = `${STORAGE_KEY}=${encodeURIComponent(currentTheme)};path=/;expires=${expiresDate.toUTCString()};SameSite=Lax`;
        }
      } catch {
        // Silently fail
      }
    };
    
    // Watch for theme changes and update cookie
    const observer = new MutationObserver(handleStorageChange);
    const checkInterval = setInterval(handleStorageChange, 1000);
    
    // Also listen to window storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="theme-preference"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
