import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { KarigarMoneyModal, type KarigarMoneyOrder } from '@/components/karigar-money-modal';
import { Icon } from '@/components/ui/icon';
import { KarigarsSkeleton } from '@/components/ui/screen-skeletons';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatRupees } from '@/lib/format';
import { orderStatusMeta, stageStatusMeta } from '@/lib/order-status';
import { useFocusApi } from '@/lib/use-focus-api';

type LedgerEntry = {
  key: string;
  icon: 'add' | 'remove';
  title: string;
  date: string;
  amount: string;
  positive: boolean;
  stageName?: string;
  advanceRemaining?: number | null;
};

type LedgerGroup = {
  key: string;
  title: string;
  total: number;
  entries: LedgerEntry[];
};

type KarigarOrder = {
  id: number;
  order_no: string;
  item_name: string;
  status: string;
  status_label: string;
  created_at: string;
  current_stage: {
    name: string;
    status: string;
    status_label: string;
    completed_stages: number;
    assigned_stages: number;
  } | null;
  due: number;
  received: number;
  pending: number;
};

type KarigarDetail = {
  id: number;
  name: string;
  role: string | null;
  default_rate: number | null;
  phone: string | null;
  orders_count: number;
  active_orders: number;
  completed_orders: number;
  pending_orders: number;
  ledger: {
    total_due: number;
    total_received: number;
    total_pending: number;
    total_settled: number;
    total_advances: number;
    balance: number;
  } | null;
  orders: KarigarOrder[] | null;
  payments: {
    id: number;
    type: string;
    type_label: string;
    amount: number;
    advance_remaining: number | null;
    note: string | null;
    paid_at: string | null;
    order_id: number | null;
    order: { id: number; order_no: string } | null;
    stage_id: number | null;
    stage: { id: number; name: string } | null;
  }[] | null;
};

