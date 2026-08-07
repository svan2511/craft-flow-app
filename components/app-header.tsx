import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette } from '@/constants/theme';

export function AppHeader({
  title = 'Craft Flow',
  showLogo = true,
  onBack,
  right,
}: {
  title?: string;
  showLogo?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconButton} hitSlop={8}>
            <Icon name="arrow_back" size={26} color={Palette.primary} />
          </Pressable>
        ) : null}
        {showLogo ? (
          <View style={styles.logoWrap}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="cover" />
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ?? (
        <Pressable style={styles.iconButton} hitSlop={8}>
          <Icon name="settings" size={26} color={Palette.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderBottomWidth: 2,
    borderBottomColor: Palette.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    backgroundColor: Palette.surfaceContainerHighest,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: Palette.primary,
    flexShrink: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
