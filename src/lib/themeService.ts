import { appStorage } from './storage';

export type ThemeMode = 'dark' | 'light';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = appStorage.getItemSync('vox_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark'; // Default to dark per design
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
  appStorage.setItem('vox_theme', theme);
  window.dispatchEvent(new CustomEvent('vox_theme_changed', { detail: theme }));
}

export function toggleTheme(): ThemeMode {
  const current = getInitialTheme();
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
