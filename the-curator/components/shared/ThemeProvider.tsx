'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

/**
 * Custom storage handler for theme persistence using cookies + localStorage
 * Cookies ensure persistence across browser restarts and enable cross-device sync
 * localStorage provides fallback for environments with cookies disabled
 */
const themeStorageHandler = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    
    // Try cookies first (more persistent)
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${key}=`))
      ?.split('=')[1];
    
    if (cookieValue) return decodeURIComponent(cookieValue);
    
    // Fallback to localStorage
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    
    // Set both cookie (expires in 1 year) and localStorage
    const expiresDate = new Date();
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    
    // Set cookie
    document.cookie = `${key}=${encodeURIComponent(value)};path=/;expires=${expiresDate.toUTCString()};SameSite=Lax`;
    
    // Also set localStorage as fallback
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage unavailable
    }
  },
  
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    
    // Remove from cookies
    document.cookie = `${key}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;SameSite=Lax`;
    
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage unavailable
    }
  },
};

/**
 * Theme provider component that wraps the application
 * Provides theme context to all child components
 * Uses cookie-based persistence for better reliability and cross-device support
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="theme-preference"
      storage={themeStorageHandler}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
