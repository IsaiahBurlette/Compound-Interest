export const colors = {
  bgTop: '#0F1226',
  bgBottom: '#1B1040',
  surface: 'rgba(255,255,255,0.06)',
  surfaceBorder: 'rgba(255,255,255,0.10)',
  textPrimary: '#F5F3FF',
  textSecondary: 'rgba(245,243,255,0.62)',
  textMuted: 'rgba(245,243,255,0.42)',

  accent: '#7C5CFC',
  accentSoft: '#A78BFA',
  growth: '#34E7A6',
  growthSoft: '#7CF7CB',
  spend: '#FF7A7A',

  chipBg: 'rgba(255,255,255,0.06)',
  chipBgActive: '#7C5CFC',
  chipBorder: 'rgba(255,255,255,0.14)',
};

export const gradients = {
  background: [colors.bgTop, colors.bgBottom] as const,
  growth: [colors.growth, colors.accent] as const,
  hero: ['#7C5CFC', '#34E7A6'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
};
