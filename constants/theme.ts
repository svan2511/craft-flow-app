import { Platform } from 'react-native';

/**
 * "Industrial Precision" design system — see UI/DESIGN.md.
 * High-contrast palette, Poppins typography, 8px grid.
 */

export const Palette = {
  background: '#F8F6F3',
  onBackground: '#1C1B1A',
  surface: '#F8F6F3',
  surfaceDim: '#E6E1DA',
  surfaceBright: '#F8F6F3',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2EFEA',
  surfaceContainer: '#EBE7E0',
  surfaceContainerHigh: '#E4DFD7',
  surfaceContainerHighest: '#DED8CF',
  onSurface: '#1C1B1A',
  onSurfaceVariant: '#5F5B54',
  inverseSurface: '#34322E',
  inverseOnSurface: '#F6F1EA',
  outline: '#8A857C',
  outlineVariant: '#CFC9BF',
  surfaceTint: '#8A6D3B',
  surfaceVariant: '#E8E3D9',
  primary: '#8A6D3B',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EFE4C8',
  onPrimaryContainer: '#2E2208',
  inversePrimary: '#D8C49A',
  secondary: '#7A6A4F',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F0E8D9',
  onSecondaryContainer: '#2E261A',
  tertiary: '#6B6B5E',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#EFEFE3',
  onTertiaryContainer: '#27271F',
  tertiaryFixed: '#E9E9DC',
  error: '#B3463E',
  onError: '#FFFFFF',
  errorContainer: '#F7E0DC',
  onErrorContainer: '#5C1510',
  whatsapp: '#25D366',
  success: '#3E6B4F',
  warning: '#B7791F',
  danger: '#C62828',
} as const;

export const Spacing = {
  base: 8,
  section: 24,
  cardGap: 12,
  touchTarget: 48,
  containerPadding: 16,
} as const;

export const Radius = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  pill: 999,
} as const;

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
  ...Platform.select({
    ios: {
      /** iOS `UIFontDescriptorSystemDesignDefault` */
      sans: 'system-ui',
      /** iOS `UIFontDescriptorSystemDesignSerif` */
      serif: 'ui-serif',
      /** iOS `UIFontDescriptorSystemDesignRounded` */
      rounded: 'ui-rounded',
      /** iOS `UIFontDescriptorSystemDesignMonospaced` */
      mono: 'ui-monospace',
    },
    default: {
      sans: 'normal',
      serif: 'serif',
      rounded: 'normal',
      mono: 'monospace',
    },
    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
      mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  }),
} as const;

export const Type = {
  display: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  headlineLg: { fontFamily: Fonts.semibold, fontSize: 22, lineHeight: 30 },
  headlineLgMobile: { fontFamily: Fonts.semibold, fontSize: 18, lineHeight: 26 },
  headlineMd: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 24 },
  bodyLg: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21 },
  labelBold: { fontFamily: Fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  statusBadge: { fontFamily: Fonts.semibold, fontSize: 12, lineHeight: 16 },
} as const;

/** Backwards-compatible helper kept for template components. */
const tintColorLight = Palette.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: Palette.onSurface,
    background: Palette.background,
    tint: tintColorLight,
    icon: Palette.onSurfaceVariant,
    tabIconDefault: Palette.onSurfaceVariant,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
