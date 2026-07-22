/**
 * Light-theme palette mirroring the web app's CSS custom properties (see
 * apps/web/src/index.css). Dark mode isn't wired up yet on mobile — worth
 * adding later via useColorScheme(), same values as the web dark block.
 */
export const colors = {
  surfacePage: "#f9f9f7",
  surface1: "#fcfcfb",
  surface2: "#ffffff",
  surfaceSunken: "#f2f1ee",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  gridline: "#e1e0d9",
  border: "#e5e4de",
  borderStrong: "#c3c2b7",

  series1: "#2a78d6",
  series2: "#eb6834",
  series3: "#1baf7a",
  series4: "#eda100",
  series5: "#e87ba4",
  series6: "#008300",
  series7: "#4a3aa7",
  series8: "#e34948",

  statusGood: "#0ca30c",
  statusWarning: "#fab219",
  statusSerious: "#ec835a",
  statusCritical: "#d03b3b",
  successText: "#006300",

  accent: "#2a78d6",
  accentInk: "#ffffff",
};

export const paletteSlots = [
  colors.series1,
  colors.series2,
  colors.series3,
  colors.series4,
  colors.series5,
  colors.series6,
  colors.series7,
  colors.series8,
];

export const radius = { sm: 6, md: 10, lg: 16 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
