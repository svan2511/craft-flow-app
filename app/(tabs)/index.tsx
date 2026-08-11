import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MetricCard } from '@/components/metric-card';
import { PaymentModal } from '@/components/payment-modal';
import { useToast } from '@/components/toast-provider';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Icon } from '@/components/ui/icon';
import { DashboardSkeleton } from '@/components/ui/screen-skeletons';
import { StatusBadge } from '@/components/ui/status-badge';
import { Palette, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatDate, formatRupees } from '@/lib/format';
import { deliveryBadge, type ApiOrder, type ApiOrderDetail } from '@/lib/order-status';
import { shareOrderPdf } from '@/lib/share-order-pdf';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

const BG_GRADIENT = ['#F8F6F3', '#F5F2EC', '#F8F6F3'] as const;
const HERO_GRADIENT = ['#FFFFFF', '#F5F0E6'] as const;

const currencyValue: TextStyle = { fontFamily: 'Poppins_700Bold', fontSize: 20, lineHeight: 28 };

type DashboardSummary = {
  workshop: { name: string } | null;
  metrics: {
    new_orders: number;
    active_orders: number;
    completed_orders: number;
    delivered_orders: number;
    total_orders: number;
    karigars: number;
    customers: number;
    outstanding_balance: number;
  };
  revenue: { today: number; this_week: number; this_month: number };
  profit: {
    today: { material: number; labor: number; gross: number; net: number };
    this_week: { material: number; labor: number; gross: number; net: number };
    this_month: { material: number; labor: number; gross: number; net: number };
  };
  urgent_deliveries: (ApiOrder & { has_advance?: boolean; customer?: { name: string } | null })[];
  recent_orders: (ApiOrder & { has_advance?: boolean; customer?: { name: string } | null })[];
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [paymentOrder, setPaymentOrder] = useState<number | null>(null);
  const [pendingDelivery, setPendingDelivery] = useState<DashboardSummary['urgent_deliveries'][number] | null>(null);
  const [delivering, setDelivering] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);
  const { data, loading, error, reload } = useFocusApi(
    useCallback(() => apiRequest<DashboardSummary>('/dashboard/summary', { authenticated: true }), []),
  );

  const urgent = data?.urgent_deliveries ?? [];
  const workshop = data?.workshop?.name ?? 'Craft Flow';

  const deliverOrder = async () => {
    const item = pendingDelivery;
    if (!item) {
      return;
    }
    setPendingDelivery(null);
    if (delivering) {
      return;
    }
    setDelivering(true);
    try {
      await apiRequest<{ order: ApiOrderDetail }>(`/orders/${item.id}/status`, {
        method: 'PATCH',
        body: { status: 'completed' },
        authenticated: true,
      });
      showToast(t('dashboard.orderDelivered'), { variant: 'success' });

      const res = await apiRequest<{ order: ApiOrderDetail }>(`/orders/${item.id}`, {
        authenticated: true,
      });
      await shareOrderPdf(res.order, t);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('dashboard.couldNotDeliver'), { variant: 'error' });
    } finally {
      setDelivering(false);
      await reload();
    }
  };

  return (
    <LinearGradient colors={[...BG_GRADIENT]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={Palette.primary} />
          }>
          {loading && !data ? (
            <DashboardSkeleton />
          ) : (
            <>
              <LinearGradient colors={[...HERO_GRADIENT]} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroAvatar}>
                <Image source={require('@/assets/images/logo.png')} style={styles.heroAvatarImg} contentFit="cover" />
              </View>
              <View style={styles.heroIdentity}>
                <Text style={styles.heroGreeting}>{t('dashboard.goodDay')}</Text>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {workshop}
                </Text>
              </View>
              <View style={styles.heroBell}>
                <Icon name="notifications" size={20} color={Palette.primary} />
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>{t('dashboard.today')}</Text>
                <Text style={styles.heroStatValue}>{formatRupees(data?.revenue.today ?? 0)}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>{t('dashboard.thisWeek')}</Text>
                <Text style={styles.heroStatValue}>{formatRupees(data?.revenue.this_week ?? 0)}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>{t('dashboard.thisMonth')}</Text>
                <Text style={styles.heroStatValue}>{formatRupees(data?.revenue.this_month ?? 0)}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIcon}>
                  <Icon name="assignment" size={15} color={Palette.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.ordersCards')}</Text>
              </View>
              <StatusBadge label={t('dashboard.total', { count: data?.metrics.total_orders ?? 0 })} variant="new" />
            </View>
            <View style={styles.jobSegments}>
              <Pressable
                style={({ pressed }) => [styles.jobSegment, pressed && styles.jobSegmentPressed]}
                onPress={() => router.push('/(tabs)/job-cards')}>
                <Text style={[styles.jobSegmentValue, { color: Palette.primary }]}>
                  {data?.metrics.new_orders ?? 0}
                </Text>
                <Text style={styles.jobSegmentLabel}>{t('dashboard.new')}</Text>
              </Pressable>
              <View style={styles.jobSegDivider} />
              <Pressable
                style={({ pressed }) => [styles.jobSegment, pressed && styles.jobSegmentPressed]}
                onPress={() => router.push('/(tabs)/job-cards')}>
                <Text style={[styles.jobSegmentValue, { color: Palette.warning }]}>
                  {data?.metrics.active_orders ?? 0}
                </Text>
                <Text style={styles.jobSegmentLabel}>{t('dashboard.active')}</Text>
              </Pressable>
              <View style={styles.jobSegDivider} />
              <Pressable
                style={({ pressed }) => [styles.jobSegment, pressed && styles.jobSegmentPressed]}
                onPress={() => router.push('/(tabs)/job-cards')}>
                <Text style={[styles.jobSegmentValue, { color: '#3E6B4F' }]}>
                  {data?.metrics.completed_orders ?? 0}
                </Text>
                <Text style={styles.jobSegmentLabel}>{t('dashboard.completed')}</Text>
              </Pressable>
              <View style={styles.jobSegDivider} />
              <Pressable
                style={({ pressed }) => [styles.jobSegment, pressed && styles.jobSegmentPressed]}
                onPress={() => router.push('/(tabs)/job-cards')}>
                <Text style={[styles.jobSegmentValue, { color: Palette.tertiary }]}>
                  {data?.metrics.delivered_orders ?? 0}
                </Text>
                <Text style={styles.jobSegmentLabel}>{t('dashboard.delivered')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            <MetricCard
              icon="account_balance_wallet"
              iconColor={Palette.secondary}
              iconBg="rgba(122,106,79,0.12)"
              badgeLabel={t('delivery.pending')}
              badgeVariant="pending"
              label={t('dashboard.marketDues')}
              value={formatRupees(data?.metrics.outstanding_balance ?? 0)}
              valueColor={Palette.onSurface}
              valueStyle={currencyValue}
              containerStyle={styles.metricCard}
            />
            <MetricCard
              icon="trending_up"
              iconColor={Palette.primary}
              iconBg="rgba(138,109,59,0.12)"
              badgeLabel={t('dashboard.monthlyHint')}
              badgeVariant="month"
              label={t('dashboard.collection')}
              value={formatRupees(data?.revenue.this_month ?? 0)}
              valueColor={Palette.onSurface}
              valueStyle={currencyValue}
              containerStyle={styles.metricCard}
            />
            <MetricCard
              icon="groups"
              iconColor={Palette.tertiary}
              iconBg="rgba(107,107,94,0.12)"
              badgeLabel={t('dashboard.teamHint')}
              badgeVariant="new"
              label={t('dashboard.karigars')}
              value={String(data?.metrics.karigars ?? 0)}
              containerStyle={styles.metricCard}
            />
            <MetricCard
              icon="support_agent"
              iconColor={Palette.primary}
              iconBg="rgba(138,109,59,0.12)"
              badgeLabel={t('dashboard.clientsHint')}
              badgeVariant="month"
              label={t('dashboard.customers')}
              value={String(data?.metrics.customers ?? 0)}
              containerStyle={styles.metricCard}
            />
          </View>

          <View style={[styles.sectionCard, styles.profitCard]}>
            <View style={styles.profitHeader}>
              <View style={styles.profitIconWrap}>
                <Icon name="trending_up" size={16} color={Palette.onPrimary} />
              </View>
              <View style={styles.profitTitleWrap}>
                <Text style={styles.profitTitle}>{t('dashboard.netProfitMonth')}</Text>
                <Text style={styles.profitSubtitle}>{t('dashboard.profitSubtitle')}</Text>
              </View>
            </View>
            <View style={styles.profitBreakdown}>
              <View style={styles.profitStat}>
                <Text style={styles.profitStatLabel}>{t('dashboard.grossSales')}</Text>
                <Text style={styles.profitStatValue}>{formatRupees(data?.profit.this_month.gross ?? 0)}</Text>
              </View>
              <View style={styles.profitStatDivider} />
              <View style={styles.profitStat}>
                <Text style={styles.profitStatLabel}>{t('dashboard.material')}</Text>
                <Text style={[styles.profitStatValue, styles.profitStatCost]}>
                  - {formatRupees(data?.profit.this_month.material ?? 0)}
                </Text>
              </View>
              <View style={styles.profitStatDivider} />
              <View style={styles.profitStat}>
                <Text style={styles.profitStatLabel}>{t('dashboard.labor')}</Text>
                <Text style={[styles.profitStatValue, styles.profitStatCost]}>
                  - {formatRupees(data?.profit.this_month.labor ?? 0)}
                </Text>
              </View>
              <View style={styles.profitStatDivider} />
              <View style={styles.profitStat}>
                <Text style={styles.profitStatLabel}>{t('dashboard.netProfit')}</Text>
                <Text
                  style={[
                    styles.profitStatValue,
                    styles.profitStatNet,
                    { color: (data?.profit.this_month.net ?? 0) < 0 ? Palette.error : '#3E6B4F' },
                  ]}>
                  {formatRupees(data?.profit.this_month.net ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIcon}>
                  <Icon name="bolt" size={15} color={Palette.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  onPress={() => router.push('/order/new')}>
                  <LinearGradient colors={[Palette.primary, '#6E552A']} style={styles.actionInner}>
                    <Icon name="add" size={18} color={Palette.onPrimary} />
                    <Text style={styles.actionText}>{t('dashboard.newOrder')}</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  onPress={() => router.push('/(tabs)/karigars')}>
                  <View style={[styles.actionInner, styles.actionSecondary]}>
                    <Icon name="payments" size={18} color={Palette.secondary} />
                    <Text style={[styles.actionText, styles.actionTextSecondary]}>{t('dashboard.advance')}</Text>
                  </View>
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                onPress={() => router.push('/(tabs)/job-cards')}>
                <View style={[styles.actionInner, styles.actionOutline]}>
                  <Icon name="receipt_long" size={18} color={Palette.primary} />
                  <Text style={[styles.actionText, styles.actionTextOutline]}>{t('dashboard.payment')}</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionIcon, styles.sectionIconDanger]}>
                  <Icon name="warning" size={15} color={Palette.error} />
                </View>
                <Text style={styles.sectionTitle}>{t('dashboard.urgentDeliveries')}</Text>
              </View>
              {urgent.length > 0 ? <StatusBadge label={`${urgent.length}`} variant="overdue" /> : null}
            </View>

            {error ? (
              <Text style={styles.emptyText}>{error}</Text>
            ) : urgent.length === 0 && !loading ? (
              <Text style={styles.emptyText}>{t('dashboard.noUrgent')}</Text>
            ) : (
              <View style={styles.deliveryList}>
                {urgent.map((item) => (
                  <DeliveryCard
                    key={item.id}
                    item={item}
                    deliverables
                    onView={() =>
                      router.push({ pathname: '/order/[id]', params: { id: String(item.id) } })
                    }
                    onDeliver={() => setPendingDelivery(item)}
                    onCollect={() => setPaymentOrder(item.id)}
                  />
                ))}
              </View>
            )}
            </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <PaymentModal
        visible={paymentOrder !== null}
        orderId={paymentOrder ?? 0}
        suggestedAmount={data?.urgent_deliveries.find((o) => o.id === paymentOrder)?.balance_due ?? 0}
        maxAmount={data?.urgent_deliveries.find((o) => o.id === paymentOrder)?.balance_due ?? 0}
        advancePaid={
          data?.urgent_deliveries.find((o) => o.id === paymentOrder)?.has_advance ?? false
        }
        onClose={() => setPaymentOrder(null)}
        onSaved={() => {
          setPaymentOrder(null);
          void reload();
        }}
      />

      <ConfirmModal
        visible={pendingDelivery !== null}
        icon="inventory_2"
        title={t('dashboard.deliverOrder')}
        message={t('dashboard.deliverMessage')}
        confirmLabel={t('dashboard.deliverAction')}
        variant="success"
        submitting={delivering}
        onCancel={() => setPendingDelivery(null)}
        onConfirm={() => void deliverOrder()}
      />
    </LinearGradient>
  );
}

type DeliveryTone = 'upcoming' | 'readyDue' | 'readyPaid';

function deliveryTone(item: DashboardSummary['urgent_deliveries'][number]): DeliveryTone {
  if (item.status === 'ready') {
    return item.balance_due > 0 ? 'readyDue' : 'readyPaid';
  }
  return 'upcoming';
}

function DeliveryCard({
  item,
  deliverables,
  onView,
  onDeliver,
  onCollect,
}: {
  item: DashboardSummary['urgent_deliveries'][number];
  deliverables?: boolean;
  onView: () => void;
  onDeliver: () => void;
  onCollect: () => void;
}) {
  const { t } = useTranslation();
  const tone = deliveryTone(item);
  const accent = tone === 'readyDue' ? Palette.tertiary : tone === 'readyPaid' ? '#3E6B4F' : Palette.secondary;
  const badge = deliveryBadge(t, item.delivery_date);

  return (
    <View style={styles.deliveryCard}>
      <View style={[styles.deliveryAccent, { backgroundColor: accent }]} />
      <View style={styles.deliveryBody}>
        <View style={styles.deliveryTitleRow}>
          <Text style={styles.deliveryTitle} numberOfLines={1}>
            {item.item_name}
          </Text>
          {tone === 'upcoming' ? (
            badge ? <StatusBadge label={badge.label} variant={badge.variant} /> : null
          ) : (
            <StatusBadge label={t('status.readyToDeliver')} variant="ready" />
          )}
        </View>

        <View style={styles.deliveryMetaRow}>
          <View style={styles.deliveryMeta}>
            <Icon name="person" size={14} color={Palette.onSurfaceVariant} />
            <Text style={styles.deliveryMetaText}>{item.customer?.name ?? '—'}</Text>
          </View>
          <Text style={styles.metaDivider}>·</Text>
          <View style={styles.deliveryMeta}>
            <Icon name="receipt_long" size={14} color={Palette.onSurfaceVariant} />
            <Text style={styles.deliveryMetaText}>{item.order_no}</Text>
          </View>
          {tone === 'upcoming' && badge ? (
            <>
              <Text style={styles.metaDivider}>·</Text>
              <View style={styles.deliveryMeta}>
                <Icon name="calendar_today" size={14} color={Palette.onSurfaceVariant} />
                <Text style={styles.deliveryMetaText} numberOfLines={1}>
                  {item.delivery_date ? formatDate(item.delivery_date) : ''}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.deliveryBottom}>
          <View>
            <Text style={styles.deliveryLabel}>
              {tone === 'readyDue' ? t('delivery.pending') : tone === 'readyPaid' ? t('delivery.payment') : t('delivery.balanceDue')}
            </Text>
            <Text
              style={[
                styles.deliveryAmount,
                tone === 'readyPaid' && { color: '#3E6B4F' },
                tone === 'readyDue' && { color: Palette.tertiary },
              ]}>
              {tone === 'readyPaid' ? t('status.fullPaid') : formatRupees(item.balance_due)}
            </Text>
          </View>

          {tone === 'upcoming' ? (
            <Pressable style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]} onPress={onView}>
              <Text style={styles.viewButtonText}>{t('common.view')}</Text>
              <Icon name="arrow_forward" size={14} color={Palette.onPrimary} />
            </Pressable>
          ) : (
            <View style={styles.readyActions}>
              {tone === 'readyDue' ? (
                <Pressable
                  style={({ pressed }) => [styles.ghostButton, pressed && styles.viewButtonPressed]}
                  onPress={onCollect}>
                  <Icon name="payments" size={15} color={Palette.tertiary} />
                  <Text style={[styles.ghostButtonText, { color: Palette.tertiary }]}>{t('common.collect')}</Text>
                </Pressable>
              ) : null}
              {deliverables ? (
                <Pressable
                  style={({ pressed }) => [styles.deliverButton, pressed && styles.viewButtonPressed]}
                  onPress={onDeliver}>
                  <Icon name="check" size={15} color={Palette.onPrimary} />
                  <Text style={styles.viewButtonText}>{t('common.deliver')}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 20,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    backgroundColor: '#ffffff',
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
  },
  heroIdentity: {
    flex: 1,
    gap: 2,
  },
  heroGreeting: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Palette.onSurfaceVariant,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: Palette.onSurface,
  },
  heroBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(138,109,59,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: {
    height: 1,
    backgroundColor: Palette.outlineVariant,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Palette.onSurfaceVariant,
  },
  heroStatValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    lineHeight: 24,
    color: Palette.onSurface,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.outlineVariant,
    marginHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48.5%',
  },
  jobSegments: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  jobSegment: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
  },
  jobSegmentPressed: {
    opacity: 0.6,
    backgroundColor: Palette.surfaceContainerLow,
  },
  jobSegmentValue: {
    ...Type.headlineLg,
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  jobSegmentLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  jobSegDivider: {
    width: 1,
    height: 34,
    backgroundColor: Palette.outlineVariant,
  },
  sectionCard: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    padding: 16,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(138,109,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconDanger: {
    backgroundColor: 'rgba(179,70,62,0.10)',
  },
  profitCard: {
    borderWidth: 2,
    borderColor: '#3E6B4F',
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#3E6B4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitTitleWrap: {
    flex: 1,
    gap: 1,
  },
  profitTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  profitSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Palette.onSurfaceVariant,
  },
  profitBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  profitStat: {
    flex: 1,
  },
  profitStatLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Palette.onSurfaceVariant,
  },
  profitStatValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Palette.onSurface,
    marginTop: 2,
  },
  profitStatCost: {
    color: Palette.error,
  },
  profitStatNet: {
    fontSize: 14,
  },
  profitStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Palette.outlineVariant,
    marginHorizontal: 8,
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  actionInner: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionSecondary: {
    backgroundColor: Palette.secondaryContainer,
  },
  actionOutline: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
  },
  actionText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: Palette.onPrimary,
  },
  actionTextSecondary: {
    color: Palette.onSecondaryContainer,
  },
  actionTextOutline: {
    color: Palette.primary,
  },
  deliveryList: {
    gap: 10,
    marginTop: 14,
  },
  deliveryCard: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    overflow: 'hidden',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  deliveryAccent: {
    width: 4,
  },
  deliveryBody: {
    flex: 1,
    padding: 14,
  },
  deliveryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  deliveryTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    flexShrink: 1,
  },
  deliveryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 2,
  },
  deliveryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  deliveryMetaText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    flexShrink: 1,
  },
  metaDivider: {
    color: Palette.outlineVariant,
    marginHorizontal: 8,
  },
  deliveryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.outlineVariant,
  },
  deliveryLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  deliveryAmount: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  viewButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  viewButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  viewButtonText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  readyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ghostButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ghostButtonText: {
    ...Type.labelBold,
  },
  deliverButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#3E6B4F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#3E6B4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
