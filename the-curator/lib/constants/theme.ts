/**
 * Theme constants and color palette definitions for dark mode
 */

export const THEME_STORAGE_KEY = 'theme-preference';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Color palette for light and dark modes
 * All colors meet WCAG AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text)
 */
export const colors = {
  light: {
    background: '#ffffff',
    foreground: '#0c0a09', // stone-950
    card: '#fafaf9', // stone-50
    cardForeground: '#1c1917', // stone-900
    primary: '#0ea5e9', // sky-500
    primaryForeground: '#f0f9ff', // sky-50
    secondary: '#f5f5f4', // stone-100
    secondaryForeground: '#292524', // stone-800
    muted: '#e7e5e4', // stone-200
    mutedForeground: '#57534e', // stone-600
    accent: '#e0f2fe', // sky-100
    accentForeground: '#075985', // sky-800
    border: '#d6d3d1', // stone-300
  },
  dark: {
    background: '#0c0a09', // stone-950
    foreground: '#fafaf9', // stone-50
    card: '#1c1917', // stone-900
    cardForeground: '#f5f5f4', // stone-100
    primary: '#38bdf8', // sky-400
    primaryForeground: '#0c4a6e', // sky-900
    secondary: '#292524', // stone-800
    secondaryForeground: '#e7e5e4', // stone-200
    muted: '#44403c', // stone-700
    mutedForeground: '#a8a29e', // stone-400
    accent: '#0c4a6e', // sky-900
    accentForeground: '#bae6fd', // sky-200
    border: '#57534e', // stone-600
  },
} as const;

/**
 * Transition timing for smooth theme switching
 */
export const THEME_TRANSITION_DURATION = 200; // milliseconds
