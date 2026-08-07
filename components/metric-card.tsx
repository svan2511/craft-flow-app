import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { StatusBadge, type BadgeVariant } from '@/components/ui/status-badge';
import { Palette, Type } from '@/constants/theme';

export function MetricCard({
  icon,
  iconColor,
  iconBg,
  badgeLabel,
  badgeVariant,
  label,
  value,
  valueColor = Palette.onSurface,
  labelColor,
  valueStyle,
  containerStyle,
  gradient,
}: {
  icon: string;
  iconColor: string;
  iconBg?: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  label: string;
  value: string;
  valueColor?: string;
  labelColor?: string;
  valueStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  gradient?: readonly [string, string];
}) {
  const content = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg ?? 'rgba(138,109,59,0.10)' }]}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <StatusBadge label={badgeLabel} variant={badgeVariant} />
      </View>
      <View>
        <Text style={[styles.label, { color: labelColor ?? Palette.onSurfaceVariant }]}>{label}</Text>
        <Text style={[styles.value, valueStyle, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </>
  );

  if (gradient) {
    return (
      <LinearGradient colors={[...gradient]} style={[styles.card, containerStyle]}>
        {content}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, styles.cardSolid, containerStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    height: 136,
    justifyContent: 'space-between',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardSolid: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  value: {
    ...Type.display,
    marginTop: 2,
  },
});
