import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { StatusBadge, type BadgeVariant } from '@/components/ui/status-badge';
import { Palette, Type } from '@/constants/theme';
import { stageStatusMeta } from '@/lib/order-status';

export function JobCard({
  orderId,
  title,
  statusVariant,
  customer,
  worker,
  total,
  paid,
  due,
  stage,
  onView,
  dimmed = false,
  showFinance = true,
}: {
  orderId: string;
  title: string;
  statusVariant: BadgeVariant;
  customer: string;
  worker: string;
  total?: string;
  paid?: string;
  due?: string;
  stage?: { name: string; status: string } | null;
  onView?: () => void;
  dimmed?: boolean;
  showFinance?: boolean;
}) {
  const stageMeta = stage ? stageStatusMeta(stage.status) : null;
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  return (
    <Pressable
      onPress={onView}
      style={({ pressed }) => [styles.card, dimmed && styles.cardDimmed, pressed && styles.cardPressed]}>
      <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>{orderId}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Animated.Text style={[styles.clickHint, { opacity: blink }]}>view details</Animated.Text>
          </View>
        <View style={styles.headerRight}>
          {stage ? (
            <View style={styles.headerStage}>
              <Text style={styles.headerStageName} numberOfLines={1}>
                {stage.name}
              </Text>
              <Text style={styles.headerStageStatus}>
                {stageMeta?.label ?? stage.status}
              </Text>
            </View>
          ) : (
            <StatusBadge label={statusLabel(statusVariant)} variant={statusVariant} />
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.personRow}>
          <View style={styles.personItem}>
            <View style={styles.iconCircle}>
              <Icon name="person" size={22} color={Palette.primary} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personLabel}>Customer</Text>
              <Text style={styles.personName}>{customer}</Text>
            </View>
          </View>
          <View style={styles.personDivider} />
          <View style={styles.personItem}>
            <View style={styles.iconCircle}>
              <Icon name="engineering" size={22} color={Palette.primary} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personLabel}>Assigned Worker</Text>
              <Text style={styles.personName}>{worker}</Text>
            </View>
          </View>
        </View>

        {showFinance ? (
          <View style={styles.financePill}>
            <View style={styles.financeCol}>
              <Text style={styles.financeLabel}>Total</Text>
              <Text style={styles.financeValue}>{total}</Text>
            </View>
            <View style={[styles.financeCol, styles.financeColBorder]}>
              <Text style={styles.financeLabel}>Paid</Text>
              <Text style={styles.financeValue}>{paid}</Text>
            </View>
            <View style={styles.financeCol}>
              <Text style={styles.financeLabel}>Due</Text>
              <Text style={[styles.financeValue, styles.financeDueValue]}>{due}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function statusLabel(variant: BadgeVariant): string {
  switch (variant) {
    case 'inStructure':
      return 'In Structure';
    case 'inPolish':
      return 'In Polish';
    case 'ready':
      return 'Ready';
    case 'completed':
      return 'Completed';
    default:
      return 'New';
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardDimmed: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clickHint: {
    fontFamily: 'Poppins_500Medium',
    fontStyle: 'italic',
    fontSize: 10,
    lineHeight: 12,
    color: Palette.onPrimary,
    letterSpacing: 0.2,
    backgroundColor: Palette.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.outlineVariant,
    backgroundColor: Palette.surfaceContainerLow,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flexShrink: 1,
    minWidth: 0,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 1,
    maxWidth: '52%',
  },
  headerStage: {
    alignItems: 'flex-end',
  },
  headerStageName: {
    ...Type.labelBold,
    fontSize: 11,
    lineHeight: 14,
    color: Palette.onSurfaceVariant,
    textAlign: 'right',
  },
  headerStageStatus: {
    ...Type.labelBold,
    fontSize: 11,
    lineHeight: 14,
    color: Palette.primary,
    textTransform: 'capitalize',
  },
  orderLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  title: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  body: {
    padding: 16,
    gap: 16,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  personItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  personDivider: {
    width: 2,
    borderRadius: 1,
    backgroundColor: Palette.outlineVariant,
    alignSelf: 'stretch',
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personLabel: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  personName: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  financePill: {
    backgroundColor: Palette.surfaceContainerHigh,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
  },
  financeCol: {
    flex: 1,
    alignItems: 'center',
  },
  financeColBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Palette.outlineVariant,
  },
  financeDueValue: {
    color: Palette.error,
  },
  financeLabel: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  financeValue: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },
});
