import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Fonts, Palette, Type } from '@/constants/theme';

export function RoyalEmpty({
  icon,
  title,
  subtitle,
  tagline,
  action,
}: {
  icon: string;
  title: string;
  subtitle: string;
  tagline?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.ring}>
        <View style={styles.circle}>
          <Icon name={icon} size={64} color={Palette.onPrimary} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rule}>
        <View style={styles.ruleLine} />
        <Text style={styles.glyph}>✦</Text>
        <View style={styles.ruleLine} />
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      {action ? <View style={styles.actionWrap}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 140,
    paddingHorizontal: 32,
  },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: Palette.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  circle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 38,
    color: Palette.onSurface,
    textAlign: 'center',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  ruleLine: {
    width: 42,
    height: 1,
    backgroundColor: Palette.primary,
    opacity: 0.6,
  },
  glyph: {
    fontSize: 16,
    color: Palette.primary,
  },
  subtitle: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    lineHeight: 26,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
  tagline: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    opacity: 0.75,
    textAlign: 'center',
    marginTop: 4,
  },
  actionWrap: {
    marginTop: 28,
  },
});
