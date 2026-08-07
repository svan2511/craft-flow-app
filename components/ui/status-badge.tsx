import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Type } from '@/constants/theme';

export type BadgeVariant =
  | 'active'
  | 'pending'
  | 'toRecover'
  | 'month'
  | 'dueTomorrow'
  | 'due48h'
  | 'inPolish'
  | 'inStructure'
  | 'ready'
  | 'completed'
  | 'new'
  | 'inProgress'
  | 'overdue';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  active: { bg: Palette.primaryContainer, color: Palette.onPrimaryContainer },
  pending: { bg: Palette.secondaryContainer, color: Palette.onSecondaryContainer },
  toRecover: { bg: Palette.errorContainer, color: Palette.onErrorContainer },
  month: { bg: Palette.tertiaryContainer, color: Palette.onTertiaryContainer },
  dueTomorrow: { bg: Palette.error, color: Palette.onError },
  due48h: { bg: Palette.secondary, color: Palette.onSecondary },
  inPolish: { bg: Palette.secondaryContainer, color: Palette.onSecondaryContainer },
  inStructure: { bg: Palette.primaryContainer, color: Palette.onPrimaryContainer },
  ready: { bg: Palette.tertiary, color: Palette.onTertiary },
  completed: { bg: Palette.tertiary, color: Palette.onTertiary },
  new: { bg: Palette.surfaceContainerHigh, color: Palette.onSurface },
  inProgress: { bg: Palette.primaryContainer, color: Palette.onPrimaryContainer },
  overdue: { bg: Palette.error, color: Palette.onError },
};

export function StatusBadge({
  label,
  variant,
  style,
}: {
  label: string;
  variant: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}) {
  const { bg, color } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.active;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  label: {
    ...Type.statusBadge,
    textTransform: 'none',
  },
});