export default function KarigarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [modal, setModal] = useState<'advance' | 'settle' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const { showToast } = useToast();

  const { data, loading, error, reload } = useFocusApi(
    useCallback(
      () => apiRequest<{ karigar: KarigarDetail }>(`/karigars/${id}`, { authenticated: true }),
      [id],
    ),
  );

  const karigar = data?.karigar ?? null;
  const ledgerGroups = buildLedger(karigar);

  const moneyOrders: KarigarMoneyOrder[] = (karigar?.orders ?? []).map((o) => ({
    id: o.id,
    order_no: o.order_no,
    item_name: o.item_name,
    pending: o.pending,
  }));

  const submitAdvance = async (amount: number, note: string, orderId: number | null) => {
    if (karigar === null) {
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/karigars/${karigar.id}/advances`, {
        method: 'POST',
        body: { amount, note, order_id: orderId },
        authenticated: true,
      });
      setModal(null);
      showToast('Karigar advance recorded.', { variant: 'success' });
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not record advance.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitSettle = async (amount: number, note: string, orderId: number | null) => {
    if (karigar === null) {
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/karigars/${karigar.id}/settle-weekly`, {
        method: 'POST',
        body: { amount, note, order_id: orderId },
        authenticated: true,
      });
      setModal(null);
      showToast('Settlement recorded.', { variant: 'success' });
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not settle payout.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader
        title={karigar ? karigar.name : 'Karigar'}
        showLogo={false}
        onBack={() => router.back()}
      />

      {loading && !data ? (
        <View style={styles.skeletonWrap}>
          <KarigarsSkeleton />
        </View>
      ) : karigar ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={Palette.primary} />
          }>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.avatarWrap}>
                <Image source={require('@/assets/images/logo.png')} style={styles.avatar} contentFit="cover" />
              </View>
              <View style={styles.summaryIdentity}>
                <Text style={styles.workerName}>{karigar.name}</Text>
                <View style={styles.roleRow}>
                  <Icon name="handyman" size={15} color={Palette.primary} />
                  <Text style={styles.workerRole}>{karigar.role ?? 'Karigar'}</Text>
                </View>
                {karigar.default_rate != null ? (
                  <View style={styles.phoneRow}>
                    <Icon name="payments" size={13} color={Palette.onSurfaceVariant} />
                    <Text style={styles.phoneText}>Default Rate: {formatRupees(karigar.default_rate)}</Text>
                  </View>
                ) : null}
                {karigar.phone ? (
                  <View style={styles.phoneRow}>
                    <Icon name="phone" size={13} color={Palette.onSurfaceVariant} />
                    <Text style={styles.phoneText}>{karigar.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.jobStats}>
              <View style={[styles.jobStat, styles.jobStatFirst]}>
                <Text style={[styles.jobStatValue, styles.jobStatActive]}>
                  {karigar.active_orders ?? 0}
                </Text>
                <Text style={styles.jobStatLabel}>Active Jobs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.jobStat}>
                <Text style={[styles.jobStatValue, styles.jobStatCompleted]}>
                  {karigar.completed_orders ?? 0}
                </Text>
                <Text style={styles.jobStatLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.jobStat}>
                <Text style={[styles.jobStatValue, styles.jobStatPending]}>
                  {karigar.pending_orders ?? 0}
                </Text>
                <Text style={styles.jobStatLabel}>Pending</Text>
              </View>
            </View>
          </View>

          <View style={styles.settlementCard}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, styles.sectionIconWallet]}>
                <Icon name="account_balance_wallet" size={15} color={Palette.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Total Statement</Text>
            </View>
            <View style={styles.settlementGrid}>
              <View style={[styles.settlementItem, styles.settlementEarned]}>
                <Text style={styles.settlementLabel}>Total Due</Text>
                <Text style={[styles.settlementValue, styles.settlementEarnedValue]}>
                  {formatRupees(karigar.ledger?.total_due ?? 0)}
                </Text>
              </View>
              <View style={[styles.settlementItem, styles.settlementPaid]}>
                <Text style={styles.settlementLabel}>Total Paid</Text>
                <Text style={[styles.settlementValue, styles.settlementPaidValue]}>
                  {formatRupees(karigar.ledger?.total_received ?? 0)}
                </Text>
              </View>
              <View style={[styles.settlementItem, styles.settlementPending]}>
                <Text style={styles.settlementLabel}>Pending</Text>
                <Text style={[styles.settlementValue, styles.settlementPendingValue]}>
                  {formatRupees(karigar.ledger?.total_pending ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          <View>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <Icon name="assignment" size={15} color={Palette.onSurfaceVariant} />
              </View>
              <Text style={styles.sectionTitle}>Order-wise Work</Text>
            </View>

            {!karigar.orders || karigar.orders.length === 0 ? (
              <View style={styles.ledger}>
                <Text style={styles.ledgerEmpty}>No orders assigned to this karigar yet.</Text>
              </View>
            ) : (
              <View style={styles.orderWrap}>
                {karigar.orders.map((ord) => {
                  const orderBadge = orderStatusMeta(ord.status);
                  const stage = ord.current_stage ? stageStatusMeta(ord.current_stage.status) : null;
                  const allDone =
                    ord.current_stage != null &&
                    ord.current_stage.status === 'completed' &&
                    ord.current_stage.completed_stages === ord.current_stage.assigned_stages;
                  return (
                    <View key={ord.id} style={styles.orderCard}>
                      <View style={styles.orderTop}>
                        <View style={styles.orderIdentity}>
                          <Text style={styles.orderNo}>#{ord.order_no}</Text>
                          <Text style={styles.orderItem}>{ord.item_name}</Text>
                        </View>
                        {stage ? (
                          <StatusBadge
                            variant={stageBadgeVariant(ord.current_stage?.status ?? 'pending')}
                            label={stageBadgeLabel(ord.current_stage?.status ?? 'pending', ord.current_stage?.completed_stages)}
                          />
                        ) : (
                          <StatusBadge {...orderBadge} />
                        )}
                      </View>

                      {stage ? (
                        <View style={styles.orderStageRow}>
                          <View style={[styles.orderStageDot, { backgroundColor: stage.color }]} />
                          {allDone && ord.current_stage ? (
                            <>
                              <Text style={styles.orderStageName}>
                                {ord.current_stage.completed_stages} stage
                                {ord.current_stage.completed_stages === 1 ? '' : 's'} completed
                              </Text>
                              <Text style={[styles.orderStageStatus, { color: stage.color }]}>
                                {stage.label}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.orderStageName}>{ord.current_stage?.name}</Text>
                              <Text style={[styles.orderStageStatus, { color: stage.color }]}>
                                {stage.label}
                              </Text>
                            </>
                          )}
                        </View>
                      ) : (
                        <View style={styles.orderStageRow}>
                          <View style={[styles.orderStageDot, { backgroundColor: Palette.outlineVariant }]} />
                          <Text style={styles.orderStageName}>No stages assigned</Text>
                        </View>
                      )}

                      <View style={styles.orderFinance}>
                        <View style={styles.orderFinanceBlock}>
                          <Text style={styles.orderFinanceLabel}>Due</Text>
                          <Text style={[styles.orderFinanceValue, styles.orderFinanceEarned]}>
                            {formatRupees(ord.due)}
                          </Text>
                        </View>
                        <View style={styles.orderFinanceBlock}>
                          <Text style={styles.orderFinanceLabel}>Received</Text>
                          <Text style={[styles.orderFinanceValue, styles.orderFinanceReceived]}>
                            {formatRupees(ord.received)}
                          </Text>
                        </View>
                        <View style={styles.orderFinanceBlock}>
                          <Text style={styles.orderFinanceLabel}>Pending</Text>
                          <Text style={[styles.orderFinanceValue, styles.orderFinancePending]}>
                            {formatRupees(ord.pending)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <Icon name="list_alt" size={15} color={Palette.onSurfaceVariant} />
              </View>
              <Text style={styles.sectionTitle}>Ledger History</Text>
            </View>

            <View style={styles.ledger}>
              {ledgerGroups.length === 0 ? (
                <Text style={styles.ledgerEmpty}>No ledger entries yet.</Text>
              ) : (
                ledgerGroups.map((group) => (
                  <LedgerAccordion
                    key={group.key}
                    group={group}
                    open={openGroupKey === group.key}
                    onToggle={() => setOpenGroupKey((k) => (k === group.key ? null : group.key))}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionOutline} onPress={() => setModal('advance')}>
              <Icon name="payments" size={20} color={Palette.primary} />
              <Text style={styles.actionOutlineText}>Give Advance</Text>
            </Pressable>
            <Pressable style={styles.actionSolid} onPress={() => setModal('settle')}>
              <Icon name="check_circle" size={20} color={Palette.onSecondary} />
              <Text style={styles.actionSolidText}>Settle Payout</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorWrap}>
          <Icon name="error_outline" size={40} color={Palette.error} />
          <Text style={styles.emptyText}>{error ?? 'Karigar not found.'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      )}

      <KarigarMoneyModal
        visible={modal === 'advance'}
        mode="advance"
        title="Give Advance"
        subtitle={karigar ? `To ${karigar.name}` : undefined}
        orders={moneyOrders}
        confirmLabel="Save Advance"
        notePlaceholder="e.g. Cash advance for material"
        onClose={() => setModal(null)}
        onSubmit={submitAdvance}
        submitLoading={submitting}
      />

      <KarigarMoneyModal
        visible={modal === 'settle'}
        mode="settle"
        title="Settle Payout"
        subtitle={karigar ? `To ${karigar.name}` : undefined}
        orders={moneyOrders}
        confirmLabel="Settle"
        notePlaceholder="e.g. Cash settled"
        onClose={() => setModal(null)}
        onSubmit={submitSettle}
        submitLoading={submitting}
      />
    </SafeAreaView>
  );
}

function LedgerAccordion({
  group,
  open,
  onToggle,
}: {
  group: LedgerGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const [measured, setMeasured] = useState<number | null>(null);
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (measured !== null) {
      Animated.timing(anim, {
        toValue: open ? measured : 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [open, measured, anim]);

  return (
    <View>
      <Pressable style={styles.ledgerGroupHeader} onPress={onToggle}>
        <Icon name="assignment" size={15} color={Palette.primary} />
        <Text style={styles.ledgerGroupTitle} numberOfLines={1}>
          {group.title}
        </Text>
        <Icon
          name="arrow_drop_down"
          size={20}
          color={Palette.onSurfaceVariant}
          style={open && styles.ledgerGroupChevronOpen}
        />
        <Text style={styles.ledgerGroupTotal}>{formatRupees(group.total)}</Text>
      </Pressable>

      <Animated.View
        style={{ height: anim, overflow: 'hidden' }}>
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (measured === null) {
              setMeasured(h);
            }
          }}>
          {group.entries.map((row, index) => (
            <View
              key={row.key}
              style={[
                styles.ledgerRow,
                index < group.entries.length - 1 && styles.ledgerRowBorder,
              ]}>
              <View style={styles.ledgerLeft}>
                <View
                  style={[
                    styles.ledgerIcon,
                    {
                      backgroundColor: row.positive
                        ? 'rgba(62,107,79,0.10)'
                        : 'rgba(179,70,62,0.10)',
                      borderColor: row.positive
                        ? 'rgba(62,107,79,0.20)'
                        : 'rgba(179,70,62,0.20)',
                    },
                  ]}>
                  <Icon name={row.icon} size={20} color={row.positive ? '#3E6B4F' : Palette.error} />
                </View>
                <View style={styles.ledgerText}>
                  <Text style={styles.ledgerTitle}>{row.title}</Text>
                  {row.stageName ? (
                    <View style={styles.ledgerStageRow}>
                      <Icon name="build" size={11} color={Palette.primary} />
                      <Text style={styles.ledgerStageText}>{row.stageName}</Text>
                    </View>
                  ) : null}
                  {row.advanceRemaining != null ? (
                    <View style={styles.ledgerStageRow}>
                      <Icon name="account_balance_wallet" size={11} color={Palette.warning} />
                      <Text style={styles.ledgerBalanceText}>
                        Balance remaining: {formatRupees(row.advanceRemaining)}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.ledgerDate}>{row.date}</Text>
                </View>
              </View>
              <Text style={[styles.ledgerAmount, { color: row.positive ? '#3E6B4F' : Palette.error }]}>
                {row.amount}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function buildLedger(karigar: KarigarDetail | null): LedgerGroup[] {
  if (!karigar) {
    return [];
  }

  const groups = new Map<number | null, LedgerEntry[]>();

  (karigar.payments ?? []).forEach((payment) => {
    const orderId = payment.order_id;
    const entry: LedgerEntry = {
      key: `payment-${payment.id}`,
      icon: 'add',
      title: payment.order
        ? `${payment.type_label} · #${payment.order.order_no}`
        : payment.type_label,
      date: payment.paid_at ? `Paid on ${payment.paid_at}` : 'Paid',
      amount: `+${formatRupees(payment.amount)}`,
      positive: true,
      stageName: payment.stage?.name,
      advanceRemaining: payment.advance_remaining,
    };

    if (!groups.has(orderId)) {
      groups.set(orderId, []);
    }
    groups.get(orderId)!.push(entry);
  });

  const orderById = new Map<number, KarigarOrder>();
  (karigar.orders ?? []).forEach((order) => orderById.set(order.id, order));

  const result: LedgerGroup[] = [];

  groups.forEach((entries, orderId) => {
    if (orderId === null) {
      result.push({
        key: 'general',
        title: 'General Payments',
        total: entries.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[^0-9.]/g, '')), 0),
        entries,
      });
      return;
    }

    const order = orderById.get(orderId);
    result.push({
      key: `order-${orderId}`,
      title: order ? `#${order.order_no}: ${order.item_name}` : `Order #${orderId}`,
      total: entries.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[^0-9.]/g, '')), 0),
      entries,
    });
  });

  result.sort((a, b) => (a.title < b.title ? 1 : -1));
  return result;
}

function stageBadgeVariant(status: string): 'completed' | 'inProgress' | 'pending' {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'inProgress';
    default:
      return 'pending';
  }
}

function stageBadgeLabel(status: string, completed?: number): string {
  switch (status) {
    case 'completed':
      return `Completed${completed && completed > 1 ? ` · ${completed}` : ''}`;
    case 'in_progress':
      return 'In Progress';
    default:
      return 'Pending';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.containerPadding,
    paddingBottom: 48,
    gap: Spacing.section,
  },
  skeletonWrap: {
    padding: Spacing.containerPadding,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 16,
    gap: 16,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.primary,
    backgroundColor: Palette.surfaceContainerLow,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  summaryIdentity: {
    flexShrink: 1,
    gap: 2,
  },
  workerName: {
    ...Type.headlineLgMobile,
    color: Palette.onSurface,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerRole: {
    ...Type.bodyLg,
    color: Palette.onSurfaceVariant,
    fontFamily: 'Poppins_500Medium',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  jobStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Palette.outlineVariant,
  },
  jobStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  jobStatFirst: {
    paddingLeft: 0,
  },
  jobStatValue: {
    ...Type.headlineLgMobile,
    marginTop: 4,
  },
  jobStatActive: {
    color: Palette.primary,
  },
  jobStatCompleted: {
    color: '#3E6B4F',
  },
  jobStatPending: {
    color: Palette.danger,
  },
  jobStatLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 2,
    backgroundColor: Palette.outlineVariant,
  },
  settlementCard: {
    backgroundColor: Palette.surfaceContainer,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(138,109,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconWallet: {
    backgroundColor: 'rgba(122,106,79,0.12)',
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  settlementGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  settlementItem: {
    flex: 1,
    backgroundColor: Palette.surfaceContainerLowest,
    padding: 10,
    borderLeftWidth: 4,
    borderRadius: Radius.md,
  },
  settlementEarned: {
    borderLeftColor: Palette.warning,
  },
  settlementPaid: {
    borderLeftColor: Palette.success,
  },
  settlementPending: {
    borderLeftColor: Palette.danger,
  },
  settlementLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    fontSize: 11,
  },
  settlementValue: {
    ...Type.headlineMd,
    marginTop: 4,
    fontSize: 15,
  },
  settlementEarnedValue: {
    color: Palette.warning,
  },
  settlementPaidValue: {
    color: Palette.success,
  },
  settlementPendingValue: {
    color: Palette.danger,
  },
  ledger: {
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLowest,
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  ledgerRowBorder: {
    borderBottomWidth: 2,
    borderBottomColor: Palette.outlineVariant,
  },
  ledgerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Palette.surfaceContainer,
    borderBottomWidth: 2,
    borderBottomColor: Palette.outlineVariant,
  },
  ledgerGroupTitle: {
    ...Type.labelBold,
    color: Palette.onSurface,
    flex: 1,
  },
  ledgerGroupChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  ledgerGroupTotal: {
    ...Type.labelBold,
    color: Palette.success,
  },
  ledgerStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerStageText: {
    ...Type.bodyMd,
    color: Palette.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  ledgerBalanceText: {
    ...Type.bodyMd,
    color: Palette.warning,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  ledgerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ledgerText: {
    flexShrink: 1,
  },
  ledgerTitle: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  ledgerDate: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  ledgerAmount: {
    ...Type.headlineMd,
  },
  ledgerEmpty: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    padding: 24,
  },
  orderWrap: {
    gap: 12,
  },
  orderCard: {
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLowest,
    padding: 14,
    gap: 10,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderIdentity: {
    flex: 1,
    gap: 2,
  },
  orderNo: {
    ...Type.labelBold,
    color: Palette.primary,
    letterSpacing: 0.5,
  },
  orderItem: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  orderStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.outlineVariant,
  },
  orderStageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderStageName: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  orderStageStatus: {
    ...Type.labelBold,
  },
  orderFinance: {
    flexDirection: 'row',
    gap: 8,
  },
  orderFinanceBlock: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLow,
    gap: 2,
  },
  orderFinanceLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    fontSize: 11,
  },
  orderFinanceValue: {
    ...Type.bodyLg,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  orderFinanceEarned: {
    color: Palette.warning,
  },
  orderFinanceReceived: {
    color: Palette.success,
  },
  orderFinancePending: {
    color: Palette.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionOutline: {
    flex: 1,
    height: Spacing.touchTarget,
    borderWidth: 2,
    borderColor: Palette.primary,
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionOutlineText: {
    ...Type.labelBold,
    color: Palette.primary,
  },
  actionSolid: {
    flex: 1,
    height: Spacing.touchTarget,
    backgroundColor: Palette.secondary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Palette.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  actionSolidText: {
    ...Type.labelBold,
    color: Palette.onSecondary,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
  backButton: {
    height: Spacing.touchTarget,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
});
