/**
 * Light/dark palettes mirroring the web app's CSS custom properties
 * (see apps/web/src/index.css). Consumed via useTheme() in ThemeContext.tsx
 * — never import lightColors/darkColors directly in a component, since that
 * bypasses the live system-theme switch.
 */
export const lightColors = {
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

export const darkColors: ThemeColors = {
  surfacePage: "#0d0d0d",
  surface1: "#1a1a19",
  surface2: "#202020",
  surfaceSunken: "#161615",
  textPrimary: "#ffffff",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  gridline: "#2c2c2a",
  border: "#3a3a37",
  borderStrong: "#383835",

  series1: "#3987e5",
  series2: "#d95926",
  series3: "#199e70",
  series4: "#c98500",
  series5: "#d55181",
  series6: "#008300",
  series7: "#9085e9",
  series8: "#e66767",

  statusGood: "#0ca30c",
  statusWarning: "#fab219",
  statusSerious: "#ec835a",
  statusCritical: "#e66767",
  successText: "#0ca30c",

  accent: "#3987e5",
  accentInk: "#ffffff",
};

export type ThemeColors = typeof lightColors;

/** Category color picker swatches — deliberately fixed to the light steps in both modes, since a category's stored hex shouldn't shift based on the viewer's current theme. */
export const paletteSlots = [
  lightColors.series1,
  lightColors.series2,
  lightColors.series3,
  lightColors.series4,
  lightColors.series5,
  lightColors.series6,
  lightColors.series7,
  lightColors.series8,
];

export const radius = { sm: 6, md: 10, lg: 16 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
