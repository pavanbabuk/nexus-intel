export type ThemeMode = 'cyberpunk' | 'amber' | 'matrix' | 'stealth';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  badge: string;
  primary: string;
  accent: string;
  bgDark: string;
  bgPanel: string;
  borderColor: string;
  fontMono: boolean;
  radarGlow: string;
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: 'NEON',
    primary: '#00f2fe',
    accent: '#8b5cf6',
    bgDark: '#0a0d14',
    bgPanel: '#101622',
    borderColor: '#2a3854',
    fontMono: true,
    radarGlow: 'rgba(0, 242, 254, 0.4)'
  },
  amber: {
    id: 'amber',
    name: 'Amber NOC Alert',
    badge: 'NOC',
    primary: '#f59e0b',
    accent: '#d97706',
    bgDark: '#120c04',
    bgPanel: '#1c1408',
    borderColor: '#452b0c',
    fontMono: true,
    radarGlow: 'rgba(245, 158, 11, 0.4)'
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Phosphor',
    badge: 'CRT',
    primary: '#22c55e',
    accent: '#15803d',
    bgDark: '#031406',
    bgPanel: '#06200c',
    borderColor: '#14431e',
    fontMono: true,
    radarGlow: 'rgba(34, 197, 94, 0.4)'
  },
  stealth: {
    id: 'stealth',
    name: 'Obsidian Stealth',
    badge: 'TITANIUM',
    primary: '#38bdf8',
    accent: '#94a3b8',
    bgDark: '#0b0f17',
    bgPanel: '#111827',
    borderColor: '#1f293d',
    fontMono: false,
    radarGlow: 'rgba(56, 189, 248, 0.35)'
  }
};

const THEME_STORAGE_KEY = 'nexus_hud_theme';

export function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
  if (saved && THEMES[saved]) return saved;
  return 'cyberpunk';
}

export function applyTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('theme-cyberpunk', 'theme-amber', 'theme-matrix', 'theme-stealth');
  root.classList.add(`theme-${theme}`);

  const cfg = THEMES[theme];
  root.style.setProperty('--hud-primary', cfg.primary);
  root.style.setProperty('--hud-accent', cfg.accent);
  root.style.setProperty('--hud-bg-dark', cfg.bgDark);
  root.style.setProperty('--hud-bg-panel', cfg.bgPanel);
  root.style.setProperty('--hud-border', cfg.borderColor);
  root.style.setProperty('--hud-radar-glow', cfg.radarGlow);
}
